import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createRefund, getAllRefunds } from "@/services/refund.service";
import { sendRefundEmail } from "@/services/email.service";
import type { RefundReason } from "@/lib/types";

async function requireAdmin(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;
  return user;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);
    const status = searchParams.get("status") ?? undefined;

    const result = await getAllRefunds(page, limit, status);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch refunds" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { order_id, amount, reason } = body as {
      order_id: string;
      amount?: number;
      reason: RefundReason;
    };

    if (!order_id || !reason) {
      return NextResponse.json(
        { error: "order_id and reason are required" },
        { status: 400 }
      );
    }

    const validReasons: RefundReason[] = [
      "requested_by_customer",
      "duplicate",
      "fraudulent",
    ];
    if (!validReasons.includes(reason)) {
      return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
    }

    const refund = await createRefund({
      orderId: order_id,
      amount,
      reason,
      adminId: admin.id,
    });

    // Send customer notification (non-fatal)
    try {
      await sendRefundEmail(order_id, refund.amount, reason);
    } catch (emailErr) {
      console.error("[refund] Email failed (non-fatal):", emailErr);
    }

    return NextResponse.json(refund, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/refunds]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Refund failed" },
      { status: 500 }
    );
  }
}
