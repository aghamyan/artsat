import { NextRequest, NextResponse } from "next/server";
import { getPaymentIntentStatus } from "@/services/payment.service";
import { createServiceClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select("stripe_payment_intent_id, payment_status, last_payment_error")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.stripe_payment_intent_id) {
      return NextResponse.json({
        payment_status: order.payment_status,
        intent_status: null,
      });
    }

    const intentStatus = await getPaymentIntentStatus(order.stripe_payment_intent_id);

    return NextResponse.json({
      payment_status: order.payment_status,
      intent_status: intentStatus.status,
      last_payment_error: order.last_payment_error,
    });
  } catch (err) {
    console.error("[GET /api/payments/intent-status]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to get intent status" },
      { status: 500 }
    );
  }
}
