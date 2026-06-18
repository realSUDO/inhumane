"use client";
import { useState } from "react";
import { PlusSignIcon, Calendar03Icon } from "hugeicons-react";

function MaximizeIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>;
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
        placeholder={emails.length ? "Add another..." : "Add guests..."}
      />
    </div>
  );
}

export function CalendarEvent({ isDark, onClose, onExpand }: { isDark: boolean; onClose: () => void; onExpand?: () => void }) {
  const tc = (l: string, d: string) => isDark ? d : l;

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }} className="w-full max-w-[600px]">
      <div className="rounded-2xl overflow-hidden" style={{ background: tc("#fff", "#1e2028"), boxShadow: tc("0 4px 24px rgba(0,0,0,0.08)", "0 4px 24px rgba(0,0,0,0.4)"), border: `1px solid ${tc("rgba(0,0,0,0.08)", "rgba(255,255,255,0.08)")}` }}>
        <div className="h-1.5" style={{ background: "var(--accent, #4285f4)" }} />
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <img src="/calendar.png" alt="Calendar" className="w-5 h-5 object-contain" />
            <span className="text-[13px] font-medium" style={{ color: tc("#333", "#ddd") }}>New Event</span>
          </div>
          <div className="flex items-center gap-1.5">
            {onExpand && <button onClick={onExpand} className="p-1.5 rounded-lg" style={{ color: tc("#888", "#777") }} title="Open Calendar"><MaximizeIcon /></button>}
            <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-full hover:opacity-60 transition-opacity text-[16px]" style={{ color: tc("#666", "#999") }}>×</button>
          </div>
        </div>
        <div className="px-5 pb-3">
          <input className="w-full bg-transparent outline-none text-[18px] font-normal" style={{ color: tc("#111", "#eee") }} placeholder="Add title" />
          <div className="h-[2px] mt-2 rounded-full" style={{ background: "var(--accent, #4285f4)" }} />
        </div>
        <div className="px-5 py-3 flex items-center gap-3" style={{ borderTop: `1px solid ${tc("rgba(0,0,0,0.04)", "rgba(255,255,255,0.04)")}` }}>
          <img src="/calendar.png" alt="" className="w-4 h-4 object-contain" />
          <div className="flex items-center gap-2 flex-1">
            <input type="date" className="bg-transparent outline-none text-[13px] px-2 py-1.5 rounded-lg" style={{ color: tc("#111", "#eee"), background: tc("rgba(0,0,0,0.02)", "rgba(255,255,255,0.04)") }} />
            <span style={{ color: tc("#999", "#666") }}>·</span>
            <input type="time" className="bg-transparent outline-none text-[13px] px-2 py-1.5 rounded-lg" style={{ color: tc("#111", "#eee"), background: tc("rgba(0,0,0,0.02)", "rgba(255,255,255,0.04)") }} />
            <span className="text-[12px]" style={{ color: tc("#999", "#666") }}>→</span>
            <input type="time" className="bg-transparent outline-none text-[13px] px-2 py-1.5 rounded-lg" style={{ color: tc("#111", "#eee"), background: tc("rgba(0,0,0,0.02)", "rgba(255,255,255,0.04)") }} />
          </div>
        </div>
        <div className="px-5 py-3 flex items-center gap-3" style={{ borderTop: `1px solid ${tc("rgba(0,0,0,0.04)", "rgba(255,255,255,0.04)")}` }}>
          <PlusSignIcon size={16} style={{ color: tc("#666", "#888") }} />
          <EmailTagInput isDark={isDark} />
        </div>
        <div className="px-5 py-3" style={{ borderTop: `1px solid ${tc("rgba(0,0,0,0.04)", "rgba(255,255,255,0.04)")}` }}>
          <textarea className="w-full bg-transparent outline-none text-[13px] resize-none min-h-[60px] leading-[1.6]" style={{ color: tc("#333", "#ddd") }} placeholder="Add description or notes..." />
        </div>
        <div className="px-5 py-3 flex items-center justify-end gap-3" style={{ borderTop: `1px solid ${tc("rgba(0,0,0,0.06)", "rgba(255,255,255,0.05)")}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-full text-[12px] font-medium hover:opacity-70 transition-opacity" style={{ color: tc("#555", "#aaa") }}>Cancel</button>
          <button className="px-5 py-2 rounded-full text-[12px] font-semibold text-white" style={{ background: "var(--accent, #4285f4)" }}>Save</button>
        </div>
      </div>
    </div>
  );
}
