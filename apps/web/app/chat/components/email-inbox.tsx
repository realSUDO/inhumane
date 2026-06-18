"use client";
import { useState, useEffect, useRef } from "react";
import { InboxIcon, StarIcon, SentIcon, Delete02Icon, Edit02Icon, Alert01Icon, Menu01Icon, Mail01Icon, Archive01Icon } from "hugeicons-react";
import { EmailCompose } from "./email-compose";

type Email = { id: string; threadId: string; from: string; to: string; subject: string; snippet: string; date: string; body: string; unread: boolean; labelIds: string[] };

function MaximizeIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>;
}
function MinimizeIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/></svg>;
}
function BackIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>;
}

const LABELS = [
  { id: "INBOX", name: "Inbox", Icon: InboxIcon },
  { id: "STARRED", name: "Starred", Icon: StarIcon },
  { id: "SENT", name: "Sent", Icon: SentIcon },
  { id: "DRAFT", name: "Drafts", Icon: Edit02Icon },
  { id: "TRASH", name: "Trash", Icon: Delete02Icon },
  { id: "SPAM", name: "Spam", Icon: Alert01Icon },
];

export function EmailInbox({ isDark, onClose, expanded, onExpand }: { isDark: boolean; onClose: () => void; expanded?: boolean; onExpand?: () => void }) {
  const tc = (l: string, d: string) => isDark ? d : l;
  const [emails, setEmails] = useState<Email[]>([]);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [openEmail, setOpenEmail] = useState<Email | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [activeLabel, setActiveLabel] = useState("INBOX");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const fetchEmails = async (label: string, pageToken?: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    const params = new URLSearchParams({ maxResults: "20", label });
    if (pageToken) params.set("pageToken", pageToken);
    const res = await fetch(`/api/emails?${params}`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setEmails(prev => pageToken ? [...prev, ...data.emails] : data.emails);
      setNextPage(data.nextPageToken);
    }
    setLoading(false);
    loadingRef.current = false;
  };

  useEffect(() => { setEmails([]); setNextPage(null); fetchEmails(activeLabel); }, [activeLabel]);

  const handleScroll = () => {
    if (!scrollRef.current || !nextPage || loadingRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollHeight - scrollTop - clientHeight < 200) fetchEmails(activeLabel, nextPage!);
  };

  const formatDate = (d: string) => {
    try { const date = new Date(d); const now = new Date(); return date.toDateString() === now.toDateString() ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : date.toLocaleDateString([], { month: "short", day: "numeric" }); } catch { return d; }
  };
  const extractName = (from: string) => from.replace(/<.*>/, "").trim().replace(/"/g, "") || from;

  const doAction = async (id: string, action: "trash" | "archive" | "star" | "unstar" | "read" | "unread") => {
    // Optimistic UI update first
    if (action === "trash" || action === "archive") {
      setEmails(prev => prev.filter(m => m.id !== id));
    } else if (action === "star") {
      setEmails(prev => prev.map(m => m.id === id ? { ...m, labelIds: [...m.labelIds, "STARRED"] } : m));
    } else if (action === "unstar") {
      setEmails(prev => prev.map(m => m.id === id ? { ...m, labelIds: m.labelIds.filter(l => l !== "STARRED") } : m));
    } else if (action === "read") {
      setEmails(prev => prev.map(m => m.id === id ? { ...m, unread: false } : m));
    } else if (action === "unread") {
      setEmails(prev => prev.map(m => m.id === id ? { ...m, unread: true } : m));
    }

    let url = `/api/emails/${id}/`;
    let body: any = undefined;
    if (action === "trash") { url += "trash"; }
    else if (action === "archive") { url += "modify"; body = { removeLabelIds: ["INBOX"] }; }
    else if (action === "star") { url += "modify"; body = { addLabelIds: ["STARRED"] }; }
    else if (action === "unstar") { url += "modify"; body = { removeLabelIds: ["STARRED"] }; }
    else if (action === "read") { url += "modify"; body = { removeLabelIds: ["UNREAD"] }; }
    else if (action === "unread") { url += "modify"; body = { addLabelIds: ["UNREAD"] }; }
    fetch(url, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
  };

  // Email detail view helper
  const renderDetailView = () => (
    <div className={expanded ? "flex-1 flex flex-col h-full bg-white dark:bg-[#161b22]" : "w-full max-w-[620px] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.12)] bg-white dark:bg-[#161b22] overflow-hidden"} style={{ ...(expanded ? {} : { border: `1px solid ${tc("rgba(0,0,0,0.08)", "rgba(255,255,255,0.08)")}` }), animation: "fadeIn 0.15s ease-out" }}>
      {/* Header Toolbar */}
      <div className={`flex items-center gap-2 px-4 py-2 shrink-0 ${expanded ? 'border-b' : ''}`} style={{ borderColor: tc("rgba(0,0,0,0.06)", "rgba(255,255,255,0.06)") }}>
        <button onClick={() => { setOpenEmail(null); setIsReplying(false); }} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: tc("#555", "#aaa") }}><BackIcon /></button>
        <div className="flex-1" />
        <button onClick={() => doAction(openEmail!.id, "archive")} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors" title="Archive" style={{ color: tc("#555", "#aaa") }}><Archive01Icon size={18} /></button>
        <button onClick={() => doAction(openEmail!.id, "trash")} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors" title="Delete" style={{ color: tc("#555", "#aaa") }}><Delete02Icon size={18} /></button>
        <button onClick={() => doAction(openEmail!.id, openEmail!.labelIds.includes("STARRED") ? "unstar" : "star")} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors" title="Star" style={{ color: openEmail!.labelIds.includes("STARRED") ? "#f4b400" : tc("#555", "#aaa") }}><StarIcon size={18} /></button>
      </div>
      
      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 md:px-12 md:py-8" style={{ scrollbarWidth: "thin" }}>
        {/* Subject */}
        <h1 className="text-[22px] md:text-[24px] font-normal mb-6 leading-tight flex items-center flex-wrap gap-3" style={{ color: tc("#111", "#eee") }}>
          {openEmail!.subject || "(no subject)"}
          {openEmail!.labelIds.includes("INBOX") && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md" style={{ background: tc("rgba(0,0,0,0.05)", "rgba(255,255,255,0.1)"), color: tc("#555", "#ccc") }}>Inbox</span>}
        </h1>
        
        {/* Sender Info */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] text-white font-medium shrink-0 shadow-sm" style={{ background: tc("#4285f4", "#3b82f6") }}>{extractName(openEmail!.from)[0]}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[14px] font-bold" style={{ color: tc("#222", "#ddd") }}>{extractName(openEmail!.from)}</span>
              <span className="text-[12px] truncate hidden sm:inline" style={{ color: tc("#777", "#888") }}>&lt;{openEmail!.from.match(/<([^>]+)>/)?.[1] || openEmail!.from}&gt;</span>
            </div>
            <div className="text-[12px] flex items-center gap-1" style={{ color: tc("#666", "#888") }}>
              to {openEmail!.to ? extractName(openEmail!.to) : "me"} 
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 9l6 6 6-6"/></svg>
            </div>
          </div>
          <div className="text-[12px] mt-1 whitespace-nowrap" style={{ color: tc("#666", "#888") }}>{formatDate(openEmail!.date)}</div>
        </div>
        
        {/* Email Content */}
        <div className="text-[14px] leading-relaxed max-w-[800px]" style={{ color: tc("#222", "#ddd") }}>
          {openEmail!.body?.includes("<") ? (
            <div dangerouslySetInnerHTML={{ __html: openEmail!.body }} className="email-body [&_a]:underline [&_a]:text-[color:var(--accent,#1a73e8)] [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-4" />
          ) : (
            <p className="whitespace-pre-wrap">{(openEmail!.body || openEmail!.snippet).replace(/(https?:\/\/[^\s]+)/g, '|||LINK:$1|||').split('|||').map((part, i) => part.startsWith('LINK:') ? <a key={i} href={part.slice(5)} target="_blank" rel="noopener noreferrer" className="underline break-all" style={{ color: "var(--accent, #1a73e8)" }}>{part.slice(5)}</a> : part)}</p>
          )}
        </div>
        
        {/* Reply Action */}
        <div className="mt-10 pt-6">
          {isReplying ? (
            <div className="rounded-2xl border bg-white dark:bg-[#1a1c23] shadow-sm mb-4" style={{ borderColor: tc("rgba(0,0,0,0.1)", "rgba(255,255,255,0.1)") }}>
               <EmailCompose isDark={isDark} onClose={() => setIsReplying(false)} prefill={{ to: openEmail!.from.match(/<([^>]+)>/)?.[1] || openEmail!.from, subject: openEmail!.subject.startsWith('Re:') ? openEmail!.subject : `Re: ${openEmail!.subject}` }} />
            </div>
          ) : (
            <button onClick={() => setIsReplying(true)} className="px-6 py-2.5 rounded-full border text-[14px] font-medium transition-colors flex items-center gap-2" style={{ borderColor: tc("rgba(0,0,0,0.1)", "rgba(255,255,255,0.1)"), color: tc("#444", "#ccc") }} onMouseEnter={e => e.currentTarget.style.background = tc("rgba(0,0,0,0.03)", "rgba(255,255,255,0.03)")} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 10h10a8 8 0 0 1 8 8v2M3 10l6 6M3 10l6-6"/></svg>
              Reply
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Compact inline card when detail view is open
  if (openEmail && !expanded) {
    return renderDetailView();
  }

  // Expanded full view
  if (expanded) {
    return (
      <div className="absolute inset-0 z-[60] flex" style={{ background: tc("#f6f8fc", "#0d1117"), animation: "fadeIn 0.15s ease-out" }}>
        {/* Sidebar - slides */}
        <div className="shrink-0 flex flex-col pt-2 transition-all duration-200 overflow-hidden" style={{ width: sidebarOpen ? 220 : 0, background: tc("#f6f8fc", "#0d1117") }}>
          {LABELS.map(({ id, name, Icon }) => (
            <button key={id} onClick={() => { setActiveLabel(id); }} className="flex items-center gap-3 mx-2 px-4 py-2 rounded-r-full text-[13px] text-left transition-colors" style={{ background: activeLabel === id ? tc("rgba(26,115,232,0.08)", "rgba(138,180,248,0.1)") : "transparent", color: activeLabel === id ? tc("#1a73e8", "#8ab4f8") : tc("#444", "#ccc"), fontWeight: activeLabel === id ? 600 : 400 }}>
              <Icon size={18} style={{ color: activeLabel === id ? tc("#1a73e8", "#8ab4f8") : tc("#666", "#999") }} />
              <span>{name}</span>
            </button>
          ))}
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ borderLeft: sidebarOpen ? `1px solid ${tc("#e0e0e0", "rgba(255,255,255,0.05)")}` : "none" }}>
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-3 py-2 shrink-0" style={{ background: tc("#fff", "#161b22"), borderBottom: `1px solid ${tc("#e0e0e0", "rgba(255,255,255,0.06)")}` }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-full" style={{ color: tc("#444", "#bbb") }}><Menu01Icon size={18} /></button>
            <img src="/gmail.png" alt="Gmail" className="w-6 h-6 object-contain" />
            <div className="flex-1 flex items-center rounded-full" style={{ background: tc("#eaf1fb", "rgba(255,255,255,0.05)") }}>
              <input className="w-full max-w-[400px] px-4 py-1.5 bg-transparent outline-none text-[13px]" style={{ color: tc("#222", "#eee") }} placeholder="Search mail" />
            </div>
            <button onClick={onExpand} className="p-2 rounded-full" style={{ color: tc("#555", "#aaa") }}><MinimizeIcon /></button>
            <button onClick={onClose} className="p-2 rounded-full text-[16px]" style={{ color: tc("#555", "#aaa") }}>×</button>
          </div>

          {/* Main Content (Email rows OR Email detail) */}
          {openEmail ? renderDetailView() : (
            <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
              {emails.length === 0 && !loading && <div className="py-12 text-center text-[13px]" style={{ color: tc("#999", "#666") }}>No emails</div>}
              {emails.map(mail => (
                <div key={mail.id} onClick={() => { setOpenEmail(mail); setIsReplying(false); }} className="flex items-center px-1 cursor-pointer group" style={{ borderBottom: `1px solid ${tc("rgba(0,0,0,0.04)", "rgba(255,255,255,0.03)")}`, background: mail.unread ? tc("#fff", "rgba(255,255,255,0.02)") : tc("#f6f8fc", "#0d1117") }} onMouseEnter={e => (e.currentTarget.style.background = tc("#f2f6fc", "rgba(255,255,255,0.04)"))} onMouseLeave={e => (e.currentTarget.style.background = mail.unread ? tc("#fff", "rgba(255,255,255,0.02)") : tc("#f6f8fc", "#0d1117"))}>
                  <div className="w-9 flex items-center justify-center shrink-0"><input type="checkbox" className="w-3.5 h-3.5 opacity-40" onClick={e => e.stopPropagation()} /></div>
                  <div className="w-7 flex items-center justify-center shrink-0 cursor-pointer" onClick={e => { e.stopPropagation(); doAction(mail.id, mail.labelIds.includes("STARRED") ? "unstar" : "star"); }}><StarIcon size={14} style={{ color: mail.labelIds.includes("STARRED") ? "#f4b400" : tc("#ccc", "#555") }} /></div>
                  <div className="w-[160px] shrink-0 px-2 py-2"><span className={`text-[13px] truncate block ${mail.unread ? "font-bold" : ""}`} style={{ color: tc("#222", "#eee") }}>{extractName(mail.from)}</span></div>
                  <div className="flex-1 min-w-0 flex items-center gap-1 px-2 py-2">
                    <span className={`text-[13px] shrink-0 max-w-[40%] truncate ${mail.unread ? "font-bold" : ""}`} style={{ color: tc("#222", "#ddd") }}>{mail.subject || "(no subject)"}</span>
                    <span className="text-[13px] truncate" style={{ color: tc("#666", "#555") }}>— {mail.snippet}</span>
                  </div>
                  {/* Hover actions */}
                  <div className="hidden group-hover:flex items-center gap-0.5 pr-2">
                    <button onClick={e => { e.stopPropagation(); doAction(mail.id, "archive"); }} className="p-1.5 rounded-full" style={{ color: tc("#666", "#999") }} title="Archive"><Archive01Icon size={14} /></button>
                    <button onClick={e => { e.stopPropagation(); doAction(mail.id, "trash"); }} className="p-1.5 rounded-full" style={{ color: tc("#666", "#999") }} title="Delete"><Delete02Icon size={14} /></button>
                    <button onClick={e => { e.stopPropagation(); doAction(mail.id, mail.unread ? "read" : "unread"); }} className="p-1.5 rounded-full" style={{ color: tc("#666", "#999") }} title={mail.unread ? "Mark read" : "Mark unread"}><Mail01Icon size={14} /></button>
                  </div>
                  <div className="w-[65px] shrink-0 px-2 py-2 text-right group-hover:hidden"><span className={`text-[11px] ${mail.unread ? "font-bold" : ""}`} style={{ color: mail.unread ? tc("#222", "#eee") : tc("#777", "#888") }}>{formatDate(mail.date)}</span></div>
                </div>
              ))}
              {loading && <div className="py-4 text-center text-[12px]" style={{ color: tc("#999", "#666") }}>Loading...</div>}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Compact inline card (unchanged)
  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }} className="w-full max-w-[620px]">
      <div className="rounded-2xl overflow-hidden" style={{ background: tc("#fff", "#1e2028"), boxShadow: tc("0 4px 24px rgba(0,0,0,0.08)", "0 4px 24px rgba(0,0,0,0.4)"), border: `1px solid ${tc("rgba(0,0,0,0.08)", "rgba(255,255,255,0.08)")}` }}>
        <div className="flex items-center justify-between px-5 py-3" style={{ background: tc("#f8f9fa", "#282a34"), borderBottom: `1px solid ${tc("rgba(0,0,0,0.06)", "rgba(255,255,255,0.05)")}` }}>
          <div className="flex items-center gap-2.5">
            <img src="/gmail.png" alt="Gmail" className="w-4 h-4 object-contain" />
            <span className="text-[13px] font-medium" style={{ color: tc("#333", "#ddd") }}>Inbox</span>
            {emails.length > 0 && <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: tc("rgba(0,0,0,0.05)", "rgba(255,255,255,0.08)"), color: tc("#666", "#999") }}>{emails.filter(m => m.unread).length}</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={onExpand} className="p-1.5 rounded-lg" style={{ color: tc("#888", "#777") }} title="Expand"><MaximizeIcon /></button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-[14px]" style={{ color: tc("#666", "#999") }}>×</button>
          </div>
        </div>
        <div>
          {(emails.length ? emails.slice(0, 5) : []).map(mail => (
            <div key={mail.id} onClick={() => { setOpenEmail(mail); setIsReplying(false); }} className="flex items-start gap-3 px-5 py-3 cursor-pointer" style={{ borderBottom: `1px solid ${tc("rgba(0,0,0,0.04)", "rgba(255,255,255,0.04)")}`, background: mail.unread ? tc("rgba(66,133,244,0.03)", "rgba(107,138,255,0.04)") : "transparent" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-semibold" style={{ background: tc("rgba(0,0,0,0.06)", "rgba(255,255,255,0.08)"), color: tc("#555", "#aaa") }}>{extractName(mail.from)[0] || "·"}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={`text-[13px] truncate ${mail.unread ? "font-semibold" : ""}`} style={{ color: tc("#111", "#eee") }}>{extractName(mail.from)}</span>
                  <span className="text-[11px] shrink-0" style={{ color: tc("#999", "#666") }}>{formatDate(mail.date)}</span>
                </div>
                <p className={`text-[12px] truncate ${mail.unread ? "font-medium" : ""}`} style={{ color: tc("#333", "#ccc") }}>{mail.subject}</p>
                <p className="text-[11px] truncate mt-0.5" style={{ color: tc("#888", "#777") }}>{mail.snippet}</p>
              </div>
              {mail.unread && <div className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ background: "var(--accent, #4285f4)" }} />}
            </div>
          ))}
          {emails.length === 0 && <div className="py-6 text-center text-[12px]" style={{ color: tc("#999", "#666") }}>{loading ? "Loading..." : "No emails"}</div>}
        </div>
        <div className="px-5 py-2.5 flex items-center justify-between" style={{ borderTop: `1px solid ${tc("rgba(0,0,0,0.06)", "rgba(255,255,255,0.05)")}`, background: tc("#f8f9fa", "#282a34") }}>
          <span className="text-[11px]" style={{ color: tc("#999", "#666") }}>{emails.length} emails</span>
          <button onClick={onExpand} className="text-[11px] font-medium" style={{ color: "var(--accent, #4285f4)" }}>View all →</button>
        </div>
      </div>
    </div>
  );
}
