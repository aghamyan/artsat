import { NextResponse } from "next/server";
import { getServerProfile } from "@/lib/auth";
import { updateProfile } from "@/services/customer.service";

export async function GET() {
  const profile = await getServerProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ data: profile });
}

export async function PATCH(request: Request) {
  const profile = await getServerProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { full_name, phone, date_of_birth, gender, preferred_language } = body;

  // Coerce empty strings to null for nullable DB columns (DATE, CHECK-constrained TEXT)
  const updates = {
    ...(full_name !== undefined && { full_name }),
    ...(phone !== undefined && { phone }),
    ...(preferred_language !== undefined && { preferred_language }),
    ...(date_of_birth !== undefined && { date_of_birth: date_of_birth || null }),
    ...(gender !== undefined && { gender: gender || null }),
  };

  try {
    const updated = await updateProfile(profile.id, updates);
    return NextResponse.json({ data: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
