import { NextRequest, NextResponse } from "next/server";
import { escalateToHuman } from "@/services/ai-chatbot.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { conversation_id } = await req.json();
    if (!conversation_id) {
      return NextResponse.json({ error: "conversation_id required" }, { status: 400 });
    }

    const ticketId = await escalateToHuman(conversation_id);
    return NextResponse.json({ ticket_id: ticketId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
