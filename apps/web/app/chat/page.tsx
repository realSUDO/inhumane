"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect, useRef, useMemo } from "react";
import { Mail01Icon, Calendar03Icon, PencilEdit01Icon, Logout03Icon, PlusSignIcon, Home01Icon, Clock01Icon, Settings01Icon, SentIcon, MoreHorizontalIcon, Delete02Icon, PinIcon, Archive01Icon, Edit02Icon } from "hugeicons-react";

function SendArrowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M5 4.5L19 12L5 19.5L9.5 12L5 4.5Z" />
      <path d="M9.5 12H19" />
    </svg>
  );
}

function EmailTagInput({ isDark }: { isDark: boolean }) {
  const [emails, setEmails] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const tc = (l: string, d: string) => isDark ? d : l;

  const addEmail = () => {
    const trimmed = current.trim();
    if (trimmed && trimmed.includes("@") && !emails.includes(trimmed)) {
      setEmails([...emails, trimmed]);
      setCurrent("");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 flex-1">
      {emails.map(e => (
        <span key={e} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ background: tc("rgba(0,0,0,0.04)", "rgba(255,255,255,0.08)"), color: tc("#333", "#ddd") }}>
          {e}
          <button onClick={() => setEmails(emails.filter(x => x !== e))} className="opacity-50 hover:opacity-100 text-[13px] leading-none">×</button>
        </span>
      ))}
      <input
        value={current}
        onChange={e => setCurrent(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addEmail(); } }}
        onBlur={addEmail}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-[13px]"
        style={{ color: tc("#111", "#eee") }}
        placeholder={emails.length ? "Add another..." : "recipient@email.com"}
      />
    </div>
  );
}

type Thread = { id: string; title: string; pinned: boolean; archived: boolean; created_at: string };
type ConnectStatus = { gmail: boolean; googlecalendar: boolean };
type User = { id: string; name: string; email: string; image?: string };

