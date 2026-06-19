/**
 * Automation service — abandoned cart recovery, review invitations, payment retries.
 * Each function returns a result object; callers log to automation_logs.
 * These functions are triggered via /api/cron/* routes (manually or via Vercel Cron).
 */
import { createServiceClient } from "@/lib/supabase-server";
import {
  sendAbandonedCartEmail,
  sendReviewInvitationEmail,
  sendPaymentRetryEmail,
  sendLowStockAlertEmail,
} from "@/services/email.service";

export interface AutomationResult {
  processed: number;
  skipped: number;
  errors: number;
  details: unknown[];
}

// ── Abandoned Cart Recovery ───────────────────────────────────

/**
 * Find carts updated 24–72 hours ago that belong to authenticated users
 * who haven't placed an order since, and email them once.
 */
export async function runAbandonedCartRecovery(): Promise<AutomationResult> {
  const supabase = createServiceClient();
  const result: AutomationResult = { processed: 0, skipped: 0, errors: 0, details: [] };

  const now = new Date();
  const cutoffOld = new Date(now.getTime() - 72 * 60 * 60 * 1000); // 72h ago
  const cutoffNew = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24h ago

  // Find carts with items, for authenticated users, last touched 24–72h ago
  const { data: carts } = await supabase
    .from("carts")
    .select("id, user_id, items, updated_at")
    .not("user_id", "is", null)
    .neq("items", "[]")
    .gte("updated_at", cutoffOld.toISOString())
    .lt("updated_at", cutoffNew.toISOString());

  if (!carts?.length) return result;

  // Collect customer ids to check email preference + recent orders + already emailed
  const userIds = carts.map((c) => c.user_id as string);

  const [profilesRes, recentOrdersRes, alreadyEmailedRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds),
    supabase
      .from("orders")
      .select("user_id")
      .in("user_id", userIds)
      .gte("created_at", cutoffNew.toISOString()),
    supabase
      .from("email_logs")
      .select("order_id, recipient")
      .eq("email_type", "abandoned_cart")
      .gte("created_at", cutoffOld.toISOString()),
  ]);

  // Build lookup sets
  const profileMap = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, p])
  );
  const recentOrderUsers = new Set(
    (recentOrdersRes.data ?? []).map((o) => o.user_id)
  );
  const alreadyEmailedEmails = new Set(
    (alreadyEmailedRes.data ?? []).map((e) => e.recipient)
  );

  for (const cart of carts) {
    const userId = cart.user_id as string;
    const profile = profileMap.get(userId);

    if (!profile) {
      result.skipped++;
      continue;
    }

    // Skip if placed an order recently (cart was converted)
    if (recentOrderUsers.has(userId)) {
      result.skipped++;
      continue;
    }

    // Skip if already emailed in the last 72h
    if (alreadyEmailedEmails.has(profile.email)) {
      result.skipped++;
      continue;
    }

    // Parse cart items
    let items: unknown[];
    try {
      items = typeof cart.items === "string" ? JSON.parse(cart.items) : cart.items;
    } catch {
      result.errors++;
      continue;
    }

    if (!Array.isArray(items) || items.length === 0) {
      result.skipped++;
      continue;
    }

    try {
      await sendAbandonedCartEmail({
        email: profile.email,
        full_name: profile.full_name ?? "there",
        cart_id: cart.id,
        items,
      });
      result.processed++;
      result.details.push({ cart_id: cart.id, email: profile.email });
    } catch (err) {
      result.errors++;
      result.details.push({
        cart_id: cart.id,
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  return result;
}

// ── Review Invitations ────────────────────────────────────────

/**
 * Find orders delivered 7–14 days ago where the customer hasn't reviewed
 * each item yet (and hasn't been invited recently). Send one email per order
 * listing unreviewed products.
 */
export async function runReviewInvitations(): Promise<AutomationResult> {
  const supabase = createServiceClient();
  const result: AutomationResult = { processed: 0, skipped: 0, errors: 0, details: [] };

  const now = new Date();
  const cutoffOld = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const cutoffNew = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Delivered orders in the 7–14 day window
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id, order_number, user_id,
      profiles!inner(email, full_name),
      order_items(product_id, product_name, variant_size, variant_color)
    `)
    .eq("status", "delivered")
    .not("user_id", "is", null)
    .gte("updated_at", cutoffOld.toISOString())
    .lt("updated_at", cutoffNew.toISOString());

  if (!orders?.length) return result;

  // Already invited
  const orderIds = orders.map((o) => o.id);
  const { data: alreadySent } = await supabase
    .from("email_logs")
    .select("order_id")
    .eq("email_type", "review_invitation")
    .in("order_id", orderIds);

  const alreadySentOrderIds = new Set((alreadySent ?? []).map((e) => e.order_id));

  for (const order of orders) {
    if (alreadySentOrderIds.has(order.id)) {
      result.skipped++;
      continue;
    }

    const profile = order.profiles as unknown as { email: string; full_name: string | null };
    const items = order.order_items as {
      product_id: string;
      product_name: string;
      variant_size: string | null;
      variant_color: string | null;
    }[];

    if (!profile?.email || !items?.length) {
      result.skipped++;
      continue;
    }

    // Check which products already have a review from this customer
    const productIds = items.map((i) => i.product_id).filter(Boolean);
    const { data: existingReviews } = await supabase
      .from("product_reviews")
      .select("product_id")
      .eq("customer_id", order.user_id as string)
      .in("product_id", productIds);

    const reviewedProductIds = new Set((existingReviews ?? []).map((r) => r.product_id));
    const unreviewedItems = items.filter(
      (i) => i.product_id && !reviewedProductIds.has(i.product_id)
    );

    if (unreviewedItems.length === 0) {
      result.skipped++;
      continue;
    }

    try {
      await sendReviewInvitationEmail({
        email: profile.email,
        full_name: profile.full_name ?? "there",
        order_id: order.id,
        order_number: order.order_number,
        items: unreviewedItems.map((i) => ({
          product_id: i.product_id,
          product_name: i.product_name,
          variant_size: i.variant_size,
          variant_color: i.variant_color,
        })),
      });
      result.processed++;
      result.details.push({ order_id: order.id, email: profile.email });
    } catch (err) {
      result.errors++;
      result.details.push({
        order_id: order.id,
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  return result;
}

// ── Payment Retry Emails ──────────────────────────────────────

/**
 * Find orders with payment_status=failed, created 24–72h ago,
 * with a Stripe payment intent, that haven't had a retry email yet.
 */
export async function runPaymentRetryEmails(): Promise<AutomationResult> {
  const supabase = createServiceClient();
  const result: AutomationResult = { processed: 0, skipped: 0, errors: 0, details: [] };

  const now = new Date();
  const cutoffOld = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  const cutoffNew = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const { data: failedOrders } = await supabase
    .from("orders")
    .select("id, order_number, total, shipping_email, shipping_full_name, stripe_payment_intent_id")
    .eq("payment_status", "failed")
    .not("stripe_payment_intent_id", "is", null)
    .gte("created_at", cutoffOld.toISOString())
    .lt("created_at", cutoffNew.toISOString());

  if (!failedOrders?.length) return result;

  const orderIds = failedOrders.map((o) => o.id);
  const { data: alreadySent } = await supabase
    .from("email_logs")
    .select("order_id")
    .eq("email_type", "payment_retry")
    .in("order_id", orderIds);

  const alreadySentIds = new Set((alreadySent ?? []).map((e) => e.order_id));

  for (const order of failedOrders) {
    if (alreadySentIds.has(order.id)) {
      result.skipped++;
      continue;
    }

    try {
      await sendPaymentRetryEmail({
        email: order.shipping_email,
        full_name: order.shipping_full_name,
        order_id: order.id,
        order_number: order.order_number,
        total: order.total,
      });
      result.processed++;
      result.details.push({ order_id: order.id, email: order.shipping_email });
    } catch (err) {
      result.errors++;
      result.details.push({
        order_id: order.id,
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  return result;
}

// ── Low Stock Alert ───────────────────────────────────────────

/**
 * Find variants below their reorder_level and email the admin.
 * Skipped if an identical alert was already sent in the last 24h.
 */
export async function runLowStockAlert(): Promise<AutomationResult> {
  const supabase = createServiceClient();
  const result: AutomationResult = { processed: 0, skipped: 0, errors: 0, details: [] };

  // PostgREST can't compare two columns directly — fetch all active variants and filter in JS
  const { data: allVariants } = await supabase
    .from("product_variants")
    .select("id, sku, size, color, stock, reorder_level, products!inner(name)")
    .eq("is_active", true);

  const needsReorder = (allVariants ?? []).filter((v) => v.stock <= v.reorder_level);

  if (needsReorder.length === 0) {
    result.skipped++;
    return result;
  }

  // Check if we already sent a low-stock alert in the last 24h
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { data: recentAlert } = await supabase
    .from("email_logs")
    .select("id")
    .eq("email_type", "low_stock")
    .gte("created_at", yesterday.toISOString())
    .limit(1);

  if (recentAlert?.length) {
    result.skipped++;
    return result;
  }

  const items = needsReorder.map((v) => ({
    sku: v.sku,
    product_name: (v.products as unknown as { name: string }).name,
    size: v.size,
    color: v.color,
    stock: v.stock,
    reorder_level: v.reorder_level,
  }));

  try {
    await sendLowStockAlertEmail({ items });
    result.processed = items.length;
    result.details = items;
  } catch (err) {
    result.errors++;
    result.details.push({ error: err instanceof Error ? err.message : "unknown" });
  }

  return result;
}

// ── Log automation run ────────────────────────────────────────

export async function logAutomationRun(
  jobName: string,
  status: "success" | "failed" | "skipped",
  result: AutomationResult,
  triggeredBy: "cron" | "manual" = "cron"
): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("automation_logs").insert({
    job_name: jobName,
    status,
    processed: result.processed,
    skipped: result.skipped,
    errors: result.errors,
    details: result.details,
    triggered_by: triggeredBy,
  });
}
