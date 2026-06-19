import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getCustomerList } from "@/services/customer.service";
import CustomerList from "@/components/admin/CustomerList";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Customers | Admin | ${SITE_NAME}`,
};

export default async function AdminCustomersPage() {
  await requireAdmin();
  const { customers, total } = await getCustomerList(1, 20);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Customers</h1>
      <CustomerList customers={customers} total={total} />
    </div>
  );
}
