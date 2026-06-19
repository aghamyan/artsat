import { createServiceClient } from "@/lib/supabase-server";
import type { ProductAnalyticsSummary } from "@/lib/types";

// ── Revenue ───────────────────────────────────────────────────

export interface RevenueMetrics {
  revenue_today: number;
  revenue_this_month: number;
  revenue_last_month: number;
  revenue_this_year: number;
  revenue_vs_last_month_pct: number;
  daily_revenue: { date: string; revenue: number }[];
}

export async function getRevenueMetrics(): Promise<RevenueMetrics> {
  const supabase = createServiceClient();
  const now = new Date();

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [todayRes, monthRes, lastMonthRes, yearRes, dailyRes] = await Promise.all([
    supabase.from("orders").select("total").eq("payment_status", "paid").gte("created_at", todayStart.toISOString()),
    supabase.from("orders").select("total").eq("payment_status", "paid").gte("created_at", monthStart.toISOString()),
    supabase.from("orders").select("total").eq("payment_status", "paid").gte("created_at", lastMonthStart.toISOString()).lt("created_at", lastMonthEnd.toISOString()),
    supabase.from("orders").select("total").eq("payment_status", "paid").gte("created_at", yearStart.toISOString()),
    supabase.from("orders").select("total, created_at").eq("payment_status", "paid").gte("created_at", thirtyDaysAgo.toISOString()).order("created_at", { ascending: true }),
  ]);

  const sum = (rows: { total: number }[] | null) =>
    (rows ?? []).reduce((s, r) => s + r.total, 0);

  const revenue_today = sum(todayRes.data);
  const revenue_this_month = sum(monthRes.data);
  const revenue_last_month = sum(lastMonthRes.data);
  const revenue_this_year = sum(yearRes.data);
  const revenue_vs_last_month_pct =
    revenue_last_month === 0
      ? 0
      : Math.round(((revenue_this_month - revenue_last_month) / revenue_last_month) * 100);

  // Build daily revenue map over 30-day window
  const dailyMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(thirtyDaysAgo.getDate() + i);
    dailyMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of dailyRes.data ?? []) {
    const key = (row.created_at as string).slice(0, 10);
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + row.total);
  }
  const daily_revenue = Array.from(dailyMap.entries()).map(([date, revenue]) => ({
    date,
    revenue,
  }));

  return {
    revenue_today,
    revenue_this_month,
    revenue_last_month,
    revenue_this_year,
    revenue_vs_last_month_pct,
    daily_revenue,
  };
}

// ── Orders ────────────────────────────────────────────────────

export interface OrderMetrics {
  orders_today: number;
  orders_this_month: number;
  orders_pending: number;
  average_order_value: number;
  orders_vs_last_month_pct: number;
}

export async function getOrderMetrics(): Promise<OrderMetrics> {
  const supabase = createServiceClient();
  const now = new Date();

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todayRes, monthRes, lastMonthRes, pendingRes, aovRes] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact" }).gte("created_at", todayStart.toISOString()),
    supabase.from("orders").select("id", { count: "exact" }).gte("created_at", monthStart.toISOString()),
    supabase.from("orders").select("id", { count: "exact" }).gte("created_at", lastMonthStart.toISOString()).lt("created_at", lastMonthEnd.toISOString()),
    supabase.from("orders").select("id", { count: "exact" }).eq("status", "pending"),
    supabase.from("orders").select("total").eq("payment_status", "paid"),
  ]);

  const orders_today = todayRes.count ?? 0;
  const orders_this_month = monthRes.count ?? 0;
  const orders_last_month = lastMonthRes.count ?? 0;
  const orders_pending = pendingRes.count ?? 0;
  const paidOrders = aovRes.data ?? [];
  const average_order_value =
    paidOrders.length === 0
      ? 0
      : Math.round(paidOrders.reduce((s, o) => s + o.total, 0) / paidOrders.length);
  const orders_vs_last_month_pct =
    orders_last_month === 0
      ? 0
      : Math.round(((orders_this_month - orders_last_month) / orders_last_month) * 100);

  return {
    orders_today,
    orders_this_month,
    orders_pending,
    average_order_value,
    orders_vs_last_month_pct,
  };
}

// ── Customers ─────────────────────────────────────────────────

export interface CustomerOverviewMetrics {
  total_customers: number;
  new_customers_today: number;
  new_customers_this_month: number;
  repeat_customer_rate: number;
}

