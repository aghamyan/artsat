import { createServiceClient } from "@/lib/supabase-server";
import {
  getOpenAI,
  EMBEDDING_MODEL,
  logAIUsage,
  getFromCache,
  setCache,
} from "@/lib/ai";
import type { Product, AISimilarProduct } from "@/lib/types";

// Generate and store an embedding for one product
export async function generateProductEmbedding(product: Product): Promise<void> {
  const openai = getOpenAI();

  const text = [
    `Name: ${product.name}`,
    product.description ? `Description: ${product.description}` : "",
    product.material ? `Material: ${product.material}` : "",
    product.ai_tags?.length ? `Tags: ${(product.ai_tags as string[]).join(", ")}` : "",
    product.tags?.length ? `Tags: ${product.tags.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });

  const embedding = response.data[0].embedding;

  await logAIUsage("recommendation", EMBEDDING_MODEL, response.usage.prompt_tokens, 0);

  const supabase = createServiceClient();
  await supabase.from("product_embeddings").upsert({
    product_id: product.id,
    embedding: JSON.stringify(embedding),
    generated_at: new Date().toISOString(),
  });
}

// Find similar products for a given product ID
export async function getRecommendedProducts(
  productId: string,
  limit = 4
): Promise<Product[]> {
  const cacheKey = `recommendations:${productId}:${limit}`;

  const cached = await getFromCache<Product[]>(cacheKey);
  if (cached) return cached;

  const supabase = createServiceClient();

  // Get source product embedding
  const { data: embeddingRow } = await supabase
    .from("product_embeddings")
    .select("embedding")
    .eq("product_id", productId)
    .single();

  if (!embeddingRow?.embedding) return [];

  // Find similar via RPC
  const { data: similar, error } = await supabase.rpc("search_similar_products", {
    query_embedding: embeddingRow.embedding,
    exclude_id: productId,
    match_count: limit,
  });

  if (error || !similar?.length) return [];

  const productIds = (similar as AISimilarProduct[]).map((s) => s.product_id);

  const { data: products } = await supabase
    .from("products")
    .select(
      `id, name, slug, price, compare_price, is_active, label, average_rating,
       images:product_images(id, url, alt_text, is_primary, sort_order)`
    )
    .in("id", productIds)
    .eq("is_active", true);

  if (!products?.length) return [];

  // Sort by similarity order
  const sorted = productIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as unknown as Product[];

  await setCache(cacheKey, sorted, 60 * 60 * 6); // 6-hour cache

  return sorted;
}

// Backfill: generate embeddings for all products that don't have one
export async function backfillEmbeddings(batchSize = 50): Promise<{ count: number }> {
  const supabase = createServiceClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, description, material, tags, ai_tags")
    .eq("is_active", true)
    .not(
      "id",
      "in",
      `(SELECT product_id FROM product_embeddings)`
    )
    .limit(batchSize);

  if (!products?.length) return { count: 0 };

  let count = 0;
  for (const product of products) {
    try {
      await generateProductEmbedding(product as Product);
      count++;
    } catch {
      // Skip individual failures
    }
  }

  return { count };
}
