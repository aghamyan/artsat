import React from "react";
import { ProductCard } from "./ProductCard";
import type { ProductWithImages } from "@/lib/types";

interface RelatedProductsProps {
  products: ProductWithImages[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (!products.length) return null;

  return (
    <section className="mt-16">
      <h2 className="text-xl font-bold mb-6">You Might Also Like</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
