import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { moderateReview } from "@/services/review.service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { action, notes } = await request.json();

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
  }

  try {
    await moderateReview(id, action, notes);
    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Moderation failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
