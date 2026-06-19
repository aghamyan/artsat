import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase-server";
import type { ReturnExchange, ReturnExchangeWithItems, ReturnStatus } from "@/lib/types";

const RETURN_WINDOW_DAYS = 14;

export async function getCustomerReturns(customerId: string): Promise<ReturnExchangeWithItems[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("returns_exchanges")
    .select(`
      *,
      order_item:order_items(*),
      order:orders(order_number, created_at, status)
    `)
    .eq("created_by", customerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as ReturnExchangeWithItems[];
}

export async function getReturn(id: string, customerId: string): Promise<ReturnExchangeWithItems | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("returns_exchanges")
    .select(`
      *,
      order_item:order_items(*),
      order:orders(order_number, created_at, status, user_id)
    `)
    .eq("id", id)
    .eq("created_by", customerId)
    .single();

  return data as unknown as ReturnExchangeWithItems | null;
}

export async function requestReturn(
  orderId: string,
  customerId: string,
  request: {
    order_item_id: string;
    request_type: "return" | "exchange";
    reason: string;
    reason_description?: string;
    quantity: number;
  }
): Promise<ReturnExchange> {
  const supabase = createServiceClient();

  // Verify order belongs to this customer (user_id, not customer_id)
  const { data: order } = await supabase
    .from("orders")
    .select("id, created_at, status, user_id")
    .eq("id", orderId)
    .eq("user_id", customerId)
    .single();

  if (!order) throw new Error("Order not found");

  // Enforce 14-day return window
  const orderDate = new Date(order.created_at);
  const daysOld = Math.floor((Date.now() - orderDate.getTime()) / 86_400_000);
  if (daysOld > RETURN_WINDOW_DAYS) {
    throw new Error(`Return window of ${RETURN_WINDOW_DAYS} days has expired`);
  }

  // Verify order item belongs to this order
  const { data: item } = await supabase
    .from("order_items")
    .select("id, quantity")
    .eq("id", request.order_item_id)
    .eq("order_id", orderId)
    .single();

  if (!item) throw new Error("Order item not found");
  if (request.quantity > item.quantity) {
    throw new Error("Return quantity exceeds purchased quantity");
  }

  // Check no duplicate return for same item
  const { data: existing } = await supabase
    .from("returns_exchanges")
    .select("id, status")
    .eq("order_item_id", request.order_item_id)
    .not("status", "in", '("rejected","cancelled")')
    .maybeSingle();

  if (existing) throw new Error("A return/exchange request already exists for this item");

  const { data, error } = await supabase
    .from("returns_exchanges")
    .insert({
      order_id: orderId,
      ...request,
      status: "pending",
      created_by: customerId,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ReturnExchange;
}

export async function getAllReturns(
  page = 1,
  limit = 20,
  status?: ReturnStatus
): Promise<{ returns: ReturnExchangeWithItems[]; total: number }> {
  const supabase = createServiceClient();
  const offset = (page - 1) * limit;

  let query = supabase
    .from("returns_exchanges")
    .select(
      `*, order_item:order_items(*), order:orders(order_number, user_id), customer:profiles!created_by(full_name, email)`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);

  const { data, error, count } = await query;
  if (error) throw error;

  return { returns: (data ?? []) as unknown as ReturnExchangeWithItems[], total: count ?? 0 };
}

export async function processReturn(
  id: string,
  updates: {
    status: ReturnStatus;
    tracking_number?: string;
    return_address?: string;
    notes?: string;
  }
): Promise<void> {
  const supabase = createServiceClient();

  const extra: Record<string, string> = {};
  if (updates.status === "approved") extra.approved_at = new Date().toISOString();
  if (updates.status === "completed") extra.completed_at = new Date().toISOString();

  const { error } = await supabase
    .from("returns_exchanges")
    .update({ ...updates, ...extra })
    .eq("id", id);

  if (error) throw error;
}
