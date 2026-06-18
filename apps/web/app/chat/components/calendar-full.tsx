"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";

type CalEvent = { id: string; summary?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string }; description?: string; location?: string; colorId?: string };

function MinimizeIcon() { return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/></svg>; }
function ChevLeft() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 18l-6-6 6-6"/></svg>; }
function ChevRight() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>; }

const COLORS: { id: string; hex: string; name: string }[] = [
  { id: "1", hex: "#7986cb", name: "Lavender" },
  { id: "2", hex: "#33b679", name: "Sage" },
  { id: "3", hex: "#8e24aa", name: "Grape" },
  { id: "4", hex: "#e67c73", name: "Flamingo" },
  { id: "5", hex: "#f6bf26", name: "Banana" },
  { id: "6", hex: "#f4511e", name: "Tangerine" },
  { id: "7", hex: "#039be5", name: "Peacock" },
  { id: "8", hex: "#616161", name: "Graphite" },
  { id: "9", hex: "#3f51b5", name: "Blueberry" },
  { id: "10", hex: "#0b8043", name: "Basil" },
  { id: "11", hex: "#d50000", name: "Tomato" },
];
const DEFAULT_COLOR = "#4285f4";
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const CELL_H = 48;

function getWeekStart(date: Date) { const d = new Date(date); d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d; }
function addDays(date: Date, days: number) { const d = new Date(date); d.setDate(d.getDate() + days); return d; }
function getColor(colorId?: string) { return COLORS.find(c => c.id === colorId)?.hex || DEFAULT_COLOR; }

