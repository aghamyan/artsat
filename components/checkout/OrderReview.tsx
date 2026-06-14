import React from "react";
import Image from "next/image";
import type { CartItemEnriched } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

interface OrderReviewProps {
  items: CartItemEnriched[];
}

export function OrderReview({ items }: OrderReviewProps) {
  return (
    <div className="space-y-4 rounded-lg border p-6">
      <h2 className="font-semibold text-lg">Review Your Order</h2>
      <div className="space-y-4">
        {items.map((item) => {
          const image =
            item.images.find((i) => i.is_primary) ?? item.images[0];
          const variantLabel = [item.variant.size, item.variant.color]
            .filter(Boolean)
            .join(" · ");

          return (
            <div key={item.variant_id} className="flex gap-4">
              <div className="relative h-16 w-12 shrink-0 rounded overflow-hidden bg-secondary">
                {image ? (
                  <Image
                    src={image.url}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">
                  {item.product.name}
                </p>
                {variantLabel && (
                  <p className="text-xs text-muted-foreground">{variantLabel}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Qty: {item.quantity}
                </p>
              </div>
              <p className="text-sm font-medium shrink-0">
                {formatPrice(item.line_total)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
