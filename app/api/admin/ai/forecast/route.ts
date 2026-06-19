import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase-server";
import { forecastInventory } from "@/services/ai-inventory-forecast.service";

export const dynamic = "force-dynamic";

async function requireAdmin(): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await createServiceClient()
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return data?.role === "admin" || data?.role === "staff";
}

// GET /api/admin/ai/forecast?variant_id=xxx&weeks=4
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const variantId = req.nextUrl.searchParams.get("variant_id");
  const weeks = parseInt(req.nextUrl.searchParams.get("weeks") ?? "4", 10);

  if (!variantId) {
    return NextResponse.json({ error: "variant_id required" }, { status: 400 });
  }

  try {
    const forecast = await forecastInventory(variantId, weeks);
    return NextResponse.json(forecast);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
