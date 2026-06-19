import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getOrderById } from "@/services/order.service";
import { RefundForm } from "@/components/admin/RefundForm";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Issue Refund | Admin | ${SITE_NAME}`,
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminRefundPage({ params }: Props) {
  const { id } = await params;

  // Verify admin
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/admin");

  const order = await getOrderById(id, null);

  if (!order) notFound();

  if (order.payment_status !== "paid" || !order.stripe_payment_intent_id) {
    redirect(`/admin/orders/${id}`);
  }

  return (
    <div className="p-8 max-w-xl space-y-6">
      <div>
        <Link
          href={`/admin/orders/${id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Order #{order.order_number}
        </Link>
        <h1 className="text-2xl font-bold mt-1">Issue Refund</h1>
      </div>

      <div className="rounded-lg border p-6">
        <RefundForm
          orderId={id}
          orderTotal={order.total}
          orderNumber={order.order_number}
        />
      </div>
    </div>
  );
}
