import { createServiceClient } from "@/lib/supabase-server";
import { getOpenAI, CHAT_MODEL, logAIUsage, parseAIJson, getFromCache, setCache } from "@/lib/ai";
import type { AIInventoryForecast } from "@/lib/types";

interface SaleDataPoint {
  week: number;    // week number relative to today
  quantity: number;
}

export async function forecastInventory(
  variantId: string,
  weeksAhead = 4
): Promise<AIInventoryForecast> {
  const cacheKey = `forecast:${variantId}:${weeksAhead}`;
  const cached = await getFromCache<AIInventoryForecast>(cacheKey);
  if (cached) return cached;

  const supabase = createServiceClient();

  // Get last 52 weeks of sales for this variant
  const since = new Date();
  since.setDate(since.getDate() - 364);

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("quantity, created_at")
    .eq("variant_id", variantId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  // Get current stock level
  const { data: variant } = await supabase
    .from("product_variants")
    .select("stock, sku")
    .eq("id", variantId)
    .single();

  if (!orderItems?.length) {
    return {
      variant_id: variantId,
      forecast: Array.from({ length: weeksAhead }, (_, i) => ({
        week: i + 1,
        predicted_units: 0,
        confidence: 0.5,
      })),
      recommendation: "Insufficient sales history to forecast. Monitor for 4+ weeks.",
    };
  }

  // Bucket into ISO weeks
  const weekBuckets = new Map<number, number>();
  const now = Date.now();
  for (const item of orderItems) {
    const ageDays = Math.floor((now - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24));
    const weekAgo = Math.floor(ageDays / 7);
    if (weekAgo <= 52) {
      weekBuckets.set(weekAgo, (weekBuckets.get(weekAgo) ?? 0) + item.quantity);
    }
  }

  // Build recent 12-week series (most recent first)
  const weeklySales: SaleDataPoint[] = Array.from({ length: 12 }, (_, i) => ({
    week: -(i + 1),
    quantity: weekBuckets.get(i + 1) ?? 0,
  })).reverse();

  const openai = getOpenAI();

  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an inventory forecasting expert for a clothing ecommerce brand. Analyse sales trends and provide practical reorder recommendations.",
      },
      {
        role: "user",
        content: `Forecast inventory demand for the next ${weeksAhead} weeks.

Current stock: ${variant?.stock ?? "unknown"} units
SKU: ${variant?.sku ?? "unknown"}

Weekly sales (most recent last, negative week = weeks ago):
${JSON.stringify(weeklySales)}

Return JSON only (no markdown):
{
  "forecast": [
    { "week": 1, "predicted_units": 5, "confidence": 0.8 },
    ...
  ],
  "recommendation": "Brief reorder recommendation mentioning lead time and safety stock"
}`,
      },
    ],
    max_tokens: 400,
    temperature: 0.3,
  });

  const usage = completion.usage;
  if (usage) {
    await logAIUsage("forecast", CHAT_MODEL, usage.prompt_tokens, usage.completion_tokens);
  }

  const raw = completion.choices[0].message.content ?? "{}";
  const parsed = parseAIJson<{ forecast: AIInventoryForecast["forecast"]; recommendation: string }>(raw);

  const result: AIInventoryForecast = {
    variant_id: variantId,
    forecast: parsed.forecast ?? [],
    recommendation: parsed.recommendation ?? "",
  };

  // Cache for 24 hours — forecasts don't need real-time freshness
  await setCache(cacheKey, result, 60 * 60 * 24);

  return result;
}
