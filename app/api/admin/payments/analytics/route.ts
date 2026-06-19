import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-server";
import { subDays, format, startOfDay, endOfDay } from "date-fns";

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
    const period = searchParams.get("period") ?? "30d";

    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const from = startOfDay(subDays(new Date(), days)).toISOString();
    const to = endOfDay(new Date()).toISOString();

    const supabase = createServiceClient();

    // Paid orders in period
    const { data: paidOrders } = await supabase
      .from("orders")
      .select("total, created_at")
      .eq("payment_status", "paid")
      .gte("created_at", from)
      .lte("created_at", to);

    const revenue = (paidOrders ?? []).reduce(
      (sum: number, o: { total: number }) => sum + o.total,
      0
    );
    const successful = (paidOrders ?? []).length;
    const averageOrderValue = successful > 0 ? Math.round(revenue / successful) : 0;

    // Failed orders in period
    const { count: failed } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("payment_status", "failed")
      .gte("created_at", from)
      .lte("created_at", to);

    // Refunds in period
    const { data: refundRows } = await supabase
      .from("refunds")
      .select("amount")
      .eq("status", "succeeded")
      .gte("requested_at", from)
      .lte("requested_at", to);

    const refundAmount = (refundRows ?? []).reduce(
      (sum: number, r: { amount: number }) => sum + r.amount,
      0
    );
    const refundRate =
      revenue > 0 ? ((refundAmount / revenue) * 100).toFixed(2) + "%" : "0.00%";

    // Revenue by date (daily buckets)
    const revenueByDate: Array<{ date: string; revenue: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dateStr = format(day, "yyyy-MM-dd");
      const dayRevenue = (paidOrders ?? [])
        .filter(
          (o: { created_at: string }) =>
            format(new Date(o.created_at), "yyyy-MM-dd") === dateStr
        )
        .reduce((sum: number, o: { total: number }) => sum + o.total, 0);
      revenueByDate.push({ date: dateStr, revenue: dayRevenue });
    }

    return NextResponse.json({
      revenue,
      successful,
      failed: failed ?? 0,
      refund_amount: refundAmount,
      refund_rate: refundRate,
      average_order_value: averageOrderValue,
      revenue_by_date: revenueByDate,
    });
  } catch (err) {
    console.error("[GET /api/admin/payments/analytics]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load analytics" },
      { status: 500 }
    );
  }
}
