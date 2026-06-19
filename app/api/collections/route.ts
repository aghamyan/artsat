import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getCollections, createCollection } from "@/services/collection.service";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  image_url: z.string().url().optional(),
  is_featured: z.boolean().default(false),
  sort_order: z.number().int().default(0),
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

export async function GET() {
  try {
    const collections = await getCollections(false);
    return NextResponse.json({ data: collections });
  } catch {
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const values = createSchema.parse(body);
    const collection = await createCollection(values);
    return NextResponse.json({ data: collection }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create collection" },
      { status: 500 }
    );
  }
}
