"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";

export default function ChatPage() {
  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      credentials: "include",
    }),
  });
  const [input, setInput] = useState("");

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
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
                    <div key={i} className="mt-2 text-xs bg-gray-200 rounded px-2 py-1">
                      <span className="font-medium">{p.toolName || "Tool"}</span>
                      {p.state === "result" && <span className="ml-2 text-green-600">✓</span>}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}
        {(status === "submitted" || status === "streaming") && (
          <div className="flex justify-start items-center gap-2">
            <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-500">
              {status === "submitted" ? "Thinking..." : "Streaming..."}
            </div>
            <button onClick={() => stop()} className="text-xs text-gray-400 hover:text-gray-600">Stop</button>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input });
            setInput("");
          }
        }}
        className="border-t p-4 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
  );
}
