import Link from "next/link";
import { Instagram, Facebook, Twitter } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";

const SHOP_LINKS = [
  { href: "/products", label: "All Products" },
  { href: "/products?label=new", label: "New Arrivals" },
  { href: "/products?label=bestseller", label: "Best Sellers" },
  { href: "/collections", label: "Collections" },
  { href: "/products?label=sale", label: "Sale" },
];

const HELP_LINKS = [
  { href: "/size-guide", label: "Size Guide" },
  { href: "/returns", label: "Returns & Exchanges" },
  { href: "/shipping", label: "Shipping Info" },
  { href: "/contact", label: "Contact Us" },
];

export function Footer() {
  return (
    <footer className="bg-stone-950 text-stone-300 mt-auto">
      {/* Main footer */}
      <div className="container py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          {/* Brand */}
          <div className="md:col-span-4">
            <Link href="/" className="font-display text-2xl italic font-normal text-white hover:opacity-70 transition-opacity duration-200">
              {SITE_NAME}
            </Link>
            <p className="mt-4 text-sm text-stone-400 max-w-xs leading-relaxed">
              Premium clothing for every style. Clean cuts, quality materials,
              built to last a lifetime.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="#"
                aria-label="Instagram"
                className="flex items-center justify-center w-9 h-9 rounded-full border border-stone-700 text-stone-400 hover:text-white hover:border-stone-500 transition-colors duration-200 cursor-pointer"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Facebook"
                className="flex items-center justify-center w-9 h-9 rounded-full border border-stone-700 text-stone-400 hover:text-white hover:border-stone-500 transition-colors duration-200 cursor-pointer"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Twitter / X"
                className="flex items-center justify-center w-9 h-9 rounded-full border border-stone-700 text-stone-400 hover:text-white hover:border-stone-500 transition-colors duration-200 cursor-pointer"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div className="md:col-span-3 md:col-start-6">
            <p className="text-xs tracking-[0.25em] uppercase text-stone-500 mb-4">
              Shop
            </p>
            <ul className="space-y-3">
              {SHOP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-stone-400 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div className="md:col-span-3 md:col-start-10">
            <p className="text-xs tracking-[0.25em] uppercase text-stone-500 mb-4">
              Help
            </p>
            <ul className="space-y-3">
              {HELP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-stone-400 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-stone-800">
        <div className="container py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-stone-600">
          <p>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-stone-400 transition-colors duration-200">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-stone-400 transition-colors duration-200">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
