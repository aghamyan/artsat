import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAllReturns } from "@/services/return.service";
import type { ReturnStatus } from "@/lib/types";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);
  const status = searchParams.get("status") as ReturnStatus | null;

  const result = await getAllReturns(page, limit, status ?? undefined);
  return NextResponse.json({ data: result });
}
