import { NextResponse } from "next/server";
import { getServerProfile } from "@/lib/auth";
import { removeFromWishlist } from "@/services/wishlist.service";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const profile = await getServerProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await removeFromWishlist(id, profile.id);
    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Remove failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
