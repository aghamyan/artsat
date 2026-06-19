import { stripe } from "@/lib/stripe-server";
import { createServiceClient } from "@/lib/supabase-server";
import type { OrderWithItems, CreatePaymentIntentResult } from "@/lib/types";

/**
 * Creates a Stripe PaymentIntent and attaches it to an existing pending order.
 * Returns the clientSecret needed by the frontend Stripe Elements form.
 */
export async function createPaymentIntent(
  order: OrderWithItems,
  customerEmail: string
): Promise<CreatePaymentIntentResult> {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: order.total,
    currency: "usd",
    metadata: {
      order_id: order.id,
      order_number: order.order_number,
    },
    description: `Artsat Clothing Order #${order.order_number}`,
    receipt_email: customerEmail,
    automatic_payment_methods: { enabled: true },
  });

  if (!paymentIntent.client_secret) {
    throw new Error("Stripe did not return a client_secret");
  }

  const supabase = createServiceClient();
  await supabase
    .from("orders")
    .update({
      stripe_payment_intent_id: paymentIntent.id,
      payment_intent_client_secret: paymentIntent.client_secret,
      payment_method: "stripe",
    })
    .eq("id", order.id);

  return {
    order_id: order.id,
    order_number: order.order_number,
    client_secret: paymentIntent.client_secret,
    amount: order.total,
  };
}

/**
 * Retrieves the current status of a PaymentIntent from Stripe.
 */
export async function getPaymentIntentStatus(
  paymentIntentId: string
): Promise<{ status: string; amount: number; last_payment_error: string | null }> {
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  return {
    status: pi.status,
    amount: pi.amount,
    last_payment_error: pi.last_payment_error?.message ?? null,
  };
}

/**
 * Called by the webhook handler when payment_intent.succeeded fires.
 * Updates the order to paid/confirmed and records charge details.
 */
export async function handlePaymentSucceeded(
  paymentIntentId: string,
  amountReceived: number,
  latestChargeId: string | null
): Promise<string | null> {
  const supabase = createServiceClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, order_number, user_id, guest_email, shipping_email")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .single();

  if (error || !order) return null;

  await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      status: "confirmed",
      stripe_charge_id: latestChargeId,
      amount_received: amountReceived,
    })
    .eq("id", order.id);

  return order.id;
}

/**
 * Called by the webhook handler when payment_intent.payment_failed fires.
 */
export async function handlePaymentFailed(
  paymentIntentId: string,
  errorMessage: string | null
): Promise<string | null> {
  const supabase = createServiceClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .single();

  if (error || !order) return null;

  await supabase
    .from("orders")
    .update({
      payment_status: "failed",
      last_payment_error: errorMessage,
    })
    .eq("id", order.id);

  return order.id;
}
