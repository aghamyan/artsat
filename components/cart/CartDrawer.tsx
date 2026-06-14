"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CartItem } from "./CartItem";
import { useCartStore, initCartSession } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import {
  FREE_SHIPPING_THRESHOLD_CENTS,
  FLAT_SHIPPING_FEE_CENTS,
} from "@/lib/constants";

export function CartDrawer() {
  const { isOpen, closeCart, items, sessionId, cartId, setItems, setCartId } =
    useCartStore();

  // Init session cookie on mount
  useEffect(() => {
    initCartSession(sessionId);
  }, [sessionId]);

  // Load cart from server on mount
  useEffect(() => {
    async function loadCart() {
      if (!cartId) return;
      const res = await fetch(`/api/cart?cart_id=${cartId}`);
      if (res.ok) {
        const { items: serverItems } = await res.json();
        setItems(serverItems ?? []);
      }
    }
    loadCart();
  }, [cartId, setItems]);

  const subtotal = useCartStore((s) => s.getSubtotal());
  const itemCount = useCartStore((s) => s.getItemCount());
  const freeShippingGap = FREE_SHIPPING_THRESHOLD_CENTS - subtotal;

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Cart {itemCount > 0 && `(${itemCount})`}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
            <ShoppingBag className="h-16 w-16 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add some items to get started
              </p>
            </div>
            <Button onClick={closeCart} asChild>
              <Link href="/products">Shop Now</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Free shipping progress */}
            {freeShippingGap > 0 && (
              <div className="px-6 py-3 bg-muted/50 text-xs text-center">
                Add{" "}
                <span className="font-semibold">
                  {formatPrice(freeShippingGap)}
                </span>{" "}
                more for free shipping
              </div>
            )}
            {freeShippingGap <= 0 && (
              <div className="px-6 py-3 bg-green-50 text-xs text-center text-green-700 font-medium">
                You qualify for free shipping!
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.map((item) => (
                <CartItem key={item.variant_id} item={item} />
              ))}
            </div>

            {/* Summary */}
            <div className="px-6 py-6 border-t space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">
                    {freeShippingGap <= 0
                      ? "Free"
                      : formatPrice(FLAT_SHIPPING_FEE_CENTS)}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>Estimated Total</span>
                <span>
                  {formatPrice(
                    freeShippingGap <= 0
                      ? subtotal
                      : subtotal + FLAT_SHIPPING_FEE_CENTS
                  )}
                </span>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={closeCart}
                asChild
              >
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={closeCart}
                asChild
              >
                <Link href="/cart">View Full Cart</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
