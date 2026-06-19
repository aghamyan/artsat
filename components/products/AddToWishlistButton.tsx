"use client";

import { useState, useEffect } from "react";

interface Props {
  productId: string;
  variantId?: string;
  className?: string;
}

export default function AddToWishlistButton({ productId, variantId, className = "" }: Props) {
  const [wishlistId, setWishlistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Check if already in wishlist via the wishlist GET and filter client-side
    fetch("/api/wishlist")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (!json?.data) { setChecked(true); return; }
        const found = (json.data as Array<{ id: string; product_id: string; variant_id: string | null }>).find(
          (w) => w.product_id === productId && (variantId ? w.variant_id === variantId : !w.variant_id)
        );
        if (found) setWishlistId(found.id);
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [productId, variantId]);

  const toggle = async () => {
    setLoading(true);
    if (wishlistId) {
      await fetch(`/api/wishlist/${wishlistId}`, { method: "DELETE" });
      setWishlistId(null);
    } else {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, variant_id: variantId ?? null }),
      });
      if (res.ok) {
        const json = await res.json();
        setWishlistId(json.data?.id ?? null);
      } else if (res.status === 401) {
        window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname);
      }
    }
    setLoading(false);
  };

  if (!checked) return null;

  const isSaved = !!wishlistId;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={isSaved ? "Remove from wishlist" : "Save to wishlist"}
      className={`flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50 ${
        isSaved ? "text-red-500 hover:text-red-700" : "text-gray-500 hover:text-black"
      } ${className}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
      {isSaved ? "Saved" : "Wishlist"}
    </button>
  );
}
