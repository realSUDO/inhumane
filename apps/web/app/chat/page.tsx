"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect, useRef, useMemo } from "react";
import { Mail01Icon, Calendar03Icon, PencilEdit01Icon, Logout03Icon, PlusSignIcon, Home01Icon, Clock01Icon, Settings01Icon, SentIcon, MoreHorizontalIcon, Delete02Icon, PinIcon, Archive01Icon, Edit02Icon } from "hugeicons-react";

type Thread = { id: string; title: string; pinned: boolean; archived: boolean; created_at: string };
type ConnectStatus = { gmail: boolean; googlecalendar: boolean };
type User = { id: string; name: string; email: string; image?: string };

function ThreadMenu({ thread, onAction }: { thread: Thread; onAction: (action: string, id: string, data?: any) => void }) {
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(thread.title);

  if (renaming) return (
    <input
      autoFocus
      value={title}
      onChange={e => setTitle(e.target.value)}
      onBlur={() => { onAction("rename", thread.id, title); setRenaming(false); }}
      onKeyDown={e => { if (e.key === "Enter") { onAction("rename", thread.id, title); setRenaming(false); } if (e.key === "Escape") setRenaming(false); }}
      className="w-full bg-white/10 text-white text-xs px-2 py-1 rounded outline-none"
      onClick={e => e.stopPropagation()}
    />
  );

  return (
    <div className="relative">
      <button onClick={e => { e.stopPropagation(); setOpen(!open); }} className="p-1 rounded hover:bg-white/10 text-[#71717A] hover:text-white transition-colors">
        <MoreHorizontalIcon size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-50 w-36 bg-[#1c1b1b] border border-white/10 rounded-lg shadow-2xl py-1 animate-[fadeIn_0.15s_ease-out]" onMouseLeave={() => setOpen(false)}>
          <button onClick={e => { e.stopPropagation(); setRenaming(true); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#e5e2e1] hover:bg-white/[0.06] transition-colors">
            <Edit02Icon size={12} /> Rename
          </button>
          <button onClick={e => { e.stopPropagation(); onAction("pin", thread.id); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#e5e2e1] hover:bg-white/[0.06] transition-colors">
            <PinIcon size={12} /> {thread.pinned ? "Unpin" : "Pin"}
          </button>
          <button onClick={e => { e.stopPropagation(); onAction("archive", thread.id); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#e5e2e1] hover:bg-white/[0.06] transition-colors">
            <Archive01Icon size={12} /> Archive
          </button>
          <div className="border-t border-white/[0.06] my-1" />
          <button onClick={e => { e.stopPropagation(); onAction("delete", thread.id); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
            <Delete02Icon size={12} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

function EmailDraftCard({ to, subject, body }: { to: string; subject: string; body: string }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    setSending(true);
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ to, subject, body }),
    });
    if (res.ok) setSent(true);
    setSending(false);
  };

  if (sent) return (
    <div className="mt-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
      <SentIcon size={14} className="text-emerald-400" />
      <span className="text-xs text-emerald-300">Email sent to {to}</span>
    </div>
  );

  return (
    <div className="mt-3 bg-white rounded-lg overflow-hidden shadow-xl max-w-[420px] border border-gray-300/80">
      {/* Title bar */}
      <div className="bg-[#404040] px-4 py-2 flex items-center justify-between">
        <span className="text-[13px] text-white font-medium">New Message</span>
        <div className="flex gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-gray-500" />
        </div>
      </div>
      {/* To field */}
      <div className="px-4 py-2 border-b border-gray-200 flex items-center gap-2">
        <span className="text-[12px] text-gray-500">To</span>
        <span className="text-[13px] text-gray-900 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">{to}</span>
      </div>
      {/* Subject */}
      <div className="px-4 py-2 border-b border-gray-200">
        <span className="text-[13px] text-gray-900">{subject}</span>
      </div>
      {/* Body */}
      <div className="px-4 py-4 min-h-[80px]">
        <p className="text-[13px] text-gray-800 whitespace-pre-wrap leading-[1.6]">{body}</p>
      </div>
      {/* Bottom toolbar */}
      <div className="px-4 py-2 border-t border-gray-200 flex items-center gap-3">
        <button
          onClick={handleSend}
          disabled={sending}
          className="px-5 py-[7px] bg-[#0b57d0] text-white text-[13px] font-medium rounded-full hover:bg-[#0842a0] hover:shadow-md active:scale-[0.97] transition-all disabled:opacity-50 flex items-center gap-1.5"
        >
          {sending ? "Sending..." : "Send"}
        </button>
        <span className="text-[11px] text-gray-400">⌘ + Enter</span>
      </div>
    </div>
  );
}

function renderMessageContent(text: string) {
  // Parse email-draft blocks
  const draftRegex = /```email-draft\n([\s\S]*?)\n```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = draftRegex.exec(text)) !== null) {
    // Text before the draft
    if (match.index > lastIndex) {
      parts.push(<span key={lastIndex}>{text.slice(lastIndex, match.index)}</span>);
    }
    // Parse the draft JSON
    try {
      const draft = JSON.parse(match[1]!);
      parts.push(<EmailDraftCard key={match.index} to={draft.to} subject={draft.subject} body={draft.body} />);
    } catch {
      parts.push(<span key={match.index}>{match[0]}</span>);
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={lastIndex}>{text.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : text;
}

function ConnectModal({ status, onConnect }: { status: ConnectStatus; onConnect: (plugin: string) => void }) {
  if (status.gmail && status.googlecalendar) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center">
      <div className="bg-[#1c1b1b] rounded-2xl p-10 max-w-lg w-full mx-4 border border-white/[0.06]">
        <h2 className="text-2xl font-semibold text-white tracking-tight mb-2">Connect your accounts</h2>
        <p className="text-[#71717A] text-sm mb-8 leading-relaxed">One-time setup. Inhumane needs access to operate on your behalf. Your credentials are encrypted and never shared.</p>
        <div className="space-y-3">
          {!status.gmail && (
            <button onClick={() => onConnect("gmail")} className="w-full flex items-center gap-4 px-5 py-4 rounded-xl bg-[#121316] hover:bg-[#1D1F24] border border-white/[0.06] transition-all duration-150 active:scale-[0.98]">
              <Mail01Icon size={20} className="text-white/60" />
              <div className="text-left"><div className="text-sm font-medium text-white">Connect Gmail</div><div className="text-xs text-[#71717A] mt-0.5">Read, send, and manage emails</div></div>
            </button>
          )}
          {!status.googlecalendar && (
            <button onClick={() => onConnect("googlecalendar")} className="w-full flex items-center gap-4 px-5 py-4 rounded-xl bg-[#121316] hover:bg-[#1D1F24] border border-white/[0.06] transition-all duration-150 active:scale-[0.98]">
              <Calendar03Icon size={20} className="text-white/60" />
              <div className="text-left"><div className="text-sm font-medium text-white">Connect Calendar</div><div className="text-xs text-[#71717A] mt-0.5">View and create events</div></div>
            </button>
          )}
        </div>
        {(status.gmail || status.googlecalendar) && (
          <p className="text-xs text-[#71717A] mt-5 text-center">{status.gmail ? "✓ Gmail connected" : "✓ Calendar connected"}</p>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [connectStatus, setConnectStatus] = useState<ConnectStatus>({ gmail: true, googlecalendar: true }); // assume connected until checked
  const [user, setUser] = useState<User | null>(null);
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Transport must be recreated when activeThread changes
  const transport = useMemo(() => new DefaultChatTransport({
    api: "/api/chat",
    credentials: "include",
    body: { threadId: activeThread },
  }), [activeThread]);

  const { messages, sendMessage, status, setMessages } = useChat({ transport, id: activeThread || "new" });

  useEffect(() => {
    fetch("/api/threads", { credentials: "include" }).then(r => r.json()).then(setThreads).catch(() => {});
    fetch("/api/auth/get-session", { credentials: "include" }).then(r => r.json()).then(s => s?.user && setUser(s.user)).catch(() => {});

    // Check onboarding status
    const onboarded = localStorage.getItem("inhumane-onboarded");
    if (onboarded) { setConnectStatus({ gmail: true, googlecalendar: true }); return; }
    fetchConnectStatus();
  }, []);

  function fetchConnectStatus() {
    fetch("/api/corsair/status", { credentials: "include" }).then(r => r.json()).then(data => {
      setConnectStatus(data);
      if (data.gmail && data.googlecalendar) localStorage.setItem("inhumane-onboarded", "true");
    }).catch(() => {});
  }

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "corsair-connected") { fetchConnectStatus(); }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    if (!activeThread) { setMessages([]); setShowChat(false); return; }
    setShowChat(true);
    fetch(`/api/threads/${activeThread}/messages`, { credentials: "include" })
      .then(r => r.json())
      .then((msgs: any[]) => {
        if (!Array.isArray(msgs) || msgs.length === 0) { setMessages([]); return; }
        setMessages(msgs.map(m => ({ id: m.id, role: m.role, parts: [{ type: "text" as const, text: m.content }] })));
      })
      .catch(() => setMessages([]));
  }, [activeThread]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleThreadAction = async (action: string, id: string, data?: any) => {
    if (action === "delete") {
      await fetch(`/api/threads/${id}`, { method: "DELETE", credentials: "include" });
      setThreads(prev => prev.filter(t => t.id !== id));
      if (activeThread === id) { setActiveThread(null); setMessages([]); setShowChat(false); }
    } else if (action === "rename") {
      await fetch(`/api/threads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ title: data }) });
      setThreads(prev => prev.map(t => t.id === id ? { ...t, title: data } : t));
    } else if (action === "pin") {
      const thread = threads.find(t => t.id === id);
      await fetch(`/api/threads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ pinned: !thread?.pinned }) });
      setThreads(prev => prev.map(t => t.id === id ? { ...t, pinned: !t.pinned } : t).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)));
    } else if (action === "archive") {
      await fetch(`/api/threads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ archived: true }) });
      setThreads(prev => prev.filter(t => t.id !== id));
      if (activeThread === id) { setActiveThread(null); setMessages([]); setShowChat(false); }
    }
  };

  const openConnectPopup = (plugin: string) => { window.open(`/api/corsair/connect?plugin=${plugin}`, "corsair-connect", "width=500,height=600,popup=yes"); };

  const startNewChat = (prefill?: string) => {
    const text = prefill || input;
    if (!text.trim() || status !== "ready") return;

    const title = text.slice(0, 50) + (text.length > 50 ? "..." : "");
    fetch("/api/threads", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ title }) })
      .then(r => r.json())
      .then(thread => {
        setThreads(prev => [thread, ...prev]);
        setActiveThread(thread.id);
        setShowChat(true);
        // sendMessage will be called after transport updates via useMemo
        setTimeout(() => sendMessage({ text }), 100);
        setInput("");
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status !== "ready") return;
    if (!activeThread) { startNewChat(); return; }
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="flex h-screen bg-[#0B0B0C] text-[#e5e2e1] font-[Inter]">
      <ConnectModal status={connectStatus} onConnect={openConnectPopup} />

      {/* Sidebar */}
      <aside className="w-64 h-screen fixed left-0 top-0 flex flex-col py-8 px-5 bg-[#121316] border-r border-white/[0.06] z-40">
        <div className="mb-8 px-1">
          <h1 className="text-xl font-bold text-white tracking-tight">Inhumane</h1>
          <p className="text-[10px] text-[#71717A] uppercase tracking-[0.15em] mt-1">AI Operator</p>
        </div>
        <nav className="space-y-1 mb-4">
          <button onClick={() => { setActiveThread(null); setShowChat(false); setMessages([]); }} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left transition-all duration-150 ${!activeThread && !showChat ? "text-white border-l-2 border-white bg-white/[0.06]" : "text-[#71717A] hover:bg-white/[0.04]"}`}>
            <Home01Icon size={16} /><span className="text-xs font-medium">Workspace</span>
          </button>
        </nav>
        <div className="flex-1 overflow-y-auto space-y-0.5">
          {threads.map(t => (
            <div key={t.id} className={`group flex items-center rounded-lg transition-all duration-150 ${activeThread === t.id ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"}`}>
              <button onClick={() => setActiveThread(t.id)} className={`flex-1 flex items-center gap-2 px-3 py-2 text-left text-xs truncate ${activeThread === t.id ? "text-white" : "text-[#71717A] hover:text-white/80"}`}>
                {t.pinned && <PinIcon size={10} className="shrink-0 text-white/50" />}
                <Clock01Icon size={12} className="shrink-0 opacity-50" />
                <span className="truncate">{t.title}</span>
              </button>
              <div className="hidden group-hover:block pr-1">
                <ThreadMenu thread={t} onAction={handleThreadAction} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-auto pt-6 space-y-3">
          <button onClick={() => { setActiveThread(null); setShowChat(true); setMessages([]); }} className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-black text-xs font-medium rounded-lg active:scale-[0.97] transition-transform duration-150">
            <PlusSignIcon size={14} /> New Chat
          </button>
          {user && (
            <div className="flex items-center gap-3 px-1 pt-2">
              {user.image && <img src={user.image} alt="" className="w-7 h-7 rounded-full ring-1 ring-white/10" />}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-white truncate">{user.name}</p>
                <p className="text-[10px] text-[#71717A] truncate">{user.email}</p>
              </div>
              <button onClick={() => { fetch("/api/auth/sign-out", { method: "POST", credentials: "include" }).then(() => { localStorage.removeItem("inhumane-onboarded"); window.location.href = "/"; }); }} className="text-[#71717A] hover:text-white transition-colors">
                <Logout03Icon size={14} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="pl-64 flex-1 flex flex-col min-h-screen relative">
        {!showChat ? (
          <div className="flex-1 flex flex-col items-center justify-center relative">
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.015) 0%, transparent 60%)" }} />
            <div className="w-full max-w-2xl px-6 relative z-10 flex flex-col items-center animate-[fadeIn_0.5s_ease-out]">
              <h2 className="text-[52px] font-semibold text-white tracking-[-0.04em] leading-[1.1] text-center">
                Work at Inhumane Speed.
              </h2>
              <div className="h-px w-16 bg-white/10 mt-6 mb-10" />
              <form onSubmit={handleSubmit} className="w-full animate-[fadeIn_0.7s_ease-out_0.15s_both]">
                <div className="relative group">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                    className="w-full h-14 bg-[#121316] px-6 pr-24 rounded-2xl border border-white/[0.06] ring-0 focus:ring-1 focus:ring-white/10 focus:bg-[#17181C] focus:border-white/10 text-[15px] text-white placeholder:text-[#71717A]/60 transition-all duration-200 outline-none"
                    placeholder="Ask anything — send email, check calendar..."
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <kbd className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] font-mono text-[#71717A]">⌘K</kbd>
                    <button type="submit" disabled={!input.trim()} className="flex items-center justify-center w-8 h-8 rounded-lg bg-white text-black disabled:opacity-20 hover:scale-105 active:scale-95 transition-transform duration-150 text-sm font-medium">→</button>
                  </div>
                </div>
              </form>
              <p className="mt-5 text-[13px] text-[#71717A] animate-[fadeIn_0.9s_ease-out_0.25s_both]">Your AI operator for email, calendar, and workflows.</p>

              <div className="grid grid-cols-3 gap-3 mt-14 w-full animate-[fadeIn_1s_ease-out_0.4s_both]">
                <button onClick={() => startNewChat("Show my latest 5 emails")} className="p-5 rounded-xl bg-[#121316] hover:bg-[#1D1F24] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-150 text-left group active:scale-[0.98]">
                  <Mail01Icon size={18} className="text-white/30 group-hover:text-white/70 transition-colors mb-3" />
                  <h3 className="text-[13px] font-medium text-white mb-1">Read Inbox</h3>
                  <p className="text-[11px] text-[#71717A] leading-relaxed">Summarize recent emails.</p>
                </button>
                <button onClick={() => startNewChat("What's on my calendar today?")} className="p-5 rounded-xl bg-[#121316] hover:bg-[#1D1F24] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-150 text-left group active:scale-[0.98]">
                  <Calendar03Icon size={18} className="text-white/30 group-hover:text-white/70 transition-colors mb-3" />
                  <h3 className="text-[13px] font-medium text-white mb-1">Today's Schedule</h3>
                  <p className="text-[11px] text-[#71717A] leading-relaxed">Check your calendar.</p>
                </button>
                <button onClick={() => startNewChat("Draft an email")} className="p-5 rounded-xl bg-[#121316] hover:bg-[#1D1F24] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-150 text-left group active:scale-[0.98]">
                  <PencilEdit01Icon size={18} className="text-white/30 group-hover:text-white/70 transition-colors mb-3" />
                  <h3 className="text-[13px] font-medium text-white mb-1">Draft Email</h3>
                  <p className="text-[11px] text-[#71717A] leading-relaxed">Compose something fast.</p>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-10 py-8 space-y-5">
              {messages.map(message => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-[fadeIn_0.2s_ease-out]`}>
                  <div className={`max-w-[65%] rounded-2xl px-5 py-3.5 ${message.role === "user" ? "bg-white/[0.08] text-white" : "bg-[#151517] border border-white/[0.04] text-[#e5e2e1]"}`}>
                    {message.parts.map((part, i) => {
                      if (part.type === "text") return <div key={i} className="whitespace-pre-wrap text-[14px] leading-[1.7]">{renderMessageContent(part.text)}</div>;
                      if (part.type.startsWith("tool-")) {
                        const p = part as any;
                        return (
                          <div key={i} className="mt-3 text-xs bg-[#0B0B0C] border border-white/[0.06] rounded-lg px-3 py-2 flex items-center gap-2">
                            <span className="text-white/40">⚡</span>
                            <span className="font-medium text-white/70">{p.toolName || "Tool"}</span>
                            {p.state === "result" && <span className="ml-auto text-emerald-400 text-[10px]">✓</span>}
                            {p.state === "call" && <span className="ml-auto text-[#71717A] text-[10px] animate-pulse">•••</span>}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              ))}
              {(status === "submitted" || status === "streaming") && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start animate-[fadeIn_0.2s_ease-out]">
                  <div className="bg-[#151517] border border-white/[0.04] rounded-2xl px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1 h-1 bg-white/50 rounded-full animate-pulse" />
                      <div className="w-1 h-1 bg-white/30 rounded-full animate-pulse [animation-delay:100ms]" />
                      <div className="w-1 h-1 bg-white/15 rounded-full animate-pulse [animation-delay:200ms]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="px-10 pb-6 pt-3">
              <form onSubmit={handleSubmit} className="relative">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                  className="w-full h-12 bg-[#121316] px-5 pr-14 rounded-xl border border-white/[0.06] ring-0 focus:ring-1 focus:ring-white/10 focus:bg-[#17181C] text-[14px] text-white placeholder:text-[#71717A]/60 transition-all duration-200 outline-none"
                  placeholder="Message Inhumane..."
                  disabled={status !== "ready"}
                />
                <button type="submit" disabled={status !== "ready" || !input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center disabled:opacity-20 hover:scale-105 active:scale-95 transition-transform duration-150 text-sm">→</button>
              </form>
            </div>
          </>
        )}
      </main>

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
