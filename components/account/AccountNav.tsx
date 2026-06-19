"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/account", label: "Dashboard", exact: true },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/reviews", label: "My Reviews" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/returns", label: "Returns" },
  { href: "/account/settings", label: "Settings" },
];

export default function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="w-full md:w-56 shrink-0">
      <ul className="flex flex-col gap-1">
        {NAV_LINKS.map(({ href, label, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-black text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
