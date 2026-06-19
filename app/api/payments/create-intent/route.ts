import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getOrderById } from "@/services/order.service";
import { createPaymentIntent } from "@/services/payment.service";

export async function POST(req: NextRequest) {
  try {
    const { order_id } = await req.json();

    if (!order_id || typeof order_id !== "string") {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const order = await getOrderById(order_id, user?.id ?? null);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.payment_status === "paid") {
      return NextResponse.json({ error: "Order already paid" }, { status: 400 });
    }

    const customerEmail = user?.email ?? order.shipping_email;
    const result = await createPaymentIntent(order, customerEmail);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[POST /api/payments/create-intent]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
