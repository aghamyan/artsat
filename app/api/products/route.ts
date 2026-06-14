import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/services/product.service";
import type { ProductListParams, ProductSortOption } from "@/lib/types";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const params: ProductListParams = {
    category: sp.get("category") ?? undefined,
    search: sp.get("search") ?? undefined,
    label: (sp.get("label") as ProductListParams["label"]) ?? undefined,
    in_stock: sp.has("in_stock") ? sp.get("in_stock") === "true" : undefined,
    min_price: sp.has("min_price") ? Number(sp.get("min_price")) : undefined,
    max_price: sp.has("max_price") ? Number(sp.get("max_price")) : undefined,
    size: sp.get("sizes") ? sp.get("sizes")!.split(",") : undefined,
    color: sp.get("colors") ? sp.get("colors")!.split(",") : undefined,
    sort: (sp.get("sort") as ProductSortOption) ?? "newest",
    page: sp.has("page") ? Number(sp.get("page")) : 1,
    limit: sp.has("per_page") ? Number(sp.get("per_page")) : 24,
  };

  try {
    const result = await getProducts(params);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/products]", err);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
