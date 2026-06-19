import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createServiceClient } from "@/lib/supabase-server";
import { formatPrice } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";
import type { Metadata } from "next";
import type { OrderWithItems } from "@/lib/types";

export const metadata: Metadata = {
  title: `Order Confirmation | ${SITE_NAME}`,
  robots: { index: false },
};

interface Props {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ payment?: string; token?: string }>;
}

async function getOrder(
  orderId: string,
  token?: string
): Promise<OrderWithItems | null> {
  const supabase = createServiceClient();

  const query = supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", orderId);

  if (token) {
    query.eq("guest_token", token);
  }

  const { data, error } = await query.single();
  if (error || !data) return null;
  return data as OrderWithItems;
}

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: Props) {
  const { orderId } = await params;
  const { token } = await searchParams;

  const order = await getOrder(orderId, token);

  if (!order) {
    notFound();
  }

  const isPaid = order.payment_status === "paid";
  const isFailed = order.payment_status === "failed";
  const isPending = order.payment_status === "pending";

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      {/* Status header */}
      {isPaid && (
        <div className="text-center mb-8">
          <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Your order has been confirmed. A receipt has been sent to{" "}
            <strong>{order.guest_email ?? order.shipping_email}</strong>.
          </p>
        </div>
      )}

      {isFailed && (
        <div className="text-center mb-8">
          <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
          {order.last_payment_error && (
            <p className="text-sm bg-destructive/10 text-destructive rounded-md p-3 mb-4">
              {order.last_payment_error}
            </p>
          )}
          <p className="text-muted-foreground mb-6">
            Your order has been saved. You can retry payment below.
          </p>
          <Button asChild size="lg">
            <Link href={`/checkout?retry=${orderId}`}>Retry Payment</Link>
          </Button>
        </div>
      )}

      {isPending && (
        <div className="text-center mb-8">
          <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Processing Payment...</h1>
          <p className="text-muted-foreground">
            Your payment is being processed. Please wait a moment.
          </p>
        </div>
      )}

      {/* Order details */}
      <div className="rounded-lg border p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Order number</p>
            <p className="font-mono font-semibold text-lg">#{order.order_number}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="font-semibold text-lg">{formatPrice(order.total)}</p>
          </div>
        </div>

        <Separator />

        {/* Items */}
        <div className="space-y-3">
          <h2 className="font-medium">Items Ordered</h2>
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <div>
                <p>{item.product_name}</p>
                {(item.variant_size ?? item.variant_color) && (
                  <p className="text-muted-foreground">
                    {[item.variant_size, item.variant_color]
                      .filter(Boolean)
                      .join(" / ")}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p>×{item.quantity}</p>
                <p>{formatPrice(item.total_price)}</p>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Totals */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>{formatPrice(order.shipping_fee)}</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-{formatPrice(order.discount_amount)}</span>
            </div>
          )}
          <Separator className="my-2" />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>

        <Separator />

        {/* Shipping address */}
        <div>
          <h2 className="font-medium mb-2">Shipping To</h2>
          <address className="text-sm text-muted-foreground not-italic space-y-0.5">
            <p>{order.shipping_full_name}</p>
            <p>{order.shipping_address_line1}</p>
            {order.shipping_address_line2 && (
              <p>{order.shipping_address_line2}</p>
            )}
            <p>
              {order.shipping_city}
              {order.shipping_postal_code ? `, ${order.shipping_postal_code}` : ""}
            </p>
            <p>{order.shipping_country}</p>
          </address>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 space-y-3">
        {isPaid && order.user_id && (
          <Button asChild variant="outline" className="w-full">
            <Link href={`/account/orders/${order.id}`}>View Order Details</Link>
          </Button>
        )}
        <Button asChild className="w-full">
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
