import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { trackProductEvent, getProductAnalytics } from "@/services/analytics.service";
import type { AnalyticEvent } from "@/services/analytics.service";

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "admin" || profile?.role === "staff" ? user : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30");
  const data = await getProductAnalytics(id, days);
  return NextResponse.json({ data });
}

// Public endpoint — track views/searches from the browser
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const event = body.event as AnalyticEvent;
    if (!["views", "searches", "add_to_cart"].includes(event))
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });

    await trackProductEvent(id, event, body.query ?? undefined);
    return NextResponse.json({ success: true });
  } catch {
    // Never fail the user request due to analytics errors
    return NextResponse.json({ success: true });
  }
}
