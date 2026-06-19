"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import type { OrderWithItems } from "@/lib/types";
import OrderTimeline from "./OrderTimeline";

interface OrderDetailProps {
  order: OrderWithItems & { reviews: Record<string, string | null> };
}

export default function OrderDetail({ order }: OrderDetailProps) {
  const items = (order.items ?? []) as Array<
    typeof order.items[0] & {
      product?: { name: string; slug: string; images?: Array<{ url: string; is_primary: boolean }> };
      variant?: { size: string | null; color: string | null };
    }
  >;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap gap-4 items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Order #{order.order_number}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Placed on {format(new Date(order.created_at), "MMMM d, yyyy")}
          </p>
        </div>
        <Link
          href={`/account/orders/${order.id}/returns`}
          className="text-sm border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
        >
          Request Return
        </Link>
      </div>

      {/* Timeline */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Status</h2>
        <OrderTimeline status={order.status} />
      </div>

      {/* Items */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Items</h2>
        <div className="space-y-3">
          {items.map((item) => {
            const primaryImage = item.product?.images?.find((i) => i.is_primary)?.url
              ?? item.product?.images?.[0]?.url;
            const hasReview = !!order.reviews?.[item.id];

            return (
              <div key={item.id} className="flex gap-4 border border-gray-100 rounded-xl p-3">
                {primaryImage && (
                  <div className="relative w-16 h-16 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    <Image src={primaryImage} alt={item.product_name} fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.product_name}</p>
                  {(item.variant_size || item.variant_color) && (
                    <p className="text-xs text-gray-500">
                      {[item.variant_size, item.variant_color].filter(Boolean).join(" / ")}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium">
                    {(item.total_price / 100).toLocaleString("hy-AM", { style: "currency", currency: "AMD" })}
                  </p>
                  {order.status === "delivered" && (
                    hasReview ? (
                      <span className="text-xs text-green-600 mt-1 block">Reviewed</span>
                    ) : (
                      <Link
                        href={`/account/orders/${order.id}/items/${item.id}/review`}
                        className="text-xs text-blue-600 hover:underline mt-1 block"
                      >
                        Write Review
                      </Link>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Totals */}
      <div className="border-t border-gray-100 pt-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span>{(order.subtotal / 100).toLocaleString("hy-AM", { style: "currency", currency: "AMD" })}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Shipping</span>
          <span>{(order.shipping_fee / 100).toLocaleString("hy-AM", { style: "currency", currency: "AMD" })}</span>
        </div>
        {order.discount_amount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-{(order.discount_amount / 100).toLocaleString("hy-AM", { style: "currency", currency: "AMD" })}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-base border-t border-gray-100 pt-2 mt-2">
          <span>Total</span>
          <span>{(order.total / 100).toLocaleString("hy-AM", { style: "currency", currency: "AMD" })}</span>
        </div>
      </div>

      {/* Shipping address */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Shipping Address</h2>
        <p className="text-sm text-gray-700">{order.shipping_full_name}</p>
        <p className="text-sm text-gray-600">{order.shipping_address_line1}</p>
        {order.shipping_address_line2 && (
          <p className="text-sm text-gray-600">{order.shipping_address_line2}</p>
        )}
        <p className="text-sm text-gray-600">
          {order.shipping_city}, {order.shipping_postal_code}
        </p>
        <p className="text-sm text-gray-600">{order.shipping_country}</p>
      </div>
    </div>
  );
}
