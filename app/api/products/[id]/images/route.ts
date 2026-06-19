import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  uploadProductImage,
  deleteProductImage,
  setPrimaryImage,
  reorderImages,
  updateImageAltText,
} from "@/services/image.service";

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "admin" || profile?.role === "staff" ? user : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const altText = (formData.get("alt_text") as string) ?? undefined;
    const image = await uploadProductImage(id, file, altText);
    return NextResponse.json({ data: image }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();

    if (body.action === "set_primary") {
      await setPrimaryImage(id, body.image_id);
      return NextResponse.json({ success: true });
    }

    if (body.action === "reorder") {
      await reorderImages(body.orders);
      return NextResponse.json({ success: true });
    }

    if (body.action === "update_alt") {
      await updateImageAltText(body.image_id, body.alt_text);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update image" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  _context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { image_id } = await req.json();
    if (!image_id) return NextResponse.json({ error: "image_id required" }, { status: 400 });
    await deleteProductImage(image_id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete image" },
      { status: 500 }
    );
  }
}
