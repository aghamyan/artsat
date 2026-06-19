import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase-server";
import { SITE_NAME } from "@/lib/constants";
import { AutomationTriggers } from "@/components/admin/AutomationTriggers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Automation | Admin | ${SITE_NAME}`,
};

interface AutomationLog {
  id: string;
  job_name: string;
  status: string;
  processed: number;
  skipped: number;
  errors: number;
  triggered_by: string;
  run_at: string;
}

export default async function AutomationPage() {
  const supabase = createServiceClient();
  const { data: logs } = await supabase
    .from("automation_logs")
    .select("*")
    .order("run_at", { ascending: false })
    .limit(50);

  const JOB_LABELS: Record<string, string> = {
    abandoned_cart: "Abandoned Cart Recovery",
    review_invitations: "Review Invitations",
    payment_retry: "Payment Retry",
    low_stock_alert: "Low Stock Alert",
  };

  const STATUS_COLORS: Record<string, string> = {
    success: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    skipped: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automation</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manually trigger jobs or review recent runs
          </p>
        </div>
        <Link
          href="/admin/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Manual triggers */}
      <AutomationTriggers />

      {/* Cron schedule info */}
      <div className="rounded-xl border bg-background p-5 shadow-sm">
        <h2 className="font-semibold mb-3">Vercel Cron Schedule</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Add this to{" "}
          <code className="bg-muted px-1 rounded text-xs">vercel.json</code> to
          automate these jobs:
        </p>
        <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto">
          {JSON.stringify(
            {
              crons: [
                {
                  path: "/api/cron/abandoned-cart",
                  schedule: "0 10 * * *",
                },
                {
                  path: "/api/cron/review-invitations",
                  schedule: "0 11 * * *",
                },
                { path: "/api/cron/payment-retry", schedule: "0 9,17 * * *" },
                {
                  path: "/api/cron/low-stock-alert",
                  schedule: "0 8 * * 1",
                },
              ],
            },
            null,
            2
          )}
        </pre>
        <p className="text-xs text-muted-foreground mt-2">
          Set <code className="bg-muted px-1 rounded">CRON_SECRET</code> in
          environment variables for secure cron auth.
        </p>
      </div>

      {/* Run history */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Run History</h2>
        {!logs?.length ? (
          <p className="text-muted-foreground text-sm">
            No automation runs yet. Trigger a job above to see results here.
          </p>
        ) : (
          <div className="rounded-xl border bg-background overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Job</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Processed</th>
                  <th className="px-4 py-3 text-right font-medium">Skipped</th>
                  <th className="px-4 py-3 text-right font-medium">Errors</th>
                  <th className="px-4 py-3 text-right font-medium">Triggered By</th>
                  <th className="px-4 py-3 text-right font-medium">Run At</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(logs as AutomationLog[]).map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">
                      {JOB_LABELS[log.job_name] ?? log.job_name}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[log.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{log.processed}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {log.skipped}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {log.errors > 0 ? (
                        <span className="text-red-500 font-medium">{log.errors}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground capitalize">
                      {log.triggered_by}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                      {new Date(log.run_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
