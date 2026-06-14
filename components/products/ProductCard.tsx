import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { ProductWithImages } from "@/lib/types";
import { formatPrice, discountPercent } from "@/lib/utils";

interface ProductCardProps {
  product: ProductWithImages;
}

export function ProductCard({ product }: ProductCardProps) {
  const image = product.primary_image;
  const hasDiscount =
    product.compare_price && product.compare_price > product.price;
  const savings = hasDiscount
    ? discountPercent(product.price, product.compare_price!)
    : 0;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-lg bg-secondary aspect-[3/4]">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt_text ?? product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm">
            No image
          </div>
        )}

        {/* Label badge */}
        {product.label && (
          <div className="absolute top-2 left-2">
            <Badge
              variant={
                product.label as
                  | "new"
                  | "sale"
                  | "bestseller"
                  | "limited"
                  | "default"
              }
              className="capitalize"
            >
              {product.label === "bestseller" ? "Best Seller" : product.label}
            </Badge>
          </div>
        )}

        {/* Discount badge */}
        {savings > 0 && (
          <div className="absolute top-2 right-2">
            <Badge variant="sale">-{savings}%</Badge>
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <p className="text-sm font-medium line-clamp-1 group-hover:underline">
          {product.name}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
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
    <div className="block">
      <div className="rounded-lg bg-muted aspect-[3/4] animate-pulse" />
      <div className="mt-3 space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
      </div>
    </div>
  );
}
