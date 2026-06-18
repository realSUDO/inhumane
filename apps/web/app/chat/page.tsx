"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect, useRef, useMemo } from "react";
import { EmailCompose } from "./components/email-compose";
import { CalendarEvent } from "./components/calendar-event";
import { CalendarFull } from "./components/calendar-full";
import { EmailInbox } from "./components/email-inbox";
import { Mail01Icon, Calendar03Icon, PencilEdit01Icon, Logout03Icon, PlusSignIcon, Home01Icon, Clock01Icon, Settings01Icon, SentIcon, MoreHorizontalIcon, Delete02Icon, PinIcon, Archive01Icon, Edit02Icon } from "hugeicons-react";

type Thread = { id: string; title: string; pinned: boolean; archived: boolean; created_at: string };
type ConnectStatus = { gmail: boolean; googlecalendar: boolean };
type User = { id: string; name: string; email: string; image?: string };

function ThreadMenu({ thread, onAction, isRenaming, setRenaming }: { thread: Thread; onAction: (action: string, id: string, data?: any) => void; isRenaming: boolean; setRenaming: (v: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [flipUp, setFlipUp] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setFlipUp(rect.bottom > window.innerHeight - 180);
    }
    setOpen(!open);
  };

  return (
    <div className="relative">
      <button ref={btnRef} data-menu-trigger onClick={handleOpen} className="p-1 rounded opacity-50 hover:opacity-100 transition-opacity" style={{ color: "var(--fg-primary, #111)" }}>
        <MoreHorizontalIcon size={14} />
      </button>
      {open && (
        <div ref={menuRef} className={`fixed z-[100] w-36 rounded-xl py-1.5 animate-[fadeIn_0.1s_ease-out]`} style={{ top: flipUp ? undefined : btnRef.current?.getBoundingClientRect().bottom! + 4, bottom: flipUp ? window.innerHeight - btnRef.current?.getBoundingClientRect().top! + 4 : undefined, left: btnRef.current?.getBoundingClientRect().right! - 144, background: "var(--bg, #fff)", border: `1px solid color-mix(in srgb, var(--fg-secondary) 15%, transparent)`, boxShadow: `0 10px 30px -5px color-mix(in srgb, var(--fg-primary) 15%, transparent)` }}>
          <button onClick={e => { e.stopPropagation(); setRenaming(true); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: "var(--fg-primary, #1a1a2e)" }}>
            <Edit02Icon size={13} /> Rename
          </button>
          <button onClick={e => { e.stopPropagation(); onAction("pin", thread.id); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: "var(--fg-primary, #1a1a2e)" }}>
            <PinIcon size={13} /> {thread.pinned ? "Unpin" : "Pin"}
          </button>
          <button onClick={e => { e.stopPropagation(); onAction("archive", thread.id); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: "var(--fg-primary, #1a1a2e)" }}>
            <Archive01Icon size={13} /> Archive
          </button>
          <div className="my-1.5" style={{ borderTop: `1px solid color-mix(in srgb, var(--fg-secondary) 15%, transparent)` }} />
          <button onClick={e => { e.stopPropagation(); onAction("delete", thread.id); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-red-500 hover:bg-red-500/10 transition-colors">
            <Delete02Icon size={13} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}


function EmailActionCard({ data }: { data: { to?: string; subject?: string; body?: string } }) {
  const dark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  return <EmailCompose isDark={dark} onClose={() => {}} prefill={data} />;
}

function CalendarActionCard({ data }: { data: { summary?: string; start?: string; end?: string; description?: string; guests?: string[] } }) {
  const dark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  return <CalendarEvent isDark={dark} onClose={() => {}} prefill={data} />;
}

function renderMessageParts(text: string) {
  const blockRegex = /```(email-draft|email-action|calendar-event|calendar-action)\n([\s\S]*?)\n```/g;
  const parts: { type: string, content?: string, data?: any }[] = [];
  let lastIndex = 0;
  let match;

  while ((match = blockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    try {
      const data = JSON.parse(match[2]!);
      parts.push({ type: match[1], data });
    } catch {
      parts.push({ type: "text", content: match[0] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  return parts;
}

function ThreadItem({ thread, active, onSelect, onAction, collapsed, isDark }: { thread: Thread; active: boolean; onSelect: () => void; onAction: (action: string, id: string, data?: any) => void; collapsed?: boolean; isDark: boolean }) {
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(thread.title);
  const tc = (light: string, dark: string) => isDark ? dark : light;

  useEffect(() => { setTitle(thread.title); }, [thread.title]);

  if (renaming && !collapsed) return (
    <div className="px-2 py-1">
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        onBlur={() => { if (title.trim()) onAction("rename", thread.id, title); setRenaming(false); }}
        onKeyDown={e => { if (e.key === "Enter") { if (title.trim()) onAction("rename", thread.id, title); setRenaming(false); } if (e.key === "Escape") { setTitle(thread.title); setRenaming(false); } }}
        className="w-full bg-transparent text-[13px] px-2 py-1.5 rounded outline-none border border-black/10 dark:border-white/10"
        style={{ color: "var(--fg-primary)" }}
        onClick={e => e.stopPropagation()}
      />
    </div>
  );

  return (
    <div className="group flex items-center rounded-lg transition-all duration-200 relative overflow-hidden"
      style={{ backgroundColor: active ? tc("rgba(0,0,0,0.04)", "rgba(255,255,255,0.06)") : undefined }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = tc("rgba(0,0,0,0.02)", "rgba(255,255,255,0.03)"); }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = ""; }}
      onContextMenu={(e) => { e.preventDefault(); setRenaming(false); const menu = e.currentTarget.querySelector("[data-menu-trigger]") as HTMLElement; menu?.click(); }}>
      {active && <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: "var(--accent)" }} />}
      <button onClick={onSelect} className={`flex-1 flex items-center py-2 text-[14px] truncate transition-all ${collapsed ? 'justify-center px-0' : 'gap-2.5 px-3 text-left'}`} style={{ color: active ? "var(--fg-primary, #111)" : "var(--fg-secondary, #777)", fontWeight: active ? 500 : 400 }}>
        {thread.pinned ? <PinIcon size={16} className="shrink-0 opacity-80" /> : (collapsed ? <div className="w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold uppercase shrink-0 transition-colors" style={{ background: active ? "var(--accent)" : tc("rgba(0,0,0,0.05)", "rgba(255,255,255,0.1)"), color: active ? "#fff" : "inherit" }}>{thread.title.charAt(0)}</div> : null)}
        {!collapsed && <span className="truncate">{thread.title}</span>}
      </button>
      {!collapsed && (
        <div className="hidden group-hover:block pr-1">
          <ThreadMenu thread={thread} onAction={onAction} isRenaming={renaming} setRenaming={setRenaming} />
        </div>
      )}
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [greetingMsg, setGreetingMsg] = useState("How can I help you get things done?");
  useEffect(() => {
    const msgs = [
      "What's on your mind today?",
      "How can I help you get things done?",
      "Ready to tackle your day?",
      "What can I do for you today?",
      "Let's get some work done."
    ];
    setGreetingMsg(msgs[Math.floor(Math.random() * msgs.length)]);
  }, []);

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
    setMessages([]); // prevent flash of old messages
    
    fetch(`/api/threads/${activeThread}/messages`, { credentials: "include" })
      .then(r => r.json())
      .then((msgs: any[]) => {
        if (!Array.isArray(msgs) || msgs.length === 0) { setMessages([]); return; }
        setMessages(msgs.map(m => ({ 
          id: m.id, 
          role: m.role, 
          content: m.content, 
          parts: [{ type: "text" as const, text: m.content }] 
        })));
      })
      .catch(() => setMessages([]));
  }, [activeThread]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleThreadAction = async (action: string, id: string, data?: any) => {
    if (action === "delete") {
      setThreads(prev => prev.filter(t => t.id !== id));
      if (activeThread === id) { setActiveThread(null); setMessages([]); setShowChat(false); }
      fetch(`/api/threads/${id}`, { method: "DELETE", credentials: "include" }).catch(console.error);
    } else if (action === "rename") {
      setThreads(prev => prev.map(t => t.id === id ? { ...t, title: data } : t));
      fetch(`/api/threads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ title: data }) }).catch(console.error);
    } else if (action === "pin") {
      const thread = threads.find(t => t.id === id);
      const newPinned = !thread?.pinned;
      setThreads(prev => prev.map(t => t.id === id ? { ...t, pinned: newPinned } : t));
      fetch(`/api/threads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ pinned: newPinned }) }).catch(console.error);
    } else if (action === "archive") {
      setThreads(prev => prev.filter(t => t.id !== id));
      if (activeThread === id) { setActiveThread(null); setMessages([]); setShowChat(false); }
      fetch(`/api/threads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ archived: true }) }).catch(console.error);
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
        activeThreadRef.current = thread.id; // Mutate ref immediately for the transport layer
        setActiveThread(thread.id);
        setShowChat(true);
        sendMessage({ text });
        setInput("");
      });
  };

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [expandedCalendar, setExpandedCalendar] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [expandedInbox, setExpandedInbox] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status !== "ready") return;

    // Dev shortcuts - inject inline cards
    if (input.trim() === "sm") { setShowEmailModal(true); setShowChat(true); setInput(""); return; }
    if (input.trim() === "sc") { setShowCalendarModal(true); setShowChat(true); setInput(""); return; }
    if (input.trim() === "sml") { setShowInbox(true); setShowChat(true); setInput(""); return; }

    if (!activeThread) { startNewChat(); return; }
    sendMessage({ text: input });
    setInput("");
  };

  const tints = isDark
    ? [{ c: "#7B93FF", bg: "#000000" }, { c: "#5DDCCC", bg: "#000000" }, { c: "#FF7BAA", bg: "#000000" }]
    : [{ c: "#4A6FA5", bg: "#f2f6fc" }, { c: "#2D6A4F", bg: "#f0f8f4" }, { c: "#8B5CF6", bg: "#f5f2ff" }];

  const tc = (light: string, dark: string) => isDark ? dark : light;

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: "var(--bg)", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", color: tc("#1c1b1b", "#e0e0e0") }}>
      {/* Premium Mesh Canvas with Top Glow */}
      <div className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000 ${showChat ? 'opacity-[0.04] dark:opacity-[0.06]' : 'opacity-[0.15] dark:opacity-[0.3]'}`}>
        {/* Base Flow */}
        <div className="absolute inset-0"
             style={{ 
               background: `linear-gradient(-45deg, var(--bg), color-mix(in srgb, var(--accent) 30%, var(--bg)), var(--bg), color-mix(in srgb, var(--accent) 15%, var(--bg)))`,
               backgroundSize: "400% 400%",
               animation: "mesh-flow 15s ease infinite"
             }} 
        />
        {/* Subtle Top Glow Overlay */}
        <div className="absolute top-[-20vh] left-0 w-full h-[60vh] mix-blend-screen dark:mix-blend-lighten"
             style={{ 
               background: "radial-gradient(100% 100% at 50% 0%, color-mix(in srgb, var(--accent) 50%, white) 0%, transparent 80%)", 
               animation: "gemini-breathe 8s ease-in-out infinite alternate" 
             }} 
        />
      </div>
      {/* Noise */}
      <div className="fixed inset-0 pointer-events-none z-[1]" style={{ opacity: tc("0.018", "0.025"), backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
      <ConnectModal status={connectStatus} onConnect={openConnectPopup} />

      <aside className="hidden md:flex flex-col fixed top-3 bottom-3 py-4 gap-4 z-50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] rounded-2xl shadow-sm" style={{ width: sidebarOpen ? 260 : 64, left: 12, paddingLeft: sidebarOpen ? 16 : 8, paddingRight: sidebarOpen ? 16 : 8, overflow: "hidden", background: tc("#FAFAFA", "#131417"), border: `1px solid ${tc("rgba(0,0,0,0.06)", "rgba(255,255,255,0.06)")}` }}>
        <div className={`px-1 py-0.5 flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
          {sidebarOpen && <h1 className="text-[20px] font-semibold tracking-tight" style={{ color: tc("#111", "#f0f0f0") }}>Inhumane</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg opacity-40 hover:opacity-80 transition-all hover:bg-black/5 dark:hover:bg-white/5 shrink-0" style={{ color: tc("#333", "#ccc") }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
        </div>

        <button onClick={() => { setActiveThread(null); setShowChat(true); setMessages([]); }} className={`flex items-center w-full py-2.5 rounded-xl text-[14px] font-medium hover:opacity-90 active:scale-[0.97] transition-all shadow-sm ${sidebarOpen ? 'gap-2.5 px-4 justify-start' : 'justify-center'}`} style={{ background: "var(--accent, #111)", color: "#fff", opacity: 1 }}>
          <PlusSignIcon size={16} className="shrink-0" /> {sidebarOpen && "New Thread"}
        </button>

        <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-4" style={{ scrollbarWidth: "none" }}>
          {groupThreadsByDate(threads).map(group => (
            <div key={group.label} className={sidebarOpen ? "mb-4" : "mb-2"}>
              {sidebarOpen && <p className="text-[10px] font-semibold uppercase tracking-[0.06em] px-2 mb-1.5" style={{ color: tc("#aaa", "#555") }}>{group.label}</p>}
              {group.threads.map(t => (
                <ThreadItem key={t.id} thread={t} active={activeThread === t.id} onSelect={() => setActiveThread(t.id)} onAction={handleThreadAction} collapsed={!sidebarOpen} isDark={isDark} />
              ))}
            </div>
          ))}
        </div>

        {/* Profile */}
        <div className="pt-3 pb-1 flex justify-center" style={{ borderTop: `1px solid ${tc("rgba(0,0,0,0.05)", "rgba(255,255,255,0.05)")}` }}>
          {user && (
            <div className={`flex items-center w-full ${sidebarOpen ? 'gap-2.5 px-1' : 'justify-center'}`}>
              {user.image ? <img src={user.image} alt="" className="w-8 h-8 rounded-full shadow-sm shrink-0" /> : <div className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 shrink-0" />}
              {sidebarOpen && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium tracking-tight truncate" style={{ color: tc("#222", "#ddd") }}>{user.name}</p>
                    <p className="text-[12px] truncate" style={{ color: tc("#999", "#555") }}>{user.email}</p>
                  </div>
                  <button onClick={() => { fetch("/api/auth/sign-out", { method: "POST", credentials: "include" }).then(() => { localStorage.removeItem("inhumane-onboarded"); window.location.href = "/"; }); }} className="opacity-30 hover:opacity-70 transition-opacity p-1">
                    <Logout03Icon size={15} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 h-screen flex flex-col relative overflow-hidden z-[2] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]" style={{ marginLeft: sidebarOpen ? 260 + 24 : 64 + 24 }}>
        {/* Accent & Theme Toggles Top Right */}
        <div className="absolute top-4 right-6 z-50 flex items-center gap-4 px-3 py-1.5 rounded-full" style={{ background: tc("rgba(255,255,255,0.5)", "rgba(18,20,28,0.5)"), backdropFilter: "blur(20px)", border: `1px solid ${tc("rgba(0,0,0,0.05)", "rgba(255,255,255,0.05)")}` }}>
          <div className="flex items-center gap-2">
            {tints.map(t => (
              <button key={t.c} onClick={() => { document.documentElement.style.setProperty("--accent", t.c); document.documentElement.style.setProperty("--bg", t.bg); }} className="w-3.5 h-3.5 rounded-full hover:scale-125 active:scale-90 transition-all cursor-pointer shadow-sm" style={{ background: t.c }} />
            ))}
          </div>
          <div className="w-[1px] h-3 opacity-20" style={{ background: tc("#000", "#fff") }} />
          <button onClick={() => { const next = !isDark; setIsDark(next); document.documentElement.classList.toggle("dark", next); document.documentElement.style.setProperty("--bg", next ? "#000000" : "#f2f6fc"); document.documentElement.style.setProperty("--accent", next ? "#7B93FF" : "#4A6FA5"); }} className="w-3.5 h-3.5 rounded-full hover:scale-125 active:scale-90 transition-all cursor-pointer shadow-sm" style={{ background: tc("#111", "#fff") }} />
        </div>
        {/* Expanded inbox overlay */}
        {showInbox && expandedInbox && <EmailInbox isDark={isDark} onClose={() => { setShowInbox(false); setExpandedInbox(false); }} expanded={true} onExpand={() => setExpandedInbox(false)} />}

        {/* Expanded calendar overlay */}
        {showCalendarModal && expandedCalendar && <CalendarFull isDark={isDark} onClose={() => { setShowCalendarModal(false); setExpandedCalendar(false); }} onMinimize={() => setExpandedCalendar(false)} />}

        {!showChat ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 pb-16">
            <div className="w-full max-w-[580px]" style={{ animation: "fadeIn 0.5s ease-out" }}>
              {/* Hero */}
              <div className="mb-10 text-center flex flex-col items-center">
                <h2 className="text-[44px] font-semibold tracking-tight leading-[1.15]" style={{ color: tc("#111", "#fff") }}>
                  Hello, <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, var(--accent), ${tc("#111", "#fff")})` }}>{user?.name ? user.name.split(" ")[0] : "there"}</span>.
                </h2>
                <p className="text-[18px] font-medium tracking-tight mt-4" style={{ color: tc("#666", "#aaa") }}>
                  {greetingMsg}
                </p>
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
              <div className="flex flex-wrap gap-2.5 justify-center mt-6">
                {[{ label: "Read Inbox", icon: Mail01Icon, q: "Show my latest 5 emails" }, { label: "Schedule", icon: Calendar03Icon, q: "What's on my calendar today?" }, { label: "Compose", icon: PencilEdit01Icon, q: "Draft an email" }].map(chip => (
                  <button key={chip.label} onClick={() => startNewChat(chip.q)} className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-medium transition-all hover:scale-[1.02] active:scale-[0.97]" style={{ background: tc("rgba(0,0,0,0.03)", "rgba(255,255,255,0.04)"), border: `1px solid ${tc("rgba(0,0,0,0.05)", "rgba(255,255,255,0.06)")}`, color: tc("#444", "#bbb") }}>
                    <chip.icon size={14} className="opacity-60" />{chip.label}
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
                  <div key={message.id} style={{ animation: "fadeIn 0.2s ease-out" }}>
                    {message.role === "user" ? (
                      <div className="flex justify-end mb-1">
                        <div className="max-w-[75%] rounded-[20px] rounded-br-sm px-4 py-2.5 shadow-sm" style={{ background: tc("rgba(0,0,0,0.05)", "rgba(255,255,255,0.08)"), color: tc("#111", "#e5e5e5") }}>
                          {(message.parts || [{ type: "text" as const, text: message.content }]).map((part, i) => part.type === "text" ? <p key={i} className="text-[15px] leading-relaxed tracking-tight whitespace-pre-wrap">{part.text}</p> : null)}
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3 max-w-[90%] mt-2 mb-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm" style={{ background: tc("rgba(0,0,0,0.05)", "rgba(255,255,255,0.08)") }}>
                          <span className="text-[10px] font-bold tracking-tight" style={{ color: tc("#555", "#aaa") }}>AI</span>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col items-start gap-2">
                          {(message.parts || [{ type: "text" as const, text: message.content }]).map((part, i) => {
                            if (part.type === "text") {
                              const blocks = renderMessageParts(part.text);
                              return blocks.map((b, bi) => {
                                if (b.type === "text" && b.content?.trim()) {
                                  return (
                                    <div key={`${i}-${bi}`} className="rounded-[20px] rounded-tl-sm px-5 py-3.5 shadow-sm" style={{ background: tc("rgba(255,255,255,0.7)", "rgba(26,28,35,0.7)"), backdropFilter: "blur(20px)", border: `1px solid ${tc("rgba(0,0,0,0.04)", "rgba(255,255,255,0.04)")}` }}>
                                      <div className="text-[15px] leading-relaxed tracking-tight whitespace-pre-wrap" style={{ color: tc("#1c1b1b", "#e0e0e0") }}>{b.content.trim()}</div>
                                    </div>
                                  );
                                }
                                if (b.type === "email-draft" || b.type === "email-action") {
                                  return <div key={`${i}-${bi}`} className="w-full max-w-full"><EmailActionCard data={b.data} /></div>;
                                }
                                if (b.type === "calendar-event" || b.type === "calendar-action") {
                                  return <div key={`${i}-${bi}`} className="w-full max-w-full"><CalendarActionCard data={b.data} /></div>;
                                }
                                return null;
                              });
                            }
                            if (part.type.startsWith("tool-")) { const p = part as any; return (<div key={i} className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium tracking-tight rounded-md px-2.5 py-1.5" style={{ background: tc("rgba(0,0,0,0.04)", "rgba(255,255,255,0.06)"), color: tc("#555", "#999") }}><span>⚡</span><span>{p.toolName || "Tool"}</span>{p.state === "result" && <span style={{ color: "var(--accent)" }}>✓</span>}{p.state === "call" && <span className="animate-pulse">…</span>}</div>); }
                            return null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {(status === "submitted" || status === "streaming") && messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex items-center gap-1.5 py-2" style={{ animation: "fadeIn 0.2s ease-out" }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--accent, #999)", animationDelay: "0ms", opacity: 0.5 }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--accent, #999)", animationDelay: "150ms", opacity: 0.5 }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--accent, #999)", animationDelay: "300ms", opacity: 0.5 }} />
                  </div>
                )}
                {showEmailModal && <EmailCompose isDark={isDark} onClose={() => setShowEmailModal(false)} />}
                {showCalendarModal && !expandedCalendar && <CalendarEvent isDark={isDark} onClose={() => setShowCalendarModal(false)} onExpand={() => setExpandedCalendar(true)} />}
                {showInbox && <EmailInbox isDark={isDark} onClose={() => { setShowInbox(false); setExpandedInbox(false); }} expanded={expandedInbox} onExpand={() => setExpandedInbox(!expandedInbox)} />}
                <div ref={messagesEndRef} />
              </div>
            </section>

            <footer className="absolute bottom-0 left-0 w-full px-6 pb-6 pt-10 pointer-events-none z-40" style={{ background: `linear-gradient(to top, var(--bg) 50%, transparent)` }}>
              <div className="max-w-[680px] mx-auto pointer-events-auto">
                <form onSubmit={handleSubmit}>
                  <div className="rounded-2xl p-3 transition-all" style={{ background: tc("rgba(255,255,255,0.75)", "rgba(26,28,35,0.75)"), backdropFilter: "blur(40px) saturate(1.5)", border: `1px solid ${tc("rgba(0,0,0,0.06)", "rgba(255,255,255,0.08)")}`, boxShadow: tc("0 8px 30px rgba(0,0,0,0.06)", "0 8px 30px rgba(0,0,0,0.3)") }}>
                    <textarea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); } }}
                      rows={2}
                      className="w-full text-[15px] placeholder:opacity-40 outline-none resize-none bg-transparent leading-[1.6] tracking-tight px-1"
                      style={{ color: tc("#1c1b1b", "#e5e5e5") }}
                      placeholder="Message Inhumane..."
                      disabled={status !== "ready"}
                    />
                    <div className="flex items-center justify-between mt-1 pt-2">
                      <span className="text-[10px] font-medium tracking-wide px-1" style={{ color: tc("#bbb", "#666") }}>⏎ to send</span>
                      <button type="submit" disabled={status !== "ready" || !input.trim()} className="w-8 h-8 rounded-full text-white flex items-center justify-center disabled:opacity-20 hover:scale-105 active:scale-95 transition-all text-[13px] font-bold shadow-sm" style={{ background: "var(--accent, #111)" }}>↑</button>
                    </div>
                  </div>
                </form>
              </div>
            </footer>
          </>
        )}
      </main>

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes mesh-flow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes gemini-breathe { 0% { transform: scale(1) translateY(0); opacity: 0.5; } 100% { transform: scale(1.05) translateY(2vh); opacity: 0.8; } }
        :root { --accent: #4A6FA5; --bg: #f2f6fc; --fg-primary: #111; --fg-secondary: #777; }
        .dark { --fg-primary: #e5e5e5; --fg-secondary: #999; }
        body { background: var(--bg); -webkit-font-smoothing: antialiased; }
        * { transition: background-color 0.4s ease, border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease; }
      `}</style>
    </div>
  );
}
