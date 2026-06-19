import { NextRequest, NextResponse } from "next/server";
import { getRecommendedProducts } from "@/services/ai-recommendations.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("product_id");
  if (!productId) {
    return NextResponse.json({ error: "product_id required" }, { status: 400 });
  }

  try {
    const products = await getRecommendedProducts(productId);
    return NextResponse.json(products);
  } catch (err) {
    console.error("[recommendations]", err);
    return NextResponse.json([], { status: 200 }); // graceful fallback
  }
}
