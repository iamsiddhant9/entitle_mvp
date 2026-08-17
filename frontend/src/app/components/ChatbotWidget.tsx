"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2, Bot } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Add an empty assistant message to stream into
    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response body");

      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // The API can return plain text or data: lines — handle both
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              // Handle UIMessageStream format
              if (parsed.type === "text-delta") {
                accumulated += parsed.delta;
              } else if (parsed.choices?.[0]?.delta?.content) {
                accumulated += parsed.choices[0].delta.content;
              }
            } catch {
              // If it's plain text data (not JSON), use it directly
              if (!data.startsWith("{")) {
                accumulated += data;
              }
            }
          } else if (!line.startsWith("data:") && line.trim()) {
            // Plain text response (toTextStreamResponse)
            accumulated += line;
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: accumulated } : m
          )
        );
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Sorry, something went wrong. Please try again." }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 mb-4 w-[360px] max-w-[calc(100vw-48px)] h-[520px] max-h-[calc(100vh-120px)] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#0B3CC8] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1 rounded-full">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Entitle Assistant</h3>
                <p className="text-xs text-white/70">Ask about welfare schemes</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 gap-3 px-4">
                <div className="bg-blue-50 p-4 rounded-full">
                  <Bot className="w-8 h-8 text-[#0B3CC8]" />
                </div>
                <p className="text-sm font-medium text-gray-700">Hi! I&apos;m your Entitle Assistant</p>
                <p className="text-xs text-gray-500">Ask me about eligibility for PM KISAN, Ayushman Bharat, PMAY, and other welfare schemes.</p>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-[#0B3CC8] text-white rounded-br-sm"
                        : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
                    }`}
                  >
                    {m.content || (m.role === "assistant" && isLoading ? (
                      <span className="flex gap-1 items-center py-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    ) : "")}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:border-[#0B3CC8] focus:ring-2 focus:ring-[#0B3CC8]/20 disabled:opacity-60"
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-[#0B3CC8] text-white p-2.5 rounded-full disabled:opacity-40 hover:bg-[#0a33b0] transition-colors flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl transition-all hover:scale-105 hover:shadow-blue-500/30 border border-white/20"
        style={{ background: "linear-gradient(135deg, #0B3CC8, #1a5aff)", color: "#fff" }}
      >
        <div className="bg-white/20 p-1.5 rounded-full">
          {isOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
        </div>
        {!isOpen && <span className="font-semibold text-sm">Chat with Assistant</span>}
      </button>
    </div>
  );
}
