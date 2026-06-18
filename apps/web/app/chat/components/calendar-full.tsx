"use client";
import { useState, useEffect, useMemo } from "react";
import { Calendar03Icon, Menu01Icon, PlusSignIcon } from "hugeicons-react";

type CalEvent = { id: string; summary?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string }; description?: string; location?: string; colorId?: string };

function MinimizeIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/></svg>;
}
function ChevLeft() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 18l-6-6 6-6"/></svg>; }
function ChevRight() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>; }

const COLORS = ["#4285f4", "#7986cb", "#33b679", "#8e24aa", "#e67c73", "#f6bf26", "#f4511e", "#039be5", "#616161", "#3f51b5", "#0b8043", "#d50000"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function getWeekStart(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function CalendarFull({ isDark, onClose, onMinimize }: { isDark: boolean; onClose: () => void; onMinimize: () => void }) {
  const tc = (l: string, d: string) => isDark ? d : l;
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<{ day: number; hour: number } | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/calendar/events?timeMin=${weekStart.toISOString()}&timeMax=${weekEnd.toISOString()}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : { events: [] })
      .then(d => setEvents(d.events || []))
      .finally(() => setLoading(false));
  }, [weekStart]);

  const prevWeek = () => setWeekStart(addDays(weekStart, -7));
  const nextWeek = () => setWeekStart(addDays(weekStart, 7));
  const today = () => setWeekStart(getWeekStart(new Date()));

  const getEventPosition = (event: CalEvent) => {
    const startStr = event.start?.dateTime || event.start?.date;
    const endStr = event.end?.dateTime || event.end?.date;
    if (!startStr) return null;
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : new Date(start.getTime() + 3600000);
    const dayIdx = start.getDay();
    const startHour = start.getHours() + start.getMinutes() / 60;
    const duration = (end.getTime() - start.getTime()) / 3600000;
    return { dayIdx, startHour, duration: Math.max(duration, 0.5) };
  };

  const createEvent = async () => {
    if (!creating || !newTitle.trim()) { setCreating(null); setNewTitle(""); return; }
    const day = addDays(weekStart, creating.day);
    const start = new Date(day); start.setHours(creating.hour, 0, 0, 0);
    const end = new Date(start); end.setHours(creating.hour + 1);
    await fetch("/api/calendar/events", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary: newTitle, start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() } })
    });
    setCreating(null); setNewTitle("");
    // Refetch
    const r = await fetch(`/api/calendar/events?timeMin=${weekStart.toISOString()}&timeMax=${weekEnd.toISOString()}`, { credentials: "include" });
    if (r.ok) { const d = await r.json(); setEvents(d.events || []); }
  };

  const deleteEvent = async (id: string) => {
    await fetch(`/api/calendar/events/${id}`, { method: "DELETE", credentials: "include" });
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const monthYear = weekStart.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="absolute inset-0 z-30 flex flex-col" style={{ background: tc("#fff", "#111317"), animation: "fadeIn 0.15s ease-out" }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 shrink-0" style={{ borderBottom: `1px solid ${tc("#e0e0e0", "rgba(255,255,255,0.06)")}` }}>
        <img src="/calendar.png" alt="Calendar" className="w-6 h-6 object-contain" />
        <span className="text-[16px] font-medium mr-4" style={{ color: tc("#333", "#eee") }}>Calendar</span>
        <button onClick={today} className="px-3 py-1 rounded text-[12px] font-medium border" style={{ borderColor: tc("#ddd", "rgba(255,255,255,0.12)"), color: tc("#555", "#ccc") }}>Today</button>
        <button onClick={prevWeek} className="p-1 rounded" style={{ color: tc("#555", "#aaa") }}><ChevLeft /></button>
        <button onClick={nextWeek} className="p-1 rounded" style={{ color: tc("#555", "#aaa") }}><ChevRight /></button>
        <span className="text-[14px] font-medium" style={{ color: tc("#333", "#eee") }}>{monthYear}</span>
        <div className="flex-1" />
        <button onClick={onMinimize} className="p-2 rounded-full" style={{ color: tc("#555", "#aaa") }}><MinimizeIcon /></button>
        <button onClick={onClose} className="p-2 rounded-full text-[16px]" style={{ color: tc("#555", "#aaa") }}>×</button>
      </div>

      {/* Day headers */}
      <div className="flex shrink-0" style={{ borderBottom: `1px solid ${tc("#e0e0e0", "rgba(255,255,255,0.06)")}`, paddingLeft: 56 }}>
        {Array.from({ length: 7 }, (_, i) => {
          const day = addDays(weekStart, i);
          const isToday = day.toDateString() === new Date().toDateString();
          return (
            <div key={i} className="flex-1 text-center py-2">
              <div className="text-[10px] font-medium" style={{ color: isToday ? tc("#1a73e8", "#8ab4f8") : tc("#666", "#999") }}>{DAY_NAMES[i]}</div>
              <div className={`text-[22px] w-10 h-10 flex items-center justify-center mx-auto rounded-full ${isToday ? "text-white" : ""}`} style={{ background: isToday ? tc("#1a73e8", "#8ab4f8") : "transparent", color: isToday ? "#fff" : tc("#333", "#eee") }}>{day.getDate()}</div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto relative" style={{ scrollbarWidth: "thin" }}>
        <div className="relative" style={{ minHeight: 24 * 48 }}>
          {/* Hour labels */}
          {HOURS.map(h => (
            <div key={h} className="absolute left-0 w-[56px] text-right pr-2 text-[10px]" style={{ top: h * 48, color: tc("#999", "#666") }}>
              {h === 0 ? "" : `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`}
            </div>
          ))}
          {/* Grid lines */}
          {HOURS.map(h => (
            <div key={h} className="absolute left-[56px] right-0" style={{ top: h * 48, borderTop: `1px solid ${tc("rgba(0,0,0,0.06)", "rgba(255,255,255,0.04)")}` }} />
          ))}
          {/* Day columns */}
          <div className="absolute left-[56px] right-0 top-0 bottom-0 flex">
            {Array.from({ length: 7 }, (_, dayIdx) => (
              <div key={dayIdx} className="flex-1 relative" style={{ borderLeft: `1px solid ${tc("rgba(0,0,0,0.06)", "rgba(255,255,255,0.04)")}` }}>
                {/* Click to create */}
                {HOURS.map(h => (
                  <div key={h} className="absolute left-0 right-0 cursor-pointer hover:bg-blue-50/30" style={{ top: h * 48, height: 48 }} onClick={() => setCreating({ day: dayIdx, hour: h })} />
                ))}
              </div>
            ))}
          </div>
          {/* Events */}
          {events.map(event => {
            const pos = getEventPosition(event);
            if (!pos) return null;
            const color = event.colorId ? COLORS[parseInt(event.colorId) - 1] || COLORS[0] : COLORS[0];
            return (
              <div key={event.id} className="absolute rounded px-1.5 py-0.5 overflow-hidden cursor-pointer group" style={{ left: `calc(56px + ${pos.dayIdx} * ((100% - 56px) / 7) + 2px)`, top: pos.startHour * 48, height: Math.max(pos.duration * 48 - 2, 18), width: `calc((100% - 56px) / 7 - 4px)`, background: color, fontSize: 11, color: "#fff", lineHeight: "1.3" }}>
                <div className="font-medium truncate">{event.summary || "(No title)"}</div>
                {pos.duration > 0.75 && <div className="text-[10px] opacity-80 truncate">{new Date(event.start?.dateTime || "").toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div>}
                <button onClick={e => { e.stopPropagation(); deleteEvent(event.id); }} className="absolute top-0.5 right-1 opacity-0 group-hover:opacity-100 text-white/80 hover:text-white text-[12px]">×</button>
              </div>
            );
          })}
          {/* Inline create */}
          {creating && (
            <div className="absolute rounded px-2 py-1 z-10 shadow-lg" style={{ left: `calc(56px + ${creating.day} * ((100% - 56px) / 7) + 2px)`, top: creating.hour * 48, width: `calc((100% - 56px) / 7 - 4px)`, height: 46, background: tc("#1a73e8", "#8ab4f8") }}>
              <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => { if (e.key === "Enter") createEvent(); if (e.key === "Escape") { setCreating(null); setNewTitle(""); } }} onBlur={createEvent} className="w-full bg-transparent text-white text-[12px] font-medium outline-none placeholder:text-white/60" placeholder="New event" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
