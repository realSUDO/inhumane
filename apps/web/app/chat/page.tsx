"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect, useRef } from "react";

type Thread = { id: string; title: string; created_at: string };
type ConnectStatus = { gmail: boolean; googlecalendar: boolean };

function ConnectBanner({ status, onConnect }: { status: ConnectStatus; onConnect: (plugin: string) => void }) {
  const missing = [];
  if (!status.gmail) missing.push("gmail");
  if (!status.googlecalendar) missing.push("googlecalendar");
  if (!missing.length) return null;

  return (
    <div className="mx-6 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
      <span className="text-sm text-yellow-800">
        Connect {missing.map((m) => m === "gmail" ? "Gmail" : "Calendar").join(" & ")} to use AI operator
      </span>
      <div className="flex gap-2">
        {missing.map((plugin) => (
          <button
            key={plugin}
            onClick={() => onConnect(plugin)}
            className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
          >
            Connect {plugin === "gmail" ? "Gmail" : "Calendar"}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [connectStatus, setConnectStatus] = useState<ConnectStatus>({ gmail: false, googlecalendar: false });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      credentials: "include",
      body: activeThread ? { threadId: activeThread } : undefined,
    }),
  });

  // Load threads
  useEffect(() => {
    fetch("/api/threads", { credentials: "include" })
      .then((r) => r.json())
      .then(setThreads)
      .catch(() => {});
    // Load connect status
    fetch("/api/corsair/status", { credentials: "include" })
      .then((r) => r.json())
      .then(setConnectStatus)
      .catch(() => {});
  }, []);

  // Listen for popup connect completion
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "corsair-connected") {
        fetch("/api/corsair/status", { credentials: "include" })
          .then((r) => r.json())
          .then(setConnectStatus)
          .catch(() => {});
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
      fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: input.slice(0, 50) }),
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
      {/* Sidebar */}
      <div className="w-64 border-r flex flex-col bg-gray-50">
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
              className={`w-full text-left px-3 py-2 text-sm truncate hover:bg-gray-100 ${
                activeThread === t.id ? "bg-gray-200 font-medium" : ""
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <ConnectBanner status={connectStatus} onConnect={openConnectPopup} />
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>What can I help you with?</p>
            </div>
          )}
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === "user" ? "bg-black text-white" : "bg-gray-100 text-gray-900"
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
