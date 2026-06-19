import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getCustomerList } from "@/services/customer.service";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);
  const search = searchParams.get("search") ?? undefined;

  const result = await getCustomerList(page, limit, search);
  return NextResponse.json({ data: result });
}
