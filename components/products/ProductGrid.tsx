import React from "react";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";
import type { ProductWithImages } from "@/lib/types";

interface ProductGridProps {
  products: ProductWithImages[];
  isLoading?: boolean;
}

export function ProductGrid({ products, isLoading = false }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="flex justify-center">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="text-border"
          >
            <rect x="8" y="12" width="24" height="20" rx="0.5" stroke="currentColor" strokeWidth="1" />
            <path d="M15 12V10a5 5 0 0 1 10 0v2" stroke="currentColor" strokeWidth="1" />
            <circle cx="20" cy="22" r="2" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>
        <p className="text-muted-foreground text-sm font-sans">No pieces found.</p>
        <p className="text-xs text-muted-foreground/60 tracking-[0.1em]">
          Try adjusting your filters.
        </p>
        <a
          href="/products"
          className="inline-block mt-2 text-[10px] tracking-[0.2em] uppercase text-silver hover:text-foreground transition-colors duration-200"
        >
          View all pieces →
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
