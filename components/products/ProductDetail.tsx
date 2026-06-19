"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { VariantSelector } from "./VariantSelector";
import { RatingStars } from "./RatingStars";
import { useCartStore } from "@/store/cart";
import type { ProductWithVariants, ProductVariant, ProductRating } from "@/lib/types";
import { formatPrice, discountPercent } from "@/lib/utils";
import { toast } from "sonner";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import AddToWishlistButton from "./AddToWishlistButton";

interface ProductDetailProps {
  product: ProductWithVariants;
  rating?: ProductRating | null;
}

export function ProductDetail({ product, rating }: ProductDetailProps) {
  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(
    product.primary_image ?? product.images[0] ?? null
  );
  const { addItem, isLoading } = useCartStore();

  const effectivePrice = selectedVariant
    ? product.price + selectedVariant.price_delta
    : product.price;

  const hasDiscount =
    product.compare_price && product.compare_price > effectivePrice;
  const savings = hasDiscount
    ? discountPercent(effectivePrice, product.compare_price!)
    : 0;

  async function handleAddToCart() {
    if (!selectedVariant) {
      toast.error("Please select your size and color before adding to cart.");
      return;
    }
    if (selectedVariant.stock < quantity) {
      toast.error(`Only ${selectedVariant.stock} units available.`);
      return;
    }

    try {
      await addItem(selectedVariant.id, quantity);
      toast.success(`${product.name} added to cart!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add to cart");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
      {/* Images */}
      <div className="space-y-3">
        {/* Main image */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-secondary">
          {activeImage ? (
            <Image
              src={activeImage.url}
              alt={activeImage.alt_text ?? product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              No image available
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {product.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {product.images.map((img) => (
              <button
                key={img.id}
                onClick={() => setActiveImage(img)}
                className={`relative h-20 w-20 shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                  activeImage?.id === img.id
                    ? "border-foreground"
                    : "border-transparent hover:border-border"
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt_text ?? product.name}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-6">
        <div>
          {product.category && (
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              {product.category.name}
            </p>
          )}
          <h1 className="text-2xl font-bold md:text-3xl">{product.name}</h1>

          {/* Rating */}
          {rating && rating.review_count > 0 && (
            <div className="mt-1.5">
              <RatingStars
                rating={rating.average_rating}
                reviewCount={rating.review_count}
                size="sm"
              />
            </div>
          )}

          <div className="flex items-center gap-3 mt-3">
            <span className="text-2xl font-semibold">
              {formatPrice(effectivePrice)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-muted-foreground line-through">
                  {formatPrice(product.compare_price!)}
                </span>
                <Badge variant="sale">Save {savings}%</Badge>
              </>
            )}
          </div>

          {product.label && (
            <div className="mt-2">
              <Badge
                variant={
                  product.label as
                    | "new"
                    | "sale"
                    | "bestseller"
                    | "limited"
                    | "default"
                }
              >
                {product.label === "bestseller" ? "Best Seller" : product.label}
              </Badge>
            </div>
          )}
        </div>

        <Separator />

        {/* Variants */}
        <VariantSelector
          variants={product.variants}
          selectedVariant={selectedVariant}
          onSelect={setSelectedVariant}
        />

        <Separator />

        {/* Quantity + Add to cart */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium">Quantity</p>
            <div className="flex items-center border rounded-md">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-11 w-11 flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center text-sm font-medium">
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity(
                    Math.min(
                      quantity + 1,
                      selectedVariant?.stock ?? 10
                    )
                  )
                }
                className="h-11 w-11 flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Stock status */}
          {selectedVariant && (
            <div className="flex items-center gap-2">
              {selectedVariant.stock === 0 ? (
                <Badge variant="secondary" className="bg-red-100 text-red-800">Out of Stock</Badge>
              ) : selectedVariant.stock <= LOW_STOCK_THRESHOLD ? (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  Low Stock — only {selectedVariant.stock} left
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-green-100 text-green-800">In Stock</Badge>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1 h-12 text-base gap-2"
              onClick={handleAddToCart}
              disabled={
                isLoading ||
                !selectedVariant ||
                selectedVariant.stock === 0
              }
            >
              <ShoppingBag className="h-5 w-5" />
              {!selectedVariant
                ? "Select Options"
                : selectedVariant.stock === 0
                ? "Out of Stock"
                : isLoading
                ? "Adding..."
                : "Add to Cart"}
            </Button>
            <AddToWishlistButton
              productId={product.id}
              variantId={selectedVariant?.id}
              className="h-12 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            />
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {product.description}
            </p>
          </div>
        )}

        {/* Details accordion */}
        {(product.material || product.care_instructions) && (
          <div className="space-y-3 pt-2">
            <Separator />
            {product.material && (
              <div>
                <p className="text-sm font-medium">Material</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {product.material}
                </p>
              </div>
            )}
            {product.care_instructions && (
              <div>
                <p className="text-sm font-medium">Care Instructions</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {product.care_instructions}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
