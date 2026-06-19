import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getDashboardMetrics } from "@/services/analytics.service";
import { getLowStockVariants as getLowStock } from "@/services/admin.service";
import { RevenueChart } from "@/components/analytics/RevenueChart";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  DollarSign,
  Package,
  CreditCard,
  AlertTriangle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Dashboard | Admin | ${SITE_NAME}`,
};

function TrendBadge({ pct }: { pct: number }) {
  if (pct === 0) return <span className="text-xs text-muted-foreground">no change</span>;
  const positive = pct > 0;
  return (
    <span
      className={`flex items-center gap-0.5 text-xs font-medium ${positive ? "text-green-600" : "text-red-500"}`}
    >
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(pct)}% vs last month
    </span>
  );
}

export default async function AdminDashboardPage() {
  const [metrics, lowStock] = await Promise.all([
    getDashboardMetrics(),
    getLowStock(),
  ]);

  const topCards = [
    {
      label: "Revenue Today",
      value: formatPrice(metrics.revenue_today),
      sub: `${formatPrice(metrics.revenue_this_month)} this month`,
      icon: DollarSign,
      trend: null,
    },
    {
      label: "Orders This Month",
      value: metrics.orders_this_month.toString(),
      sub: `${metrics.orders_today} today · ${metrics.orders_pending} pending`,
      icon: ShoppingCart,
      trend: metrics.orders_vs_last_month_pct,
    },
    {
      label: "Customers",
      value: metrics.total_customers.toString(),
      sub: `${metrics.new_customers_this_month} new · ${metrics.repeat_customer_rate}% repeat`,
      icon: Users,
      trend: null,
    },
    {
      label: "Payment Success",
      value: `${metrics.payment_success_rate}%`,
      sub: `${metrics.failed_payments_count} failed · ${metrics.refund_rate}% refund rate`,
      icon: CreditCard,
      trend: null,
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/analytics/products"
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Product Analytics
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link
            href="/admin/analytics/customers"
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Customers
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link
            href="/admin/analytics/automation"
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Automation
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {topCards.map(({ label, value, sub, icon: Icon, trend }) => (
          <div key={label} className="rounded-xl border bg-background p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            {trend !== null && trend !== undefined && (
              <div className="mt-1">
                <TrendBadge pct={trend} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <section>
        <div className="rounded-xl border bg-background p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Revenue (30 days)</h2>
            <div className="text-right">
              <p className="text-2xl font-bold">{formatPrice(metrics.revenue_this_month)}</p>
              <TrendBadge pct={metrics.revenue_vs_last_month_pct} />
            </div>
          </div>
          <RevenueChart data={metrics.daily_revenue} />
        </div>
      </section>

      {/* Revenue breakdown */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">This Month</p>
          <p className="text-xl font-bold mt-1">{formatPrice(metrics.revenue_this_month)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            vs {formatPrice(metrics.revenue_last_month)} last month
          </p>
        </div>
        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Average Order Value</p>
          <p className="text-xl font-bold mt-1">{formatPrice(metrics.average_order_value)}</p>
        </div>
        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Year to Date</p>
          <p className="text-xl font-bold mt-1">{formatPrice(metrics.revenue_this_year)}</p>
        </div>
      </div>

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-lg font-semibold">
              Low Stock Alerts
              <Badge variant="outline" className="ml-2 text-amber-600 border-amber-200">
                {lowStock.length}
              </Badge>
            </h2>
          </div>
          <div className="rounded-xl border bg-background overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-left font-medium">SKU</th>
                  <th className="px-4 py-3 text-left font-medium">Size</th>
                  <th className="px-4 py-3 text-left font-medium">Color</th>
                  <th className="px-4 py-3 text-right font-medium">Stock</th>
                  <th className="px-4 py-3 text-right font-medium">Reorder At</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lowStock.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/products/${v.product_id ?? ""}`}
                        className="hover:underline"
                      >
                        {v.product_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{v.sku}</td>
                    <td className="px-4 py-3">{v.size ?? "—"}</td>
                    <td className="px-4 py-3">{v.color ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="destructive">{v.stock}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {v.reorder_level ?? 5}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Quick links to analytics */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Analytics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/admin/analytics/products"
            className="rounded-xl border bg-background p-5 shadow-sm hover:bg-accent transition-colors"
          >
            <Package className="h-6 w-6 mb-2 text-muted-foreground" />
            <p className="font-semibold">Product Performance</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Sales, views, conversion, returns
            </p>
          </Link>
          <Link
            href="/admin/analytics/customers"
            className="rounded-xl border bg-background p-5 shadow-sm hover:bg-accent transition-colors"
          >
            <Users className="h-6 w-6 mb-2 text-muted-foreground" />
            <p className="font-semibold">Customer Segments</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              LTV, at-risk, loyal customers
            </p>
          </Link>
          <Link
            href="/admin/analytics/automation"
            className="rounded-xl border bg-background p-5 shadow-sm hover:bg-accent transition-colors"
          >
            <ShoppingCart className="h-6 w-6 mb-2 text-muted-foreground" />
            <p className="font-semibold">Automation</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Abandoned carts, review invites, retry emails
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
