import { createServiceClient } from "@/lib/supabase-server";
import { getOpenAI, CHAT_MODEL, logAIUsage } from "@/lib/ai";
import type { ChatMessage } from "@/lib/types";

const SYSTEM_PROMPT = `You are the customer support assistant for Artsat Clothing, a premium fashion brand.

You help customers with:
- Product information (materials, sizing, care instructions)
- Order status and tracking
- Returns & exchanges policy
- Shipping information
- Account help

Company policies:
- 14-day return window from delivery date
- Free shipping on orders over $50
- Exchanges available for size or color (same product, subject to availability)
- Processing time: 1–2 business days
- We ship domestically and internationally

Tone: Helpful, warm, and concise. Use the Artsat brand voice — refined but approachable.

If you don't know the answer to a specific order question (order number, delivery status),
say you can't look that up in chat and offer to escalate to a human agent.
Never fabricate order details, tracking numbers, or inventory information.
Never make refund or return approval decisions — always refer those to the human team.`;

export async function chatWithAI(
  userMessage: string,
  history: ChatMessage[],
  conversationId?: string
): Promise<{ response: string; conversationId: string }> {
  const openai = getOpenAI();
  const supabase = createServiceClient();

  // Build message list for the API
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages,
    max_tokens: 400,
    temperature: 0.7,
  });

  const usage = completion.usage;
  if (usage) {
    await logAIUsage("chatbot", CHAT_MODEL, usage.prompt_tokens, usage.completion_tokens);
  }

  const aiResponse = completion.choices[0].message.content ?? "I'm sorry, I couldn't generate a response. Please try again.";

  // Persist conversation
  const updatedMessages: ChatMessage[] = [
    ...history,
    { role: "user", content: userMessage, timestamp: new Date().toISOString() },
    { role: "assistant", content: aiResponse, timestamp: new Date().toISOString() },
  ];

  let convId = conversationId;
  if (convId) {
    await supabase
      .from("support_conversations")
      .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
      .eq("id", convId);
  } else {
    const { data } = await supabase
      .from("support_conversations")
      .insert({ messages: updatedMessages })
      .select("id")
      .single();
    convId = data?.id ?? crypto.randomUUID();
  }

  return { response: aiResponse, conversationId: convId! };
}

export async function getConversation(conversationId: string): Promise<ChatMessage[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("support_conversations")
    .select("messages")
    .eq("id", conversationId)
    .single();

  return (data?.messages as ChatMessage[]) ?? [];
}

export async function escalateToHuman(conversationId: string): Promise<string> {
  const supabase = createServiceClient();

  const { data: ticket } = await supabase
    .from("support_tickets")
    .insert({
      conversation_id: conversationId,
      subject: "Customer requested human support",
      status: "open",
      priority: "normal",
    })
    .select("id")
    .single();

  await supabase
    .from("support_conversations")
    .update({ status: "escalated", updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return ticket?.id ?? "";
}
