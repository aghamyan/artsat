import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getOrderById } from "@/services/order.service";
import { getRefundsByOrder } from "@/services/refund.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  SITE_NAME,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: `Order Detail | Admin | ${SITE_NAME}`,
};

interface Props {
  params: Promise<{ id: string }>;
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await getOrderById(id, null);

  if (!order) notFound();

  const refunds = await getRefundsByOrder(id);
  const canRefund =
    order.payment_status === "paid" && order.stripe_payment_intent_id;

  return (
    <div className="p-8 max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/orders"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Orders
          </Link>
          <h1 className="text-2xl font-bold mt-1">Order #{order.order_number}</h1>
        </div>
        {canRefund && (
          <Button asChild variant="outline">
            <Link href={`/admin/orders/${id}/refund`}>Issue Refund</Link>
          </Button>
        )}
      </div>

      {/* Status row */}
      <div className="flex flex-wrap gap-4">
        <Badge variant="secondary" className={ORDER_STATUS_COLORS[order.status]}>
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
        <Badge
          variant="secondary"
          className={PAYMENT_STATUS_COLORS[order.payment_status]}
        >
          Payment: {PAYMENT_STATUS_LABELS[order.payment_status]}
        </Badge>
        {order.payment_method === "stripe" && (
          <Badge variant="outline">Stripe</Badge>
        )}
      </div>

      {/* Payment details */}
      {order.payment_method === "stripe" && (
        <div className="rounded-lg border p-6 space-y-3">
          <h2 className="font-semibold">Payment Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {order.stripe_payment_intent_id && (
              <>
                <span className="text-muted-foreground">Payment Intent</span>
                <span className="font-mono text-xs">
                  {order.stripe_payment_intent_id}
                </span>
              </>
            )}
            {order.stripe_charge_id && (
              <>
                <span className="text-muted-foreground">Charge ID</span>
                <span className="font-mono text-xs">{order.stripe_charge_id}</span>
              </>
            )}
            {order.amount_received !== null && (
              <>
                <span className="text-muted-foreground">Amount Received</span>
                <span>{formatPrice(order.amount_received)}</span>
              </>
            )}
            {order.last_payment_error && (
              <>
                <span className="text-muted-foreground">Error</span>
                <span className="text-destructive">{order.last_payment_error}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Refunds */}
      {refunds.length > 0 && (
        <div className="rounded-lg border p-6 space-y-3">
          <h2 className="font-semibold">Refunds</h2>
          <div className="divide-y">
            {refunds.map((refund) => (
              <div key={refund.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {refund.stripe_refund_id}
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    {refund.reason.replace(/_/g, " ")} —{" "}
                    {formatDate(refund.requested_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(refund.amount)}</p>
                  <Badge variant="secondary">{refund.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order items */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="font-semibold">Items</h2>
        <div className="divide-y">
          {order.items.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">{item.product_name}</p>
                <p className="text-muted-foreground">
                  {item.variant_sku}
                  {item.variant_size ? ` — ${item.variant_size}` : ""}
                  {item.variant_color ? ` / ${item.variant_color}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p>×{item.quantity}</p>
                <p className="font-semibold">{formatPrice(item.total_price)}</p>
              </div>
            </div>
          ))}
        </div>

        <Separator />

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
              <span>Discount ({order.discount_code_used})</span>
              <span>-{formatPrice(order.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Customer / shipping */}
      <div className="rounded-lg border p-6 space-y-2">
        <h2 className="font-semibold mb-3">Shipping</h2>
        <p className="text-sm">{order.shipping_full_name}</p>
        <p className="text-sm text-muted-foreground">{order.shipping_email}</p>
        <p className="text-sm text-muted-foreground">{order.shipping_phone}</p>
        <p className="text-sm">
          {order.shipping_address_line1}
          {order.shipping_address_line2
            ? `, ${order.shipping_address_line2}`
            : ""}
        </p>
        <p className="text-sm">
          {order.shipping_city}
          {order.shipping_postal_code ? `, ${order.shipping_postal_code}` : ""},{" "}
          {order.shipping_country}
        </p>
        {order.shipping_notes && (
          <p className="text-sm italic text-muted-foreground mt-2">
            Notes: {order.shipping_notes}
          </p>
        )}
      </div>

      {/* Metadata */}
      <p className="text-xs text-muted-foreground">
        Created: {formatDate(order.created_at)} · Updated: {formatDate(order.updated_at)}
      </p>
    </div>
  );
}
