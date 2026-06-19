import { NextResponse } from "next/server";
import { getServerProfile } from "@/lib/auth";
import { getWishlist, addToWishlist } from "@/services/wishlist.service";

export async function GET() {
  const profile = await getServerProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await getWishlist(profile.id);
  return NextResponse.json({ data: items });
}

export async function POST(request: Request) {
  const profile = await getServerProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product_id, variant_id } = await request.json();
  if (!product_id) return NextResponse.json({ error: "product_id required" }, { status: 400 });

  try {
    const id = await addToWishlist(profile.id, product_id, variant_id);
    return NextResponse.json({ data: { id } }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to add to wishlist";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
