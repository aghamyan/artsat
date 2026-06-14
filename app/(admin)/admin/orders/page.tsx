import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllOrders } from "@/services/order.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Orders | Admin | ${SITE_NAME}`,
};

export default async function AdminOrdersPage() {
  const { orders } = await getAllOrders(1, 50);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Orders</h1>

      <div className="rounded-xl border bg-background overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Order #</th>
              <th className="px-4 py-3 text-left font-medium">Customer</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs">
                  {order.order_number}
                </td>
                <td className="px-4 py-3">
                  {order.shipping_full_name || order.guest_email || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(order.created_at)}
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {formatPrice(order.total)}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="secondary"
                    className={ORDER_STATUS_COLORS[order.status]}
                  >
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/orders/${order.id}`}>View</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No orders yet.
          </div>
        )}
      </div>
    </div>
  );
}
