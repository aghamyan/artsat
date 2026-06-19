import { createServiceClient } from "@/lib/supabase-server";
import { getOpenAI, CHAT_MODEL, logAIUsage } from "@/lib/ai";
import type { AIAnalyticsResult } from "@/lib/types";

// Pre-defined read-only analytics queries. The LLM picks one — never writes SQL.
type QueryKey =
  | "top_products"
  | "revenue_by_day"
  | "order_status_breakdown"
  | "low_stock"
  | "returning_customers"
  | "category_revenue"
  | "recent_reviews"
  | "abandoned_carts";

const QUERY_MAP: Record<QueryKey, () => Promise<unknown>> = {
  async top_products() {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("order_items")
      .select("product_id, quantity, products:product_id(name)")
      .gte(
        "created_at",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      )
      .limit(500);

    const counts = new Map<string, { name: string; units: number }>();
    for (const item of data ?? []) {
      const existing = counts.get(item.product_id);
      const name = (item.products as unknown as { name: string } | null)?.name ?? item.product_id;
      counts.set(item.product_id, {
        name,
        units: (existing?.units ?? 0) + (item.quantity ?? 0),
      });
    }

    return Array.from(counts.values())
      .sort((a, b) => b.units - a.units)
      .slice(0, 10);
  },

  async revenue_by_day() {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("orders")
      .select("total, created_at")
      .eq("payment_status", "paid")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: true });

    const days = new Map<string, number>();
    for (const o of data ?? []) {
      const day = o.created_at.slice(0, 10);
      days.set(day, (days.get(day) ?? 0) + (o.total ?? 0));
    }

    return Array.from(days.entries()).map(([date, revenue]) => ({
      date,
      revenue_usd: (revenue / 100).toFixed(2),
    }));
  },

  async order_status_breakdown() {
    const supabase = createServiceClient();
    const { data } = await supabase.from("orders").select("status");

    const counts: Record<string, number> = {};
    for (const o of data ?? []) {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    }

    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  },

  async low_stock() {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("product_variants")
      .select("sku, stock, products:product_id(name)")
      .lt("stock", 10)
      .order("stock", { ascending: true })
      .limit(20);

    return (data ?? []).map((v) => ({
      sku: v.sku,
      stock: v.stock,
      product: (v.products as unknown as { name: string } | null)?.name ?? "Unknown",
    }));
  },

  async returning_customers() {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("orders")
      .select("customer_id")
      .eq("payment_status", "paid");

    const customerOrders = new Map<string, number>();
    for (const o of data ?? []) {
      customerOrders.set(o.customer_id, (customerOrders.get(o.customer_id) ?? 0) + 1);
    }

    const total = customerOrders.size;
    const returning = Array.from(customerOrders.values()).filter((c) => c > 1).length;

    return {
      total_customers: total,
      returning_customers: returning,
      return_rate_pct: total ? ((returning / total) * 100).toFixed(1) : "0",
    };
  },

  async category_revenue() {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("order_items")
      .select("unit_price, quantity, products:product_id(category_id, categories:category_id(name))")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(2000);

    const catRev = new Map<string, number>();
    for (const item of data ?? []) {
      const p = item.products as { categories?: { name: string } } | null;
      const catName = p?.categories?.name ?? "Uncategorised";
      catRev.set(catName, (catRev.get(catName) ?? 0) + (item.unit_price ?? 0) * (item.quantity ?? 0));
    }

    return Array.from(catRev.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category, revenue]) => ({
        category,
        revenue_usd: (revenue / 100).toFixed(2),
      }));
  },

  async recent_reviews() {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("product_reviews")
      .select("rating, created_at, products:product_id(name)")
      .order("created_at", { ascending: false })
      .limit(20);

    const total = (data ?? []).length;
    const avg = total ? (data!.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : "0";
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of data ?? []) dist[r.rating] = (dist[r.rating] ?? 0) + 1;

    return { total, average_rating: avg, distribution: dist };
  },

  async abandoned_carts() {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("orders")
      .select("id")
      .eq("status", "pending")
      .lt("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

    return { abandoned_count: data?.length ?? 0 };
  },
};

const QUERY_DESCRIPTIONS: Record<QueryKey, string> = {
  top_products: "top selling products in the last 30 days, units sold",
  revenue_by_day: "daily revenue for the last 30 days",
  order_status_breakdown: "count of orders by status",
  low_stock: "product variants with fewer than 10 units in stock",
  returning_customers: "how many customers have purchased more than once",
  category_revenue: "revenue by product category in the last 30 days",
  recent_reviews: "recent review ratings and distribution",
  abandoned_carts: "number of pending orders older than 1 hour",
};

export async function queryAnalytics(naturalLanguage: string): Promise<AIAnalyticsResult> {
  const openai = getOpenAI();

  // Step 1: Classify the query to a known key
  const classifyCompletion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      {
        role: "system",
        content: `You are classifying a business analytics question into one predefined category.
Available categories and what data they return:
${Object.entries(QUERY_DESCRIPTIONS).map(([k, v]) => `- "${k}": ${v}`).join("\n")}

Reply with only the category key that best matches the question, or "unknown" if none fit.`,
      },
      {
        role: "user",
        content: naturalLanguage,
      },
    ],
    max_tokens: 20,
    temperature: 0,
  });

  const queryKey = classifyCompletion.choices[0].message.content?.trim().toLowerCase() as QueryKey | "unknown";

  if (queryKey === "unknown" || !(queryKey in QUERY_MAP)) {
    return {
      answer: "I'm not able to answer that question yet. Try asking about: top products, revenue, order status, stock levels, reviews, or customer retention.",
      insights: [],
    };
  }

  // Step 2: Execute the safe read-only query
  const rawData = await QUERY_MAP[queryKey]();

  // Step 3: Interpret with AI
  const interpretCompletion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      {
        role: "system",
        content: "You are a business analytics assistant for Artsat Clothing. Summarise data clearly and highlight actionable insights.",
      },
      {
        role: "user",
        content: `Question: "${naturalLanguage}"

Data:
${JSON.stringify(rawData, null, 2)}

Provide a clear answer in JSON only (no markdown):
{
  "answer": "direct answer to the question",
  "insights": ["insight 1", "insight 2"],
  "recommendation": "optional action to take"
}`,
      },
    ],
    max_tokens: 400,
    temperature: 0.4,
  });

  const usage1 = classifyCompletion.usage;
  const usage2 = interpretCompletion.usage;
  const totalPrompt = (usage1?.prompt_tokens ?? 0) + (usage2?.prompt_tokens ?? 0);
  const totalCompletion = (usage1?.completion_tokens ?? 0) + (usage2?.completion_tokens ?? 0);
  await logAIUsage("analytics", CHAT_MODEL, totalPrompt, totalCompletion);

  const raw = interpretCompletion.choices[0].message.content ?? "{}";

  try {
    const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    return JSON.parse(stripped) as AIAnalyticsResult;
  } catch {
    return {
      answer: interpretCompletion.choices[0].message.content ?? "Unable to interpret results.",
      insights: [],
    };
  }
}
