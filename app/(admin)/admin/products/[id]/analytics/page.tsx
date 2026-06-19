import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Eye, Search, ShoppingCart } from "lucide-react";
import { getProductById } from "@/services/product.service";
import { getProductAnalytics } from "@/services/analytics.service";
import { SITE_NAME } from "@/lib/constants";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  return { title: `Analytics — ${product?.name ?? "Product"} | Admin | ${SITE_NAME}` };
}

export default async function ProductAnalyticsPage({ params }: Props) {
  const { id } = await params;
  const [product, analytics] = await Promise.all([
    getProductById(id),
    getProductAnalytics(id, 30),
  ]);

  if (!product) notFound();

  const stats = [
    { label: "Views (30d)", value: analytics.views, icon: Eye },
    { label: "Searches (30d)", value: analytics.searches, icon: Search },
    { label: "Add to Cart (30d)", value: analytics.add_to_cart, icon: ShoppingCart },
  ];

  return (
    <div className="p-8 max-w-4xl space-y-8">
      <div>
        <Link
          href={`/admin/products/${id}/edit`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" /> Back to {product.name}
        </Link>
        <h1 className="text-2xl font-bold">Product Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {product.name} — Last 30 days
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border p-5 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-4 w-4" />
              <span className="text-sm">{label}</span>
            </div>
            <p className="text-3xl font-bold">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Daily breakdown */}
      {analytics.daily.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Daily Breakdown</h2>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Views</th>
                  <th className="px-4 py-3 text-right font-medium">Searches</th>
                  <th className="px-4 py-3 text-right font-medium">Add to Cart</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {analytics.daily.map((row) => (
                  <tr key={row.date} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-mono text-xs">{row.date}</td>
                    <td className="px-4 py-2.5 text-right">{row.views}</td>
                    <td className="px-4 py-2.5 text-right">{row.searches}</td>
                    <td className="px-4 py-2.5 text-right">{row.add_to_cart}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {analytics.daily.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">
          No analytics data for this period yet. Views are tracked when customers visit the product page.
        </p>
      )}
    </div>
  );
}
