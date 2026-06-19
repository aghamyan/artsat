import type { Metadata } from "next";
import Link from "next/link";
import {
  getCustomerSegments,
  summariseSegments,
} from "@/services/analytics.service";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Customer Analytics | Admin | ${SITE_NAME}`,
};

const SEGMENT_LABELS: Record<string, { label: string; color: string }> = {
  loyal: { label: "Loyal", color: "bg-green-100 text-green-800" },
  high_value: { label: "High Value", color: "bg-purple-100 text-purple-800" },
  at_risk: { label: "At Risk", color: "bg-red-100 text-red-800" },
  regular: { label: "Regular", color: "bg-blue-100 text-blue-800" },
  new: { label: "New", color: "bg-gray-100 text-gray-800" },
};

export default async function CustomerAnalyticsPage() {
  const segments = await getCustomerSegments();
  const summary = summariseSegments(segments);

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customer Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Segmented view of {summary.total} customers
          </p>
        </div>
        <Link
          href="/admin/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Segment summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Total", value: summary.total, color: "text-foreground" },
          { label: "Loyal (5+ orders)", value: summary.loyal, color: "text-green-600" },
          { label: "High Value ($500+)", value: summary.high_value, color: "text-purple-600" },
          { label: "At Risk (60d inactive)", value: summary.at_risk, color: "text-red-500" },
          { label: "New (0 orders)", value: summary.new_customers, color: "text-muted-foreground" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border bg-background p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Average LTV */}
      <div className="rounded-xl border bg-background p-5 shadow-sm inline-block">
        <p className="text-sm text-muted-foreground">Average Lifetime Value</p>
        <p className="text-3xl font-bold mt-1">{formatPrice(summary.average_ltv)}</p>
      </div>

      {/* Customer table */}
      <div className="rounded-xl border bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-center font-medium">Segment</th>
                <th className="px-4 py-3 text-right font-medium">Orders</th>
                <th className="px-4 py-3 text-right font-medium">LTV</th>
                <th className="px-4 py-3 text-right font-medium">Last Order</th>
                <th className="px-4 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {segments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No customer data yet.
                  </td>
                </tr>
              )}
              {segments.map((c) => {
                const seg = SEGMENT_LABELS[c.segment] ?? {
                  label: c.segment,
                  color: "bg-gray-100 text-gray-800",
                };
                return (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.full_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={`${seg.color} border-0 text-xs`}>
                        {seg.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">{c.order_count}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatPrice(c.ltv)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                      {c.last_order_at
                        ? new Date(c.last_order_at).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/admin/customers/${c.id}`}
                        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
