import React from "react";
import type { Metadata } from "next";
import { getDashboardStats, getLowStockVariants } from "@/services/admin.service";
import { Badge } from "@/components/ui/badge";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Dashboard | Admin | ${SITE_NAME}`,
};

export default async function AdminDashboardPage() {
  const [stats, lowStock] = await Promise.all([
    getDashboardStats(),
    getLowStockVariants(),
  ]);

  const cards = [
    { label: "Total Orders", value: stats.totalOrders },
    { label: "Pending Orders", value: stats.pendingOrders },
    { label: "Total Revenue", value: `$${(stats.totalRevenue / 100).toFixed(2)}` },
    { label: "Low Stock SKUs", value: stats.lowStockCount },
  ];

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value }) => (
          <div key={label} className="rounded-xl border bg-background p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      {lowStock.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Low Stock Alerts</h2>
          <div className="rounded-xl border bg-background overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-left font-medium">SKU</th>
                  <th className="px-4 py-3 text-left font-medium">Size</th>
                  <th className="px-4 py-3 text-left font-medium">Color</th>
                  <th className="px-4 py-3 text-right font-medium">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lowStock.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">{v.product_name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{v.sku}</td>
                    <td className="px-4 py-3">{v.size ?? "—"}</td>
                    <td className="px-4 py-3">{v.color ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="destructive">{v.stock}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
