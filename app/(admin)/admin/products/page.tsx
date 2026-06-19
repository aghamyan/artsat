import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getProducts } from "@/services/product.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Products | Admin | ${SITE_NAME}`,
};

export default async function AdminProductsPage() {
  const { products } = await getProducts({ limit: 100 });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button asChild>
          <Link href="/admin/products/new">Add Product</Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-background overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Slug</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3 text-left font-medium">Label</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{product.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {product.slug}
                </td>
                <td className="px-4 py-3 text-right">{formatPrice(product.price)}</td>
                <td className="px-4 py-3">
                  {product.label ? (
                    <Badge variant="secondary" className="capitalize">
                      {product.label}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  {product.is_active ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      Inactive
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/products/${product.id}/edit`}>Edit</Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/products/${product.id}/variants`}>Variants</Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/products/${product.id}/images`}>Images</Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No products yet.{" "}
            <Link href="/admin/products/new" className="underline">
              Add one
            </Link>
            .
          </div>
        )}
      </div>
    </div>
  );
}
