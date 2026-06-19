"use client";

import { useState, useEffect } from "react";

interface SegmentSummary {
  segment: string;
  count: number;
}

const SEGMENT_META: Record<string, { label: string; description: string; color: string }> = {
  vip: {
    label: "VIP",
    description: "High LTV, 5+ orders, active in last 90 days",
    color: "text-yellow-400",
  },
  loyal: {
    label: "Loyal",
    description: "3+ orders, moderate LTV, active in last 180 days",
    color: "text-emerald-400",
  },
  at_risk: {
    label: "At Risk",
    description: "Previously active but dormant 180+ days",
    color: "text-red-400",
  },
  new: {
    label: "New",
    description: "Signed up < 60 days ago or 0–1 orders",
    color: "text-blue-400",
  },
  high_potential: {
    label: "High Potential",
    description: "2–4 orders, growing, active in last 90 days",
    color: "text-purple-400",
  },
};

export default function AdminAISegmentsPage() {
  const [summary, setSummary] = useState<SegmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<{ processed?: number; errors?: number } | null>(null);

  async function loadSummary() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ai/segmentation");
      const data = await res.json();
      setSummary(Array.isArray(data) ? data : []);
    } catch {
      setSummary([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  async function runSegmentation() {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await fetch("/api/admin/ai/segmentation", { method: "POST" });
      const data = await res.json();
      setRunResult(data);
      await loadSummary();
    } catch {
      setRunResult(null);
    } finally {
      setRunning(false);
    }
  }

  const total = summary.reduce((s, r) => s + r.count, 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1">Admin / AI</p>
          <h1 className="font-display text-3xl tracking-wide">Customer Segments</h1>
          <p className="text-sm text-muted-foreground mt-2">
            AI segments customers by purchase behaviour and value.
          </p>
        </div>
        <button
          onClick={runSegmentation}
          disabled={running}
          className="bg-foreground text-background text-xs tracking-[0.15em] uppercase px-5 py-2.5 hover:bg-silver disabled:opacity-40 transition-colors"
        >
          {running ? "Running…" : "Run Segmentation"}
        </button>
      </div>

      {runResult && (
        <div className="border border-border p-4 text-sm">
          Segmented {runResult.processed} customers.
          {runResult.errors ? ` ${runResult.errors} errors skipped.` : ""}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border border-border p-5 animate-pulse space-y-2">
              <div className="h-4 bg-secondary rounded w-1/3" />
              <div className="h-3 bg-secondary rounded w-2/3" />
              <div className="h-6 bg-secondary rounded w-1/4 mt-4" />
            </div>
          ))}
        </div>
      ) : summary.length === 0 ? (
        <div className="border border-border p-8 text-center text-sm text-muted-foreground">
          No segments yet. Click &ldquo;Run Segmentation&rdquo; to analyse your customers.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {summary.map((row) => {
            const meta = SEGMENT_META[row.segment];
            const pct = total ? ((row.count / total) * 100).toFixed(0) : "0";

            return (
              <div key={row.segment} className="border border-border p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium tracking-wide ${meta?.color ?? ""}`}>
                    {meta?.label ?? row.segment}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{pct}%</span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {meta?.description ?? ""}
                </p>

                <div className="flex items-end gap-2">
                  <span className="font-display text-3xl tabular-nums">{row.count}</span>
                  <span className="text-xs text-muted-foreground mb-1">customers</span>
                </div>

                {/* Progress bar */}
                <div className="h-0.5 bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-silver/60"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
