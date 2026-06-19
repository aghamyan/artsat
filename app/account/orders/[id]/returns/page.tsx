import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerProfile } from "@/lib/auth";
import { getCustomerOrderDetail } from "@/services/customer.service";
import ReturnForm from "@/components/account/ReturnForm";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Request Return | ${SITE_NAME}`,
  robots: { index: false },
};

export default async function RequestReturnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getServerProfile();
  if (!profile) return null;

  const order = await getCustomerOrderDetail(id, profile.id);
  if (!order) notFound();

  return (
    <div>
      <h1 className="text-xl font-bold mb-2">Request Return / Exchange</h1>
      <p className="text-sm text-gray-500 mb-6">Order #{order.order_number} — returns accepted within 14 days of purchase.</p>
      <ReturnForm orderId={id} items={order.items ?? []} />
    </div>
  );
}
