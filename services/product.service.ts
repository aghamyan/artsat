import { createServerSupabaseClient } from "@/lib/supabase-server";
import type {
  Product,
  ProductWithImages,
  ProductWithVariants,
  ProductListParams,
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
    sort = "newest",
    page = 1,
    limit = PRODUCTS_PER_PAGE,
  } = params;

  let query = supabase
    .from("products")
    .select(
      `
      *,
      images:product_images(*)
    `,
      { count: "exact" }
    )
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
  if (search) query = query.ilike("name", `%${search}%`);

  // Sort
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
    default:
      query = query.order("created_at", { ascending: false });
  }

  // Pagination
  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  let products = (data ?? []) as ProductWithImages[];

  // Filter by size/color/in_stock via variants (post-query)
  if (size?.length || color?.length || in_stock) {
    const { data: variants } = await supabase
      .from("product_variants")
      .select("product_id, size, color, stock")
      .eq("is_active", true);

    if (variants) {
      const matchingProductIds = new Set(
        variants
          .filter((v) => {
            const sizeMatch = !size?.length || size.includes(v.size ?? "");
            const colorMatch = !color?.length || color.includes(v.color ?? "");
            const stockMatch = !in_stock || v.stock > 0;
            return sizeMatch && colorMatch && stockMatch;
          })
          .map((v) => v.product_id)
      );
      products = products.filter((p) => matchingProductIds.has(p.id));
    }
  }

  // Attach primary_image
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
    .select(
      `
      *,
      images:product_images(*),
      variants:product_variants(*),
      category:categories(*)
    `
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .is("deleted_at", null)
    .single();

  if (error || !data) return null;

  return {
    ...data,
    primary_image:
      data.images.find(
        (img: { is_primary: boolean }) => img.is_primary
      ) ??
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
    .select(
      `
      *,
      images:product_images(*),
      variants:product_variants(*),
      category:categories(*)
    `
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return {
    ...data,
    primary_image:
      data.images.find(
        (img: { is_primary: boolean }) => img.is_primary
      ) ??
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
