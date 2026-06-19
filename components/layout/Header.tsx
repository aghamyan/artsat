"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag, Search, Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/store/cart";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";

const NAV_LINKS = [
  { href: "/products", label: "Shop" },
  { href: "/products?label=new", label: "New Arrivals" },
  { href: "/collections", label: "Collections" },
  { href: "/products?label=sale", label: "Sale" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { getItemCount, openCart } = useCartStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const itemCount = getItemCount();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm transition-all duration-200",
        isScrolled ? "shadow-[0_1px_8px_rgba(0,0,0,0.06)]" : "shadow-none"
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-display text-xl italic font-normal tracking-tight hover:opacity-70 transition-opacity duration-200"
        >
          {SITE_NAME}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(link.href.split("?")[0] + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative text-sm font-medium transition-colors duration-200 py-1",
                  "after:absolute after:bottom-0 after:left-0 after:h-px after:bg-foreground",
                  "after:transition-all after:duration-300",
                  isActive
                    ? "text-foreground after:w-full"
                    : "text-muted-foreground hover:text-foreground after:w-0 hover:after:w-full"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Search */}
          {isSearchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <Input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-48 h-9 bg-background"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(false)}
                className="cursor-pointer"
              >
                <X className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search"
              onClick={() => setIsSearchOpen(true)}
              className="cursor-pointer hover:bg-accent transition-colors duration-200"
            >
              <Search className="h-[18px] w-[18px]" />
            </Button>
          )}

          {/* Account */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Account"
            className="cursor-pointer hover:bg-accent transition-colors duration-200"
            asChild
          >
            <Link href={isLoggedIn ? "/account" : "/login"}>
              <User className="h-[18px] w-[18px]" />
            </Link>
          </Button>

          {/* Cart */}
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Cart (${itemCount} items)`}
            onClick={openCart}
            className="relative cursor-pointer hover:bg-accent transition-colors duration-200"
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background leading-none">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Button>

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden cursor-pointer"
            aria-label="Menu"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            {isMobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {isMobileOpen && (
        <div className="md:hidden border-t bg-background px-6 py-5 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-base font-medium py-2.5 text-muted-foreground hover:text-foreground transition-colors duration-200 border-b border-border last:border-0"
              onClick={() => setIsMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 flex gap-3">
            <Link
              href={isLoggedIn ? "/account" : "/login"}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsMobileOpen(false)}
            >
              {isLoggedIn ? "My Account" : "Sign In"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
