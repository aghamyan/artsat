import { stripe } from "@/lib/stripe-server";
import { createServiceClient } from "@/lib/supabase-server";
import { handlePaymentSucceeded, handlePaymentFailed } from "./payment.service";
import { sendPaymentConfirmationEmail, sendPaymentFailedEmail } from "./email.service";
import type Stripe from "stripe";

/**
 * Verifies and constructs a Stripe webhook event from the raw request body.
 */
export function constructWebhookEvent(
  payload: string,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_placeholder"
  );
}

/**
 * Checks if a Stripe event has already been processed.
 * Uses maybeSingle() so zero-row result returns null (not an error).
 */
export async function isEventAlreadyProcessed(
  stripeEventId: string
): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("stripe_webhooks")
    .select("id, processed")
    .eq("stripe_event_id", stripeEventId)
    .maybeSingle();

  return data !== null && data.processed === true;
}

/**
 * Main webhook dispatcher. Inserts the event log and dispatches to handlers.
 * The unique constraint on stripe_event_id prevents concurrent duplicate inserts.
 */
export async function processWebhookEvent(event: Stripe.Event): Promise<void> {
  const supabase = createServiceClient();

  // Insert the webhook log before processing to claim idempotency slot
  const { error: insertError } = await supabase
    .from("stripe_webhooks")
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event.data as unknown as Record<string, unknown>,
      processed: false,
    });

  // Unique constraint violation means it's already being processed
  if (insertError) {
    if (insertError.code === "23505") return; // duplicate
    throw new Error(insertError.message);
  }

  let orderId: string | null = null;
  let processingError: string | null = null;

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const chargeId =
          typeof pi.latest_charge === "string"
            ? pi.latest_charge
            : (pi.latest_charge as Stripe.Charge | null)?.id ?? null;

        orderId = await handlePaymentSucceeded(pi.id, pi.amount_received, chargeId);

        if (orderId) {
          await sendPaymentConfirmationEmail(orderId);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        orderId = await handlePaymentFailed(
          pi.id,
          pi.last_payment_error?.message ?? null
        );

        if (orderId) {
          await sendPaymentFailedEmail(
            orderId,
            pi.last_payment_error?.message ?? "Payment was declined"
          );
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const supabase2 = createServiceClient();
        const { data: order } = await supabase2
          .from("orders")
          .select("id")
          .eq("stripe_charge_id", charge.id)
          .maybeSingle();
        orderId = order?.id ?? null;
        break;
      }

      default:
        break;
    }
  } catch (err) {
    processingError = err instanceof Error ? err.message : "Unknown error";
  }

  // Mark event as processed (or failed)
  await supabase
    .from("stripe_webhooks")
    .update({
      processed: processingError === null,
      processed_at: processingError === null ? new Date().toISOString() : null,
      order_id: orderId,
      error_message: processingError,
    })
    .eq("stripe_event_id", event.id);

  if (processingError) {
    throw new Error(processingError);
  }
}
