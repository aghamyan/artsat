import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase-server";
import type { Profile, EmailPreferences, CustomerWithStats, OrderWithItems } from "@/lib/types";

// ── Profile ──────────────────────────────────────────────────

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, "full_name" | "phone" | "date_of_birth" | "gender" | "preferred_language">>
): Promise<Profile> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function softDeleteAccount(userId: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      account_status: "deleted",
      deleted_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw error;
}

// ── Email preferences ────────────────────────────────────────

export async function getEmailPreferences(userId: string): Promise<EmailPreferences | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("email_preferences")
    .select("*")
    .eq("customer_id", userId)
    .maybeSingle();

  return data as EmailPreferences | null;
}

export async function upsertEmailPreferences(
  userId: string,
  prefs: Partial<Omit<EmailPreferences, "id" | "customer_id" | "updated_at">>
): Promise<EmailPreferences> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("email_preferences")
    .upsert(
      { customer_id: userId, ...prefs, updated_at: new Date().toISOString() },
      { onConflict: "customer_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as EmailPreferences;
}

// ── Order history ────────────────────────────────────────────

export async function getCustomerOrders(
  userId: string,
  page = 1,
  limit = 10
): Promise<{ orders: OrderWithItems[]; total: number }> {
  const supabase = await createServerSupabaseClient();
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from("orders")
    .select("*, items:order_items(*)", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { orders: (data ?? []) as unknown as OrderWithItems[], total: count ?? 0 };
}

export async function getCustomerOrderDetail(
  orderId: string,
  userId: string
): Promise<(OrderWithItems & { reviews: Record<string, string | null> }) | null> {
  const supabase = await createServerSupabaseClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, items:order_items(*, product:products(name, slug, images:product_images(url, is_primary)), variant:product_variants(size, color))")
    .eq("id", orderId)
    .eq("user_id", userId)
    .single();

  if (!order) return null;

  const itemIds = (order as Record<string, unknown[]>).items?.map((i: unknown) => (i as Record<string, unknown>).id as string) ?? [];

  const { data: reviews } = await supabase
    .from("product_reviews")
    .select("id, order_item_id")
    .in("order_item_id", itemIds);

  const reviewMap: Record<string, string | null> = {};
  (reviews ?? []).forEach((r: Record<string, string>) => {
    reviewMap[r.order_item_id] = r.id;
  });

  return { ...order, reviews: reviewMap } as unknown as OrderWithItems & { reviews: Record<string, string | null> };
}

// ── Admin: customer list ─────────────────────────────────────

export async function getCustomerList(
  page = 1,
  limit = 20,
  search?: string
): Promise<{ customers: CustomerWithStats[]; total: number }> {
  const supabase = createServiceClient();
  const offset = (page - 1) * limit;

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .eq("role", "customer")
    .eq("account_status", "active")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search?.trim()) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  // Fetch order stats per customer via a view or inline aggregation
  const customers = (data ?? []) as CustomerWithStats[];
  return { customers, total: count ?? 0 };
}

export async function getCustomerDetail(customerId: string): Promise<Profile | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", customerId)
    .single();

  return data as Profile | null;
}
