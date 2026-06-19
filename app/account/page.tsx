import Link from "next/link";
import type { Metadata } from "next";
import { getServerProfile } from "@/lib/auth";
import { getCustomerOrders } from "@/services/customer.service";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `My Account | ${SITE_NAME}`,
  robots: { index: false },
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

export default async function AccountPage() {
  const profile = await getServerProfile();
  if (!profile) return null;

  const { orders } = await getCustomerOrders(profile.id, 1, 5);

  const quickLinks = [
    { href: "/account/profile", label: "Edit Profile", icon: "👤" },
    { href: "/account/addresses", label: "Addresses", icon: "📍" },
    { href: "/account/wishlist", label: "Wishlist", icon: "♡" },
    { href: "/account/returns", label: "Returns", icon: "↩" },
    { href: "/account/settings", label: "Settings", icon: "⚙" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {profile.full_name ?? profile.email.split("@")[0]}</h1>
        <p className="text-gray-500 text-sm mt-1">{profile.email}</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {quickLinks.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-xl hover:border-black hover:bg-gray-50 transition-colors text-center"
          >
            <span className="text-xl">{icon}</span>
            <span className="text-xs font-medium text-gray-700">{label}</span>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Recent Orders</h2>
          <Link href="/account/orders" className="text-sm text-gray-500 hover:text-black">
            View all →
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-10 border border-gray-200 rounded-xl">
            <p className="text-gray-500 text-sm mb-4">No orders yet.</p>
            <Link href="/products" className="inline-block bg-black text-white text-sm px-5 py-2 rounded-lg hover:bg-gray-800">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between border border-gray-200 rounded-xl p-4 hover:border-gray-400 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">#{order.order_number}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold">
                    {(order.total / 100).toLocaleString("hy-AM", { style: "currency", currency: "AMD" })}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {order.status.replace("_", " ")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
