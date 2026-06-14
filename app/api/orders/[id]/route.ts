import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getOrderById, getOrderByGuestToken } from "@/services/order.service";
import { getServerProfile } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const guestToken = req.nextUrl.searchParams.get("token");
    const profile = user ? await getServerProfile() : null;
    const isAdmin = profile?.role === "admin" || profile?.role === "staff";

    const order = isAdmin
      ? await getOrderById(id, null)
      : await getOrderById(id, user?.id ?? null);

    if (!order) {
      // Try guest token
      if (guestToken) {
        const guestOrder = await getOrderByGuestToken(guestToken);
        if (guestOrder && guestOrder.id === id) {
          return NextResponse.json(guestOrder);
        }
      }
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (err) {
    console.error("[GET /api/orders/:id]", err);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}
