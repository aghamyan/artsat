import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-server";
import type { Collection, CollectionWithProducts } from "@/lib/types";

export async function getCollections(activeOnly = true): Promise<Collection[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("collections")
    .select("*")
    .order("sort_order", { ascending: true });
  if (activeOnly) query = query.eq("is_active", true);
  const { data } = await query;
  return (data ?? []) as Collection[];
}

export async function getFeaturedCollections(limit = 4): Promise<Collection[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("collections")
    .select("*")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("sort_order", { ascending: true })
    .limit(limit);
  return (data ?? []) as Collection[];
}

export async function getCollectionBySlug(
  slug: string
): Promise<CollectionWithProducts | null> {
  const supabase = await createServerSupabaseClient();

  const { data: collection } = await supabase
    .from("collections")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!collection) return null;

  const { data: pivotRows } = await supabase
    .from("collection_products")
    .select("product_id, sort_order")
    .eq("collection_id", collection.id)
    .order("sort_order", { ascending: true });

  const productIds = (pivotRows ?? []).map((r) => r.product_id);
  let products: CollectionWithProducts["products"] = [];

  if (productIds.length) {
    const { data: productData } = await supabase
      .from("products")
      .select("*, images:product_images(*)")
      .in("id", productIds)
      .eq("is_active", true)
      .is("deleted_at", null);

    products = ((productData ?? []) as CollectionWithProducts["products"]).map(
      (p) => ({
        ...p,
        primary_image:
          p.images.find((img) => img.is_primary) ?? p.images[0] ?? null,
      })
    );

    // Restore pivot sort order
    const orderMap = new Map(pivotRows!.map((r) => [r.product_id, r.sort_order]));
    products.sort(
      (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
    );
  }

  return {
    ...(collection as Collection),
    products,
    product_count: products.length,
  };
}

export async function getCollectionById(
  id: string
): Promise<Collection | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("collections")
    .select("*")
    .eq("id", id)
    .single();
  return (data ?? null) as Collection | null;
}

export async function createCollection(values: {
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_featured?: boolean;
  sort_order?: number;
}): Promise<Collection> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("collections")
    .insert(values)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Collection;
}

export async function updateCollection(
  id: string,
  values: Partial<{
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    is_featured: boolean;
    sort_order: number;
    is_active: boolean;
  }>
): Promise<Collection> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("collections")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Collection;
}

export async function deleteCollection(id: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("collections").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function addProductToCollection(
  collectionId: string,
  productId: string,
  sortOrder = 0
): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("collection_products").insert({
    collection_id: collectionId,
    product_id: productId,
    sort_order: sortOrder,
  });
  if (error) throw new Error(error.message);
}

export async function removeProductFromCollection(
  collectionId: string,
  productId: string
): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("collection_products")
    .delete()
    .eq("collection_id", collectionId)
    .eq("product_id", productId);
  if (error) throw new Error(error.message);
}

export async function getCollectionProducts(
  collectionId: string
): Promise<string[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("collection_products")
    .select("product_id")
    .eq("collection_id", collectionId)
    .order("sort_order", { ascending: true });
  return (data ?? []).map((r) => r.product_id);
}
