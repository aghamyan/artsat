import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase-server";
import { segmentCustomers, getSegmentSummary } from "@/services/ai-segmentation.service";

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

// GET /api/admin/ai/segmentation — get segment summary
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await getSegmentSummary();
    return NextResponse.json(summary);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/admin/ai/segmentation — run segmentation
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await segmentCustomers();
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
