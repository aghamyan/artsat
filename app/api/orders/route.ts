import { NextResponse } from "next/server";
import { getServerProfile } from "@/lib/auth";
import { getCustomerOrders } from "@/services/customer.service";

export async function GET(request: Request) {
  const profile = await getServerProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);

  const result = await getCustomerOrders(profile.id, page, limit);
  return NextResponse.json({ data: result });
}
