import { NextRequest, NextResponse } from "next/server";
import { chatWithAI, getConversation } from "@/services/ai-chatbot.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, conversation_id } = body as {
      message: string;
      conversation_id?: string;
    };

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    if (message.length > 1000) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }

    const history = conversation_id ? await getConversation(conversation_id) : [];

    const result = await chatWithAI(message.trim(), history, conversation_id);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[support/chat]", msg);
    return NextResponse.json(
      { error: "Unable to process request. Please try again." },
      { status: 500 }
    );
  }
}
