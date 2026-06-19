import { NextResponse } from "next/server";
import { getServerProfile } from "@/lib/auth";
import { getCustomerReturns } from "@/services/return.service";

export async function GET() {
  const profile = await getServerProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const returns = await getCustomerReturns(profile.id);
  return NextResponse.json({ data: returns });
}