export async function getCustomerOverviewMetrics(): Promise<CustomerOverviewMetrics> {
  const supabase = createServiceClient();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalRes, todayRes, monthRes, repeatRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact" }).eq("role", "customer"),
    supabase.from("profiles").select("id", { count: "exact" }).eq("role", "customer").gte("created_at", todayStart.toISOString()),
    supabase.from("profiles").select("id", { count: "exact" }).eq("role", "customer").gte("created_at", monthStart.toISOString()),
    supabase.from("orders").select("user_id").eq("payment_status", "paid").not("user_id", "is", null),
  ]);

  const ordersByCustomer = new Map<string, number>();
  for (const row of repeatRes.data ?? []) {
    if (row.user_id) {
      ordersByCustomer.set(row.user_id, (ordersByCustomer.get(row.user_id) ?? 0) + 1);
    }
  }
  const repeatCount = [...ordersByCustomer.values()].filter((c) => c >= 2).length;
  const repeat_customer_rate =
    ordersByCustomer.size === 0 ? 0 : Math.round((repeatCount / ordersByCustomer.size) * 100);

  return {
    total_customers: totalRes.count ?? 0,
    new_customers_today: todayRes.count ?? 0,
    new_customers_this_month: monthRes.count ?? 0,
    repeat_customer_rate,
  };
}

// ── Payment health ────────────────────────────────────────────

export interface PaymentHealthMetrics {
  payment_success_rate: number;
  failed_payments_count: number;
  refund_rate: number;
}

export async function getPaymentHealthMetrics(): Promise<PaymentHealthMetrics> {
  const supabase = createServiceClient();
  const { data: rows } = await supabase
    .from("orders")
    .select("payment_status")
    .not("payment_method", "eq", "cash_on_delivery");

  const all = rows ?? [];
  const paid = all.filter((r) => r.payment_status === "paid").length;
  const failed = all.filter((r) => r.payment_status === "failed").length;
  const refunded = all.filter((r) => r.payment_status === "refunded").length;
  const payment_success_rate =
    all.length === 0 ? 100 : Math.round((paid / all.length) * 100);
  const refund_rate =
    paid + refunded === 0 ? 0 : Math.round((refunded / (paid + refunded)) * 100);

  return {
    payment_success_rate,
    failed_payments_count: failed,
    refund_rate,
  };
}

// ── Combined BI dashboard ─────────────────────────────────────

export interface DashboardMetrics
  extends RevenueMetrics,
    OrderMetrics,
    CustomerOverviewMetrics,
    PaymentHealthMetrics {}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [revenue, orders, customers, payments] = await Promise.all([
    getRevenueMetrics(),
    getOrderMetrics(),
    getCustomerOverviewMetrics(),
    getPaymentHealthMetrics(),
  ]);
  return { ...revenue, ...orders, ...customers, ...payments };
}

// ── Product performance table ─────────────────────────────────

export interface ProductPerformanceRow {
  id: string;
  name: string;
  price: number;
  primary_image: string | null;
  units_sold: number;
  revenue: number;
  views: number;
  add_to_cart: number;
  cart_conversion_rate: number;
  average_rating: number;
  review_count: number;
  total_stock: number;
  return_count: number;
  return_rate: number;
}

