import { createServiceClient } from "@/lib/supabase-server";
import type { Cart, CartItem, CartItemEnriched } from "@/lib/types";

/** Fetch or create a cart. userId takes priority over sessionId. */
export async function getOrCreateCart(
  userId: string | null,
  sessionId: string | null
): Promise<Cart | null> {
  if (!userId && !sessionId) return null;

  const supabase = createServiceClient();

  // Try to find existing non-expired cart
  let query = supabase
    .from("carts")
    .select("*")
    .gt("expires_at", new Date().toISOString());

  if (userId) {
    query = query.eq("user_id", userId);
  } else {
    query = query.eq("session_id", sessionId);
  }

  const { data: existing } = await query.limit(1).maybeSingle();

  if (existing) return existing as Cart;

  // Create new cart
  const insertPayload: {
    user_id?: string;
    session_id?: string | null;
    items: CartItem[];
  } = { items: [], ...(userId ? { user_id: userId } : { session_id: sessionId }) };

  const { data: created, error } = await supabase
    .from("carts")
    .insert(insertPayload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return created as Cart;
}

export async function getCart(cartId: string): Promise<Cart | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("carts")
    .select("*")
    .eq("id", cartId)
    .single();
  return data as Cart | null;
}

export async function updateCartItems(
  cartId: string,
  items: CartItem[]
): Promise<Cart> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("carts")
    .update({ items })
    .eq("id", cartId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Cart;
}

export async function clearCart(cartId: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("carts")
    .update({ items: [] })
    .eq("id", cartId);
}

/** Merge a guest cart into a user cart on login */
export async function mergeGuestCartIntoUserCart(
  userId: string,
  sessionId: string
): Promise<void> {
  const supabase = createServiceClient();

  const { data: guestCart } = await supabase
    .from("carts")
    .select("*")
    .eq("session_id", sessionId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!guestCart || !(guestCart.items as CartItem[]).length) return;

  const { data: userCart } = await supabase
    .from("carts")
    .select("*")
    .eq("user_id", userId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (userCart) {
    // Merge: combine items, deduplicate by variant_id (keep higher quantity)
    const existing = userCart.items as CartItem[];
    const guest = guestCart.items as CartItem[];
    const merged = [...existing];

    for (const gItem of guest) {
      const idx = merged.findIndex((i) => i.variant_id === gItem.variant_id);
      if (idx >= 0) {
        merged[idx] = {
          ...merged[idx],
          quantity: Math.max(merged[idx].quantity, gItem.quantity),
        };
      } else {
        merged.push(gItem);
      }
    }

    await supabase
      .from("carts")
      .update({ items: merged })
      .eq("id", userCart.id);
  } else {
    // Transfer guest cart to user
    await supabase
      .from("carts")
      .update({ user_id: userId, session_id: null })
      .eq("id", guestCart.id);
  }

  // Clear the original guest cart
  await supabase.from("carts").delete().eq("id", guestCart.id);
}

/** Enrich cart items with product and variant data */
export async function enrichCartItems(
  items: CartItem[]
): Promise<CartItemEnriched[]> {
  if (!items.length) return [];

  const supabase = createServiceClient();
  const variantIds = items.map((i) => i.variant_id);

  const { data: variants } = await supabase
    .from("product_variants")
    .select(`*, product:products(*, images:product_images(*))`)
    .in("id", variantIds)
    .eq("is_active", true);

  if (!variants) return [];

  return items.flatMap((item) => {
    const variant = variants.find((v) => v.id === item.variant_id);
    if (!variant?.product) return [];

    const product = variant.product;
    const unitPrice: number = product.price + variant.price_delta;
    return [
      {
        ...item,
        product,
        variant,
        images: product.images ?? [],
        unit_price: unitPrice,
        line_total: unitPrice * item.quantity,
      } as CartItemEnriched,
    ];
  });
}
