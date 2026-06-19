import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase-server";
import { generateSEOMetadata } from "@/services/ai-content.service";
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

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { product_id } = await req.json();

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

    const metadata = await generateSEOMetadata(product as Product);
    return NextResponse.json(metadata);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
