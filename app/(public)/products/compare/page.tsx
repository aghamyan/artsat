import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getProductById } from "@/services/product.service";
import { formatPrice } from "@/lib/utils";
import { RatingStars } from "@/components/products/RatingStars";
import { Badge } from "@/components/ui/badge";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Compare Products | ${SITE_NAME}`,
};

interface Props {
  searchParams: Promise<{ ids?: string }>;
}

export default async function ComparePage({ searchParams }: Props) {
  const { ids } = await searchParams;
  const productIds = ids?.split(",").filter(Boolean).slice(0, 3) ?? [];

  const products = await Promise.all(
    productIds.map((id) => getProductById(id))
  );
  const validProducts = products.filter(Boolean) as NonNullable<(typeof products)[0]>[];

  if (validProducts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Compare Products</h1>
        <p className="text-muted-foreground mb-6">
          No products selected for comparison. Add <code>?ids=id1,id2,id3</code> to the URL,
          or browse products and select up to 3 to compare.
        </p>
        <Link href="/products" className="underline hover:no-underline">
          Browse Products
        </Link>
      </div>
    );
  }

  const rows: { label: string; key: (p: NonNullable<typeof validProducts[0]>) => React.ReactNode }[] = [
    { label: "Image", key: (p) => p.primary_image ? (
      <div className="relative aspect-square w-32 mx-auto">
        <Image src={p.primary_image.url} alt={p.name} fill className="object-cover rounded-lg" />
      </div>
    ) : <div className="h-32 bg-muted rounded-lg mx-auto w-32 flex items-center justify-center text-muted-foreground text-xs">No image</div> },
    { label: "Name", key: (p) => <Link href={`/products/${p.slug}`} className="font-semibold hover:underline">{p.name}</Link> },
    { label: "Price", key: (p) => formatPrice(p.price) },
    { label: "Rating", key: (p) => p.average_rating > 0 ? <RatingStars rating={p.average_rating} showCount={false} /> : "—" },
    { label: "Category", key: (p) => p.category?.name ?? "—" },
    { label: "Label", key: (p) => p.label ? <Badge variant="secondary" className="capitalize">{p.label}</Badge> : "—" },
    { label: "Material", key: (p) => p.material ?? "—" },
    { label: "Sizes", key: (p) => {
      const sizes = [...new Set(p.variants.map((v) => v.size).filter(Boolean))];
      return sizes.length ? sizes.join(", ") : "—";
    }},
    { label: "Colors", key: (p) => {
      const colors = [...new Set(p.variants.map((v) => v.color).filter(Boolean))];
      return colors.length ? colors.join(", ") : "—";
    }},
    { label: "In Stock", key: (p) => p.variants.some((v) => v.stock > 0) ? "✓ Yes" : "✗ No" },
    { label: "Care", key: (p) => p.care_instructions ?? "—" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 overflow-x-auto">
      <nav aria-label="breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <li><a href="/" className="hover:text-foreground">Home</a></li>
          <li>/</li>
          <li><a href="/products" className="hover:text-foreground">Shop</a></li>
          <li>/</li>
          <li className="text-foreground font-medium">Compare</li>
        </ol>
      </nav>

      <h1 className="text-2xl font-bold mb-8">Compare Products</h1>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-36 text-left px-4 py-3 border-b font-medium text-muted-foreground text-sm" />
            {validProducts.map((p) => (
              <th key={p.id} className="px-6 py-3 border-b text-center" />
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, key }) => (
            <tr key={label} className="border-b last:border-b-0 hover:bg-muted/20">
              <td className="px-4 py-4 text-sm font-medium text-muted-foreground align-top">
                {label}
              </td>
              {validProducts.map((p) => (
                <td key={p.id} className="px-6 py-4 text-sm text-center align-top">
                  {key(p)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
