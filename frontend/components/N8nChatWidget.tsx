"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Bot, User, Sparkles, Loader2, RotateCcw, Trash2 } from "lucide-react";

interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
}

export default function N8nChatWidget({
  sessionId,
  isSidebarMode = false,
}: {
  sessionId?: string;
  isSidebarMode?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // Load chat history when sessionId changes
  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      return;
    }
    // Set default clean state
    setMessages([
      {
        role: "assistant",
        content: "Halo! Saya AI Data Assistant Anda. Ada yang bisa saya bantu analisis dari data Anda?",
      },
    ]);

    fetch(`${backendUrl}/api/chat/history/${sessionId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setMessages(data);
        }
      })
      .catch(() => {});
  }, [sessionId, backendUrl]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !sessionId) return;

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setLoading(true);

    try {
      const res = await fetch(`${backendUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId,
          message: userText,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response || "Tidak ada jawaban." },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Maaf, terjadi kesalahan saat menghubungi AI." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Gagal terhubung ke backend server." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!sessionId) return;
    try {
      await fetch(`${backendUrl}/api/chat/history/${sessionId}`, { method: "DELETE" });
      setMessages([
        {
          role: "assistant",
          content: "Chat telah dikosongkan. Ada yang bisa saya bantu analisis dari data Anda?",
        },
      ]);
    } catch (e) {
      console.error(e);
    }
  };

  const chatContent = (
    <div className={`flex flex-col h-full w-full bg-zinc-900/95 backdrop-blur-md overflow-hidden text-sm ${isSidebarMode ? "" : "border border-zinc-800 rounded-2xl shadow-2xl"}`}>
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-100 text-sm">DataMind Assistant</h3>
            <p className="text-[11px] text-zinc-400">Nous Hermes 3 (OpenRouter)</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleClearChat}
            title="Kosongkan/Reset Chat"
            className="text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/60 px-2 py-1 rounded-md transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Chat</span>
          </button>
          {!isSidebarMode && (
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-2.5 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`p-3 rounded-xl max-w-[85%] whitespace-pre-wrap leading-relaxed text-xs sm:text-sm ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-xs"
                  : "bg-zinc-800/80 text-zinc-200 border border-zinc-700/50 rounded-bl-xs"
              }`}
            >
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="w-6 h-6 rounded-full bg-zinc-700 text-zinc-300 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="p-3 rounded-xl bg-zinc-800/80 text-zinc-400 border border-zinc-700/50 flex items-center gap-2 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Sedang menganalisis data...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Suggestions */}
      <div className="px-3 py-2 border-t border-zinc-800/80 bg-zinc-950/60 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
          {[
            { icon: "📊", text: "Rangkum data ini" },
            { icon: "🏆", text: "Apa produk terlaris?" },
            { icon: "💰", text: "Total & rata-rata nilai" },
          ].map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (loading) return;
                setInput(item.text);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800/90 hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-zinc-700/70 text-xs text-zinc-200 whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm active:scale-95"
            >
              <span className="text-xs leading-none">{item.icon}</span>
              <span className="font-medium text-[11.5px] leading-none">{item.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSend}
        className="p-3 pb-3.5 border-t border-zinc-800 bg-zinc-950 flex gap-2 items-center shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanyakan sesuatu tentang data..."
          className="flex-1 bg-zinc-800/90 border border-zinc-700 text-zinc-100 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer shadow-md shadow-indigo-600/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );

  // Jika dipasang sebagai sidebar permanen (desktop dock)
  if (isSidebarMode) {
    return chatContent;
  }

  // Floating button & popup modal fallback
  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center cursor-pointer"
        aria-label="Toggle AI Chat"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-6rem)] animate-in fade-in slide-in-from-bottom-5 duration-200">
          {chatContent}
        </div>
      )}
    </>
  );
}
