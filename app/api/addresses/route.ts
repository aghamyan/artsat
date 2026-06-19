import { NextResponse } from "next/server";
import { getServerProfile } from "@/lib/auth";
import { getAddresses, createAddress } from "@/services/address.service";

export async function GET() {
  const profile = await getServerProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const addresses = await getAddresses(profile.id);
  return NextResponse.json({ data: addresses });
}

export async function POST(request: Request) {
  const profile = await getServerProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { label, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default, is_billing } = body;

  if (!full_name || !phone || !address_line1 || !city || !postal_code || !country) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const address = await createAddress(profile.id, {
      label: label ?? "home",
      full_name,
      phone,
      address_line1,
      address_line2: address_line2 ?? null,
      city,
      state: state ?? "",
      postal_code,
      country,
      is_default: is_default ?? false,
      is_billing: is_billing ?? false,
    });
    return NextResponse.json({ data: address }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Create failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
