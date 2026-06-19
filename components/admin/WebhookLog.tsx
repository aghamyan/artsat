"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { StripeWebhookEvent } from "@/lib/types";

interface WebhookLogResponse {
  events: StripeWebhookEvent[];
  total: number;
}

export function WebhookLog() {
  const [events, setEvents] = useState<StripeWebhookEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stripe/events?page=${page}&limit=20`);
      const json = await res.json() as WebhookLogResponse;
      setEvents(json.events ?? []);
      setTotal(json.total ?? 0);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Webhook Events</h2>
        <span className="text-sm text-muted-foreground">{total} total</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No webhook events recorded yet.
        </p>
      ) : (
        <div className="rounded-lg border divide-y">
          {events.map((event) => (
            <div key={event.id} className="p-4 flex items-start gap-4">
              <Badge variant={event.processed ? "default" : "destructive"}>
                {event.processed ? "processed" : "failed"}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono font-medium">{event.event_type}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {event.stripe_event_id}
                </p>
                {event.error_message && (
                  <p className="text-xs text-destructive mt-1">{event.error_message}</p>
                )}
              </div>
              <time className="text-xs text-muted-foreground whitespace-nowrap">
                {format(new Date(event.created_at), "MMM d, HH:mm")}
              </time>
            </div>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 20 >= total}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