function ThreadMenu({ thread, onAction, isRenaming, setRenaming }: { thread: Thread; onAction: (action: string, id: string, data?: any) => void; isRenaming: boolean; setRenaming: (v: boolean) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button data-menu-trigger onClick={e => { e.stopPropagation(); setOpen(!open); }} className="p-1 rounded transition-colors" style={{ color: "var(--fg-secondary, #999)" }}>
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
    <div className={`group flex items-center rounded-lg transition-all duration-150 ${active ? "bg-[--thread-active]" : "hover:bg-[--thread-hover]"}`}
      style={{ ["--thread-active" as any]: undefined, backgroundColor: active ? "rgba(128,128,128,0.08)" : undefined }}
      onContextMenu={(e) => { e.preventDefault(); setRenaming(false); const menu = e.currentTarget.querySelector("[data-menu-trigger]") as HTMLElement; menu?.click(); }}>
      <button onClick={onSelect} className={`flex-1 flex items-center gap-2 px-3 py-2.5 text-left text-[13px] truncate font-normal ${active ? "font-medium" : ""}`} style={{ color: active ? "var(--fg-primary, #111)" : "var(--fg-secondary, #777)" }}>
        {thread.pinned && <PinIcon size={10} className="shrink-0 opacity-40" />}
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
  const [isDark, setIsDark] = useState(false);
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

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status !== "ready") return;

    // Dev shortcuts - inject inline cards
    if (input.trim() === "sm") { setShowEmailModal(true); setShowChat(true); setInput(""); return; }
    if (input.trim() === "sc") { setShowCalendarModal(true); setShowChat(true); setInput(""); return; }

    if (!activeThread) { startNewChat(); return; }
    sendMessage({ text: input });
    setInput("");
  };

  const tints = isDark
    ? [{ c: "#7B93FF", bg: "#080b14" }, { c: "#5DDCCC", bg: "#081210" }, { c: "#FF7BAA", bg: "#120810" }]
    : [{ c: "#4A6FA5", bg: "#f2f6fc" }, { c: "#2D6A4F", bg: "#f0f8f4" }, { c: "#8B5CF6", bg: "#f5f2ff" }];

  const tc = (light: string, dark: string) => isDark ? dark : light;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)", fontFamily: "'Inter', -apple-system, sans-serif", color: tc("#1c1b1b", "#e0e0e0") }}>
      <ConnectModal status={connectStatus} onConnect={openConnectPopup} />

      <aside className="hidden md:flex flex-col h-full w-[270px] fixed left-0 top-0 p-5 gap-5 z-50" style={{ background: tc("rgba(255,255,255,0.7)", "rgba(12,14,20,0.9)"), backdropFilter: "blur(20px)", borderRight: `1px solid ${tc("rgba(0,0,0,0.05)", "rgba(255,255,255,0.05)")}` }}>
        <div className="px-1">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em]" style={{ color: tc("#111", "#f0f0f0") }}>Inhumane</h1>
          <p className="text-[10px] uppercase tracking-[0.08em] font-medium mt-0.5" style={{ color: tc("#999", "#555") }}>Workspace</p>
        </div>

        <button onClick={() => { setActiveThread(null); setShowChat(true); setMessages([]); }} className="flex items-center gap-2.5 w-full px-4 py-3 rounded-xl text-[13px] font-medium hover:opacity-90 active:scale-[0.97] transition-all" style={{ background: "var(--accent, #111)", color: "#fff", opacity: 1 }}>
          <PlusSignIcon size={16} /> New Thread
        </button>

        <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-4" style={{ scrollbarWidth: "none" }}>
          {groupThreadsByDate(threads).map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] px-2 mb-1.5" style={{ color: tc("#aaa", "#555") }}>{group.label}</p>
              {group.threads.map(t => (
                <ThreadItem key={t.id} thread={t} active={activeThread === t.id} onSelect={() => setActiveThread(t.id)} onAction={handleThreadAction} />
              ))}
            </div>
          ))}
        </div>

        {/* Tint Dots */}
        <div className="flex items-center gap-2.5 px-1">
          {tints.map(t => (
            <button key={t.c} onClick={() => { document.documentElement.style.setProperty("--accent", t.c); document.documentElement.style.setProperty("--bg", t.bg); }} className="w-[22px] h-[22px] rounded-full hover:scale-[1.2] active:scale-90 transition-all cursor-pointer" style={{ background: t.c, boxShadow: `0 2px 8px ${t.c}40` }} />
          ))}
          <button onClick={() => { const next = !isDark; setIsDark(next); document.documentElement.classList.toggle("dark", next); document.documentElement.style.setProperty("--bg", next ? "#080b14" : "#f2f6fc"); document.documentElement.style.setProperty("--accent", next ? "#7B93FF" : "#4A6FA5"); }} className="w-[22px] h-[22px] rounded-full hover:scale-[1.2] active:scale-90 transition-all cursor-pointer" style={{ background: tc("#111", "#fff"), boxShadow: tc("0 2px 8px rgba(0,0,0,0.2)", "0 2px 8px rgba(255,255,255,0.3)") }} />
        </div>

        {user && (
          <div className="flex items-center gap-2.5 px-1 pt-3" style={{ borderTop: `1px solid ${tc("rgba(0,0,0,0.05)", "rgba(255,255,255,0.05)")}` }}>
            {user.image && <img src={user.image} alt="" className="w-8 h-8 rounded-full" />}
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium truncate" style={{ color: tc("#222", "#ddd") }}>{user.name}</p>
              <p className="text-[10px] truncate" style={{ color: tc("#999", "#555") }}>{user.email}</p>
            </div>
            <button onClick={() => { fetch("/api/auth/sign-out", { method: "POST", credentials: "include" }).then(() => { localStorage.removeItem("inhumane-onboarded"); window.location.href = "/"; }); }} className="opacity-30 hover:opacity-70 transition-opacity">
              <Logout03Icon size={15} />
            </button>
          </div>
        )}
      </aside>

      <main className="md:ml-[270px] flex-1 h-screen flex flex-col relative overflow-hidden">
        {!showChat ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 pb-16">
            <div className="w-full max-w-[580px]" style={{ animation: "fadeIn 0.5s ease-out" }}>
              {/* Hero */}
              <div className="mb-10">
                <p className="text-[12px] font-medium uppercase tracking-[0.08em] mb-3" style={{ color: "var(--accent, #4A6FA5)" }}>Your AI operator</p>
                <h2 className="text-[38px] font-semibold tracking-[-0.03em] leading-[1.15]" style={{ color: tc("#0a0a0a", "#f5f5f5") }}>
                  How can I help you<br />get things done?
                </h2>
              </div>

              {/* Input Card */}
              <form onSubmit={handleSubmit} className="mb-5">
                <div className="rounded-2xl p-[18px] transition-all" style={{ background: tc("rgba(255,255,255,0.8)", "rgba(255,255,255,0.03)"), border: `1px solid ${tc("rgba(0,0,0,0.06)", "rgba(255,255,255,0.06)")}`, boxShadow: tc("0 4px 20px rgba(0,0,0,0.04)", "0 4px 20px rgba(0,0,0,0.3)") }}>
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); } }}
                    rows={3}
                    className="w-full text-[14px] placeholder:opacity-40 outline-none resize-none bg-transparent leading-[1.7]"
                    style={{ color: tc("#1c1b1b", "#e5e5e5") }}
                    placeholder="Send an email, check calendar, draft a reply..."
                  />
                  <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${tc("rgba(0,0,0,0.04)", "rgba(255,255,255,0.04)")}` }}>
                    <span className="text-[10px] font-mono" style={{ color: tc("#bbb", "#555") }}>⏎ to send</span>
                    <button type="submit" disabled={!input.trim()} className="w-9 h-9 rounded-full text-white flex items-center justify-center disabled:opacity-15 hover:scale-105 active:scale-95 transition-all text-[13px] font-medium" style={{ background: "var(--accent, #111)", boxShadow: `0 3px 10px ${tc("rgba(0,0,0,0.15)", "rgba(123,147,255,0.3)")}` }}>↑</button>
                  </div>
                </div>
              </form>

              {/* Chips */}
              <div className="flex flex-wrap gap-2">
                {[{ label: "Read Inbox", icon: Mail01Icon, q: "Show my latest 5 emails" }, { label: "Schedule", icon: Calendar03Icon, q: "What's on my calendar today?" }, { label: "Compose", icon: PencilEdit01Icon, q: "Draft an email" }].map(chip => (
                  <button key={chip.label} onClick={() => startNewChat(chip.q)} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-medium transition-all hover:scale-[1.02] active:scale-[0.97]" style={{ background: tc("rgba(0,0,0,0.03)", "rgba(255,255,255,0.04)"), border: `1px solid ${tc("rgba(0,0,0,0.06)", "rgba(255,255,255,0.06)")}`, color: tc("#444", "#bbb") }}>
                    <chip.icon size={13} className="opacity-50" />{chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <section className="flex-1 overflow-y-auto px-8 pt-8 pb-40" style={{ scrollbarWidth: "none" }}>
              <div className="max-w-[680px] mx-auto flex flex-col gap-7">
                {messages.map(message => (
                  <div key={message.id} style={{ animation: "fadeIn 0.3s ease-out" }}>
                    {message.role === "user" ? (
                      <div className="flex justify-end">
                        <div className="max-w-[75%] rounded-2xl rounded-br-lg px-4 py-3" style={{ background: "var(--accent, #111)", color: "#fff", opacity: 1 }}>
                          {message.parts.map((part, i) => part.type === "text" ? <p key={i} className="text-[14px] leading-[1.6] whitespace-pre-wrap">{part.text}</p> : null)}
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1" style={{ background: tc("rgba(0,0,0,0.04)", "rgba(255,255,255,0.06)") }}>
                          <span className="text-[9px] font-bold" style={{ color: tc("#888", "#888") }}>AI</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          {message.parts.map((part, i) => {
                            if (part.type === "text") return <div key={i} className="text-[14px] leading-[1.8] whitespace-pre-wrap" style={{ color: tc("#222", "#ddd") }}>{renderMessageContent(part.text)}</div>;
                            if (part.type.startsWith("tool-")) { const p = part as any; return (<div key={i} className="mt-2 inline-flex items-center gap-1.5 text-[11px] rounded-lg px-2.5 py-1.5" style={{ background: tc("rgba(0,0,0,0.03)", "rgba(255,255,255,0.04)"), border: `1px solid ${tc("rgba(0,0,0,0.05)", "rgba(255,255,255,0.06)")}`, color: tc("#666", "#999") }}><span>⚡</span><span>{p.toolName || "Tool"}</span>{p.state === "result" && <span className="text-green-500">✓</span>}{p.state === "call" && <span className="animate-pulse">…</span>}</div>); }
                            return null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {(status === "submitted" || status === "streaming") && messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex gap-3" style={{ animation: "fadeIn 0.2s ease-out" }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: tc("rgba(0,0,0,0.04)", "rgba(255,255,255,0.06)") }}>
                      <span className="text-[9px] font-bold" style={{ color: "#888" }}>AI</span>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--accent, #999)", animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--accent, #999)", animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--accent, #999)", animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
                {/* Inline Email Card - Gmail Style */}
                {showEmailModal && (
                  <div style={{ animation: "fadeIn 0.3s ease-out" }} className="max-w-[500px]">
                    <div className="rounded-2xl overflow-hidden" style={{ background: tc("#fff", "#1e2028"), boxShadow: tc("0 4px 24px rgba(0,0,0,0.08)", "0 4px 24px rgba(0,0,0,0.4)"), border: `1px solid ${tc("rgba(0,0,0,0.08)", "rgba(255,255,255,0.08)")}` }}>
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: tc("#f8f9fa", "#282a34"), borderBottom: `1px solid ${tc("rgba(0,0,0,0.06)", "rgba(255,255,255,0.05)")}` }}>
                        <div className="flex items-center gap-2">
                          <img src="/gmail.svg" alt="Gmail" className="w-4 h-4" />
                          <span className="text-[12px] font-medium" style={{ color: tc("#444", "#ccc") }}>New Message</span>
                        </div>
                        <button onClick={() => setShowEmailModal(false)} className="w-6 h-6 flex items-center justify-center rounded-full hover:opacity-60 transition-opacity text-[14px]" style={{ color: tc("#666", "#999") }}>×</button>
                      </div>
                      {/* To */}
                      <div className="px-4 py-2 flex items-center gap-3" style={{ borderBottom: `1px solid ${tc("rgba(0,0,0,0.04)", "rgba(255,255,255,0.04)")}` }}>
                        <span className="text-[12px]" style={{ color: tc("#777", "#888") }}>To</span>
                        <EmailTagInput isDark={isDark} />
                      </div>
                      {/* Subject */}
                      <div className="px-4 py-2" style={{ borderBottom: `1px solid ${tc("rgba(0,0,0,0.04)", "rgba(255,255,255,0.04)")}` }}>
                        <input className="w-full bg-transparent outline-none text-[13px]" style={{ color: tc("#111", "#eee") }} placeholder="Subject" />
                      </div>
                      {/* Body */}
                      <div className="px-4 py-3">
                        <textarea className="w-full bg-transparent outline-none text-[13px] resize-none min-h-[140px] leading-[1.7]" style={{ color: tc("#222", "#ddd") }} placeholder="Compose email..." />
                      </div>
                      {/* Footer - Send on right like Gmail */}
                      <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: `1px solid ${tc("rgba(0,0,0,0.06)", "rgba(255,255,255,0.05)")}` }}>
                        <button onClick={() => setShowEmailModal(false)} className="text-[12px] px-3 py-1.5 rounded-lg hover:opacity-70 transition-opacity" style={{ color: tc("#666", "#888") }}>Discard</button>
                        <button className="px-5 py-2 rounded-full text-[12px] font-semibold text-white flex items-center gap-1.5" style={{ background: "#1a73e8" }}>
                          <SendArrowIcon /> Send
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Inline Calendar Card */}
                {showCalendarModal && (
                  <div style={{ animation: "fadeIn 0.3s ease-out" }} className="max-w-[440px]">
                    <div className="rounded-2xl overflow-hidden" style={{ background: tc("#fff", "#1e2028"), boxShadow: tc("0 4px 24px rgba(0,0,0,0.08)", "0 4px 24px rgba(0,0,0,0.4)"), border: `1px solid ${tc("rgba(0,0,0,0.08)", "rgba(255,255,255,0.08)")}` }}>
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: tc("#f8f9fa", "#282a34"), borderBottom: `1px solid ${tc("rgba(0,0,0,0.06)", "rgba(255,255,255,0.05)")}` }}>
                        <div className="flex items-center gap-2">
                          <Calendar03Icon size={14} style={{ color: "var(--accent)" }} />
                          <span className="text-[12px] font-medium" style={{ color: tc("#444", "#ccc") }}>New Event</span>
                        </div>
                        <button onClick={() => setShowCalendarModal(false)} className="w-6 h-6 flex items-center justify-center rounded-full hover:opacity-60 transition-opacity text-[14px]" style={{ color: tc("#666", "#999") }}>×</button>
                      </div>
                      {/* Content */}
                      <div className="px-4 py-4 space-y-4">
                        <input className="w-full bg-transparent outline-none text-[15px] font-medium" style={{ color: tc("#111", "#eee") }} placeholder="Add title" />
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl px-3 py-2.5" style={{ background: tc("rgba(0,0,0,0.02)", "rgba(255,255,255,0.03)"), border: `1px solid ${tc("rgba(0,0,0,0.06)", "rgba(255,255,255,0.06)")}` }}>
                            <label className="text-[9px] font-semibold uppercase tracking-wide block mb-1" style={{ color: tc("#999", "#666") }}>Date</label>
                            <input type="date" className="w-full bg-transparent outline-none text-[12px]" style={{ color: tc("#111", "#eee") }} />
                          </div>
                          <div className="rounded-xl px-3 py-2.5" style={{ background: tc("rgba(0,0,0,0.02)", "rgba(255,255,255,0.03)"), border: `1px solid ${tc("rgba(0,0,0,0.06)", "rgba(255,255,255,0.06)")}` }}>
                            <label className="text-[9px] font-semibold uppercase tracking-wide block mb-1" style={{ color: tc("#999", "#666") }}>Time</label>
                            <input type="time" className="w-full bg-transparent outline-none text-[12px]" style={{ color: tc("#111", "#eee") }} />
                          </div>
                        </div>
                        <input className="w-full bg-transparent outline-none text-[13px] pb-2" style={{ color: tc("#111", "#eee"), borderBottom: `1px solid ${tc("rgba(0,0,0,0.05)", "rgba(255,255,255,0.05)")}` }} placeholder="Add guests..." />
                      </div>
                      {/* Footer - Create on right */}
                      <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: `1px solid ${tc("rgba(0,0,0,0.06)", "rgba(255,255,255,0.05)")}` }}>
                        <button onClick={() => setShowCalendarModal(false)} className="text-[12px] px-3 py-1.5 rounded-lg hover:opacity-70 transition-opacity" style={{ color: tc("#666", "#888") }}>Cancel</button>
                        <button className="px-5 py-2 rounded-full text-[12px] font-semibold text-white" style={{ background: "var(--accent, #111)" }}>
                          Create Event
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </section>

            <footer className="absolute bottom-0 left-0 w-full px-8 pb-6 pt-4 pointer-events-none" style={{ background: `linear-gradient(to top, var(--bg) 50%, transparent)` }}>
              <div className="max-w-[680px] mx-auto pointer-events-auto">
                <form onSubmit={handleSubmit} className="flex items-center gap-2.5 rounded-2xl px-4 py-2" style={{ background: tc("rgba(255,255,255,0.85)", "rgba(20,22,30,0.85)"), backdropFilter: "blur(16px)", border: `1px solid ${tc("rgba(0,0,0,0.06)", "rgba(255,255,255,0.06)")}`, boxShadow: tc("0 4px 20px rgba(0,0,0,0.04)", "0 4px 20px rgba(0,0,0,0.4)") }}>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                    className="flex-1 bg-transparent text-[14px] outline-none py-2.5 px-2"
                    style={{ color: tc("#111", "#e5e5e5") }}
                    placeholder="Reply..."
                    disabled={status !== "ready"}
                  />
                  <button type="submit" disabled={status !== "ready" || !input.trim()} className="w-8 h-8 rounded-full text-white flex items-center justify-center disabled:opacity-15 hover:scale-105 active:scale-95 transition-all text-[12px]" style={{ background: "var(--accent, #111)" }}>↑</button>
                </form>
              </div>
            </footer>
          </>
        )}
      </main>

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        :root { --accent: #4A6FA5; --bg: #f2f6fc; --fg-primary: #111; --fg-secondary: #777; }
        .dark { --fg-primary: #e5e5e5; --fg-secondary: #999; }
        body { background: var(--bg); -webkit-font-smoothing: antialiased; }
        * { transition: background-color 0.4s ease, border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease; }
      `}</style>
    </div>
  );
}
