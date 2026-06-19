"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { WishlistItemEnriched } from "@/lib/types";

interface Props {
  items: WishlistItemEnriched[];
}

export default function WishlistItems({ items: initial }: Props) {
  const [items, setItems] = useState(initial);
  const [removing, setRemoving] = useState<string | null>(null);

  const handleRemove = async (wishlistId: string) => {
    setRemoving(wishlistId);
    await fetch(`/api/wishlist/${wishlistId}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== wishlistId));
    setRemoving(null);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg font-medium mb-2">Your wishlist is empty</p>
        <p className="text-sm mb-6">Save items you love to find them later.</p>
        <Link
          href="/products"
          className="inline-block bg-black text-white text-sm px-6 py-2.5 rounded-lg hover:bg-gray-800"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => {
        const primaryImage =
          item.images?.find((img) => img.is_primary)?.url ?? item.images?.[0]?.url;
        const price = item.product
          ? (item.product.price + (item.variant?.price_delta ?? 0)) / 100
          : 0;

        return (
          <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden group">
            <Link href={`/products/${item.product?.slug}`}>
              <div className="relative aspect-[3/4] bg-gray-100">
                {primaryImage && (
                  <Image
                    src={primaryImage}
                    alt={item.product?.name ?? "Product"}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
              </div>
            </Link>
            <div className="p-3">
              <Link href={`/products/${item.product?.slug}`}>
                <p className="text-sm font-medium hover:underline line-clamp-1">{item.product?.name}</p>
              </Link>
              {item.variant && (
                <p className="text-xs text-gray-500">
                  {[item.variant.size, item.variant.color].filter(Boolean).join(" / ")}
                </p>
              )}
              <p className="text-sm font-semibold mt-1">
                {price.toLocaleString("hy-AM", { style: "currency", currency: "AMD" })}
              </p>
              <button
                onClick={() => handleRemove(item.id)}
                disabled={removing === item.id}
                className="mt-2 w-full text-xs text-red-500 hover:text-red-700 disabled:opacity-50 py-1"
              >
                {removing === item.id ? "Removing..." : "Remove from Wishlist"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