export async function getProductPerformance(): Promise<ProductPerformanceRow[]> {
  const supabase = createServiceClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [productsRes, analyticsRes, salesRes, returnsRes] = await Promise.all([
    supabase
      .from("products")
      .select(`id, name, price, product_images(url, is_primary), product_variants(stock), product_ratings(average_rating, review_count)`)
      .is("deleted_at", null)
      .eq("is_active", true),
    supabase
      .from("product_analytics")
      .select("product_id, views, add_to_cart")
      .gte("date", thirtyDaysAgo.toISOString().slice(0, 10)),
    supabase
      .from("order_items")
      .select("product_id, quantity, total_price")
      .gte("created_at", thirtyDaysAgo.toISOString()),
    supabase
      .from("returns_exchanges")
      .select("quantity, order_items!inner(product_id)")
      .gte("created_at", thirtyDaysAgo.toISOString()),
  ]);

  const analyticsMap = new Map<string, { views: number; add_to_cart: number }>();
  for (const row of analyticsRes.data ?? []) {
    const cur = analyticsMap.get(row.product_id) ?? { views: 0, add_to_cart: 0 };
    analyticsMap.set(row.product_id, {
      views: cur.views + row.views,
      add_to_cart: cur.add_to_cart + row.add_to_cart,
    });
  }

  const salesMap = new Map<string, { units: number; revenue: number }>();
  for (const row of salesRes.data ?? []) {
    if (!row.product_id) continue;
    const cur = salesMap.get(row.product_id) ?? { units: 0, revenue: 0 };
    salesMap.set(row.product_id, {
      units: cur.units + row.quantity,
      revenue: cur.revenue + row.total_price,
    });
  }

  const returnsMap = new Map<string, number>();
  for (const row of returnsRes.data ?? []) {
    const pid = (row.order_items as unknown as { product_id: string } | null)?.product_id;
    if (!pid) continue;
    returnsMap.set(pid, (returnsMap.get(pid) ?? 0) + row.quantity);
  }

  return (productsRes.data ?? [])
    .map((p) => {
      const images = (p.product_images as { url: string; is_primary: boolean }[]) ?? [];
      const primary = images.find((i) => i.is_primary)?.url ?? images[0]?.url ?? null;
      const variants = (p.product_variants as { stock: number }[]) ?? [];
      const ratingsRaw = p.product_ratings;
      const ratings = (Array.isArray(ratingsRaw) ? ratingsRaw[0] : ratingsRaw) as
        | { average_rating: number; review_count: number }
        | null
        | undefined;
      const av = analyticsMap.get(p.id) ?? { views: 0, add_to_cart: 0 };
      const sal = salesMap.get(p.id) ?? { units: 0, revenue: 0 };
      const returnCount = returnsMap.get(p.id) ?? 0;
      const cart_conversion_rate =
        av.views === 0 ? 0 : Math.round((av.add_to_cart / av.views) * 100);
      const return_rate =
        sal.units === 0 ? 0 : Math.round((returnCount / sal.units) * 100);

      return {
        id: p.id,
        name: p.name,
        price: p.price,
        primary_image: primary,
        units_sold: sal.units,
        revenue: sal.revenue,
        views: av.views,
        add_to_cart: av.add_to_cart,
        cart_conversion_rate,
        average_rating: ratings?.average_rating ?? 0,
        review_count: ratings?.review_count ?? 0,
        total_stock: variants.reduce((s, v) => s + v.stock, 0),
        return_count: returnCount,
        return_rate,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

// ── Customer segments ─────────────────────────────────────────

export interface CustomerSegmentRow {
  id: string;
  full_name: string | null;
  email: string;
  order_count: number;
  ltv: number;
  last_order_at: string | null;
  segment: "loyal" | "at_risk" | "high_value" | "new" | "regular";
}

export async function getCustomerSegments(): Promise<CustomerSegmentRow[]> {
  const supabase = createServiceClient();

  const [customersRes, ordersRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, created_at")
      .eq("role", "customer")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("orders")
      .select("user_id, total, created_at")
      .eq("payment_status", "paid")
      .not("user_id", "is", null),
  ]);

  const statsMap = new Map<string, { count: number; ltv: number; last: string | null }>();
  for (const o of ordersRes.data ?? []) {
    if (!o.user_id) continue;
    const cur = statsMap.get(o.user_id) ?? { count: 0, ltv: 0, last: null };
    const newLast =
      cur.last === null || o.created_at > cur.last ? o.created_at : cur.last;
    statsMap.set(o.user_id, { count: cur.count + 1, ltv: cur.ltv + o.total, last: newLast });
  }

  const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;

  return (customersRes.data ?? []).map((c) => {
    const stats = statsMap.get(c.id) ?? { count: 0, ltv: 0, last: null };
    const lastMs = stats.last ? new Date(stats.last).getTime() : null;

    let segment: CustomerSegmentRow["segment"] = "new";
    if (stats.count >= 5) {
      segment = "loyal";
    } else if (stats.ltv >= 50000) {
      segment = "high_value";
    } else if (stats.count > 0 && lastMs !== null && lastMs < sixtyDaysAgo) {
      segment = "at_risk";
    } else if (stats.count >= 2) {
      segment = "regular";
    }

    return {
      id: c.id,
      full_name: c.full_name,
      email: c.email,
      order_count: stats.count,
      ltv: stats.ltv,
      last_order_at: stats.last,
      segment,
    };
  });
}

export interface CustomerSegmentSummary {
  total: number;
  loyal: number;
  high_value: number;
  at_risk: number;
  new_customers: number;
  average_ltv: number;
}

export function summariseSegments(segments: CustomerSegmentRow[]): CustomerSegmentSummary {
  const total = segments.length;
  const totalLtv = segments.reduce((s, c) => s + c.ltv, 0);
  return {
    total,
    loyal: segments.filter((s) => s.segment === "loyal").length,
    high_value: segments.filter((s) => s.segment === "high_value").length,
    at_risk: segments.filter((s) => s.segment === "at_risk").length,
    new_customers: segments.filter((s) => s.segment === "new").length,
    average_ltv: total === 0 ? 0 : Math.round(totalLtv / total),
  };
}

// ── Inventory forecasting ─────────────────────────────────────

export interface StockForecastRow {
  variant_id: string;
  sku: string;
  product_name: string;
  size: string | null;
  color: string | null;
  current_stock: number;
  reorder_level: number;
  weekly_velocity: number;
  weeks_remaining: number;
  needs_reorder: boolean;
}

export async function getStockForecasts(): Promise<StockForecastRow[]> {
  const supabase = createServiceClient();
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const [variantsRes, salesRes] = await Promise.all([
    supabase
      .from("product_variants")
      .select("id, sku, size, color, stock, reorder_level, products!inner(name)")
      .eq("is_active", true)
      .order("stock", { ascending: true }),
    supabase
      .from("order_items")
      .select("variant_id, quantity")
      .gte("created_at", fourWeeksAgo.toISOString())
      .not("variant_id", "is", null),
  ]);

  const salesMap = new Map<string, number>();
  for (const row of salesRes.data ?? []) {
    if (row.variant_id) {
      salesMap.set(row.variant_id, (salesMap.get(row.variant_id) ?? 0) + row.quantity);
    }
  }

  return (variantsRes.data ?? []).map((v) => {
    const totalSold = salesMap.get(v.id) ?? 0;
    const weekly_velocity = totalSold / 4;
    const weeks_remaining =
      weekly_velocity === 0 ? 99 : Math.round((v.stock / weekly_velocity) * 10) / 10;

    return {
      variant_id: v.id,
      sku: v.sku,
      product_name: (v.products as unknown as { name: string }).name,
      size: v.size,
      color: v.color,
      current_stock: v.stock,
      reorder_level: v.reorder_level,
      weekly_velocity: Math.round(weekly_velocity * 10) / 10,
      weeks_remaining,
      needs_reorder: v.stock <= v.reorder_level,
    };
  });
}

export type AnalyticEvent = "views" | "searches" | "add_to_cart";

/**
 * Atomically increments a product analytic counter via the Postgres function
 * defined in migration 009. Safe against concurrent updates.
 */
export async function trackProductEvent(
  productId: string,
  event: AnalyticEvent,
  searchQuery?: string
): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.rpc("increment_product_analytic", {
    p_product_id: productId,
    p_event: event,
    p_date: new Date().toISOString().split("T")[0],
    p_query: searchQuery ?? null,
  });
  if (error) {
    // Silently swallow analytic errors — never block user action
    console.error("[analytics] trackProductEvent:", error.message);
  }
}

export async function getTopProducts(
  days = 30,
  limit = 10
): Promise<ProductAnalyticsSummary[]> {
  const supabase = createServiceClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("product_analytics")
    .select(`
      product_id,
      views,
      searches,
      add_to_cart,
      products!inner(name)
    `)
    .gte("date", since.toISOString().split("T")[0])
    .order("views", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  // Aggregate by product_id across days
  const map = new Map<string, ProductAnalyticsSummary>();
  for (const row of data ?? []) {
    const name =
      (row.products as unknown as { name: string } | null)?.name ?? "Unknown";
    const existing = map.get(row.product_id);
    if (existing) {
      existing.total_views += row.views;
      existing.total_searches += row.searches;
      existing.total_add_to_cart += row.add_to_cart;
    } else {
      map.set(row.product_id, {
        product_id: row.product_id,
        product_name: name,
        total_views: row.views,
        total_searches: row.searches,
        total_add_to_cart: row.add_to_cart,
        period_days: days,
      });
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => b.total_views - a.total_views
  );
}

export async function getProductAnalytics(
  productId: string,
  days = 30
): Promise<{
  views: number;
  searches: number;
  add_to_cart: number;
  daily: { date: string; views: number; searches: number; add_to_cart: number }[];
}> {
  const supabase = createServiceClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("product_analytics")
    .select("date, views, searches, add_to_cart")
    .eq("product_id", productId)
    .gte("date", since.toISOString().split("T")[0])
    .order("date", { ascending: true });

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  return {
    views: rows.reduce((s, r) => s + r.views, 0),
    searches: rows.reduce((s, r) => s + r.searches, 0),
    add_to_cart: rows.reduce((s, r) => s + r.add_to_cart, 0),
    daily: rows,
  };
}
