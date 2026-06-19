import { stripe } from "@/lib/stripe-server";
import { createServiceClient } from "@/lib/supabase-server";
import type { Refund, RefundReason } from "@/lib/types";

export interface CreateRefundParams {
  orderId: string;
  amount?: number; // cents — omit for full refund
  reason: RefundReason;
  adminId: string;
}

/**
 * Issues a Stripe refund and records it in the database.
 * Pass amount for partial refund; omit for full refund.
 */
export async function createRefund(params: CreateRefundParams): Promise<Refund> {
  const { orderId, amount, reason, adminId } = params;
  const supabase = createServiceClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, total, payment_status, stripe_payment_intent_id")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new Error("Order not found");
  }
  if (order.payment_status !== "paid") {
    throw new Error("Order has not been paid");
  }
  if (!order.stripe_payment_intent_id) {
    throw new Error("No Stripe PaymentIntent attached to this order");
  }

  const refundAmount = amount ?? order.total;

  const stripeRefund = await stripe.refunds.create({
    payment_intent: order.stripe_payment_intent_id,
    amount: refundAmount,
    reason,
  });

  const { data: refund, error: insertError } = await supabase
    .from("refunds")
    .insert({
      order_id: orderId,
      stripe_refund_id: stripeRefund.id,
      amount: stripeRefund.amount,
      reason,
      status: stripeRefund.status === "succeeded" ? "succeeded" : "pending",
      requested_by: adminId,
    })
    .select()
    .single();

  if (insertError || !refund) {
    throw new Error("Failed to record refund: " + (insertError?.message ?? "unknown"));
  }

  // For full refunds that immediately succeed, update the order directly
  if (stripeRefund.status === "succeeded" && refundAmount >= order.total) {
    await supabase
      .from("orders")
      .update({
        payment_status: "refunded",
        refunded_at: new Date().toISOString(),
        refund_amount: refundAmount,
        refund_reason: reason,
      })
      .eq("id", orderId);
  }

  return refund as Refund;
}

export async function getRefundsByOrder(orderId: string): Promise<Refund[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("refunds")
    .select("*")
    .eq("order_id", orderId)
    .order("requested_at", { ascending: false });

  return (data ?? []) as Refund[];
}

export async function getAllRefunds(
  page = 1,
  limit = 20,
  status?: string
): Promise<{ refunds: Refund[]; total: number }> {
  const supabase = createServiceClient();

  let query = supabase
    .from("refunds")
    .select("*", { count: "exact" })
    .order("requested_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  return { refunds: (data ?? []) as Refund[], total: count ?? 0 };
}
