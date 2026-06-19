import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createOrder, getOrderById } from "@/services/order.service";
import { createPaymentIntent } from "@/services/payment.service";
import { sendOrderConfirmation, sendAdminOrderAlert } from "@/services/email.service";
import { checkoutRequestSchema } from "@/lib/validations/checkout";
import { parseDbError } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = checkoutRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { items, shipping, payment_method, discount_code, cart_id } =
      parsed.data;

    const result = await createOrder(
      { items, shipping, payment_method, discount_code, cart_id },
      user?.id ?? null
    );

    // For Stripe payments: create a PaymentIntent and return the clientSecret
    if (payment_method === "stripe") {
      const fullOrder = await getOrderById(result.order_id, user?.id ?? null);
      if (!fullOrder) {
        return NextResponse.json({ error: "Order not found" }, { status: 500 });
      }

      const customerEmail = user?.email ?? shipping.email;
      const intentResult = await createPaymentIntent(fullOrder, customerEmail);

      return NextResponse.json(
        {
          ...result,
          client_secret: intentResult.client_secret,
          payment_method: "stripe",
        },
        { status: 201 }
      );
    }

    // Non-Stripe payments: send confirmation emails (non-fatal)
    try {
      const fullOrder = await getOrderById(result.order_id, user?.id ?? null);
      if (fullOrder) {
        await Promise.all([
          sendOrderConfirmation(fullOrder),
          sendAdminOrderAlert(fullOrder),
        ]);
      }
    } catch (emailErr) {
      console.error("Email send failed (non-fatal):", emailErr);
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("[POST /api/checkout]", err);
    const message = parseDbError(err instanceof Error ? err.message : "");
    return NextResponse.json(
      { error: message || "Checkout failed. Please try again." },
      { status: 500 }
    );
  }
}
