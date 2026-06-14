"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItemEnriched } from "@/lib/types";
import { CART_SESSION_COOKIE, CART_SESSION_MAX_AGE } from "@/lib/constants";
import { generateSessionId } from "@/lib/utils";

interface CartState {
  cartId: string | null;
  sessionId: string;
  items: CartItemEnriched[];
  isOpen: boolean;
  isLoading: boolean;

  // Actions
  setCartId: (id: string) => void;
  setItems: (items: CartItemEnriched[]) => void;
  addItem: (variantId: string, quantity: number) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearItems: () => void;
  openCart: () => void;
  closeCart: () => void;
  setLoading: (loading: boolean) => void;
  getItemCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartId: null,
      sessionId: generateSessionId(),
      items: [],
      isOpen: false,
      isLoading: false,

      setCartId: (id) => set({ cartId: id }),
      setItems: (items) => set({ items }),

      addItem: async (variantId, quantity) => {
        set({ isLoading: true });
        try {
          const sessionId = get().sessionId;
          const cartId = get().cartId;

          const res = await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "add",
              variant_id: variantId,
              quantity,
              cart_id: cartId,
              session_id: sessionId,
            }),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error ?? "Failed to add item");
          }

          const { cart, items } = await res.json();
          set({
            cartId: cart.id,
            items,
            isOpen: true,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      updateQuantity: async (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }

        set({ isLoading: true });
        try {
          const cartId = get().cartId;
          if (!cartId) return;

          const res = await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "update",
              variant_id: variantId,
              quantity,
              cart_id: cartId,
              session_id: get().sessionId,
            }),
          });

          if (!res.ok) return;
          const { items } = await res.json();
          set({ items });
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (variantId) => {
        set({ isLoading: true });
        try {
          const cartId = get().cartId;
          if (!cartId) return;

          const res = await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "remove",
              variant_id: variantId,
              cart_id: cartId,
              session_id: get().sessionId,
            }),
          });

          if (!res.ok) return;
          const { items } = await res.json();
          set({ items });
        } finally {
          set({ isLoading: false });
        }
      },

      clearItems: () => set({ items: [], cartId: null }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      setLoading: (loading) => set({ isLoading: loading }),

      getItemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      getSubtotal: () =>
        get().items.reduce((sum, item) => sum + item.line_total, 0),
    }),
    {
      name: "artsat-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cartId: state.cartId,
        sessionId: state.sessionId,
      }),
    }
  )
);

/** Set the cart session cookie for server-side access */
export function initCartSession(sessionId: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${CART_SESSION_COOKIE}=${sessionId}; max-age=${CART_SESSION_MAX_AGE}; path=/; SameSite=Lax`;
}
