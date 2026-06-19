import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase-server";
import { createVariant, updateVariant, deleteVariant } from "@/services/admin.service";
import { z } from "zod";

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

const createSchema = z.object({
  sku: z.string().min(1).max(100),
  size: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  color_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  price_delta: z.number().int().default(0),
  stock: z.number().int().min(0),
  reorder_level: z.number().int().min(0).default(5),
});

const updateSchema = createSchema.partial().omit({ sku: true }).extend({
  is_active: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", id)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const values = createSchema.parse(body);
    const variant = await createVariant(id, values, admin.id);
    return NextResponse.json({ data: variant }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create variant" },
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
    const { id: _productId } = await params;
    const body = await req.json();
    const { variant_id, ...rest } = body;
    if (!variant_id)
      return NextResponse.json({ error: "variant_id required" }, { status: 400 });
    const values = updateSchema.parse(rest);
    const variant = await updateVariant(variant_id, values, admin.id);
    return NextResponse.json({ data: variant });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update variant" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id: _productId } = await params;
    const { variant_id } = await req.json();
    if (!variant_id)
      return NextResponse.json({ error: "variant_id required" }, { status: 400 });
    await deleteVariant(variant_id, admin.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete variant" },
      { status: 500 }
    );
  }
}
