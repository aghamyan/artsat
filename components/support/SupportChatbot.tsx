"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage } from "@/lib/types";

export function SupportChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [escalated, setEscalated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, timestamp: new Date().toISOString() },
    ]);
    setLoading(true);

    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversation_id: conversationId }),
      });
      const data = await res.json();

      if (data.response) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response, timestamp: new Date().toISOString() },
        ]);
        if (data.conversationId) setConversationId(data.conversationId);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble right now. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleEscalate() {
    if (!conversationId) return;
    await fetch("/api/support/escalate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: conversationId }),
    });
    setEscalated(true);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "I've connected you with our support team. Someone will follow up with you by email shortly.",
        timestamp: new Date().toISOString(),
      },
    ]);
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close support chat" : "Open support chat"}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-foreground text-background flex items-center justify-center shadow-lg hover:bg-silver transition-colors duration-200"
      >
        {open ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 sm:w-96 bg-background border border-border shadow-2xl flex flex-col" style={{ maxHeight: "520px" }}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-secondary">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Artsat</p>
              <p className="font-display text-sm tracking-wide">Support</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-muted-foreground">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-xs mt-6 space-y-1">
                <p className="font-display text-sm text-foreground">Hello!</p>
                <p>How can I help you today?</p>
                <div className="flex flex-wrap gap-1.5 justify-center mt-4">
                  {["Track my order", "Return policy", "Sizing help"].map((hint) => (
                    <button
                      key={hint}
                      onClick={() => { setInput(hint); }}
                      className="text-[10px] tracking-wide border border-border px-2.5 py-1.5 hover:bg-secondary transition-colors"
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={[
                    "max-w-[80%] text-xs leading-relaxed px-3 py-2",
                    msg.role === "user"
                      ? "bg-foreground text-background"
                      : "bg-secondary text-foreground",
                  ].join(" ")}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-secondary px-3 py-2.5 flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Ask a question..."
                maxLength={1000}
                disabled={loading || escalated}
                className="flex-1 bg-secondary border-none text-xs px-3 py-2.5 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-silver/40"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim() || escalated}
                className="px-3 py-2.5 bg-foreground text-background text-xs tracking-wide hover:bg-silver disabled:opacity-40 transition-colors"
              >
                Send
              </button>
            </div>

            {messages.length >= 2 && !escalated && conversationId && (
              <button
                onClick={handleEscalate}
                className="w-full text-[10px] tracking-wide text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                Talk to a human →
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
