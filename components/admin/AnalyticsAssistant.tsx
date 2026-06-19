"use client";

import { useState } from "react";
import type { AIAnalyticsResult } from "@/lib/types";

const EXAMPLE_QUERIES = [
  "What are my top 5 selling products?",
  "How much revenue did I make this month?",
  "Which products are almost out of stock?",
  "What's my customer return rate?",
  "How are my product reviews looking?",
];

export function AnalyticsAssistant() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AIAnalyticsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleQuery(q?: string) {
    const text = (q ?? query).trim();
    if (!text || loading) return;

    setLoading(true);
    setResult(null);
    setError(null);
    if (q) setQuery(q);

    try {
      const res = await fetch("/api/admin/ai/analytics-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data as AIAnalyticsResult);
      }
    } catch {
      setError("Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Query input */}
      <div className="border border-border p-5 space-y-4">
        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground block mb-1.5">
            Ask a business question
          </label>
          <div className="flex gap-2">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleQuery();
                }
              }}
              placeholder="e.g. What are my top selling products this month?"
              rows={2}
              maxLength={500}
              className="flex-1 bg-secondary border-none text-sm px-3 py-2.5 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-silver/40 resize-none"
            />
            <button
              onClick={() => handleQuery()}
              disabled={!query.trim() || loading}
              className="px-5 bg-foreground text-background text-xs tracking-[0.15em] uppercase hover:bg-silver disabled:opacity-40 transition-colors"
            >
              {loading ? "…" : "Ask"}
            </button>
          </div>
        </div>

        {/* Example queries */}
        <div>
          <p className="text-[10px] tracking-wide text-muted-foreground mb-2">Try:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => handleQuery(q)}
                disabled={loading}
                className="text-[10px] border border-border px-2.5 py-1.5 hover:bg-secondary transition-colors tracking-wide disabled:opacity-40"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="border border-border p-5 space-y-3 animate-pulse">
          <div className="h-4 bg-secondary rounded w-3/4" />
          <div className="h-3 bg-secondary rounded w-1/2" />
          <div className="h-3 bg-secondary rounded w-2/3" />
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="border border-border p-5 space-y-5">
          {/* Main answer */}
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Answer</p>
            <p className="text-sm leading-relaxed">{result.answer}</p>
          </div>

          {/* Insights */}
          {result.insights && result.insights.length > 0 && (
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Key Insights</p>
              <ul className="space-y-1.5">
                {result.insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-silver mt-0.5 flex-shrink-0">—</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation */}
          {result.recommendation && (
            <div className="border-l-2 border-silver/40 pl-4">
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">Recommendation</p>
              <p className="text-sm">{result.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
