import { NextResponse } from "next/server";
import { getServerProfile } from "@/lib/auth";
import { voteHelpful } from "@/services/review.service";

export async function POST(request: Request) {
  const profile = await getServerProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { review_id, is_helpful } = await request.json();
  if (!review_id || is_helpful === undefined) {
    return NextResponse.json({ error: "review_id and is_helpful required" }, { status: 400 });
  }

  try {
    await voteHelpful(review_id, profile.id, Boolean(is_helpful));
    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Vote failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
