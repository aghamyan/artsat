import { NextResponse } from "next/server";
import { getServerProfile } from "@/lib/auth";
import { getAddress, updateAddress, deleteAddress } from "@/services/address.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const profile = await getServerProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const address = await getAddress(id, profile.id);
  if (!address) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: address });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const profile = await getServerProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  try {
    const updated = await updateAddress(id, profile.id, body);
    return NextResponse.json({ data: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const profile = await getServerProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await deleteAddress(id, profile.id);
    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
