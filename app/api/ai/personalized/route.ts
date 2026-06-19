import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getPersonalizedRecommendations } from "@/services/ai-personalization.service";
import { createServiceClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json([], { status: 200 }); // anon users get empty
  }

  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "6", 10);

  try {
    const recommendations = await getPersonalizedRecommendations(user.id, limit);

    if (!recommendations.length) {
      return NextResponse.json([]);
    }

    // Hydrate with full product data
    const productIds = recommendations.map((r) => r.product_id);
    const { data: products } = await createServiceClient()
      .from("products")
      .select(
        `id, name, slug, price, compare_price, is_active, label, average_rating,
         images:product_images(id, url, alt_text, is_primary, sort_order)`
      )
      .in("id", productIds)
      .eq("is_active", true);

    if (!products) return NextResponse.json([]);

    // Sort by recommendation score
    const sorted = productIds
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean);

    return NextResponse.json(sorted);
  } catch (err) {
    console.error("[personalized]", err);
    return NextResponse.json([]);
  }
}
