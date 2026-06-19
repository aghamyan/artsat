"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, RefreshCcw, AlertTriangle, ShoppingCart, Loader2 } from "lucide-react";

interface Job {
  id: string;
  label: string;
  description: string;
  endpoint: string;
  icon: React.ComponentType<{ className?: string }>;
}

const JOBS: Job[] = [
  {
    id: "abandoned-cart",
    label: "Abandoned Cart Recovery",
    description: "Email customers who left items in their cart 24–72h ago.",
    endpoint: "/api/cron/abandoned-cart",
    icon: ShoppingCart,
  },
  {
    id: "review-invitations",
    label: "Review Invitations",
    description: "Invite customers with delivered orders (7–14 days ago) to leave a review.",
    endpoint: "/api/cron/review-invitations",
    icon: Mail,
  },
  {
    id: "payment-retry",
    label: "Payment Retry Emails",
    description: "Email customers whose Stripe payment failed 24–72h ago.",
    endpoint: "/api/cron/payment-retry",
    icon: RefreshCcw,
  },
  {
    id: "low-stock-alert",
    label: "Low Stock Alert",
    description: "Send admin a summary of variants below their reorder level.",
    endpoint: "/api/cron/low-stock-alert",
    icon: AlertTriangle,
  },
];

export function AutomationTriggers() {
  const [loading, setLoading] = useState<string | null>(null);

  async function trigger(job: Job) {
    setLoading(job.id);
    try {
      const res = await fetch(job.endpoint, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(`${job.label}: ${data.error ?? "Failed"}`);
        return;
      }
      toast.success(
        `${job.label}: ${data.processed} processed, ${data.skipped} skipped, ${data.errors} errors`
      );
    } catch {
      toast.error(`${job.label}: Network error`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Manual Triggers</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {JOBS.map((job) => {
          const Icon = job.icon;
          const isLoading = loading === job.id;
          return (
            <div key={job.id} className="rounded-xl border bg-background p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <Icon className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{job.label}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{job.description}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-4 w-full"
                onClick={() => trigger(job)}
                disabled={loading !== null}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    Running…
                  </>
                ) : (
                  "Run Now"
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
