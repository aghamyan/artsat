import { createServiceClient } from "@/lib/supabase-server";
import {
  getOpenAI,
  CHAT_MODEL,
  logAIUsage,
  parseAIJson,
  getFromCache,
  setCache,
} from "@/lib/ai";
import type { AIPersonalizationResult } from "@/lib/types";

export async function getPersonalizedRecommendations(
  customerId: string,
  limit = 6
): Promise<AIPersonalizationResult[]> {
  const cacheKey = `personalization:${customerId}:${limit}`;
  const cached = await getFromCache<AIPersonalizationResult[]>(cacheKey);
  if (cached) return cached;

  const supabase = createServiceClient();

  // Gather customer history
  const { data: customer } = await supabase
    .from("profiles")
    .select(
      `id,
       orders(order_items(product_id, products:product_id(id, name, category_id))),
       product_reviews(product_id, rating),
       wishlists(product_id)`
    )
    .eq("id", customerId)
    .single();

  if (!customer) return [];

  // Get a pool of products not yet purchased (max 50)
  const orders = (customer.orders as Array<{ order_items: Array<{ product_id: string }> }>) ?? [];
  const purchasedIds = new Set(orders.flatMap((o) => o.order_items.map((i) => i.product_id)));

  const { data: candidateProducts } = await supabase
    .from("products")
    .select("id, name, category_id, price, tags, ai_tags")
    .eq("is_active", true)
    .not("id", "in", `(${Array.from(purchasedIds).join(",") || "'00000000-0000-0000-0000-000000000000'"})`)
    .limit(50);

  if (!candidateProducts?.length) return [];

  // Build compact context for the LLM
  const purchasedNames = orders
    .flatMap((o) => o.order_items)
    .map((i: { product_id: string; products?: { name: string } }) => i.products?.name)
    .filter(Boolean)
    .slice(0, 10);

  const highlyRated = (customer.product_reviews as Array<{ rating: number; product_id: string }> ?? [])
    .filter((r) => r.rating >= 4)
    .map((r) => r.product_id)
    .slice(0, 5);

  const wishlistIds = (customer.wishlists as Array<{ product_id: string }> ?? []).map((w) => w.product_id);

  const openai = getOpenAI();

  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a personalisation engine for a premium clothing brand. Recommend products based on customer purchase patterns.",
      },
      {
        role: "user",
        content: `Recommend ${limit} products for this customer.

Previously purchased: ${purchasedNames.join(", ") || "none"}
Highly rated product IDs: ${highlyRated.join(", ") || "none"}
Wishlist IDs: ${wishlistIds.join(", ") || "none"}

Candidate products (id, name, tags):
${candidateProducts.map((p) => `${p.id} | ${p.name} | ${(p.ai_tags ?? p.tags ?? []).join(", ")}`).join("\n")}

Return JSON only (no markdown):
{ "recommendations": [ { "product_id": "...", "score": 0.0–1.0, "reason": "brief reason" }, ... ] }
Sort by score descending. Return exactly ${limit} items.`,
      },
    ],
    max_tokens: 500,
    temperature: 0.5,
  });

  const usage = completion.usage;
  if (usage) {
    await logAIUsage("personalization", CHAT_MODEL, usage.prompt_tokens, usage.completion_tokens);
  }

  const raw = completion.choices[0].message.content ?? "{}";
  const parsed = parseAIJson<{ recommendations: AIPersonalizationResult[] }>(raw);

  const results = (parsed.recommendations ?? []).slice(0, limit);

  // Cache for 6 hours
  await setCache(cacheKey, results, 60 * 60 * 6);

  return results;
}
