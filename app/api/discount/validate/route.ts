import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { z } from "zod";
import type { DiscountCode } from "@/lib/types";

const schema = z.object({
  code: z.string().min(1).max(50),
  subtotal: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { code, subtotal } = parsed.data;
    const supabase = createServiceClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("discount_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .lte("valid_from", now)
      .or(`valid_until.is.null,valid_until.gte.${now}`)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Invalid or expired discount code." },
        { status: 400 }
      );
    }

    const discount = data as DiscountCode;

    if (discount.max_uses !== null && discount.uses_count >= discount.max_uses) {
      return NextResponse.json(
        { error: "This discount code has reached its usage limit." },
        { status: 400 }
      );
    }

    if (discount.minimum_amount && subtotal < discount.minimum_amount) {
      return NextResponse.json(
        {
          error: `Minimum order of $${(discount.minimum_amount / 100).toFixed(2)} required for this code.`,
        },
        { status: 400 }
      );
    }

    let discount_amount = 0;
    if (discount.type === "percentage") {
      discount_amount = Math.floor((subtotal * discount.value) / 100);
    } else {
      discount_amount = Math.min(discount.value, subtotal);
    }

    return NextResponse.json({
      discount_amount,
      type: discount.type,
      value: discount.value,
    });
  } catch (err) {
    console.error("[POST /api/discount/validate]", err);
    return NextResponse.json(
      { error: "Failed to validate discount code." },
      { status: 500 }
    );
  }
}
