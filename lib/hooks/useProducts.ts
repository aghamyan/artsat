"use client";

import { useEffect, useState, useCallback } from "react";
import type { ProductWithImages, ProductListParams } from "@/lib/types";

interface UseProductsResult {
  products: ProductWithImages[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProducts(params: ProductListParams = {}): UseProductsResult {
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams();
        if (params.category) query.set("category", params.category);
        if (params.search) query.set("search", params.search);
        if (params.label) query.set("label", params.label);
        if (params.in_stock !== undefined)
          query.set("in_stock", String(params.in_stock));
        if (params.min_price !== undefined)
          query.set("min_price", String(params.min_price));
        if (params.max_price !== undefined)
          query.set("max_price", String(params.max_price));
        if (params.size?.length) query.set("sizes", params.size.join(","));
        if (params.color?.length) query.set("colors", params.color.join(","));
        if (params.sort) query.set("sort", params.sort);
        if (params.page) query.set("page", String(params.page));
        if (params.limit) query.set("per_page", String(params.limit));

        const res = await fetch(`/api/products?${query.toString()}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error ?? "Failed to load products");

        if (!cancelled) {
          setProducts(data.products ?? []);
          setTotal(data.total ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tick,
    params.category,
    params.search,
    params.label,
    params.in_stock,
    params.min_price,
    params.max_price,
    params.sort,
    params.page,
    params.limit,
  ]);

  return { products, total, isLoading, error, refetch };
}
