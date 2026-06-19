"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";
import { CLOTHING_SIZES } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

interface ProductFiltersProps {
  categories: Category[];
  availableColors: string[];
  maxPrice: number;
  className?: string;
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="py-4 border-b border-border last:border-0">
      <button
        className="flex items-center justify-between w-full group cursor-pointer"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="text-[10px] tracking-[0.22em] uppercase font-medium text-muted-foreground group-hover:text-silver transition-colors duration-200">
          {title}
        </span>
        {open ? (
          <ChevronUp className="h-3 w-3 text-muted-foreground group-hover:text-silver transition-colors duration-200" />
        ) : (
          <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-silver transition-colors duration-200" />
        )}
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function ProductFilters({
  categories,
  availableColors,
  maxPrice,
  className,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") ?? "";
  const currentSizes = searchParams.get("sizes")?.split(",").filter(Boolean) ?? [];
  const currentColors = searchParams.get("colors")?.split(",").filter(Boolean) ?? [];
  const currentMinPrice = parseInt(searchParams.get("min_price") ?? "0");
  const currentMaxPrice = parseInt(searchParams.get("max_price") ?? String(maxPrice));
  const currentInStock = searchParams.get("in_stock") === "true";
  const currentMinRating = parseFloat(searchParams.get("min_rating") ?? "0");

  const [localMin, setLocalMin] = useState(currentMinPrice);
  const [localMax, setLocalMax] = useState(currentMaxPrice || maxPrice);

  function updateParam(key: string, value: string | null) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    p.delete("page");
    router.push(`/products?${p.toString()}`);
  }

  function toggleMultiParam(paramKey: string, value: string, current: string[]) {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateParam(paramKey, next.length ? next.join(",") : null);
  }

  function applyPriceRange() {
    const p = new URLSearchParams(searchParams.toString());
    if (localMin > 0) p.set("min_price", String(localMin));
    else p.delete("min_price");
    if (localMax < maxPrice) p.set("max_price", String(localMax));
    else p.delete("max_price");
    p.delete("page");
    router.push(`/products?${p.toString()}`);
  }

  function clearAll() {
    router.push("/products");
  }

  const activeFilterCount = [
    currentCategory,
    ...currentSizes,
    ...currentColors,
    currentInStock ? "in_stock" : "",
    currentMinRating > 0 ? "rating" : "",
    currentMinPrice > 0 || currentMaxPrice < maxPrice ? "price" : "",
  ].filter(Boolean).length;

  return (
    <aside className={cn("space-y-0", className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border mb-0">
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-silver" />
          <span className="text-[10px] tracking-[0.25em] uppercase font-medium text-foreground">
            Refine
          </span>
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center h-4 w-4 rounded-full bg-silver text-background text-[9px] font-bold leading-none">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-[10px] tracking-[0.12em] uppercase text-muted-foreground hover:text-silver transition-colors duration-200 cursor-pointer"
          >
            <X className="h-2.5 w-2.5" />
            Clear
          </button>
        )}
      </div>

      {/* Category */}
      <FilterSection title="Category">
        <div className="space-y-2.5">
          {[{ id: "all", slug: "", name: "All" }, ...categories].map((cat) => {
            const isActive = cat.slug === "" ? !currentCategory : currentCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => updateParam("category", cat.slug || null)}
                className={cn(
                  "flex items-center justify-between w-full text-left group cursor-pointer py-0.5",
                )}
              >
                <span
                  className={cn(
                    "text-sm font-sans transition-colors duration-200",
                    isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  {cat.name}
                </span>
                {isActive && (
                  <span className="block h-px w-3 bg-silver" />
                )}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Price */}
      <FilterSection title="Price Range">
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground w-6 shrink-0">
                Min
              </span>
              <input
                type="range"
                min={0}
                max={maxPrice}
                step={100}
                value={localMin}
                onChange={(e) => setLocalMin(parseInt(e.target.value))}
                className="flex-1 h-px appearance-none bg-border cursor-pointer accent-silver [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-silver [&::-webkit-slider-thumb]:rounded-none"
              />
              <span className="text-xs text-muted-foreground w-14 text-right tabular-nums">
                {formatPrice(localMin)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground w-6 shrink-0">
                Max
              </span>
              <input
                type="range"
                min={0}
                max={maxPrice}
                step={100}
                value={localMax}
                onChange={(e) => setLocalMax(parseInt(e.target.value))}
                className="flex-1 h-px appearance-none bg-border cursor-pointer accent-silver [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-silver [&::-webkit-slider-thumb]:rounded-none"
              />
              <span className="text-xs text-muted-foreground w-14 text-right tabular-nums">
                {formatPrice(localMax)}
              </span>
            </div>
          </div>
          <button
            onClick={applyPriceRange}
            className="w-full py-2 text-[10px] tracking-[0.2em] uppercase font-medium border border-border text-muted-foreground hover:border-silver hover:text-silver transition-all duration-200 cursor-pointer"
          >
            Apply
          </button>
        </div>
      </FilterSection>

      {/* Size */}
      <FilterSection title="Size">
        <div className="flex flex-wrap gap-1.5">
          {CLOTHING_SIZES.map((size) => {
            const isActive = currentSizes.includes(size);
            return (
              <button
                key={size}
                onClick={() => toggleMultiParam("sizes", size, currentSizes)}
                className={cn(
                  "h-8 w-10 text-[11px] font-medium font-sans transition-all duration-200 cursor-pointer border",
                  isActive
                    ? "bg-silver text-background border-silver"
                    : "border-border text-muted-foreground hover:border-silver hover:text-silver",
                )}
              >
                {size}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Color */}
      {availableColors.length > 0 && (
        <FilterSection title="Color">
          <div className="space-y-2.5">
            {availableColors.slice(0, 8).map((color) => {
              const isActive = currentColors.includes(color);
              return (
                <button
                  key={color}
                  onClick={() => toggleMultiParam("colors", color, currentColors)}
                  className="flex items-center gap-2.5 w-full group cursor-pointer py-0.5"
                >
                  <span
                    className={cn(
                      "flex items-center justify-center h-3 w-3 border flex-shrink-0 transition-all duration-200",
                      isActive ? "border-silver bg-silver" : "border-border group-hover:border-silver",
                    )}
                  >
                    {isActive && (
                      <svg className="h-2 w-2 text-background" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                        <path d="M1.5 4L3.5 6L6.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                      </svg>
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-sans transition-colors duration-200",
                      isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    {color}
                  </span>
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {/* Rating */}
      <FilterSection title="Min Rating">
        <div className="space-y-2.5">
          {[4, 3, 2].map((r) => {
            const isActive = currentMinRating === r;
            return (
              <button
                key={r}
                onClick={() =>
                  updateParam("min_rating", isActive ? null : String(r))
                }
                className="flex items-center gap-2.5 w-full group cursor-pointer py-0.5"
              >
                <span
                  className={cn(
                    "flex items-center justify-center h-3 w-3 border flex-shrink-0 transition-all duration-200",
                    isActive ? "border-silver bg-silver" : "border-border group-hover:border-silver",
                  )}
                >
                  {isActive && (
                    <svg className="h-2 w-2 text-background" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                      <path d="M1.5 4L3.5 6L6.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                    </svg>
                  )}
                </span>
                <span className={cn(
                  "text-sm font-sans transition-colors duration-200",
                  isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
                )}>
                  {r}+ Stars
                </span>
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Availability */}
      <FilterSection title="Availability" defaultOpen={false}>
        <button
          onClick={() => updateParam("in_stock", currentInStock ? null : "true")}
          className="flex items-center gap-2.5 w-full group cursor-pointer py-0.5"
        >
          <span
            className={cn(
              "flex items-center justify-center h-3 w-3 border flex-shrink-0 transition-all duration-200",
              currentInStock ? "border-silver bg-silver" : "border-border group-hover:border-silver",
            )}
          >
            {currentInStock && (
              <svg className="h-2 w-2 text-background" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                <path d="M1.5 4L3.5 6L6.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
              </svg>
            )}
          </span>
          <span className={cn(
            "text-sm font-sans transition-colors duration-200",
            currentInStock ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
          )}>
            In Stock Only
          </span>
        </button>
      </FilterSection>
    </aside>
  );
}
