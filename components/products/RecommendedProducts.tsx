"use client";

import { useEffect, useState } from "react";
import type { ProductWithImages } from "@/lib/types";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";

interface RecommendedProductsProps {
  productId: string;
}

export function RecommendedProducts({ productId }: RecommendedProductsProps) {
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/recommendations?product_id=${productId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        // Silently skip — recommendations are non-critical
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="mt-20 border-t border-border pt-16">
      <div className="mb-10">
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-sans mb-2">
          AI Curated
        </p>
        <h3 className="font-display text-2xl tracking-wide">
          You Might Also Like
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-10">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          : products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>
    </section>
  );
}
