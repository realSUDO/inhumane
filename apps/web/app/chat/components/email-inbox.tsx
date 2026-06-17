"use client";
import { useState, useEffect, useRef, useCallback } from "react";

type Email = { id: string; threadId: string; from: string; to: string; subject: string; snippet: string; date: string; body: string; unread: boolean };

function MaximizeIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>;
}
function MinimizeIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/></svg>;
}
function BackIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>;
}

export function EmailInbox({ isDark, onClose, expanded, onExpand }: { isDark: boolean; onClose: () => void; expanded?: boolean; onExpand?: () => void }) {
  const tc = (l: string, d: string) => isDark ? d : l;
  const [emails, setEmails] = useState<Email[]>([]);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [openEmail, setOpenEmail] = useState<Email | null>(null);
  const [activeLabel, setActiveLabel] = useState("INBOX");
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchEmails = useCallback(async (pageToken?: string) => {
    if (loading) return;
    setLoading(true);
    const url = pageToken ? `/api/emails?maxResults=15&label=${activeLabel}&pageToken=${pageToken}` : `/api/emails?maxResults=15&label=${activeLabel}`;
    const res = await fetch(url, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setEmails(prev => pageToken ? [...prev, ...data.emails] : data.emails);
      setNextPage(data.nextPageToken);
    }
    setLoading(false);
  }, [loading, activeLabel]);

  useEffect(() => { fetchEmails(); }, [activeLabel]);

  // Infinite scroll
  const handleScroll = () => {
    if (!scrollRef.current || !nextPage || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollHeight - scrollTop - clientHeight < 200) fetchEmails(nextPage);
  };

  const formatDate = (d: string) => {
    try { const date = new Date(d); const now = new Date(); return date.toDateString() === now.toDateString() ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : date.toLocaleDateString([], { month: "short", day: "numeric" }); } catch { return d; }
  };

  const extractName = (from: string) => from.replace(/<.*>/, "").trim().replace(/"/g, "") || from;

  // Email detail view
  if (openEmail) {
    return (
      <div className={expanded ? "absolute inset-0 z-30 flex flex-col" : "w-full max-w-[620px]"} style={{ background: tc("#fff", "#161b22"), animation: "fadeIn 0.2s ease-out", ...(expanded ? {} : { borderRadius: "16px", border: `1px solid ${tc("rgba(0,0,0,0.08)", "rgba(255,255,255,0.08)")}`, boxShadow: tc("0 4px 24px rgba(0,0,0,0.08)", "0 4px 24px rgba(0,0,0,0.4)"), overflow: "hidden" }) }}>
        <div className="flex items-center gap-3 px-5 py-3 shrink-0" style={{ borderBottom: `1px solid ${tc("#e0e0e0", "rgba(255,255,255,0.06)")}` }}>
          <button onClick={() => setOpenEmail(null)} className="p-1.5 rounded-lg" style={{ color: tc("#555", "#aaa") }}><BackIcon /></button>
          <span className="text-[13px] font-medium truncate flex-1" style={{ color: tc("#222", "#eee") }}>{openEmail.subject}</span>
          <button onClick={onClose} className="text-[16px] opacity-40 hover:opacity-80">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarWidth: "thin" }}>
          <h2 className="text-[20px] font-normal mb-4" style={{ color: tc("#222", "#eee") }}>{openEmail.subject}</h2>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold" style={{ background: tc("#e0e0e0", "rgba(255,255,255,0.08)"), color: tc("#555", "#aaa") }}>{extractName(openEmail.from)[0]}</div>
            <div>
              <p className="text-[13px] font-medium" style={{ color: tc("#222", "#eee") }}>{extractName(openEmail.from)}</p>
              <p className="text-[11px]" style={{ color: tc("#777", "#888") }}>to me · {formatDate(openEmail.date)}</p>
            </div>
          </div>
          <div className="text-[14px] leading-[1.8] whitespace-pre-wrap" style={{ color: tc("#333", "#ddd") }}>{openEmail.body || openEmail.snippet}</div>
        </div>
      </div>
    );
  }

  // Expanded full view
  if (expanded) {
    return (
      <div className="absolute inset-0 z-30 flex" style={{ background: tc("#f6f8fc", "#0d1117"), animation: "fadeIn 0.2s ease-out" }}>
        {/* Gmail Sidebar */}
        <div className="w-[200px] shrink-0 flex flex-col py-3" style={{ background: tc("#f6f8fc", "#0d1117") }}>
          <div className="px-3 mb-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-medium" style={{ background: tc("#c2e7ff", "rgba(130,180,255,0.15)"), color: tc("#001d35", "#8ab4f8") }}>
              <span className="text-[16px]">✏️</span> Compose
            </button>
          </div>
          {[
            { label: "INBOX", name: "Inbox", icon: "📥", count: emails.filter(m => m.unread).length },
            { label: "STARRED", name: "Starred", icon: "⭐", count: 0 },
            { label: "SENT", name: "Sent", icon: "📤", count: 0 },
            { label: "DRAFT", name: "Drafts", icon: "📝", count: 0 },
            { label: "TRASH", name: "Trash", icon: "🗑️", count: 0 },
            { label: "SPAM", name: "Spam", icon: "⚠️", count: 0 },
          ].map(item => (
            <button key={item.label} onClick={() => { setActiveLabel(item.label); setEmails([]); setNextPage(null); }} className={`w-full flex items-center gap-3 px-6 py-2 text-[13px] text-left rounded-r-full transition-colors ${activeLabel === item.label ? "font-semibold" : ""}`} style={{ background: activeLabel === item.label ? tc("rgba(0,0,0,0.04)", "rgba(255,255,255,0.04)") : "transparent", color: activeLabel === item.label ? tc("#1a73e8", "#8ab4f8") : tc("#444", "#ccc") }}>
              <span className="text-[14px]">{item.icon}</span>
              <span className="flex-1">{item.name}</span>
              {item.count > 0 && <span className="text-[11px] font-semibold">{item.count}</span>}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ borderLeft: `1px solid ${tc("#e0e0e0", "rgba(255,255,255,0.06)")}` }}>
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 shrink-0" style={{ background: tc("#fff", "#161b22"), borderBottom: `1px solid ${tc("#e0e0e0", "rgba(255,255,255,0.06)")}` }}>
            <div className="flex items-center gap-3">
              <img src="/gmail.png" alt="Gmail" className="w-6 h-6 object-contain" />
              <div className="flex items-center rounded-full overflow-hidden" style={{ background: tc("#eaf1fb", "rgba(255,255,255,0.06)") }}>
                <input className="w-[300px] px-4 py-1.5 bg-transparent outline-none text-[13px]" style={{ color: tc("#222", "#eee") }} placeholder="Search mail" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onExpand} className="p-2 rounded-full" style={{ color: tc("#555", "#aaa") }}><MinimizeIcon /></button>
              <button onClick={onClose} className="p-2 rounded-full text-[16px]" style={{ color: tc("#555", "#aaa") }}>×</button>
            </div>
          </div>

          {/* Email list */}
          <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
            {emails.map(mail => (
              <div key={mail.id} onClick={() => setOpenEmail(mail)} className="flex items-center px-2 cursor-pointer group" style={{ borderBottom: `1px solid ${tc("rgba(0,0,0,0.04)", "rgba(255,255,255,0.03)")}`, background: mail.unread ? tc("#fff", "rgba(255,255,255,0.02)") : tc("#f6f8fc", "#0d1117") }} onMouseEnter={e => (e.currentTarget.style.background = tc("#f2f6fc", "rgba(255,255,255,0.03)"))} onMouseLeave={e => (e.currentTarget.style.background = mail.unread ? tc("#fff", "rgba(255,255,255,0.02)") : tc("#f6f8fc", "#0d1117"))}>
                <div className="w-10 flex items-center justify-center shrink-0"><input type="checkbox" className="w-3.5 h-3.5 rounded opacity-50" onClick={e => e.stopPropagation()} /></div>
                <div className="w-8 flex items-center justify-center shrink-0"><span className="text-[14px] opacity-30 hover:opacity-80 cursor-pointer" onClick={e => { e.stopPropagation(); fetch(`/api/emails/${mail.id}/modify`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ addLabelIds: ["STARRED"] }) }); }}>☆</span></div>
                <div className="w-[160px] shrink-0 px-2 py-2.5"><span className={`text-[13px] truncate block ${mail.unread ? "font-semibold" : ""}`} style={{ color: tc("#222", "#eee") }}>{extractName(mail.from)}</span></div>
                <div className="flex-1 min-w-0 flex items-center gap-1.5 px-2 py-2.5">
                  <span className={`text-[13px] shrink-0 ${mail.unread ? "font-semibold" : ""}`} style={{ color: tc("#222", "#ddd") }}>{mail.subject || "(no subject)"}</span>
                  <span className="text-[13px] truncate" style={{ color: tc("#777", "#666") }}>— {mail.snippet}</span>
                </div>
                {/* Hover actions */}
                <div className="hidden group-hover:flex items-center gap-1 px-2">
                  <button onClick={e => { e.stopPropagation(); fetch(`/api/emails/${mail.id}/modify`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ removeLabelIds: ["INBOX"] }) }).then(() => setEmails(prev => prev.filter(m => m.id !== mail.id))); }} className="p-1 rounded opacity-50 hover:opacity-100 text-[12px]" title="Archive">📦</button>
                  <button onClick={e => { e.stopPropagation(); fetch(`/api/emails/${mail.id}/trash`, { method: "POST", credentials: "include" }).then(() => setEmails(prev => prev.filter(m => m.id !== mail.id))); }} className="p-1 rounded opacity-50 hover:opacity-100 text-[12px]" title="Delete">🗑️</button>
                </div>
                <div className="w-[70px] shrink-0 px-2 py-2.5 text-right group-hover:hidden"><span className={`text-[11px] ${mail.unread ? "font-semibold" : ""}`} style={{ color: mail.unread ? tc("#222", "#eee") : tc("#777", "#888") }}>{formatDate(mail.date)}</span></div>
              </div>
            ))}
            {loading && <div className="py-4 text-center text-[12px]" style={{ color: tc("#999", "#666") }}>Loading...</div>}
          </div>
        </div>
      </div>
    );
  }

  // Compact inline card
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
        <div className="divide-y" style={{ borderColor: tc("rgba(0,0,0,0.04)", "rgba(255,255,255,0.04)") }}>
          {(emails.length ? emails.slice(0, 5) : [{id:"0",from:"",subject:"",snippet:"Loading...",date:"",body:"",threadId:"",to:"",unread:false}]).map(mail => (
            <div key={mail.id} onClick={() => mail.from && setOpenEmail(mail)} className="flex items-start gap-3 px-5 py-3 cursor-pointer" style={{ background: mail.unread ? tc("rgba(66,133,244,0.03)", "rgba(107,138,255,0.04)") : "transparent" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-semibold" style={{ background: tc("rgba(0,0,0,0.06)", "rgba(255,255,255,0.08)"), color: tc("#555", "#aaa") }}>{extractName(mail.from)[0] || "·"}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={`text-[13px] truncate ${mail.unread ? "font-semibold" : ""}`} style={{ color: tc("#111", "#eee") }}>{extractName(mail.from) || "..."}</span>
                  <span className="text-[11px] shrink-0" style={{ color: tc("#999", "#666") }}>{formatDate(mail.date)}</span>
                </div>
                <p className={`text-[12px] truncate ${mail.unread ? "font-medium" : ""}`} style={{ color: tc("#333", "#ccc") }}>{mail.subject || "..."}</p>
                <p className="text-[11px] truncate mt-0.5" style={{ color: tc("#888", "#777") }}>{mail.snippet}</p>
              </div>
              {mail.unread && <div className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ background: "var(--accent, #4285f4)" }} />}
            </div>
          ))}
        </div>
        <div className="px-5 py-2.5 flex items-center justify-between" style={{ borderTop: `1px solid ${tc("rgba(0,0,0,0.06)", "rgba(255,255,255,0.05)")}`, background: tc("#f8f9fa", "#282a34") }}>
          <span className="text-[11px]" style={{ color: tc("#999", "#666") }}>{emails.length ? `${emails.length} emails` : "Loading..."}</span>
          <button onClick={onExpand} className="text-[11px] font-medium" style={{ color: "var(--accent, #4285f4)" }}>View all →</button>
        </div>
      </div>
    </div>
  );
}
