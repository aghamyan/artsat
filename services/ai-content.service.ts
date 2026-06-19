import { createServiceClient } from "@/lib/supabase-server";
import { getOpenAI, CHAT_MODEL, logAIUsage, parseAIJson } from "@/lib/ai";
import type { Product, AIGeneratedDescription, AISEOMetadata, AIProductTags } from "@/lib/types";

// Generate a product description from raw product data
export async function generateProductDescription(
  product: Product
): Promise<AIGeneratedDescription> {
  const openai = getOpenAI();

  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a copywriter for Artsat, a premium clothing brand. Write compelling, concise product descriptions that are SEO-friendly and reflect a refined, modern aesthetic.",
      },
      {
        role: "user",
        content: `Generate a product description for our store.

Product: ${product.name}
Price: $${(product.price / 100).toFixed(2)}
${product.material ? `Material: ${product.material}` : ""}
${product.care_instructions ? `Care: ${product.care_instructions}` : ""}
${product.tags?.length ? `Tags: ${product.tags.join(", ")}` : ""}

Requirements:
- 120–180 words
- Highlight key benefits and craftsmanship
- Natural, persuasive tone — no markdown
- SEO-friendly language
- Return only the description text, nothing else.`,
      },
    ],
    max_tokens: 350,
    temperature: 0.75,
  });

  const usage = completion.usage;
  if (usage) {
    await logAIUsage("description", CHAT_MODEL, usage.prompt_tokens, usage.completion_tokens);
  }

  const description = completion.choices[0].message.content?.trim() ?? "";

  // Persist to database
  const supabase = createServiceClient();
  await supabase
    .from("products")
    .update({
      description,
      description_generated: true,
      description_generated_by: CHAT_MODEL,
      updated_at: new Date().toISOString(),
    })
    .eq("id", product.id);

  return { description, tokens_used: usage?.total_tokens ?? 0 };
}

// Generate meta title + meta description + meta keywords
export async function generateSEOMetadata(product: Product): Promise<AISEOMetadata> {
  const openai = getOpenAI();

  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an SEO expert for Artsat Clothing. Generate optimised meta tags that improve search engine ranking.",
      },
      {
        role: "user",
        content: `Generate SEO metadata for this product.

Product: ${product.name}
Price: $${(product.price / 100).toFixed(2)}
${product.description ? `Description: ${product.description.slice(0, 300)}` : ""}
${product.tags?.length ? `Tags: ${product.tags.join(", ")}` : ""}

Return JSON only (no markdown fences):
{
  "meta_title": "50–60 chars, include product name and brand",
  "meta_description": "150–160 chars, compelling, include a call to action",
  "meta_keywords": "comma-separated relevant keywords, 5–10 terms"
}`,
      },
    ],
    max_tokens: 250,
    temperature: 0.5,
  });

  const usage = completion.usage;
  if (usage) {
    await logAIUsage("seo", CHAT_MODEL, usage.prompt_tokens, usage.completion_tokens);
  }

  const raw = completion.choices[0].message.content ?? "{}";
  const metadata = parseAIJson<AISEOMetadata>(raw);

  // Persist
  const supabase = createServiceClient();
  await supabase
    .from("products")
    .update({
      meta_title: metadata.meta_title,
      meta_description: metadata.meta_description,
      meta_keywords: metadata.meta_keywords,
      updated_at: new Date().toISOString(),
    })
    .eq("id", product.id);

  return metadata;
}

// Generate AI tags for categorisation and vector search enrichment
export async function generateProductTags(product: Product): Promise<AIProductTags> {
  const openai = getOpenAI();

  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      {
        role: "user",
        content: `Generate 6–10 relevant tags for this clothing product. These are used for categorisation and internal search.

Product: ${product.name}
${product.description ? `Description: ${product.description.slice(0, 200)}` : ""}

Return JSON only (no markdown fences): { "tags": ["tag1", "tag2", ...] }`,
      },
    ],
    max_tokens: 150,
    temperature: 0.5,
  });

  const usage = completion.usage;
  if (usage) {
    await logAIUsage("description", CHAT_MODEL, usage.prompt_tokens, usage.completion_tokens);
  }

  const raw = completion.choices[0].message.content ?? "{}";
  const result = parseAIJson<AIProductTags>(raw);
  const tags = result.tags ?? [];

  // Persist ai_tags
  const supabase = createServiceClient();
  await supabase
    .from("products")
    .update({ ai_tags: tags, updated_at: new Date().toISOString() })
    .eq("id", product.id);

  return { tags };
}

// Bulk generate descriptions for products without one
export async function bulkGenerateDescriptions(batchSize = 25): Promise<{ count: number }> {
  const supabase = createServiceClient();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .or("description.is.null,description_generated.eq.false")
    .limit(batchSize);

  if (!products?.length) return { count: 0 };

  let count = 0;
  for (const product of products) {
    try {
      await generateProductDescription(product as Product);
      count++;
    } catch {
      // Skip individual failures, continue batch
    }
  }

  return { count };
}
