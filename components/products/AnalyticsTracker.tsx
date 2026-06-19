"use client";

import { useEffect } from "react";
import type { AnalyticEvent } from "@/services/analytics.service";

interface AnalyticsTrackerProps {
  productId: string;
  event: AnalyticEvent;
  searchQuery?: string;
}

export function AnalyticsTracker({ productId, event, searchQuery }: AnalyticsTrackerProps) {
  useEffect(() => {
    // Fire-and-forget — never block the UI
    fetch(`/api/products/${productId}/analytics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, query: searchQuery }),
    }).catch(() => {});
  }, [productId, event, searchQuery]);

  return null;
}
