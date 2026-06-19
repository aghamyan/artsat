"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

interface ProductSearchProps {
  defaultValue?: string;
}

export function ProductSearch({ defaultValue = "" }: ProductSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setIsSearching(true);
    fetch(`/api/products/search?q=${encodeURIComponent(debouncedQuery)}&limit=8`)
      .then((r) => r.json())
      .then((json) => {
        setSuggestions(json.data ?? []);
        setIsOpen(true);
      })
      .catch(() => setSuggestions([]))
      .finally(() => setIsSearching(false));
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsOpen(false);
    if (query.trim()) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("search", query.trim());
      params.delete("page");
      router.push(`/products?${params.toString()}`);
    }
  }

  function handleClear() {
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  }

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-silver transition-colors duration-200" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setIsOpen(true)}
            placeholder="Search the collection…"
            aria-label="Search products"
            className="w-full h-11 bg-background border border-border pl-10 pr-10 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-silver transition-colors duration-200"
          />
          {isSearching ? (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-silver transition-colors duration-200 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </form>

      {/* Suggestions */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-px bg-popover border border-border z-50 overflow-hidden shadow-xl shadow-black/30">
          {suggestions.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-accent transition-colors duration-150 border-b border-border/50 last:border-0"
              onClick={() => setIsOpen(false)}
            >
              <span className="text-sm font-sans text-foreground">{product.name}</span>
              <span className="text-xs text-silver tabular-nums ml-4 shrink-0">
                {formatPrice(product.price)}
              </span>
            </Link>
          ))}
          <button
            className="w-full px-4 py-2.5 text-left text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-silver transition-colors duration-200 cursor-pointer"
            onClick={handleSubmit as unknown as React.MouseEventHandler}
          >
            See all results for &ldquo;{query}&rdquo; →
          </button>
        </div>
      )}
    </div>
  );
}
