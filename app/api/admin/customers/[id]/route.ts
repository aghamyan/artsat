import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getCustomerDetail } from "@/services/customer.service";
import { getCustomerOrders } from "@/services/customer.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [customer, ordersResult] = await Promise.all([
    getCustomerDetail(id),
    getCustomerOrders(id, 1, 5),
  ]);

  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: { customer, recent_orders: ordersResult.orders, order_count: ordersResult.total } });
}
