"use client";

import { useCartStore } from "@/store/cart";
import { FREE_SHIPPING_THRESHOLD_CENTS, FLAT_SHIPPING_FEE_CENTS } from "@/lib/constants";

export function useCart() {
  const store = useCartStore();
  const subtotal = store.getSubtotal();
  const shippingFee =
    subtotal >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_FEE_CENTS;
  const total = subtotal + shippingFee;
  const itemCount = store.items.reduce((sum, i) => sum + i.quantity, 0);
  const isEmpty = store.items.length === 0;

  return {
    ...store,
    subtotal,
    shippingFee,
    total,
    itemCount,
    isEmpty,
  };
}
