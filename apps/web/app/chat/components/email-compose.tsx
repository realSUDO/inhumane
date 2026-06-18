"use client";
import { useState } from "react";

function SendArrowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M5 4.5L19 12L5 19.5L9.5 12L5 4.5Z" />
      <path d="M9.5 12H19" />
    </svg>
  );
}

function EmailTagInput({ isDark, initial }: { isDark: boolean; initial?: string[] }) {
  const [emails, setEmails] = useState<string[]>(initial || []);
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

export function EmailCompose({ isDark, onClose, prefill, onSuccess, completed }: { isDark: boolean; onClose: () => void; prefill?: { to?: string; subject?: string; body?: string }; onSuccess?: () => void; completed?: boolean }) {
  const tc = (l: string, d: string) => isDark ? d : l;
  const [subject, setSubject] = useState(prefill?.subject || "");
  const [body, setBody] = useState(prefill?.body || "");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(completed || false);
  const [error, setError] = useState<string | null>(null);
  const toRef = { current: prefill?.to ? [prefill.to] : [] };

  const handleSend = async () => {
    setSending(true);
    setError(null);
    const res = await fetch("/api/send-email", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ to: toRef.current[0] || prefill?.to, subject, body }) });
    if (res.ok) { 
      setSent(true); 
      onSuccess?.(); 
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to send email");
    }
    setSending(false);
  };

  if (sent) return (
    <div className="flex items-center gap-2 py-1.5 opacity-70" style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: "var(--accent, #1a73e8)" }}>
        <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth={2.5}><path d="M2 6l3 3 5-5"/></svg>
      </div>
      <span className="text-[12px]" style={{ color: tc("#555", "#aaa") }}>Sent to {prefill?.to}</span>
    </div>
  );

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }} className="max-w-[500px]">
      <div className="rounded-2xl overflow-hidden" style={{ background: tc("#fff", "#1e2028"), boxShadow: tc("0 4px 24px rgba(0,0,0,0.08)", "0 4px 24px rgba(0,0,0,0.4)"), border: `1px solid ${tc("rgba(0,0,0,0.08)", "rgba(255,255,255,0.08)")}` }}>
        <div className="flex items-center justify-between px-4 py-2.5" style={{ background: tc("#f8f9fa", "#282a34"), borderBottom: `1px solid ${tc("rgba(0,0,0,0.06)", "rgba(255,255,255,0.05)")}` }}>
          <div className="flex items-center gap-2">
            <img src="/gmail.png" alt="Gmail" className="w-4 h-4" />
            <span className="text-[12px] font-medium" style={{ color: tc("#444", "#ccc") }}>New Message</span>
          </div>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-full hover:opacity-60 transition-opacity text-[14px]" style={{ color: tc("#666", "#999") }}>×</button>
        </div>
        <div className="px-4 py-2 flex items-center gap-3" style={{ borderBottom: `1px solid ${tc("rgba(0,0,0,0.04)", "rgba(255,255,255,0.04)")}` }}>
          <span className="text-[12px]" style={{ color: tc("#777", "#888") }}>To</span>
          <EmailTagInput isDark={isDark} initial={prefill?.to ? [prefill.to] : undefined} />
        </div>
        <div className="px-4 py-2" style={{ borderBottom: `1px solid ${tc("rgba(0,0,0,0.04)", "rgba(255,255,255,0.04)")}` }}>
          <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-transparent outline-none text-[13px]" style={{ color: tc("#111", "#eee") }} placeholder="Subject" />
        </div>
        <div className="px-4 py-3">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            className="w-full min-h-[160px] p-4 bg-transparent outline-none text-[14px] resize-none"
            style={{ color: tc("#222", "#eee") }}
            placeholder="Write something..."
          />
        </div>
        
        {error && (
          <div className="px-4 py-2 mx-4 mt-2 text-[12px] rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-3" style={{ background: tc("#f8f9fa", "#1e2028"), borderTop: `1px solid ${tc("rgba(0,0,0,0.06)", "rgba(255,255,255,0.05)")}` }}>
          <button onClick={onClose} className="text-[12px] px-3 py-1.5 rounded-lg hover:opacity-70 transition-opacity" style={{ color: tc("#666", "#888") }}>Discard</button>
          <button onClick={handleSend} disabled={sending} className="px-5 py-2 rounded-full text-[12px] font-semibold text-white flex items-center gap-1.5" style={{ background: "#1a73e8" }}>
            <SendArrowIcon /> {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
