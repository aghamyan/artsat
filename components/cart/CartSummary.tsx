import React from "react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import {
  FREE_SHIPPING_THRESHOLD_CENTS,
  FLAT_SHIPPING_FEE_CENTS,
} from "@/lib/constants";

interface CartSummaryProps {
  subtotal: number;
  discountAmount?: number;
  discountCode?: string;
  shippingFee?: number;
}

export function CartSummary({
  subtotal,
  discountAmount = 0,
  discountCode,
  shippingFee,
}: CartSummaryProps) {
  const calculatedShipping =
    shippingFee !== undefined
      ? shippingFee
      : subtotal >= FREE_SHIPPING_THRESHOLD_CENTS
      ? 0
      : FLAT_SHIPPING_FEE_CENTS;

  const total = subtotal - discountAmount + calculatedShipping;

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h2 className="font-semibold text-lg">Order Summary</h2>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-green-700">
            <span className="flex items-center gap-1.5">
              Discount
              {discountCode && (
                <Badge
                  variant="secondary"
                  className="text-xs font-mono"
                >
                  {discountCode}
                </Badge>
              )}
            </span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span>
            {calculatedShipping === 0 ? (
              <span className="text-green-700 font-medium">Free</span>
            ) : (
              formatPrice(calculatedShipping)
            )}
          </span>
        </div>
      </div>

      <Separator />

      <div className="flex justify-between font-bold text-base">
        <span>Total</span>
        <span>{formatPrice(Math.max(0, total))}</span>
      </div>

      {subtotal < FREE_SHIPPING_THRESHOLD_CENTS && calculatedShipping > 0 && (
        <p className="text-xs text-muted-foreground">
          Add {formatPrice(FREE_SHIPPING_THRESHOLD_CENTS - subtotal)} more for
          free shipping
        </p>
      )}
    </div>
  );
}
