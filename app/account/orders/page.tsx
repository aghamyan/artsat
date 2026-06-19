import type { Metadata } from "next";
import { getServerProfile } from "@/lib/auth";
import { getCustomerOrders } from "@/services/customer.service";
import OrderHistory from "@/components/account/OrderHistory";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Order History | ${SITE_NAME}`,
  robots: { index: false },
};

export default async function OrdersPage() {
  const profile = await getServerProfile();
  if (!profile) return null;

  const { orders, total } = await getCustomerOrders(profile.id, 1, 20);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Order History</h1>
      <OrderHistory orders={orders} total={total} />
    </div>
  );
}
