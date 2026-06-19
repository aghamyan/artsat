"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";
import type { PaymentAnalytics as PaymentAnalyticsType } from "@/lib/types";

export function PaymentAnalytics() {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<PaymentAnalyticsType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payments/analytics?period=${period}`);
      const json = await res.json() as PaymentAnalyticsType;
      setData(json);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Payment Analytics</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Total Revenue" value={formatPrice(data.revenue)} />
            <StatCard label="Successful Payments" value={data.successful.toString()} />
            <StatCard label="Failed Payments" value={data.failed.toString()} className="text-destructive" />
            <StatCard label="Refunds Issued" value={formatPrice(data.refund_amount)} />
            <StatCard label="Refund Rate" value={data.refund_rate} />
            <StatCard label="Avg Order Value" value={formatPrice(data.average_order_value)} />
          </div>

          <div>
            <h3 className="font-medium mb-3">Revenue by Day</h3>
            <div className="space-y-1">
              {data.revenue_by_date
                .filter((d) => d.revenue > 0)
                .slice(-14)
                .map((d) => (
                  <div key={d.date} className="flex items-center gap-3 text-sm">
                    <span className="w-24 text-muted-foreground font-mono">{d.date}</span>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (d.revenue / (data.revenue || 1)) * 100 * 3)}%`,
                        }}
                      />
                    </div>
                    <span className="w-20 text-right">{formatPrice(d.revenue)}</span>
                  </div>
                ))}
              {data.revenue_by_date.every((d) => d.revenue === 0) && (
                <p className="text-sm text-muted-foreground">No revenue in this period</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground">Failed to load analytics</p>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${className}`}>{value}</p>
    </div>
  );
}
