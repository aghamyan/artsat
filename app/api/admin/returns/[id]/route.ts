import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { processReturn } from "@/services/return.service";
import type { ReturnStatus } from "@/lib/types";

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
  const body = await request.json();
  const { status, tracking_number, return_address, notes } = body;

  const validStatuses: ReturnStatus[] = ["pending", "approved", "rejected", "shipped_back", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    await processReturn(id, { status, tracking_number, return_address, notes });
    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Processing failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
