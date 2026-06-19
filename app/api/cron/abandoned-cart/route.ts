/**
 * POST /api/cron/abandoned-cart
 *
 * Trigger: Vercel Cron (daily) or manual from admin UI.
 * Auth: Bearer CRON_SECRET header (cron) OR authenticated admin session (manual).
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  runAbandonedCartRecovery,
  logAutomationRun,
} from "@/services/automation.service";

export async function POST(req: NextRequest) {
  const triggeredBy = await authorise(req);
  if (!triggeredBy) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runAbandonedCartRecovery();
    await logAutomationRun(
      "abandoned_cart",
      result.errors > 0 ? "failed" : result.processed === 0 ? "skipped" : "success",
      result,
      triggeredBy
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function authorise(req: NextRequest): Promise<"cron" | "manual" | null> {
  // Cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth === `Bearer ${cronSecret}`) return "cron";
  }

  // Authenticated admin
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") return "manual";
  return null;
}
