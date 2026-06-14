import React, { Suspense } from "react";
import type { Metadata } from "next";
import { getProducts } from "@/services/product.service";
import { ProductGrid } from "@/components/products/ProductGrid";
import { PRODUCTS_PER_PAGE, SITE_NAME } from "@/lib/constants";
import type { ProductListParams, ProductSortOption } from "@/lib/types";

export const metadata: Metadata = {
  title: `Shop All Products | ${SITE_NAME}`,
};

interface SearchParams {
  page?: string;
  sort?: string;
  category?: string;
  label?: string;
  search?: string;
  in_stock?: string;
  min_price?: string;
  max_price?: string;
}

interface ProductsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  const listParams: ProductListParams = {
    page: params.page ? parseInt(params.page) : 1,
    limit: PRODUCTS_PER_PAGE,
    sort: (params.sort as ProductSortOption) ?? "newest",
    category: params.category,
    label: params.label as ProductListParams["label"],
    search: params.search,
    in_stock: params.in_stock === "true" ? true : undefined,
    min_price: params.min_price ? parseInt(params.min_price) : undefined,
    max_price: params.max_price ? parseInt(params.max_price) : undefined,
  };

  const { products, total, totalPages } = await getProducts(listParams);
  const page = listParams.page ?? 1;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {params.search
            ? `Results for "${params.search}"`
            : params.label === "new"
            ? "New Arrivals"
            : params.label === "sale"
            ? "Sale"
            : "All Products"}
        </h1>
        <p className="text-sm text-muted-foreground">{total} products</p>
      </div>

      <Suspense fallback={<ProductGrid products={[]} isLoading />}>
        <ProductGrid products={products} />
      </Suspense>

      {totalPages > 1 && (
        <div className="mt-10 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`?page=${p}`}
              className={`h-9 w-9 flex items-center justify-center rounded border text-sm ${
                p === page
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-muted"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
