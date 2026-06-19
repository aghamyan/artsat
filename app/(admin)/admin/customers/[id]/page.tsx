import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getCustomerDetail, getCustomerOrders } from "@/services/customer.service";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Customer Detail | Admin | ${SITE_NAME}`,
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  out_for_delivery: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-600",
};

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [customer, ordersResult] = await Promise.all([
    getCustomerDetail(id),
    getCustomerOrders(id, 1, 10),
  ]);

  if (!customer) notFound();

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{customer.full_name ?? "Unnamed Customer"}</h1>
          <p className="text-gray-500 mt-1">{customer.email}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
          customer.account_status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {customer.account_status}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Joined", value: format(new Date(customer.created_at), "MMM d, yyyy") },
          { label: "Phone", value: customer.phone ?? "—" },
          { label: "Orders", value: String(ordersResult.total) },
          { label: "Role", value: customer.role },
        ].map(({ label, value }) => (
          <div key={label} className="border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-sm font-medium mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-base font-semibold mb-4">Order History</h2>
        {ordersResult.orders.length === 0 ? (
          <p className="text-sm text-gray-500">No orders.</p>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Order</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {ordersResult.orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:underline">
                        #{order.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {format(new Date(order.created_at), "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-3">
                      {(order.total / 100).toLocaleString("hy-AM", { style: "currency", currency: "AMD" })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {order.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
