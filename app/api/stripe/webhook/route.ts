import { NextRequest, NextResponse } from "next/server";
import {
  constructWebhookEvent,
  isEventAlreadyProcessed,
  processWebhookEvent,
} from "@/services/webhook.service";

// Stripe sends the raw body — disable body parsing so we get the raw text
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook signature invalid" },
      { status: 400 }
    );
  }

  // Quick idempotency check before doing any work
  const alreadyProcessed = await isEventAlreadyProcessed(event.id);
  if (alreadyProcessed) {
    return NextResponse.json({ received: true });
  }

  try {
    await processWebhookEvent(event);
  } catch (err) {
    console.error("[webhook] Processing error:", err);
    // Return 500 so Stripe will retry (but we logged it)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
