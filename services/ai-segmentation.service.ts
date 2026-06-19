import { createServiceClient } from "@/lib/supabase-server";
import { getOpenAI, CHAT_MODEL, logAIUsage, parseAIJson } from "@/lib/ai";
import type { CustomerSegmentLabel, AISegmentResult } from "@/lib/types";

interface CustomerProfile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  lifetime_value: number;
  purchase_count: number;
  avg_order_value: number;
  days_since_last_purchase: number | null;
  days_since_signup: number;
  avg_rating_given: number | null;
}

export async function getCustomerProfiles(): Promise<CustomerProfile[]> {
  const supabase = createServiceClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      `id, email, full_name, created_at,
       orders(id, total, created_at, status),
       product_reviews(rating)`
    )
    .eq("role", "customer")
    .eq("account_status", "active");

  if (!profiles?.length) return [];

  const now = Date.now();

  return profiles.map((p) => {
    const orders = (p.orders as Array<{ id: string; total: number; created_at: string; status: string }>) ?? [];
    const reviews = (p.product_reviews as Array<{ rating: number }>) ?? [];
    const completedOrders = orders.filter((o) => o.status === "delivered");

    const lifetimeValue = completedOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);
    const lastOrderDate = completedOrders.length
      ? new Date(Math.max(...completedOrders.map((o) => new Date(o.created_at).getTime())))
      : null;

    return {
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      created_at: p.created_at,
      lifetime_value: lifetimeValue,
      purchase_count: completedOrders.length,
      avg_order_value: completedOrders.length ? lifetimeValue / completedOrders.length : 0,
      days_since_last_purchase: lastOrderDate
        ? Math.floor((now - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
        : null,
      days_since_signup: Math.floor((now - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      avg_rating_given:
        reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null,
    };
  });
}

export async function segmentCustomers(
  batchSize = 50
): Promise<{ processed: number; errors: number }> {
  const profiles = await getCustomerProfiles();
  const supabase = createServiceClient();
  const openai = getOpenAI();

  // Process in batches of 50 to stay within token limits
  let processed = 0;
  let errors = 0;

  for (let i = 0; i < profiles.length; i += batchSize) {
    const batch = profiles.slice(i, i + batchSize);

    const simplified = batch.map((c) => ({
      id: c.id,
      ltv: Math.round(c.lifetime_value / 100), // dollars
      orders: c.purchase_count,
      avg_order: Math.round(c.avg_order_value / 100),
      days_inactive: c.days_since_last_purchase,
      days_as_customer: c.days_since_signup,
    }));

    try {
      const completion = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
          {
            role: "system",
            content: `Segment customers for a clothing brand into exactly these labels:
- "vip": high LTV (>$300), 5+ orders, active in last 90 days
- "loyal": 3+ orders, moderate LTV, active in last 180 days
- "at_risk": previously active but inactive 180+ days
- "new": < 60 days as customer or 0–1 orders
- "high_potential": 2–4 orders, growing LTV, < 90 days since last purchase`,
          },
          {
            role: "user",
            content: `Segment these customers. Return JSON only (no markdown):
{ "segments": [ { "id": "...", "segment": "vip|loyal|at_risk|new|high_potential", "score": 0.0–1.0, "reasoning": "brief" }, ... ] }

Customers: ${JSON.stringify(simplified)}`,
          },
        ],
        max_tokens: 1500,
        temperature: 0.2,
      });

      const usage = completion.usage;
      if (usage) {
        await logAIUsage("segmentation", CHAT_MODEL, usage.prompt_tokens, usage.completion_tokens);
      }

      const raw = completion.choices[0].message.content ?? "{}";
      const parsed = parseAIJson<{ segments: AISegmentResult[] }>(raw);

      // Upsert segments
      for (const seg of parsed.segments ?? []) {
        const rawSeg = seg as AISegmentResult & { id?: string };
        await supabase.from("customer_segments").upsert({
          customer_id: rawSeg.customer_id ?? rawSeg.id,
          segment: seg.segment as CustomerSegmentLabel,
          score: seg.score,
          updated_at: new Date().toISOString(),
        });
        processed++;
      }
    } catch {
      errors += batch.length;
    }
  }

  return { processed, errors };
}

export async function getSegmentSummary(): Promise<
  Array<{ segment: CustomerSegmentLabel; count: number }>
> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("customer_segments")
    .select("segment");

  if (!data) return [];

  const counts = new Map<CustomerSegmentLabel, number>();
  for (const row of data) {
    counts.set(row.segment, (counts.get(row.segment) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([segment, count]) => ({ segment, count }));
}
