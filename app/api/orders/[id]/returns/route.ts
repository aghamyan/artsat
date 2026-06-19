import { NextResponse } from "next/server";
import { getServerProfile } from "@/lib/auth";
import { requestReturn } from "@/services/return.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  const profile = await getServerProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { order_item_id, request_type, reason, reason_description, quantity } = body;

  if (!order_item_id || !request_type || !reason || !quantity) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const returnReq = await requestReturn(orderId, profile.id, {
      order_item_id,
      request_type,
      reason,
      reason_description,
      quantity,
    });
    return NextResponse.json({ data: returnReq }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
