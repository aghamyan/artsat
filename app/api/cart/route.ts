import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  getOrCreateCart,
  getCart,
  updateCartItems,
  enrichCartItems,
} from "@/services/cart.service";
import { CART_SESSION_COOKIE } from "@/lib/constants";
import type { CartItem } from "@/lib/types";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const cartId = req.nextUrl.searchParams.get("cart_id");

  if (!cartId) {
    return NextResponse.json({ items: [] });
  }

  try {
    const cart = await getCart(cartId);
    if (!cart) return NextResponse.json({ items: [] });

    const enriched = await enrichCartItems(cart.items as CartItem[]);
    return NextResponse.json({ cart_id: cart.id, items: enriched });
  } catch (err) {
    console.error("[GET /api/cart]", err);
    return NextResponse.json({ error: "Failed to load cart" }, { status: 500 });
  }
}

const postSchema = z.object({
  action: z.enum(["add", "update", "remove"]),
  variant_id: z.string().uuid(),
  quantity: z.number().int().min(0).max(10).optional(),
  cart_id: z.string().uuid().optional(),
  session_id: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { action, variant_id, quantity, cart_id } = parsed.data;

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const cookieStore = await cookies();
    const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value ?? null;

    let cart;
    if (cart_id) {
      cart = await getCart(cart_id);
    } else {
      cart = await getOrCreateCart(user?.id ?? null, sessionId);
    }

    if (!cart) {
      return NextResponse.json({ error: "Could not create cart" }, { status: 500 });
    }

    let items = (cart.items as CartItem[]) ?? [];

    if (action === "add") {
      const qty = quantity ?? 1;
      const existing = items.findIndex((i) => i.variant_id === variant_id);
      if (existing >= 0) {
        items[existing] = {
          ...items[existing],
          quantity: Math.min(10, items[existing].quantity + qty),
        };
      } else {
        items.push({ variant_id, quantity: qty, added_at: new Date().toISOString() });
      }
    } else if (action === "update") {
      const qty = quantity ?? 0;
      if (qty <= 0) {
        items = items.filter((i) => i.variant_id !== variant_id);
      } else {
        const idx = items.findIndex((i) => i.variant_id === variant_id);
        if (idx >= 0) {
          items[idx] = { ...items[idx], quantity: Math.min(10, qty) };
        }
      }
    } else if (action === "remove") {
      items = items.filter((i) => i.variant_id !== variant_id);
    }

    const updated = await updateCartItems(cart.id, items);
    const enriched = await enrichCartItems(updated.items as CartItem[]);

    return NextResponse.json({ cart: { id: updated.id }, items: enriched });
  } catch (err) {
    console.error("[POST /api/cart]", err);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}
