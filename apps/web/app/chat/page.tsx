"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect, useRef, useMemo } from "react";
import { Mail01Icon, Calendar03Icon, PencilEdit01Icon, Logout03Icon, PlusSignIcon, Home01Icon, Clock01Icon, Settings01Icon, SentIcon, MoreHorizontalIcon, Delete02Icon, PinIcon, Archive01Icon, Edit02Icon } from "hugeicons-react";

type Thread = { id: string; title: string; pinned: boolean; archived: boolean; created_at: string };
type ConnectStatus = { gmail: boolean; googlecalendar: boolean };
type User = { id: string; name: string; email: string; image?: string };

function ThreadMenu({ thread, onAction, isRenaming, setRenaming }: { thread: Thread; onAction: (action: string, id: string, data?: any) => void; isRenaming: boolean; setRenaming: (v: boolean) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={e => { e.stopPropagation(); setOpen(!open); }} className="p-1 rounded hover:bg-[#f4f4f8] text-[#6b7280] hover:text-[#1a1a2e] transition-colors">
        <MoreHorizontalIcon size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-50 w-36 bg-[#f4f4f8] border border-[#e8e8ec] rounded-lg shadow-2xl py-1 animate-[fadeIn_0.15s_ease-out]" onMouseLeave={() => setOpen(false)}>
          <button onClick={e => { e.stopPropagation(); setRenaming(true); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#1a1a2e] hover:bg-[#f4f4f8] transition-colors">
            <Edit02Icon size={12} /> Rename
          </button>
          <button onClick={e => { e.stopPropagation(); onAction("pin", thread.id); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#1a1a2e] hover:bg-[#f4f4f8] transition-colors">
            <PinIcon size={12} /> {thread.pinned ? "Unpin" : "Pin"}
          </button>
          <button onClick={e => { e.stopPropagation(); onAction("archive", thread.id); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#1a1a2e] hover:bg-[#f4f4f8] transition-colors">
            <Archive01Icon size={12} /> Archive
          </button>
          <div className="border-t border-[#e8e8ec] my-1" />
          <button onClick={e => { e.stopPropagation(); onAction("delete", thread.id); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors">
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
    <div className="mt-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
      <SentIcon size={14} className="text-emerald-600" />
      <span className="text-xs text-emerald-700">Email sent to {to}</span>
    </div>
  );

  return (
    <div className="mt-3 bg-white rounded-lg overflow-hidden shadow-xl max-w-[420px] border border-[#d4d4dc]/80">
      {/* Title bar */}
      <div className="bg-gray-700 px-4 py-2 flex items-center justify-between">
        <span className="text-[13px] text-[#1a1a2e] font-medium">New Message</span>
        <div className="flex gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#f8f9fa]0" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#f8f9fa]0" />
        </div>
      </div>
      {/* To field */}
      <div className="px-4 py-2 border-b border-[#e8e8ec] flex items-center gap-2">
        <span className="text-[12px] text-[#6b7280]">To</span>
        <span className="text-[13px] text-[#1a1a2e] bg-blue-50 border border-blue-200 rounded px-2 py-0.5">{to}</span>
      </div>
      {/* Subject */}
      <div className="px-4 py-2 border-b border-[#e8e8ec]">
        <span className="text-[13px] text-[#1a1a2e]">{subject}</span>
      </div>
      {/* Body */}
      <div className="px-4 py-4 min-h-[80px]">
        <p className="text-[13px] text-gray-800 whitespace-pre-wrap leading-[1.6]">{body}</p>
      </div>
      {/* Bottom toolbar */}
      <div className="px-4 py-2 border-t border-[#e8e8ec] flex items-center gap-3">
        <button
          onClick={handleSend}
          disabled={sending}
          className="px-5 py-[7px] bg-[#0b57d0] text-[#1a1a2e] text-[13px] font-medium rounded-full hover:bg-[#0842a0] hover:shadow-md active:scale-[0.97] transition-all disabled:opacity-50 flex items-center gap-1.5"
        >
          {sending ? "Sending..." : "Send"}
        </button>
        <span className="text-[11px] text-[#9ca3af]">⌘ + Enter</span>
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

function ThreadItem({ thread, active, onSelect, onAction }: { thread: Thread; active: boolean; onSelect: () => void; onAction: (action: string, id: string, data?: any) => void }) {
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(thread.title);

  useEffect(() => { setTitle(thread.title); }, [thread.title]);

  if (renaming) return (
    <div className="px-2 py-1">
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        onBlur={() => { if (title.trim()) onAction("rename", thread.id, title); setRenaming(false); }}
        onKeyDown={e => { if (e.key === "Enter") { if (title.trim()) onAction("rename", thread.id, title); setRenaming(false); } if (e.key === "Escape") { setTitle(thread.title); setRenaming(false); } }}
        className="w-full bg-[#e8e8ec] text-[#1a1a2e] text-xs px-2 py-1.5 rounded outline-none border border-[#d4d4dc]"
        onClick={e => e.stopPropagation()}
      />
    </div>
  );

  return (
    <div className={`group flex items-center rounded-lg transition-all duration-150 ${active ? "bg-[#f4f4f8]" : "hover:bg-[#f8f9fa]"}`}>
      <button onClick={onSelect} className={`flex-1 flex items-center gap-2 px-3 py-2 text-left text-xs truncate ${active ? "text-[#1a1a2e]" : "text-[#6b7280] hover:text-[#374151]"}`}>
        {thread.pinned && <PinIcon size={10} className="shrink-0 text-[#9ca3af]" />}
        <span className="truncate">{thread.title}</span>
      </button>
      <div className="hidden group-hover:block pr-1">
        <ThreadMenu thread={thread} onAction={onAction} isRenaming={renaming} setRenaming={setRenaming} />
      </div>
    </div>
  );
}

function groupThreadsByDate(threads: Thread[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; threads: Thread[] }[] = [];
  const pinned = threads.filter(t => t.pinned);
  const unpinned = threads.filter(t => !t.pinned);

  if (pinned.length) groups.push({ label: "Pinned", threads: pinned });

  const todayThreads = unpinned.filter(t => new Date(t.created_at) >= today);
  const yesterdayThreads = unpinned.filter(t => { const d = new Date(t.created_at); return d >= yesterday && d < today; });
  const weekThreads = unpinned.filter(t => { const d = new Date(t.created_at); return d >= weekAgo && d < yesterday; });
  const olderThreads = unpinned.filter(t => new Date(t.created_at) < weekAgo);

  if (todayThreads.length) groups.push({ label: "Today", threads: todayThreads });
  if (yesterdayThreads.length) groups.push({ label: "Yesterday", threads: yesterdayThreads });
  if (weekThreads.length) groups.push({ label: "This Week", threads: weekThreads });
  if (olderThreads.length) groups.push({ label: "Older", threads: olderThreads });

  return groups;
}

function ConnectModal({ status, onConnect }: { status: ConnectStatus; onConnect: (plugin: string) => void }) {
  if (status.gmail && status.googlecalendar) return null;
  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#f4f4f8] rounded-2xl p-10 max-w-lg w-full mx-4 border border-[#e8e8ec]">
        <h2 className="text-2xl font-semibold text-[#1a1a2e] tracking-tight mb-2">Connect your accounts</h2>
        <p className="text-[#6b7280] text-sm mb-8 leading-relaxed">One-time setup. Inhumane needs access to operate on your behalf. Your credentials are encrypted and never shared.</p>
        <div className="space-y-3">
          {!status.gmail && (
            <button onClick={() => onConnect("gmail")} className="w-full flex items-center gap-4 px-5 py-4 rounded-xl bg-[#f8f9fa] hover:bg-[#f4f4f8] border border-[#e8e8ec] transition-all duration-150 active:scale-[0.98]">
              <Mail01Icon size={20} className="text-[#6b7280]" />
              <div className="text-left"><div className="text-sm font-medium text-[#1a1a2e]">Connect Gmail</div><div className="text-xs text-[#6b7280] mt-0.5">Read, send, and manage emails</div></div>
            </button>
          )}
          {!status.googlecalendar && (
            <button onClick={() => onConnect("googlecalendar")} className="w-full flex items-center gap-4 px-5 py-4 rounded-xl bg-[#f8f9fa] hover:bg-[#f4f4f8] border border-[#e8e8ec] transition-all duration-150 active:scale-[0.98]">
              <Calendar03Icon size={20} className="text-[#6b7280]" />
              <div className="text-left"><div className="text-sm font-medium text-[#1a1a2e]">Connect Calendar</div><div className="text-xs text-[#6b7280] mt-0.5">View and create events</div></div>
            </button>
          )}
        </div>
        {(status.gmail || status.googlecalendar) && (
          <p className="text-xs text-[#6b7280] mt-5 text-center">{status.gmail ? "✓ Gmail connected" : "✓ Calendar connected"}</p>
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

  // Stable transport - threadId passed via body dynamically
  const activeThreadRef = useRef<string | null>(null);
  activeThreadRef.current = activeThread;

  const transport = useMemo(() => new DefaultChatTransport({
    api: "/api/chat",
    credentials: "include",
    body: () => ({ threadId: activeThreadRef.current }),
  }), []);

  const { messages, sendMessage, status, setMessages } = useChat({ transport });

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

  const justCreatedRef = useRef(false);

  useEffect(() => {
    if (!activeThread) { setMessages([]); setShowChat(false); return; }
    // Skip DB load if we just created this thread (messages are already in useChat state)
    if (justCreatedRef.current) { justCreatedRef.current = false; return; }
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
      const newPinned = !thread?.pinned;
      await fetch(`/api/threads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ pinned: newPinned }) });
      setThreads(prev => prev.map(t => t.id === id ? { ...t, pinned: newPinned } : t));
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
        justCreatedRef.current = true;
        setActiveThread(thread.id);
        setShowChat(true);
        sendMessage({ text });
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
    <div className="flex h-screen overflow-hidden" style={{ background: "#fdf8f8", fontFamily: "'Inter', sans-serif" }}>
      <ConnectModal status={connectStatus} onConnect={openConnectPopup} />

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col h-full w-72 fixed left-0 top-0 p-7 gap-8 z-50" style={{ background: "rgba(247,243,242,0.8)", backdropFilter: "blur(12px)" }}>
        <div>
          <h1 className="text-[28px] font-medium tracking-[-0.02em]" style={{ color: "#1c1b1b" }}>Inhumane</h1>
          <p className="text-[11px] uppercase tracking-[0.05em] font-semibold mt-1" style={{ color: "#747878" }}>AI Workspace</p>
        </div>

        <button onClick={() => { setActiveThread(null); setShowChat(true); setMessages([]); }} className="flex items-center gap-3 w-full px-5 py-4 rounded-2xl text-[15px] font-medium text-white hover:opacity-90 active:scale-[0.98] transition-all" style={{ background: "#1c1b1b" }}>
          <PlusSignIcon size={18} /> New Thread
        </button>

        <nav className="flex-1 overflow-y-auto -mx-2 px-2 space-y-5" style={{ scrollbarWidth: "thin", scrollbarColor: "#e5e2e1 transparent" }}>
          {groupThreadsByDate(threads).map(group => (
            <div key={group.label}>
              <p className="text-[10px] uppercase tracking-[0.08em] font-semibold px-3 mb-2" style={{ color: "#747878" }}>{group.label}</p>
              {group.threads.map(t => (
                <ThreadItem key={t.id} thread={t} active={activeThread === t.id} onSelect={() => setActiveThread(t.id)} onAction={handleThreadAction} />
              ))}
            </div>
          ))}
        </nav>

        {user && (
          <div className="mt-auto flex items-center gap-3 pt-5" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
            {user.image && <img src={user.image} alt="" className="w-9 h-9 rounded-full object-cover" />}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate" style={{ color: "#1c1b1b" }}>{user.name}</p>
              <p className="text-[11px] truncate" style={{ color: "#747878" }}>{user.email}</p>
            </div>
            <button onClick={() => { fetch("/api/auth/sign-out", { method: "POST", credentials: "include" }).then(() => { localStorage.removeItem("inhumane-onboarded"); window.location.href = "/"; }); }} className="opacity-40 hover:opacity-80 transition-opacity">
              <Logout03Icon size={16} />
            </button>
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="md:ml-72 flex-1 h-screen flex flex-col relative overflow-hidden">
        {!showChat ? (
          <div className="flex-1 flex flex-col items-center justify-center px-10 pb-20">
            <div className="w-full max-w-[640px]" style={{ animation: "fadeIn 0.6s ease-out" }}>
              <h2 className="text-[36px] font-medium tracking-[-0.02em] leading-[1.2] mb-3" style={{ color: "#1c1b1b" }}>Good to see you.</h2>
              <p className="text-[16px] leading-[1.7] mb-10 max-w-md" style={{ color: "#5e5e5c" }}>What are we working on? I can manage your email, calendar, and everyday workflows.</p>

              <form onSubmit={handleSubmit} className="mb-6">
                <div className="bg-white rounded-2xl p-4 transition-all" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.04)" }}>
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); } }}
                    rows={3}
                    className="w-full text-[15px] placeholder:text-[#aaa] outline-none resize-none bg-transparent leading-[1.7]"
                    style={{ color: "#1c1b1b" }}
                    placeholder="Type your instruction..."
                  />
                  <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.03)" }}>
                    <kbd className="px-2 py-1 rounded-lg text-[10px] font-mono" style={{ background: "#f5f3f1", color: "#888", border: "1px solid rgba(0,0,0,0.04)" }}>⌘ Enter</kbd>
                    <button type="submit" disabled={!input.trim()} className="w-10 h-10 rounded-full text-white flex items-center justify-center disabled:opacity-20 hover:scale-105 active:scale-95 transition-transform" style={{ background: "#1c1b1b", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>↑</button>
                  </div>
                </div>
              </form>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => startNewChat("Show my latest 5 emails")} className="px-5 py-2.5 rounded-full text-[13px] transition-colors hover:opacity-80" style={{ background: "#f3f7ff", color: "#1c1b1b", border: "1px solid #d0dfff" }}>
                  <Mail01Icon size={14} className="inline mr-1.5 -mt-0.5 opacity-60" />Read Inbox
                </button>
                <button onClick={() => startNewChat("What's on my calendar today?")} className="px-5 py-2.5 rounded-full text-[13px] transition-colors hover:opacity-80" style={{ background: "#f3f7ff", color: "#1c1b1b", border: "1px solid #d0dfff" }}>
                  <Calendar03Icon size={14} className="inline mr-1.5 -mt-0.5 opacity-60" />Schedule
                </button>
                <button onClick={() => startNewChat("Draft an email")} className="px-5 py-2.5 rounded-full text-[13px] transition-colors hover:opacity-80" style={{ background: "#f3f7ff", color: "#1c1b1b", border: "1px solid #d0dfff" }}>
                  <PencilEdit01Icon size={14} className="inline mr-1.5 -mt-0.5 opacity-60" />Compose
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <section className="flex-1 overflow-y-auto px-10 pt-8 pb-44" style={{ scrollbarWidth: "thin", scrollbarColor: "#e5e2e1 transparent" }}>
              <div className="max-w-[720px] mx-auto flex flex-col gap-10">
                {messages.map(message => (
                  <div key={message.id} style={{ animation: "fadeIn 0.4s ease-out" }}>
                    {message.role === "user" ? (
                      <div className="flex justify-end">
                        <div className="max-w-[80%] bg-white rounded-2xl px-5 py-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.04)" }}>
                          {message.parts.map((part, i) => part.type === "text" ? <p key={i} className="text-[15px] leading-[1.7] whitespace-pre-wrap" style={{ color: "#5e5e5c" }}>{part.text}</p> : null)}
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="bg-white rounded-2xl px-6 py-5 max-w-[92%]" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.04)" }}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#f5f3f1" }}>
                              <span className="text-[9px] font-bold" style={{ color: "#747878" }}>AI</span>
                            </div>
                            <span className="text-[10px] font-semibold uppercase tracking-[0.05em]" style={{ color: "#747878" }}>Inhumane</span>
                          </div>
                          {message.parts.map((part, i) => {
                            if (part.type === "text") return <div key={i} className="text-[15px] leading-[1.8] whitespace-pre-wrap" style={{ color: "#1c1b1b" }}>{renderMessageContent(part.text)}</div>;
                            if (part.type.startsWith("tool-")) { const p = part as any; return (<div key={i} className="mt-3 inline-flex items-center gap-2 text-[12px] rounded-xl px-3 py-2" style={{ background: "#f5f3f1", border: "1px solid rgba(0,0,0,0.04)" }}><span style={{ color: "#aaa" }}>⚡</span><span style={{ color: "#5e5e5c" }}>{p.toolName || "Tool"}</span>{p.state === "result" && <span className="text-green-600">✓</span>}{p.state === "call" && <span className="animate-pulse" style={{ color: "#aaa" }}>...</span>}</div>); }
                            return null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {(status === "submitted" || status === "streaming") && messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex items-center gap-3" style={{ animation: "fadeIn 0.3s ease-out" }}>
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "rgba(28,27,27,0.2)", animationDelay: "0s" }} />
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "rgba(28,27,27,0.2)", animationDelay: "0.2s" }} />
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "rgba(28,27,27,0.2)", animationDelay: "0.4s" }} />
                    </div>
                    <p className="text-[12px] italic" style={{ color: "#747878" }}>Processing...</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </section>

            {/* Floating Input */}
            <footer className="absolute bottom-0 left-0 w-full px-10 pb-7 pt-4 pointer-events-none" style={{ background: "linear-gradient(to top, #fdf8f8 60%, transparent)" }}>
              <div className="max-w-[720px] mx-auto pointer-events-auto">
                <form onSubmit={handleSubmit} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(16px)", boxShadow: "0 4px 24px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.05)" }}>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                    className="flex-1 bg-transparent text-[14px] placeholder:text-[#aaa] outline-none py-3 px-3"
                    style={{ color: "#1c1b1b" }}
                    placeholder="Type your instruction..."
                    disabled={status !== "ready"}
                  />
                  <button type="submit" disabled={status !== "ready" || !input.trim()} className="w-10 h-10 rounded-full text-white flex items-center justify-center disabled:opacity-20 hover:scale-105 active:scale-95 transition-transform" style={{ background: "#1c1b1b", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>↑</button>
                </form>
              </div>
            </footer>
          </>
        )}
      </main>

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        body { background: #fdf8f8; -webkit-font-smoothing: antialiased; }
      `}</style>
    </div>
  );
}
