import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { ProductWithImages } from "@/lib/types";
import { formatPrice, discountPercent } from "@/lib/utils";

interface ProductCardProps {
  product: ProductWithImages;
}

const LABEL_STYLES: Record<string, string> = {
  new: "bg-silver text-background",
  sale: "bg-garnet text-white",
  bestseller: "bg-muted text-silver border border-silver/30",
  limited: "bg-background text-silver border border-silver/40",
};

export function ProductCard({ product }: ProductCardProps) {
  const image = product.primary_image;
  const hasDiscount =
    product.compare_price && product.compare_price > product.price;
  const savings = hasDiscount
    ? discountPercent(product.price, product.compare_price!)
    : 0;

  return (
    <Link href={`/products/${product.slug}`} className="group block cursor-pointer">
      {/* Image container */}
      <div className="relative overflow-hidden bg-secondary aspect-[3/4]">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt_text ?? product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover object-center transition-all duration-700 ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-muted-foreground text-[10px] tracking-[0.2em] uppercase">
              No image
            </span>
          </div>
        )}

        {/* Gradient overlay — deepens on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Quick view bar — slides up */}
        <div className="absolute inset-x-4 bottom-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <div className="flex items-center justify-center gap-2 bg-silver/95 backdrop-blur-sm text-background py-2.5 px-4">
            <svg
              className="w-3 h-3 flex-shrink-0"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <rect x="1" y="4" width="10" height="7" rx="0.5" stroke="currentColor" strokeWidth="1" />
              <path d="M4 4V3a2 2 0 1 1 4 0v1" stroke="currentColor" strokeWidth="1" />
            </svg>
            <span className="text-[10px] tracking-[0.22em] uppercase font-medium font-sans">
              View Piece
            </span>
          </div>
        </div>

        {/* Silver border shimmer on hover */}
        <div className="absolute inset-0 border border-transparent group-hover:border-silver/25 transition-colors duration-500 pointer-events-none" />

        {/* Label badge */}
        {product.label && (
          <div className="absolute top-3 left-3">
            <span
              className={[
                "inline-block text-[9px] tracking-[0.2em] uppercase font-medium font-sans px-2 py-1",
                LABEL_STYLES[product.label] ?? "bg-muted text-foreground",
              ].join(" ")}
            >
              {product.label === "bestseller" ? "Best Seller" : product.label}
            </span>
          </div>
        )}

        {/* Discount badge */}
        {savings > 0 && (
          <div className="absolute top-3 right-3">
            <span className="inline-block text-[9px] tracking-[0.15em] uppercase font-medium font-sans px-2 py-1 bg-garnet text-white">
              -{savings}%
            </span>
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="mt-3.5 space-y-1.5">
        <p className="font-display text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300 line-clamp-1 tracking-wide">
          {product.name}
        </p>
        <div className="flex items-center gap-2.5">
          <span className="text-sm text-silver font-sans font-medium tabular-nums">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through tabular-nums">
              {formatPrice(product.compare_price!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="block" aria-hidden="true">
      <div className="aspect-[3/4] bg-secondary animate-pulse relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>
      <div className="mt-3.5 space-y-2">
        <div className="h-3.5 bg-secondary rounded-none animate-pulse w-3/4" />
        <div className="h-3 bg-secondary rounded-none animate-pulse w-1/3" />
      </div>
    </div>
  );
}
