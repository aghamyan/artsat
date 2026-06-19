import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerProfile } from "@/lib/auth";
import { getCustomerOrderDetail } from "@/services/customer.service";
import OrderDetail from "@/components/account/OrderDetail";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Order Details | ${SITE_NAME}`,
  robots: { index: false },
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getServerProfile();
  if (!profile) return null;

  const order = await getCustomerOrderDetail(id, profile.id);
  if (!order) notFound();

  return (
    <div>
      <OrderDetail order={order} />
    </div>
  );
}
