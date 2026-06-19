import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  generateProductEmbedding,
  backfillEmbeddings,
} from "@/services/ai-recommendations.service";
import { createServiceClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await createServiceClient()
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return data?.role === "admin" || data?.role === "staff";
}

// POST /api/admin/ai/embed?product_id=xxx  — embed one product
// POST /api/admin/ai/embed?backfill=true    — backfill all
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const productId = req.nextUrl.searchParams.get("product_id");
  const backfill = req.nextUrl.searchParams.get("backfill") === "true";

  try {
    if (backfill) {
      const result = await backfillEmbeddings();
      return NextResponse.json(result);
    }

    if (!productId) {
      return NextResponse.json({ error: "product_id or backfill=true required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: product } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await generateProductEmbedding(product);
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
