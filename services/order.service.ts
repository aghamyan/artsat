import { createServiceClient } from "@/lib/supabase-server";
import type {
  CheckoutRequest,
  CheckoutResult,
  Order,
  OrderWithItems,
} from "@/lib/types";
import { parseDbError, generateGuestToken } from "@/lib/utils";

/**
 * Creates an order atomically using the plpgsql stored procedure.
 * This is the only correct way to create an order — server-side only.
 */
export async function createOrder(
  request: CheckoutRequest,
  userId: string | null
): Promise<CheckoutResult> {
  const supabase = createServiceClient();

  const guestToken = userId ? null : generateGuestToken();
  const guestEmail = userId ? null : request.shipping.email;

  const { data, error } = await supabase.rpc("create_order_transaction", {
    p_user_id: userId,
    p_guest_email: guestEmail,
    p_guest_token: guestToken,
    p_shipping: request.shipping,
    p_items: request.items,
    p_payment_method: request.payment_method,
    p_discount_code: request.discount_code ?? null,
    p_cart_id: request.cart_id ?? null,
  });

  if (error) {
    throw new Error(parseDbError(error.message));
  }

  const result = data as CheckoutResult & { guest_token?: string };

  // Attach guest token to result for cookie setting
  if (guestToken) {
    (result as CheckoutResult & { guest_token: string }).guest_token =
      guestToken;
  }

  return result;
}

export async function getOrderById(
  orderId: string,
  userId: string | null
): Promise<OrderWithItems | null> {
  const supabase = createServiceClient();

  const query = supabase
    .from("orders")
    .select(`*, items:order_items(*)`)
    .eq("id", orderId);

  // If not admin, restrict to own orders
  if (userId) {
    query.eq("user_id", userId);
  }

  const { data, error } = await query.single();
  if (error || !data) return null;

  return data as OrderWithItems;
}

export async function getOrderByGuestToken(
  token: string
): Promise<OrderWithItems | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("orders")
    .select(`*, items:order_items(*)`)
    .eq("guest_token", token)
    .single();

  if (error || !data) return null;
  return data as OrderWithItems;
}

export async function getOrdersByUser(userId: string): Promise<Order[]> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []) as Order[];
}

/** Admin: get all orders with pagination */
export async function getAllOrders(
  page = 1,
  limit = 20,
  status?: string
): Promise<{ orders: Order[]; total: number }> {
  const supabase = createServiceClient();

  let query = supabase
    .from("orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  return { orders: (data ?? []) as Order[], total: count ?? 0 };
}

/** Admin: update order status and log the action */
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  adminId: string
): Promise<void> {
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("orders")
    .select("status, order_number")
    .eq("id", orderId)
    .single();

  const { error } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId);

  if (error) throw new Error(error.message);

  // Log admin action
  await supabase.from("admin_logs").insert({
    admin_id: adminId,
    action: "status_change",
    table_name: "orders",
    record_id: orderId,
    old_values: { status: existing?.status },
    new_values: { status: newStatus },
  });
}
