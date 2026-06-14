import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getServerProfile } from "@/lib/auth";
import { getOrdersByUser } from "@/services/order.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, SITE_NAME } from "@/lib/constants";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: `My Account | ${SITE_NAME}`,
  robots: { index: false },
};

export default async function AccountPage() {
  const profile = await getServerProfile();

  if (!profile) {
    redirect("/login?redirect=/account");
  }

  const orders = await getOrdersByUser(profile.id);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-10 w-full">
        <h1 className="text-2xl font-bold mb-2">My Account</h1>
        <p className="text-muted-foreground mb-8">
          Welcome back, {profile.full_name ?? profile.email}
        </p>

        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
          {orders.length === 0 ? (
            <div className="rounded-lg border p-8 text-center">
              <p className="text-muted-foreground mb-4">No orders yet.</p>
              <Button asChild>
                <Link href="/products">Start Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-mono text-sm font-medium">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold">
                      {formatPrice(order.total)}
                    </span>
                    <Badge
                      variant="secondary"
                      className={ORDER_STATUS_COLORS[order.status]}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/account/orders/${order.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Account Details</h2>
          <div className="rounded-lg border p-4 space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-muted-foreground w-28">Name</span>
              <span>{profile.full_name ?? "—"}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground w-28">Email</span>
              <span>{profile.email}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground w-28">Role</span>
              <span className="capitalize">{profile.role}</span>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
