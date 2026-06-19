"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { ProductSortOption } from "@/lib/types";
import { cn } from "@/lib/utils";

const SORT_OPTIONS: { value: ProductSortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "featured", label: "Featured" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "rating", label: "Best Rated" },
];

interface ProductSortProps {
  currentSort?: string;
}

export function ProductSort({ currentSort = "newest" }: ProductSortProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = SORT_OPTIONS.find((o) => o.value === currentSort) ?? SORT_OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page");
    router.push(`/products?${params.toString()}`);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 h-9 px-3 border border-border text-xs font-sans text-muted-foreground hover:border-silver hover:text-silver transition-all duration-200 cursor-pointer min-w-[148px] justify-between"
      >
        <span className="tracking-[0.08em]">{current.label}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Sort options"
          className="absolute right-0 top-full mt-px bg-popover border border-border z-50 overflow-hidden shadow-xl shadow-black/30 min-w-[180px]"
        >
          {SORT_OPTIONS.map((opt) => {
            const isActive = opt.value === currentSort;
            return (
              <button
                key={opt.value}
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-xs font-sans tracking-[0.08em] transition-colors duration-150 cursor-pointer border-b border-border/50 last:border-0",
                  isActive
                    ? "text-silver bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
