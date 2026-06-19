import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase-server";
import type { WishlistItemEnriched } from "@/lib/types";

export async function getWishlist(customerId: string): Promise<WishlistItemEnriched[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("wishlists")
    .select(`
      *,
      product:products(*, images:product_images(*)),
      variant:product_variants(*)
    `)
    .eq("customer_id", customerId)
    .order("added_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => {
    const product = row.product as Record<string, unknown>;
    const images = (product?.images as unknown[]) ?? [];
    return {
      ...row,
      product: { ...product, images },
      images,
    } as unknown as WishlistItemEnriched;
  });
}

export async function isInWishlist(
  customerId: string,
  productId: string,
  variantId?: string
): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("wishlists")
    .select("id")
    .eq("customer_id", customerId)
    .eq("product_id", productId);

  if (variantId) {
    query = query.eq("variant_id", variantId);
  } else {
    query = query.is("variant_id", null);
  }

  const { data } = await query.maybeSingle();
  return data?.id ?? null;
}

export async function addToWishlist(
  customerId: string,
  productId: string,
  variantId?: string
): Promise<string> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("wishlists")
    .insert({
      customer_id: customerId,
      product_id: productId,
      variant_id: variantId ?? null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("Already in wishlist");
    throw error;
  }
  return data.id;
}

export async function removeFromWishlist(id: string, customerId: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("id", id)
    .eq("customer_id", customerId);

  if (error) throw error;
}
