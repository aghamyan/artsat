import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase-server";
import {
  generateProductDescription,
  generateProductTags,
  bulkGenerateDescriptions,
} from "@/services/ai-content.service";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

async function requireAdmin(): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await createServiceClient()
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return data?.role === "admin" || data?.role === "staff";
}

// POST body: { product_id, generate_tags } OR { bulk: true }
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (body.bulk) {
      const result = await bulkGenerateDescriptions(body.batch_size ?? 25);
      return NextResponse.json(result);
    }

    const { product_id, generate_tags } = body as {
      product_id: string;
      generate_tags?: boolean;
    };

    if (!product_id) {
      return NextResponse.json({ error: "product_id required" }, { status: 400 });
    }

    const { data: product } = await createServiceClient()
      .from("products")
      .select("*")
      .eq("id", product_id)
      .single();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const [descResult, tagsResult] = await Promise.all([
      generateProductDescription(product as Product),
      generate_tags ? generateProductTags(product as Product) : Promise.resolve(null),
    ]);

    return NextResponse.json({
      description: descResult.description,
      tokens_used: descResult.tokens_used,
      tags: tagsResult?.tags ?? null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
