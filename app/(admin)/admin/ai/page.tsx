"use client";

import { useState } from "react";

interface GenerateResult {
  description?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  tags?: string[];
  tokens_used?: number;
  error?: string;
}

export default function AdminAIToolsPage() {
  const [productId, setProductId] = useState("");
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [loading, setLoading] = useState<"description" | "seo" | "bulk" | null>(null);

  async function runAction(type: "description" | "seo" | "bulk") {
    setLoading(type);
    setResult(null);

    try {
      let res: Response;

      if (type === "bulk") {
        res = await fetch("/api/admin/ai/generate-description", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bulk: true }),
        });
      } else if (type === "description") {
        res = await fetch("/api/admin/ai/generate-description", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: productId, generate_tags: true }),
        });
      } else {
        res = await fetch("/api/admin/ai/generate-seo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: productId }),
        });
      }

      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: "Request failed" });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">
      <div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1">Admin</p>
        <h1 className="font-display text-3xl tracking-wide">AI Content Tools</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Generate product descriptions, SEO metadata, and AI tags using GPT-4o.
        </p>
      </div>

      {/* Single product tools */}
      <section className="border border-border p-6 space-y-5">
        <h2 className="font-display text-lg tracking-wide">Single Product</h2>

        <div>
          <label className="text-xs tracking-wide text-muted-foreground block mb-1.5">
            Product ID
          </label>
          <input
            type="text"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
            className="w-full bg-secondary border border-border text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-silver/40"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => runAction("description")}
            disabled={!productId || loading !== null}
            className="flex-1 bg-foreground text-background text-xs tracking-[0.15em] uppercase py-2.5 hover:bg-silver disabled:opacity-40 transition-colors"
          >
            {loading === "description" ? "Generating…" : "Generate Description"}
          </button>
          <button
            onClick={() => runAction("seo")}
            disabled={!productId || loading !== null}
            className="flex-1 border border-border text-xs tracking-[0.15em] uppercase py-2.5 hover:bg-secondary disabled:opacity-40 transition-colors"
          >
            {loading === "seo" ? "Generating…" : "Generate SEO"}
          </button>
        </div>
      </section>

      {/* Bulk tools */}
      <section className="border border-border p-6 space-y-4">
        <div>
          <h2 className="font-display text-lg tracking-wide">Bulk Operations</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Processes up to 25 products without descriptions per run. Each run costs ~$0.10–$0.20.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => runAction("bulk")}
            disabled={loading !== null}
            className="border border-border text-xs tracking-[0.15em] uppercase px-5 py-2.5 hover:bg-secondary disabled:opacity-40 transition-colors"
          >
            {loading === "bulk" ? "Running…" : "Backfill Descriptions (25)"}
          </button>
          <a
            href="/api/admin/ai/embed?backfill=true"
            className="border border-border text-xs tracking-[0.15em] uppercase px-5 py-2.5 hover:bg-secondary transition-colors"
            onClick={(e) => {
              e.preventDefault();
              fetch("/api/admin/ai/embed?backfill=true", { method: "POST" })
                .then((r) => r.json())
                .then((d) => setResult(d));
            }}
          >
            Backfill Embeddings
          </a>
        </div>
      </section>

      {/* Result */}
      {result && (
        <section className="border border-border p-6 space-y-4">
          <h2 className="font-display text-lg tracking-wide">Result</h2>

          {result.error && (
            <p className="text-sm text-red-400">{result.error}</p>
          )}

          {result.description && (
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Description</p>
              <p className="text-sm leading-relaxed">{result.description}</p>
              {result.tokens_used && (
                <p className="text-xs text-muted-foreground mt-2">{result.tokens_used} tokens used</p>
              )}
            </div>
          )}

          {result.meta_title && (
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">SEO Metadata</p>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground text-xs">Meta Title</dt>
                  <dd>{result.meta_title}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Meta Description</dt>
                  <dd>{result.meta_description}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Keywords</dt>
                  <dd className="text-muted-foreground">{result.meta_keywords}</dd>
                </div>
              </dl>
            </div>
          )}

          {result.tags && result.tags.length > 0 && (
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">AI Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {result.tags.map((tag) => (
                  <span key={tag} className="text-[10px] bg-secondary px-2 py-1 tracking-wide">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {typeof (result as { count?: number }).count === "number" && (
            <p className="text-sm">
              Generated descriptions for {(result as { count: number }).count} products.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
