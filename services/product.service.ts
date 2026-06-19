import { createServerSupabaseClient } from "@/lib/supabase-server";
import type {
  Product,
  ProductWithImages,
  ProductWithVariants,
  ProductListParams,
  ProductRating,
} from "@/lib/types";
import { PRODUCTS_PER_PAGE } from "@/lib/constants";

export interface ProductListResult {
  products: ProductWithImages[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getProducts(
  params: ProductListParams = {}
): Promise<ProductListResult> {
  const supabase = await createServerSupabaseClient();
  const {
    category,
    size,
    color,
    min_price,
    max_price,
    label,
    search,
    in_stock,
    collections,
    min_rating,
    sort = "newest",
    page = 1,
    limit = PRODUCTS_PER_PAGE,
  } = params;

  let query = supabase
    .from("products")
    .select("*, images:product_images(*)", { count: "exact" })
    .eq("is_active", true)
    .is("deleted_at", null);

  // Filters
  if (category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", category)
      .single();
    if (cat) query = query.eq("category_id", cat.id);
  }

  if (label) query = query.eq("label", label);
  if (min_price !== undefined) query = query.gte("price", min_price);
  if (max_price !== undefined) query = query.lte("price", max_price);
  if (min_rating !== undefined) query = query.gte("average_rating", min_rating);

  // Search on name only — .ilike() is parameterized, unlike .or() string interpolation
  if (search?.trim()) {
    query = query.ilike("name", `%${search.trim()}%`);
  }

  // Sort (average_rating is denormalized on products table — safe to order)
  switch (sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "featured":
      query = query.order("is_featured", { ascending: false });
      break;
    case "rating":
      query = query.order("average_rating", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  // Pagination
  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  let products = (data ?? []) as ProductWithImages[];

  // Filter by size/color/in_stock/collections via post-query (Supabase limitation)
  const needsVariantFilter = size?.length || color?.length || in_stock;
  const needsCollectionFilter = collections?.length;

  if (needsVariantFilter || needsCollectionFilter) {
    const productIds = products.map((p) => p.id);

    if (needsVariantFilter && productIds.length) {
      const { data: variants } = await supabase
        .from("product_variants")
        .select("product_id, size, color, stock")
        .in("product_id", productIds)
        .eq("is_active", true);

      if (variants) {
        const matchingIds = new Set(
          variants
            .filter((v) => {
              const sizeMatch = !size?.length || size.includes(v.size ?? "");
              const colorMatch = !color?.length || color.includes(v.color ?? "");
              const stockMatch = !in_stock || v.stock > 0;
              return sizeMatch && colorMatch && stockMatch;
            })
            .map((v) => v.product_id)
        );
        products = products.filter((p) => matchingIds.has(p.id));
      }
    }

    if (needsCollectionFilter && products.length) {
      const { data: collectionRows } = await supabase
        .from("collection_products")
        .select("product_id, collection_id");

      if (collectionRows) {
        const productInCollections = new Set(
          collectionRows
            .filter((r) => collections!.includes(r.collection_id))
            .map((r) => r.product_id)
        );
        products = products.filter((p) => productInCollections.has(p.id));
      }
    }
  }

  const enriched = products.map((p) => ({
    ...p,
    primary_image:
      p.images.find((img) => img.is_primary) ?? p.images[0] ?? null,
  }));

  const total = count ?? 0;
  return {
    products: enriched,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getProductBySlug(
  slug: string
): Promise<ProductWithVariants | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      images:product_images(*),
      variants:product_variants(*),
      category:categories(*)
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .is("deleted_at", null)
    .single();

  if (error || !data) return null;

  return {
    ...data,
    primary_image:
      data.images.find((img: { is_primary: boolean }) => img.is_primary) ??
      data.images[0] ??
      null,
  } as ProductWithVariants;
}

export async function getProductById(
  id: string
): Promise<ProductWithVariants | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      images:product_images(*),
      variants:product_variants(*),
      category:categories(*)
    `)
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return {
    ...data,
    primary_image:
      data.images.find((img: { is_primary: boolean }) => img.is_primary) ??
      data.images[0] ??
      null,
  } as ProductWithVariants;
}

export async function getFeaturedProducts(
  limit = 8
): Promise<ProductWithImages[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("products")
    .select(`*, images:product_images(*)`)
    .eq("is_active", true)
    .eq("is_featured", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as ProductWithImages[]).map((p) => ({
    ...p,
    primary_image:
      p.images.find((img) => img.is_primary) ?? p.images[0] ?? null,
  }));
}

export async function getNewArrivals(limit = 8): Promise<ProductWithImages[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("products")
    .select(`*, images:product_images(*)`)
    .eq("is_active", true)
    .eq("label", "new")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as ProductWithImages[]).map((p) => ({
    ...p,
    primary_image:
      p.images.find((img) => img.is_primary) ?? p.images[0] ?? null,
  }));
}

export async function searchProducts(
  query: string,
  limit = 10
): Promise<Product[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, slug, price, label")
    .eq("is_active", true)
    .is("deleted_at", null)
    .ilike("name", `%${query}%`)
    .limit(limit);

  return (data ?? []) as Product[];
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string | null,
  price: number,
  limit = 6
): Promise<ProductWithImages[]> {
  const supabase = await createServerSupabaseClient();

  // Same category, similar price (±$20 = ±2000 cents), exclude self
  let query = supabase
    .from("products")
    .select(`*, images:product_images(*)`)
    .neq("id", productId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .gte("price", Math.max(0, price - 2000))
    .lte("price", price + 2000)
    .order("average_rating", { ascending: false })
    .limit(limit);

  if (categoryId) query = query.eq("category_id", categoryId);

  const { data } = await query;
  const rows = (data ?? []) as ProductWithImages[];

  // If same category is sparse, fall back to any products in price range
  if (rows.length < 2 && categoryId) {
    const { data: fallback } = await supabase
      .from("products")
      .select(`*, images:product_images(*)`)
      .neq("id", productId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("average_rating", { ascending: false })
      .limit(limit);

    return ((fallback ?? []) as ProductWithImages[]).map((p) => ({
      ...p,
      primary_image:
        p.images.find((img) => img.is_primary) ?? p.images[0] ?? null,
    }));
  }

  return rows.map((p) => ({
    ...p,
    primary_image:
      p.images.find((img) => img.is_primary) ?? p.images[0] ?? null,
  }));
}

export async function getProductRating(
  productId: string
): Promise<ProductRating | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("product_ratings")
    .select("*")
    .eq("product_id", productId)
    .single();
  return (data ?? null) as ProductRating | null;
}

export async function getProductReviews(productId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("product_reviews")
    .select("*, customer:profiles(full_name)")
    .eq("product_id", productId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getAvailableFilters(): Promise<{
  colors: string[];
  sizes: string[];
  maxPrice: number;
}> {
  const supabase = await createServerSupabaseClient();

  const { data: variants } = await supabase
    .from("product_variants")
    .select("size, color")
    .eq("is_active", true);

  const { data: priceData } = await supabase
    .from("products")
    .select("price")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("price", { ascending: false })
    .limit(1);

  const colors = [
    ...new Set((variants ?? []).map((v) => v.color).filter(Boolean) as string[]),
  ].sort();
  const sizes = [
    ...new Set((variants ?? []).map((v) => v.size).filter(Boolean) as string[]),
  ];
  const maxPrice = priceData?.[0]?.price ?? 50000;

  return { colors, sizes, maxPrice };
}
