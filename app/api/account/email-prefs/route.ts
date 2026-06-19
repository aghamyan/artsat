import { NextResponse } from "next/server";
import { getServerProfile } from "@/lib/auth";
import { getEmailPreferences, upsertEmailPreferences } from "@/services/customer.service";

export async function GET() {
  const profile = await getServerProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prefs = await getEmailPreferences(profile.id);
  return NextResponse.json({ data: prefs });
}

export async function PATCH(request: Request) {
  const profile = await getServerProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const updated = await upsertEmailPreferences(profile.id, body);
  return NextResponse.json({ data: updated });
}