export function CalendarFull({ isDark, onClose, onMinimize }: { isDark: boolean; onClose: () => void; onMinimize: () => void }) {
  const tc = (l: string, d: string) => isDark ? d : l;
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [loading, setLoading] = useState(false);

  // Drag state
  const [dragging, setDragging] = useState<{ day: number; startQ: number; endQ: number } | null>(null);
  const dragRef = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // Popup editor
  const [popup, setPopup] = useState<{ event?: CalEvent; day?: number; startQ?: number; endQ?: number; x: number; y: number } | null>(null);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupDesc, setPopupDesc] = useState("");
  const [popupColor, setPopupColor] = useState("7");

  // Context menu (right-click color)
  const [ctxMenu, setCtxMenu] = useState<{ eventId: string; x: number; y: number } | null>(null);

  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/calendar/events?timeMin=${weekStart.toISOString()}&timeMax=${weekEnd.toISOString()}`, { credentials: "include" });
    if (r.ok) { const d = await r.json(); setEvents(d.events || []); }
    setLoading(false);
  }, [weekStart, weekEnd]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const prevWeek = () => setWeekStart(addDays(weekStart, -7));
  const nextWeek = () => setWeekStart(addDays(weekStart, 7));
  const today = () => setWeekStart(getWeekStart(new Date()));

  // Quarter-hour from mouse Y
  const getQuarter = (clientY: number) => {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    const scrollTop = gridRef.current.scrollTop;
    const y = clientY - rect.top + scrollTop;
    return Math.max(0, Math.floor(y / (CELL_H / 4)));
  };
  const getDay = (clientX: number) => {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    const x = clientX - rect.left - 56;
    const colW = (rect.width - 56) / 7;
    return Math.max(0, Math.min(6, Math.floor(x / colW)));
  };

  // Mouse handlers for drag-to-create
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const day = getDay(e.clientX);
    const q = getQuarter(e.clientY);
    setDragging({ day, startQ: q, endQ: q + 4 }); // default 1 hour
    dragRef.current = true;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current || !dragging) return;
    const q = getQuarter(e.clientY);
    setDragging({ ...dragging, endQ: Math.max(dragging.startQ + 1, q) });
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!dragRef.current || !dragging) return;
    dragRef.current = false;
    const endQ = Math.max(dragging.startQ + 2, dragging.endQ);
    // Open popup
    const rect = gridRef.current?.getBoundingClientRect();
    const colW = rect ? (rect.width - 56) / 7 : 100;
    const px = rect ? rect.left + 56 + dragging.day * colW + colW / 2 : e.clientX;
    const py = rect ? rect.top + (dragging.startQ * CELL_H / 4) - gridRef.current!.scrollTop + 60 : e.clientY;
    setPopup({ day: dragging.day, startQ: dragging.startQ, endQ, x: Math.min(px, window.innerWidth - 340), y: Math.min(py, window.innerHeight - 300) });
    setPopupTitle("");
    setPopupDesc("");
    setPopupColor("7");
    setDragging(null);
  };

  // Save event from popup
  const saveEvent = async () => {
    if (!popup || (!popup.event && popup.day === undefined)) return;
    if (popup.event) {
      // Edit existing
      await fetch(`/api/calendar/events/${popup.event.id}`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ summary: popupTitle || popup.event.summary, description: popupDesc, colorId: popupColor }) });
    } else {
      // Create new
      const day = addDays(weekStart, popup.day!);
      const start = new Date(day); start.setHours(0, popup.startQ! * 15, 0, 0);
      const end = new Date(day); end.setHours(0, popup.endQ! * 15, 0, 0);
      await fetch("/api/calendar/events", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ summary: popupTitle || "Untitled", description: popupDesc, colorId: popupColor, start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() } }) });
    }
    setPopup(null);
    fetchEvents();
  };

  const deleteEvent = async (id: string) => {
    await fetch(`/api/calendar/events/${id}`, { method: "DELETE", credentials: "include" });
    setEvents(prev => prev.filter(e => e.id !== id));
    setPopup(null);
    setCtxMenu(null);
  };

  const changeColor = async (eventId: string, colorId: string) => {
    await fetch(`/api/calendar/events/${eventId}`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ colorId }) });
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, colorId } : e));
    setCtxMenu(null);
  };

  const getEventPosition = (event: CalEvent) => {
    const startStr = event.start?.dateTime || event.start?.date;
    const endStr = event.end?.dateTime || event.end?.date;
    if (!startStr) return null;
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : new Date(start.getTime() + 3600000);
    const dayIdx = start.getDay();
    const startMin = start.getHours() * 60 + start.getMinutes();
    const endMin = end.getHours() * 60 + end.getMinutes();
    return { dayIdx, top: (startMin / 60) * CELL_H, height: Math.max(((endMin - startMin) / 60) * CELL_H, 20) };
  };

  const formatTime = (q: number) => { const h = Math.floor(q / 4); const m = (q % 4) * 15; return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };
  const monthYear = weekStart.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="absolute inset-0 z-30 flex flex-col" style={{ background: tc("#fff", "#111317"), animation: "fadeIn 0.15s ease-out" }} onClick={() => { setCtxMenu(null); }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 shrink-0" style={{ borderBottom: `1px solid ${tc("#dadce0", "rgba(255,255,255,0.06)")}` }}>
        <img src="/calendar.png" alt="Calendar" className="w-6 h-6 object-contain" />
        <span className="text-[16px] font-medium mr-4" style={{ color: tc("#333", "#eee") }}>Calendar</span>
        <button onClick={today} className="px-3 py-1 rounded text-[12px] font-medium border" style={{ borderColor: tc("#dadce0", "rgba(255,255,255,0.12)"), color: tc("#555", "#ccc") }}>Today</button>
        <button onClick={prevWeek} className="p-1 rounded" style={{ color: tc("#555", "#aaa") }}><ChevLeft /></button>
        <button onClick={nextWeek} className="p-1 rounded" style={{ color: tc("#555", "#aaa") }}><ChevRight /></button>
        <span className="text-[14px] font-normal" style={{ color: tc("#333", "#eee") }}>{monthYear}</span>
        <div className="flex-1" />
        <button onClick={onMinimize} className="p-2 rounded-full" style={{ color: tc("#555", "#aaa") }}><MinimizeIcon /></button>
        <button onClick={onClose} className="p-2 rounded-full text-[16px]" style={{ color: tc("#555", "#aaa") }}>×</button>
      </div>

      {/* Day headers */}
      <div className="flex shrink-0" style={{ borderBottom: `1px solid ${tc("#dadce0", "rgba(255,255,255,0.06)")}`, paddingLeft: 56 }}>
        {Array.from({ length: 7 }, (_, i) => {
          const day = addDays(weekStart, i);
          const isToday = day.toDateString() === new Date().toDateString();
          return (
            <div key={i} className="flex-1 text-center py-1.5">
              <div className="text-[10px] font-medium tracking-wide" style={{ color: isToday ? tc("#1a73e8", "#8ab4f8") : tc("#70757a", "#999") }}>{DAY_NAMES[i]}</div>
              <div className={`text-[22px] w-10 h-10 flex items-center justify-center mx-auto rounded-full leading-none`} style={{ background: isToday ? tc("#1a73e8", "#8ab4f8") : "transparent", color: isToday ? "#fff" : tc("#333", "#eee") }}>{day.getDate()}</div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div ref={gridRef} className="flex-1 overflow-y-auto relative select-none" style={{ scrollbarWidth: "thin" }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
        <div className="relative" style={{ height: 24 * CELL_H }}>
          {/* Hour labels + lines */}
          {HOURS.map(h => (
            <div key={h}>
              <div className="absolute left-0 w-[56px] text-right pr-2 text-[10px] -mt-[6px]" style={{ top: h * CELL_H, color: tc("#70757a", "#666") }}>
                {h === 0 ? "" : `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`}
              </div>
              <div className="absolute left-[56px] right-0" style={{ top: h * CELL_H, borderTop: `1px solid ${tc("#dadce0", "rgba(255,255,255,0.05)")}` }} />
            </div>
          ))}
          {/* Day column borders */}
          <div className="absolute left-[56px] right-0 top-0 bottom-0 flex pointer-events-none">
            {Array.from({ length: 7 }, (_, i) => <div key={i} className="flex-1" style={{ borderLeft: i > 0 ? `1px solid ${tc("#dadce0", "rgba(255,255,255,0.05)")}` : "none" }} />)}
          </div>

          {/* Drag preview */}
          {dragging && (
            <div className="absolute rounded-[4px] pointer-events-none opacity-70" style={{ left: `calc(56px + ${dragging.day} * ((100% - 56px) / 7) + 2px)`, top: dragging.startQ * (CELL_H / 4), height: Math.max((dragging.endQ - dragging.startQ) * (CELL_H / 4), 12), width: `calc((100% - 56px) / 7 - 4px)`, background: getColor(popupColor) }} />
          )}

          {/* Events */}
          {events.map(event => {
            const pos = getEventPosition(event);
            if (!pos) return null;
            const color = getColor(event.colorId);
            return (
              <div key={event.id} className="absolute rounded-[4px] px-2 py-1 overflow-hidden cursor-pointer group" style={{ left: `calc(56px + ${pos.dayIdx} * ((100% - 56px) / 7) + 2px)`, top: pos.top, height: pos.height, width: `calc((100% - 56px) / 7 - 4px)`, background: color, color: "#fff", fontSize: 11 }}
                onClick={e => { e.stopPropagation(); setPopup({ event, x: Math.min(e.clientX, window.innerWidth - 340), y: Math.min(e.clientY, window.innerHeight - 300) }); setPopupTitle(event.summary || ""); setPopupDesc(event.description || ""); setPopupColor(event.colorId || "7"); }}
                onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setCtxMenu({ eventId: event.id, x: e.clientX, y: e.clientY }); }}>
                <div className="font-medium truncate leading-tight">{event.summary || "(No title)"}</div>
                {pos.height > 30 && <div className="text-[10px] opacity-80">{new Date(event.start?.dateTime || "").toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – {new Date(event.end?.dateTime || "").toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event popup editor */}
      {popup && (
        <div className="fixed z-50" style={{ left: popup.x, top: popup.y }} onClick={e => e.stopPropagation()}>
          <div className="w-[320px] rounded-lg shadow-2xl overflow-hidden" style={{ background: tc("#fff", "#2a2d35"), border: `1px solid ${tc("#dadce0", "rgba(255,255,255,0.1)")}` }}>
            <div className="h-1" style={{ background: getColor(popupColor) }} />
            <div className="p-4">
              <input autoFocus value={popupTitle} onChange={e => setPopupTitle(e.target.value)} className="w-full bg-transparent outline-none text-[16px] font-normal mb-1" style={{ color: tc("#222", "#eee"), borderBottom: `2px solid ${tc("#dadce0", "rgba(255,255,255,0.1)")}` }} placeholder="Add title" onKeyDown={e => { if (e.key === "Enter") saveEvent(); }} />
              {/* Time display */}
              <div className="mt-3 text-[12px]" style={{ color: tc("#70757a", "#999") }}>
                {popup.event ? (
                  <>{new Date(popup.event.start?.dateTime || "").toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} – {new Date(popup.event.end?.dateTime || "").toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</>
                ) : popup.day !== undefined ? (
                  <>{addDays(weekStart, popup.day).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })} · {formatTime(popup.startQ!)} – {formatTime(popup.endQ!)}</>
                ) : null}
              </div>
              {/* Description */}
              <textarea value={popupDesc} onChange={e => setPopupDesc(e.target.value)} className="w-full mt-3 bg-transparent outline-none text-[12px] resize-none min-h-[40px]" style={{ color: tc("#555", "#ccc") }} placeholder="Add description" />
              {/* Color picker */}
              <div className="mt-3 flex items-center gap-1.5">
                {COLORS.map(c => (
                  <button key={c.id} onClick={() => setPopupColor(c.id)} className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: c.hex, border: popupColor === c.id ? "2px solid #fff" : "none", boxShadow: popupColor === c.id ? `0 0 0 2px ${c.hex}` : "none" }} title={c.name} />
                ))}
              </div>
            </div>
            {/* Actions */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${tc("#eee", "rgba(255,255,255,0.06)")}` }}>
              <div className="flex gap-2">
                {popup.event && <button onClick={() => deleteEvent(popup.event!.id)} className="text-[12px] font-medium px-3 py-1.5 rounded" style={{ color: tc("#d93025", "#f28b82") }}>Delete</button>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPopup(null)} className="text-[12px] font-medium px-3 py-1.5 rounded" style={{ color: tc("#5f6368", "#aaa") }}>Cancel</button>
                <button onClick={saveEvent} className="text-[12px] font-medium px-4 py-1.5 rounded text-white" style={{ background: tc("#1a73e8", "#8ab4f8") }}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Right-click color context menu */}
      {ctxMenu && (
        <div className="fixed z-50 rounded-lg shadow-xl py-2 px-1" style={{ left: ctxMenu.x, top: ctxMenu.y, background: tc("#fff", "#2a2d35"), border: `1px solid ${tc("#dadce0", "rgba(255,255,255,0.1)")}` }} onClick={e => e.stopPropagation()}>
          <div className="px-3 py-1 text-[11px] font-medium" style={{ color: tc("#70757a", "#999") }}>Event color</div>
          <div className="flex flex-wrap gap-1.5 px-3 py-2 max-w-[180px]">
            {COLORS.map(c => (
              <button key={c.id} onClick={() => changeColor(ctxMenu.eventId, c.id)} className="w-6 h-6 rounded-full hover:scale-110 transition-transform" style={{ background: c.hex }} title={c.name} />
            ))}
          </div>
          <div className="border-t mx-2 my-1" style={{ borderColor: tc("#eee", "rgba(255,255,255,0.06)") }} />
          <button onClick={() => deleteEvent(ctxMenu.eventId)} className="w-full text-left px-3 py-1.5 text-[12px] rounded hover:bg-black/5" style={{ color: tc("#d93025", "#f28b82") }}>Delete event</button>
        </div>
      )}
    </div>
  );
}
