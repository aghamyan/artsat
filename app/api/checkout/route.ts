import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createOrder, getOrderById } from "@/services/order.service";
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

    // Fetch full order for email (non-fatal if this fails)
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
