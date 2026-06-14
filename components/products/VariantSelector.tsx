"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import type { ProductVariant } from "@/lib/types";
import { CLOTHING_SIZES } from "@/lib/constants";

interface VariantSelectorProps {
  variants: ProductVariant[];
  onSelect: (variant: ProductVariant | null) => void;
  selectedVariant: ProductVariant | null;
}

export function VariantSelector({
  variants,
  onSelect,
  selectedVariant,
}: VariantSelectorProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const availableSizes = Array.from(
    new Set(
      variants
        .filter((v) => v.size)
        .sort(
          (a, b) =>
            CLOTHING_SIZES.indexOf(a.size as typeof CLOTHING_SIZES[number]) -
            CLOTHING_SIZES.indexOf(b.size as typeof CLOTHING_SIZES[number])
        )
        .map((v) => v.size!)
    )
  );

  const availableColors = Array.from(
    new Map(
      variants
        .filter((v) => v.color)
        .map((v) => [v.color, { color: v.color!, hex: v.color_hex }])
    ).values()
  );

  const hasColors = availableColors.length > 0;
  const hasSizes = availableSizes.length > 0;

  function findVariant(size: string | null, color: string | null) {
    return (
      variants.find((v) => {
        const sizeMatch = !hasSizes || v.size === size;
        const colorMatch = !hasColors || v.color === color;
        return sizeMatch && colorMatch && v.is_active;
      }) ?? null
    );
  }

  function isVariantAvailable(size: string | null, color: string | null) {
    const v = variants.find((variant) => {
      const sizeMatch = !hasSizes || variant.size === size;
      const colorMatch = !hasColors || variant.color === color;
      return sizeMatch && colorMatch;
    });
    return v ? v.stock > 0 : false;
  }

  function handleSizeSelect(size: string) {
    setSelectedSize(size);
    const variant = findVariant(size, selectedColor);
    onSelect(variant);
  }

  function handleColorSelect(color: string) {
    setSelectedColor(color);
    const variant = findVariant(selectedSize, color);
    onSelect(variant);
  }

  return (
    <div className="space-y-4">
      {/* Color selector */}
      {hasColors && (
        <div>
          <p className="text-sm font-medium mb-2">
            Color
            {selectedColor && (
              <span className="ml-2 text-muted-foreground font-normal">
                {selectedColor}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {availableColors.map(({ color, hex }) => {
              const available = isVariantAvailable(selectedSize, color);
              const isSelected = selectedColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => available && handleColorSelect(color)}
                  aria-label={color}
                  aria-pressed={isSelected}
                  disabled={!available}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all",
                    isSelected
                      ? "border-foreground ring-2 ring-foreground ring-offset-2"
                      : "border-border hover:border-foreground",
                    !available && "opacity-40 cursor-not-allowed"
                  )}
                  style={{ backgroundColor: hex ?? color }}
                  title={available ? color : `${color} (unavailable)`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Size selector */}
      {hasSizes && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Size</p>
            <button className="text-xs text-muted-foreground underline underline-offset-2">
              Size Guide
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size) => {
              const available = isVariantAvailable(size, selectedColor);
              const isSelected = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => available && handleSizeSelect(size)}
                  aria-label={`Size ${size}`}
                  aria-pressed={isSelected}
                  disabled={!available}
                  className={cn(
                    "min-w-[44px] h-11 px-3 rounded-md border text-sm font-medium transition-all",
                    isSelected
                      ? "bg-foreground text-background border-foreground"
                      : "border-input hover:border-foreground bg-background",
                    !available &&
                      "opacity-40 cursor-not-allowed line-through"
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* No selection warning */}
      {!selectedVariant && (hasSizes || hasColors) && (
        <p className="text-xs text-muted-foreground">
          {hasSizes && !selectedSize
            ? "Please select a size to continue"
            : hasColors && !selectedColor
            ? "Please select a color to continue"
            : ""}
        </p>
      )}

      {/* Stock warning */}
      {selectedVariant && selectedVariant.stock <= 5 && selectedVariant.stock > 0 && (
        <p className="text-xs text-orange-600 font-medium">
          Only {selectedVariant.stock} left in stock
        </p>
      )}
    </div>
  );
}
