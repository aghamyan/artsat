"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { OrderWithItems } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready_for_pickup: "Ready for Pickup",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  refunded: "Refunded",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  ready_for_pickup: "bg-indigo-100 text-indigo-800",
  out_for_delivery: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-600",
  returned: "bg-red-100 text-red-700",
  refunded: "bg-pink-100 text-pink-700",
};

interface Props {
  orders: OrderWithItems[];
  total: number;
}

export default function OrderHistory({ orders, total }: Props) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg font-medium mb-2">No orders yet</p>
        <p className="text-sm">Your order history will appear here.</p>
        <Link
          href="/products"
          className="mt-4 inline-block bg-black text-white text-sm px-6 py-2.5 rounded-lg hover:bg-gray-800"
        >
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{total} order{total !== 1 ? "s" : ""} total</p>
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/account/orders/${order.id}`}
          className="block border border-gray-200 rounded-xl p-4 hover:border-gray-400 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-sm">#{order.order_number}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium text-sm">
                {(order.total / 100).toLocaleString("hy-AM", { style: "currency", currency: "AMD" })}
              </p>
              <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
