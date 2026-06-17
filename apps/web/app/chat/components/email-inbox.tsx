"use client";

const MOCK_EMAILS = [
  { id: "1", from: "Sarah Chen", email: "sarah@company.com", subject: "Q3 Product Roadmap Review", snippet: "Hey, wanted to share the updated roadmap for next quarter. Let me know your thoughts on the timeline...", time: "10:32 AM", unread: true },
  { id: "2", from: "GitHub", email: "notifications@github.com", subject: "[corsair] PR #142 merged", snippet: "Your pull request has been merged into main. The deployment pipeline will run shortly...", time: "9:15 AM", unread: true },
  { id: "3", from: "David Park", email: "david@startup.io", subject: "Re: Partnership proposal", snippet: "Thanks for sending over the deck. We reviewed it internally and have a few questions...", time: "Yesterday", unread: false },
  { id: "4", from: "Google Calendar", email: "calendar@google.com", subject: "Reminder: Team standup in 30 min", snippet: "Your event 'Team Standup' starts at 11:00 AM. Join with Google Meet...", time: "Yesterday", unread: false },
  { id: "5", from: "Stripe", email: "receipts@stripe.com", subject: "Payment receipt for $49.00", snippet: "Your payment of $49.00 to Vercel Inc. was successful. Transaction ID: pi_3N...", time: "Jun 15", unread: false },
];

export function EmailInbox({ isDark, onClose }: { isDark: boolean; onClose: () => void }) {
  const tc = (l: string, d: string) => isDark ? d : l;

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }} className="w-full max-w-[620px]">
      <div className="rounded-2xl overflow-hidden" style={{ background: tc("#fff", "#1e2028"), boxShadow: tc("0 4px 24px rgba(0,0,0,0.08)", "0 4px 24px rgba(0,0,0,0.4)"), border: `1px solid ${tc("rgba(0,0,0,0.08)", "rgba(255,255,255,0.08)")}` }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3" style={{ background: tc("#f8f9fa", "#282a34"), borderBottom: `1px solid ${tc("rgba(0,0,0,0.06)", "rgba(255,255,255,0.05)")}` }}>
          <div className="flex items-center gap-2.5">
            <img src="/gmail.svg" alt="Gmail" className="w-4 h-4" />
            <span className="text-[13px] font-medium" style={{ color: tc("#333", "#ddd") }}>Inbox</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: tc("rgba(0,0,0,0.05)", "rgba(255,255,255,0.08)"), color: tc("#666", "#999") }}>5</span>
          </div>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-full hover:opacity-60 transition-opacity text-[14px]" style={{ color: tc("#666", "#999") }}>×</button>
        </div>

        {/* Email List */}
        <div className="divide-y" style={{ borderColor: tc("rgba(0,0,0,0.04)", "rgba(255,255,255,0.04)") }}>
          {MOCK_EMAILS.map(mail => (
            <div key={mail.id} className="flex items-start gap-3 px-5 py-3 cursor-pointer transition-colors" style={{ background: mail.unread ? tc("rgba(66,133,244,0.03)", "rgba(107,138,255,0.04)") : "transparent" }} onMouseEnter={e => (e.currentTarget.style.background = tc("rgba(0,0,0,0.02)", "rgba(255,255,255,0.02)"))} onMouseLeave={e => (e.currentTarget.style.background = mail.unread ? tc("rgba(66,133,244,0.03)", "rgba(107,138,255,0.04)") : "transparent")}>
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-semibold" style={{ background: tc("rgba(0,0,0,0.06)", "rgba(255,255,255,0.08)"), color: tc("#555", "#aaa") }}>
                {mail.from[0]}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={`text-[13px] truncate ${mail.unread ? "font-semibold" : "font-normal"}`} style={{ color: tc("#111", "#eee") }}>{mail.from}</span>
                  <span className="text-[11px] shrink-0" style={{ color: tc("#999", "#666") }}>{mail.time}</span>
                </div>
                <p className={`text-[12px] truncate ${mail.unread ? "font-medium" : "font-normal"}`} style={{ color: tc("#333", "#ccc") }}>{mail.subject}</p>
                <p className="text-[11px] truncate mt-0.5" style={{ color: tc("#888", "#777") }}>{mail.snippet}</p>
              </div>
              {/* Unread dot */}
              {mail.unread && <div className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ background: "var(--accent, #4285f4)" }} />}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 flex items-center justify-between" style={{ borderTop: `1px solid ${tc("rgba(0,0,0,0.06)", "rgba(255,255,255,0.05)")}`, background: tc("#f8f9fa", "#282a34") }}>
          <span className="text-[11px]" style={{ color: tc("#999", "#666") }}>Showing latest 5 emails</span>
          <button className="text-[11px] font-medium" style={{ color: "var(--accent, #4285f4)" }}>Open Gmail →</button>
        </div>
      </div>
    </div>
  );
}
