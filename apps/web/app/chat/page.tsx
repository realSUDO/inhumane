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
      <button onClick={e => { e.stopPropagation(); setOpen(!open); }} className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
        <MoreHorizontalIcon size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-50 w-36 bg-gray-100 border border-gray-200 rounded-lg shadow-2xl py-1 animate-[fadeIn_0.15s_ease-out]" onMouseLeave={() => setOpen(false)}>
          <button onClick={e => { e.stopPropagation(); setRenaming(true); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-900 hover:bg-gray-100 transition-colors">
            <Edit02Icon size={12} /> Rename
          </button>
          <button onClick={e => { e.stopPropagation(); onAction("pin", thread.id); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-900 hover:bg-gray-100 transition-colors">
            <PinIcon size={12} /> {thread.pinned ? "Unpin" : "Pin"}
          </button>
          <button onClick={e => { e.stopPropagation(); onAction("archive", thread.id); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-900 hover:bg-gray-100 transition-colors">
            <Archive01Icon size={12} /> Archive
          </button>
          <div className="border-t border-gray-200 my-1" />
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
    <div className="mt-3 bg-white rounded-lg overflow-hidden shadow-xl max-w-[420px] border border-gray-300/80">
      {/* Title bar */}
      <div className="bg-gray-700 px-4 py-2 flex items-center justify-between">
        <span className="text-[13px] text-gray-900 font-medium">New Message</span>
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
          className="px-5 py-[7px] bg-[#0b57d0] text-gray-900 text-[13px] font-medium rounded-full hover:bg-[#0842a0] hover:shadow-md active:scale-[0.97] transition-all disabled:opacity-50 flex items-center gap-1.5"
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
        className="w-full bg-gray-200 text-gray-900 text-xs px-2 py-1.5 rounded outline-none border border-gray-300"
        onClick={e => e.stopPropagation()}
      />
    </div>
  );

  return (
    <div className={`group flex items-center rounded-lg transition-all duration-150 ${active ? "bg-gray-100" : "hover:bg-gray-50"}`}>
      <button onClick={onSelect} className={`flex-1 flex items-center gap-2 px-3 py-2 text-left text-xs truncate ${active ? "text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
        {thread.pinned && <PinIcon size={10} className="shrink-0 text-gray-400" />}
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
      <div className="bg-gray-100 rounded-2xl p-10 max-w-lg w-full mx-4 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-2">Connect your accounts</h2>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">One-time setup. Inhumane needs access to operate on your behalf. Your credentials are encrypted and never shared.</p>
        <div className="space-y-3">
          {!status.gmail && (
            <button onClick={() => onConnect("gmail")} className="w-full flex items-center gap-4 px-5 py-4 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all duration-150 active:scale-[0.98]">
              <Mail01Icon size={20} className="text-gray-500" />
              <div className="text-left"><div className="text-sm font-medium text-gray-900">Connect Gmail</div><div className="text-xs text-gray-500 mt-0.5">Read, send, and manage emails</div></div>
            </button>
          )}
          {!status.googlecalendar && (
            <button onClick={() => onConnect("googlecalendar")} className="w-full flex items-center gap-4 px-5 py-4 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all duration-150 active:scale-[0.98]">
              <Calendar03Icon size={20} className="text-gray-500" />
              <div className="text-left"><div className="text-sm font-medium text-gray-900">Connect Calendar</div><div className="text-xs text-gray-500 mt-0.5">View and create events</div></div>
            </button>
          )}
        </div>
        {(status.gmail || status.googlecalendar) && (
          <p className="text-xs text-gray-500 mt-5 text-center">{status.gmail ? "✓ Gmail connected" : "✓ Calendar connected"}</p>
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
    <div className="flex h-screen bg-white text-gray-900 font-[Inter]">
      <ConnectModal status={connectStatus} onConnect={openConnectPopup} />

      {/* Sidebar */}
      <aside className="w-64 h-screen fixed left-0 top-0 flex flex-col py-8 px-5 bg-gray-50 border-r border-gray-200 z-40">
        <div className="mb-8 px-1">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Inhumane</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.15em] mt-1">AI Operator</p>
        </div>
        <nav className="space-y-1 mb-4">
          <button onClick={() => { setActiveThread(null); setShowChat(false); setMessages([]); }} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left transition-all duration-150 ${!activeThread && !showChat ? "text-gray-900 border-l-2 border-white bg-gray-100" : "text-gray-500 hover:bg-gray-50"}`}>
            <Home01Icon size={16} /><span className="text-xs font-medium">Workspace</span>
          </button>
        </nav>
        <div className="flex-1 overflow-y-auto space-y-3 px-1">
          {groupThreadsByDate(threads).map(group => (
            <div key={group.label}>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.1em] px-2 mb-1">{group.label}</p>
              <div className="space-y-0.5">
                {group.threads.map(t => (
                  <ThreadItem key={t.id} thread={t} active={activeThread === t.id} onSelect={() => setActiveThread(t.id)} onAction={handleThreadAction} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-auto pt-6 space-y-3">
          <button onClick={() => { setActiveThread(null); setShowChat(true); setMessages([]); }} className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white text-xs font-medium rounded-lg active:scale-[0.97] transition-transform duration-150 hover:bg-gray-800">
            <PlusSignIcon size={14} /> New Chat
          </button>
          {user && (
            <div className="flex items-center gap-3 px-1 pt-2">
              {user.image && <img src={user.image} alt="" className="w-7 h-7 rounded-full ring-1 ring-white/10" />}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
              </div>
              <button onClick={() => { fetch("/api/auth/sign-out", { method: "POST", credentials: "include" }).then(() => { localStorage.removeItem("inhumane-onboarded"); window.location.href = "/"; }); }} className="text-gray-500 hover:text-gray-900 transition-colors">
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
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0.02) 0%, transparent 60%)" }} />
            <div className="w-full max-w-2xl px-6 relative z-10 flex flex-col items-center animate-[fadeIn_0.5s_ease-out]">
              <h2 className="text-[52px] font-semibold text-gray-900 tracking-[-0.04em] leading-[1.1] text-center">
                Work at Inhumane Speed.
              </h2>
              <div className="h-px w-16 bg-gray-200 mt-6 mb-10" />
              <form onSubmit={handleSubmit} className="w-full animate-[fadeIn_0.7s_ease-out_0.15s_both]">
                <div className="relative group w-full">
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); } }}
                    rows={4}
                    className="w-full bg-white px-5 py-4 rounded-xl border border-gray-200 shadow-sm ring-0 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 text-[15px] text-gray-900 placeholder:text-gray-400 transition-all duration-200 outline-none resize-none"
                    placeholder="Ask anything — send email, check calendar, create events..."
                  />
                  <div className="absolute right-3 bottom-3 flex items-center gap-2">
                    <kbd className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-[10px] font-mono text-gray-500">⌘K</kbd>
                    <button type="submit" disabled={!input.trim()} className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-900 text-white disabled:opacity-20 hover:bg-gray-800 active:scale-95 transition-all duration-150 text-sm font-medium">→</button>
                  </div>
                </div>
              </form>
              <p className="mt-5 text-[13px] text-gray-500 animate-[fadeIn_0.9s_ease-out_0.25s_both]">Your AI operator for email, calendar, and workflows.</p>

              <div className="grid grid-cols-3 gap-3 mt-14 w-full animate-[fadeIn_1s_ease-out_0.4s_both]">
                <button onClick={() => startNewChat("Show my latest 5 emails")} className="p-5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 hover:border-gray-200 transition-all duration-150 text-left group active:scale-[0.98]">
                  <Mail01Icon size={18} className="text-gray-300 group-hover:text-gray-600 transition-colors mb-3" />
                  <h3 className="text-[13px] font-medium text-gray-900 mb-1">Read Inbox</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed">Summarize recent emails.</p>
                </button>
                <button onClick={() => startNewChat("What's on my calendar today?")} className="p-5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 hover:border-gray-200 transition-all duration-150 text-left group active:scale-[0.98]">
                  <Calendar03Icon size={18} className="text-gray-300 group-hover:text-gray-600 transition-colors mb-3" />
                  <h3 className="text-[13px] font-medium text-gray-900 mb-1">Today's Schedule</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed">Check your calendar.</p>
                </button>
                <button onClick={() => startNewChat("Draft an email")} className="p-5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 hover:border-gray-200 transition-all duration-150 text-left group active:scale-[0.98]">
                  <PencilEdit01Icon size={18} className="text-gray-300 group-hover:text-gray-600 transition-colors mb-3" />
                  <h3 className="text-[13px] font-medium text-gray-900 mb-1">Draft Email</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed">Compose something fast.</p>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-10 py-8 space-y-5">
              {messages.map(message => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-[fadeIn_0.2s_ease-out]`}>
                  <div className={`max-w-[65%] rounded-2xl px-5 py-3.5 ${message.role === "user" ? "bg-gray-100 text-gray-900" : "bg-gray-50 border border-gray-100 text-gray-900"}`}>
                    {message.parts.map((part, i) => {
                      if (part.type === "text") return <div key={i} className="whitespace-pre-wrap text-[14px] leading-[1.7]">{renderMessageContent(part.text)}</div>;
                      if (part.type.startsWith("tool-")) {
                        const p = part as any;
                        return (
                          <div key={i} className="mt-3 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2">
                            <span className="text-gray-400">⚡</span>
                            <span className="font-medium text-gray-600">{p.toolName || "Tool"}</span>
                            {p.state === "result" && <span className="ml-auto text-emerald-600 text-[10px]">✓</span>}
                            {p.state === "call" && <span className="ml-auto text-gray-500 text-[10px] animate-pulse">•••</span>}
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
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5">
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
                  className="w-full h-12 bg-white px-5 pr-14 rounded-xl border border-gray-200 shadow-sm ring-0 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 text-[14px] text-gray-900 placeholder:text-gray-400 transition-all duration-200 outline-none"
                  placeholder="Message Inhumane..."
                  disabled={status !== "ready"}
                />
                <button type="submit" disabled={status !== "ready" || !input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center disabled:opacity-20 hover:bg-gray-800 active:scale-95 transition-all duration-150 text-sm">→</button>
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
