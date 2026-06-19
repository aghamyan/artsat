import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getProductPerformance } from "@/services/analytics.service";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";
import { Star, Eye, ShoppingCart, TrendingDown } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Product Analytics | Admin | ${SITE_NAME}`,
};

export default async function ProductAnalyticsPage() {
  const products = await getProductPerformance();

  const totalRevenue = products.reduce((s, p) => s + p.revenue, 0);
  const totalUnits = products.reduce((s, p) => s + p.units_sold, 0);
  const totalViews = products.reduce((s, p) => s + p.views, 0);

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Last 30 days</p>
        </div>
        <Link
          href="/admin/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold mt-1">{formatPrice(totalRevenue)}</p>
        </div>
        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Units Sold</p>
          <p className="text-2xl font-bold mt-1">{totalUnits.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Product Views</p>
          <p className="text-2xl font-bold mt-1">{totalViews.toLocaleString()}</p>
        </div>
      </div>

      {/* Products table */}
      <div className="rounded-xl border bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Product</th>
                <th className="px-4 py-3 text-right font-medium">Revenue</th>
                <th className="px-4 py-3 text-right font-medium">Units Sold</th>
                <th className="px-4 py-3 text-right font-medium">
                  <span className="flex items-center justify-end gap-1">
                    <Eye className="h-3.5 w-3.5" /> Views
                  </span>
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  <span className="flex items-center justify-end gap-1">
                    <ShoppingCart className="h-3.5 w-3.5" /> Cart %
                  </span>
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  <span className="flex items-center justify-end gap-1">
                    <Star className="h-3.5 w-3.5" /> Rating
                  </span>
                </th>
                <th className="px-4 py-3 text-right font-medium">Stock</th>
                <th className="px-4 py-3 text-right font-medium">Return %</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No product data available yet.
                  </td>
                </tr>
              )}
              {products.map((p, i) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-5 text-right">
                        {i + 1}
                      </span>
                      {p.primary_image && (
                        <Image
                          src={p.primary_image}
                          alt={p.name}
                          width={32}
                          height={32}
                          className="rounded object-cover h-8 w-8"
                        />
                      )}
                      <div>
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="font-medium hover:underline"
                        >
                          {p.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(p.price)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatPrice(p.revenue)}
                  </td>
                  <td className="px-4 py-3 text-right">{p.units_sold}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {p.views.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        p.cart_conversion_rate >= 10
                          ? "text-green-600 font-medium"
                          : ""
                      }
                    >
                      {p.cart_conversion_rate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.average_rating > 0 ? (
                      <span className="flex items-center justify-end gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {p.average_rating.toFixed(1)}
                        <span className="text-xs text-muted-foreground">
                          ({p.review_count})
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.total_stock <= 5 ? (
                      <Badge variant="destructive">{p.total_stock}</Badge>
                    ) : (
                      <span>{p.total_stock}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.return_rate > 10 ? (
                      <span className="flex items-center justify-end gap-1 text-red-500">
                        <TrendingDown className="h-3 w-3" />
                        {p.return_rate}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{p.return_rate}%</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
