import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  updateCollection,
  deleteCollection,
  addProductToCollection,
  removeProductFromCollection,
  getCollectionProducts,
} from "@/services/collection.service";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  is_featured: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const productIds = await getCollectionProducts(id);
  return NextResponse.json({ data: productIds });
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

    // Support adding/removing products via action field
    if (body.action === "add_product" && body.product_id) {
      await addProductToCollection(id, body.product_id, body.sort_order ?? 0);
      return NextResponse.json({ success: true });
    }
    if (body.action === "remove_product" && body.product_id) {
      await removeProductFromCollection(id, body.product_id);
      return NextResponse.json({ success: true });
    }

    const values = updateSchema.parse(body);
    const collection = await updateCollection(id, values);
    return NextResponse.json({ data: collection });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update collection" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await deleteCollection(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete collection" },
      { status: 500 }
    );
  }
}
