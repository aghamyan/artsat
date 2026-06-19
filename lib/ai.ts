import OpenAI from "openai";
import { createServiceClient } from "@/lib/supabase-server";
import type { AIFeature } from "@/lib/types";

// Singleton OpenAI client
let _openai: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "sk-placeholder") {
      throw new Error("OPENAI_API_KEY is not configured. Set it in .env.local.");
    }
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

// Model constants
export const CHAT_MODEL = "gpt-4o" as const;
export const EMBEDDING_MODEL = "text-embedding-3-small" as const;

// Cost per 1K tokens (USD) — approximate 2025 pricing
const TOKEN_COST: Record<string, { prompt: number; completion: number }> = {
  "gpt-4o":                   { prompt: 0.0025,  completion: 0.01    },
  "gpt-4o-mini":              { prompt: 0.00015, completion: 0.0006  },
  "text-embedding-3-small":   { prompt: 0.00002, completion: 0        },
};

function estimateCost(model: string, promptTokens: number, completionTokens: number): number {
  const rates = TOKEN_COST[model] ?? { prompt: 0, completion: 0 };
  return (
    (promptTokens   / 1000) * rates.prompt +
    (completionTokens / 1000) * rates.completion
  );
}

export async function logAIUsage(
  feature: AIFeature,
  model: string,
  promptTokens: number,
  completionTokens: number
): Promise<void> {
  try {
    const supabase = createServiceClient();
    const totalTokens = promptTokens + completionTokens;
    const estimatedCostUsd = estimateCost(model, promptTokens, completionTokens);

    await supabase.from("ai_usage_log").insert({
      feature,
      model,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      estimated_cost_usd: estimatedCostUsd,
    });
  } catch {
    // Non-fatal — usage logging must never break the feature
  }
}

// Simple cache helpers
export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("ai_cache")
      .select("value, expires_at")
      .eq("cache_key", key)
      .single();

    if (!data) return null;
    if (new Date(data.expires_at) < new Date()) {
      await supabase.from("ai_cache").delete().eq("cache_key", key);
      return null;
    }
    return data.value as T;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    const supabase = createServiceClient();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

    await supabase.from("ai_cache").upsert({
      cache_key: key,
      value,
      expires_at: expiresAt,
    });
  } catch {
    // Non-fatal
  }
}

// Parse JSON safely from LLM output — strip markdown fences
export function parseAIJson<T>(raw: string): T {
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  return JSON.parse(stripped) as T;
}
