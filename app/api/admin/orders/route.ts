import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAllOrders, updateOrderStatus } from "@/services/order.service";
import type { OrderStatus } from "@/lib/types";
import { z } from "zod";

export async function GET() {
  let profile;
  try {
    profile = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  void profile;

  try {
    const { orders } = await getAllOrders(1, 100);
    return NextResponse.json(orders);
  } catch (err) {
    console.error("[GET /api/admin/orders]", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

const updateSchema = z.object({
  order_id: z.string().uuid(),
  status: z.enum([
    "pending",
    "confirmed",
    "preparing",
    "ready_for_pickup",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "returned",
    "refunded",
  ]),
});

export async function PATCH(req: NextRequest) {
  let profile;
  try {
    profile = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { order_id, status } = parsed.data;
    await updateOrderStatus(order_id, status as OrderStatus, profile.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/admin/orders]", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
