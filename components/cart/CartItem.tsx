"use client";

import React from "react";
import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import type { CartItemEnriched } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

interface CartItemProps {
  item: CartItemEnriched;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();
  const image = item.images.find((i) => i.is_primary) ?? item.images[0];

  const variantLabel = [item.variant.size, item.variant.color]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex gap-3">
      {/* Image */}
      <div className="relative h-20 w-16 shrink-0 rounded-md overflow-hidden bg-secondary">
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

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
        {variantLabel && (
          <p className="text-xs text-muted-foreground mt-0.5">{variantLabel}</p>
        )}
        <p className="text-sm font-semibold mt-1">
          {formatPrice(item.line_total)}
        </p>

        {/* Quantity controls */}
        <div className="flex items-center gap-1 mt-2">
          <button
            onClick={() =>
              updateQuantity(item.variant_id, item.quantity - 1)
            }
            className="h-7 w-7 flex items-center justify-center rounded border hover:bg-muted"
            aria-label="Decrease quantity"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-8 text-center text-sm">{item.quantity}</span>
          <button
            onClick={() =>
              updateQuantity(item.variant_id, item.quantity + 1)
            }
            disabled={item.quantity >= item.variant.stock}
            className="h-7 w-7 flex items-center justify-center rounded border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Increase quantity"
          >
            <Plus className="h-3 w-3" />
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 ml-1 text-muted-foreground hover:text-destructive"
            onClick={() => removeItem(item.variant_id)}
            aria-label="Remove item"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
