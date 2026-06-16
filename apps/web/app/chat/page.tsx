"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect, useRef } from "react";

type Thread = { id: string; title: string; created_at: string };
type ConnectStatus = { gmail: boolean; googlecalendar: boolean };
type User = { id: string; name: string; email: string; image?: string };

function ConnectBanner({ status, onConnect }: { status: ConnectStatus; onConnect: (plugin: string) => void }) {
  const needsGmail = !status.gmail;
  const needsCalendar = !status.googlecalendar;
  if (!needsGmail && !needsCalendar) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-xl font-semibold mb-2">Connect your accounts</h2>
        <p className="text-gray-500 text-sm mb-6">
          Inhumane needs access to your email and calendar to operate on your behalf. This is a one-time setup.
        </p>
        <div className="space-y-3">
          {needsGmail && (
            <button
              onClick={() => onConnect("gmail")}
              className="w-full flex items-center gap-3 px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg">✉️</span>
              <div className="text-left">
                <div className="text-sm font-medium">Connect Gmail</div>
                <div className="text-xs text-gray-400">Read, send, and manage emails</div>
              </div>
            </button>
          )}
          {needsCalendar && (
            <button
              onClick={() => onConnect("googlecalendar")}
              className="w-full flex items-center gap-3 px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg">📅</span>
              <div className="text-left">
                <div className="text-sm font-medium">Connect Calendar</div>
                <div className="text-xs text-gray-400">View and create events</div>
              </div>
            </button>
          )}
        </div>
        {!needsGmail && needsCalendar && (
          <p className="text-xs text-gray-400 mt-4 text-center">Gmail connected ✓</p>
        )}
        {needsGmail && !needsCalendar && (
          <p className="text-xs text-gray-400 mt-4 text-center">Calendar connected ✓</p>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [connectStatus, setConnectStatus] = useState<ConnectStatus>({ gmail: false, googlecalendar: false });
  const [user, setUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      credentials: "include",
      body: activeThread ? { threadId: activeThread } : undefined,
    }),
  });

  // Load threads + status + user session
  useEffect(() => {
    fetch("/api/threads", { credentials: "include" })
      .then((r) => r.json())
      .then(setThreads)
      .catch(() => {});

    // Connect status - check cache first
    const cached = localStorage.getItem("corsair-status");
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < 5 * 60 * 1000) { setConnectStatus(data); }
      else { fetchConnectStatus(); }
    } else { fetchConnectStatus(); }

    fetch("/api/auth/get-session", { credentials: "include" })
      .then((r) => r.json())
      .then((s) => s?.user && setUser(s.user))
      .catch(() => {});
  }, []);

  function fetchConnectStatus() {
    fetch("/api/corsair/status", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setConnectStatus(data);
        localStorage.setItem("corsair-status", JSON.stringify({ data, ts: Date.now() }));
      })
      .catch(() => {});
  }

  // Listen for popup connect completion
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "corsair-connected") {
        localStorage.removeItem("corsair-status");
        fetchConnectStatus();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const openConnectPopup = (plugin: string) => {
    window.open(`/api/corsair/connect?plugin=${plugin}`, "corsair-connect", "width=500,height=600,popup=yes");
  };

  // Load messages when switching threads
  useEffect(() => {
    if (!activeThread) { setMessages([]); return; }
    fetch(`/api/threads/${activeThread}/messages`, { credentials: "include" })
      .then((r) => r.json())
      .then((msgs: any[]) => {
        setMessages(msgs.map((m) => ({
          id: m.id,
          role: m.role,
          parts: [{ type: "text" as const, text: m.content }],
        })));
      })
      .catch(() => {});
  }, [activeThread]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createThread = async () => {
    const r = await fetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title: "New conversation" }),
    });
    const thread = await r.json();
    setThreads((prev) => [thread, ...prev]);
    setActiveThread(thread.id);
    setMessages([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status !== "ready") return;

    // Auto-create thread if none active
    if (!activeThread) {
      const title = input.slice(0, 50) + (input.length > 50 ? "..." : "");
      fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title }),
      })
        .then((r) => r.json())
        .then((thread) => {
          setThreads((prev) => [thread, ...prev]);
          setActiveThread(thread.id);
          sendMessage({ text: input });
          setInput("");
        });
      return;
    }

    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="flex h-screen">
      <ConnectBanner status={connectStatus} onConnect={openConnectPopup} />
      {/* Sidebar */}
      <div className="w-64 border-r flex flex-col bg-gray-800 text-white">
        <div className="p-3 border-b">
          <button
            onClick={createThread}
            className="w-full px-3 py-2 bg-black text-white rounded text-sm"
          >
            + New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveThread(t.id)}
              className={`w-full text-left px-3 py-2 text-sm truncate hover:bg-gray-700 ${
                activeThread === t.id ? "bg-gray-700 font-medium" : ""
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>
        {/* Profile */}
        {user && (
          <div className="border-t border-gray-700 p-3">
            <div className="flex items-center gap-2">
              {user.image && <img src={user.image} alt="" className="w-7 h-7 rounded-full" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
              <button
                onClick={() => {
                  fetch("/api/auth/sign-out", { method: "POST", credentials: "include" })
                    .then(() => window.location.href = "/");
                }}
                className="text-xs text-gray-400 hover:text-white"
              >
                ↪
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>What can I help you with?</p>
            </div>
          )}
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === "user" ? "bg-gray-700 text-white" : "bg-gray-600 text-white"
              }`}>
                {message.parts.map((part, i) => {
                  if (part.type === "text") return <p key={i} className="whitespace-pre-wrap text-sm">{part.text}</p>;
                  if (part.type.startsWith("tool-")) {
                    const p = part as any;
                    return (
                      <div key={i} className="mt-2 text-xs bg-blue-50 border border-blue-200 rounded px-2 py-1">
                        <span className="font-medium">⚡ {p.toolName || "Tool"}</span>
                        {p.state === "result" && <span className="ml-2 text-green-600">✓ Done</span>}
                        {p.state === "call" && <span className="ml-2 text-yellow-600">Running...</span>}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          ))}
          {(status === "submitted" || status === "streaming") && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-500 animate-pulse">
                {status === "submitted" ? "Thinking..." : "Responding..."}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
            placeholder="Send an email, check calendar..."
            className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            disabled={status !== "ready"}
          />
          <button
            type="submit"
            disabled={status !== "ready" || !input.trim()}
            className="px-4 py-2 bg-black text-white rounded-lg text-sm disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
