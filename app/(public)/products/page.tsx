import React, { Suspense } from "react";
import type { Metadata } from "next";
import { getProducts, getAvailableFilters } from "@/services/product.service";
import { getCategories } from "@/services/category.service";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ProductSearch } from "@/components/products/ProductSearch";
import { ProductSort } from "@/components/products/ProductSort";
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
  min_rating?: string;
  sizes?: string;
  colors?: string;
}

interface ProductsPageProps {
  searchParams: Promise<SearchParams>;
}

function ArmenianOrnament() {
  return (
    <svg
      width="120"
      height="16"
      viewBox="0 0 120 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-silver opacity-40"
    >
      <line x1="0" y1="8" x2="46" y2="8" stroke="currentColor" strokeWidth="0.75" />
      <rect x="50" y="4" width="8" height="8" transform="rotate(45 54 8)" stroke="currentColor" strokeWidth="0.75" fill="none" />
      <rect x="54" y="6" width="4" height="4" transform="rotate(45 56 8)" fill="currentColor" opacity="0.6" />
      <line x1="74" y1="8" x2="120" y2="8" stroke="currentColor" strokeWidth="0.75" />
    </svg>
  );
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
    min_rating: params.min_rating ? parseFloat(params.min_rating) : undefined,
    size: params.sizes ? params.sizes.split(",") : undefined,
    color: params.colors ? params.colors.split(",") : undefined,
  };

  const [{ products, total, totalPages }, categories, filters] = await Promise.all([
    getProducts(listParams),
    getCategories(),
    getAvailableFilters(),
  ]);

  const page = listParams.page ?? 1;

  const pageTitle = params.search
    ? `Results for "${params.search}"`
    : params.label === "new"
    ? "New Arrivals"
    : params.label === "sale"
    ? "On Sale"
    : params.label === "bestseller"
    ? "Best Sellers"
    : params.category
    ? categories.find((c) => c.slug === params.category)?.name ?? "Collection"
    : "The Collection";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header */}
      <div className="relative overflow-hidden border-b border-border">
        {/* Armenian diamond-grid background */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(45deg, hsl(var(--silver)) 0, hsl(var(--silver)) 1px, transparent 0, transparent 50%),
              repeating-linear-gradient(-45deg, hsl(var(--silver)) 0, hsl(var(--silver)) 1px, transparent 0, transparent 50%)
            `,
            backgroundSize: "28px 28px",
          }}
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-6 pt-10 pb-12 relative">
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-muted-foreground">
              <li>
                <a href="/" className="hover:text-silver transition-colors duration-200">
                  Home
                </a>
              </li>
              <li className="text-border">—</li>
              <li className="text-silver">Shop</li>
            </ol>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              {/* Armenian ornamental divider above title */}
              <div className="mb-5">
                <ArmenianOrnament />
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground leading-none tracking-tight">
                {pageTitle}
              </h1>
              <p className="mt-3 text-[11px] tracking-[0.3em] uppercase text-muted-foreground font-sans">
                Artsat — Armenian Silver
              </p>
            </div>
            <p className="text-muted-foreground text-sm font-sans tabular-nums hidden md:block">
              {total} {total === 1 ? "piece" : "pieces"}
            </p>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Filters sidebar */}
          <Suspense>
            <ProductFilters
              categories={categories}
              availableColors={filters.colors}
              maxPrice={filters.maxPrice}
              className="lg:w-56 shrink-0"
            />
          </Suspense>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Search + Sort row */}
            <div className="mb-8 space-y-4">
              <Suspense>
                <ProductSearch defaultValue={params.search} />
              </Suspense>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">
                  <span className="text-foreground font-medium tabular-nums">{total}</span>{" "}
                  {total === 1 ? "piece" : "pieces"}
                </p>
                <Suspense>
                  <ProductSort currentSort={params.sort} />
                </Suspense>
              </div>
            </div>

            {/* Product grid */}
            <Suspense fallback={<ProductGrid products={[]} isLoading />}>
              <ProductGrid products={products} />
            </Suspense>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  const ps = new URLSearchParams();
                  if (params.sort) ps.set("sort", params.sort);
                  if (params.category) ps.set("category", params.category);
                  if (params.search) ps.set("search", params.search);
                  if (params.sizes) ps.set("sizes", params.sizes);
                  if (params.colors) ps.set("colors", params.colors);
                  if (params.min_price) ps.set("min_price", params.min_price);
                  if (params.max_price) ps.set("max_price", params.max_price);
                  ps.set("page", String(p));
                  const isActive = p === page;
                  return (
                    <a
                      key={p}
                      href={`/products?${ps.toString()}`}
                      aria-current={isActive ? "page" : undefined}
                      className={[
                        "h-9 w-9 flex items-center justify-center text-xs font-medium transition-all duration-200 cursor-pointer",
                        isActive
                          ? "bg-silver text-background border border-silver"
                          : "border border-border text-muted-foreground hover:border-silver hover:text-silver",
                      ].join(" ")}
                    >
                      {p}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
