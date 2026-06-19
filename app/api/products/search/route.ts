import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/services/product.service";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "10");

  if (!q || q.length < 1)
    return NextResponse.json({ data: [] });

  try {
    const products = await searchProducts(q, Math.min(limit, 20));
    return NextResponse.json({ data: products });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
