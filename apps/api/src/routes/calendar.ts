import { Router } from "express";
import { corsair } from "../corsair";
import { auth } from "@repo/auth";
import { fromNodeHeaders } from "better-auth/node";
import { cache } from "../cache";
import { z } from "zod";

export const calendarRouter = Router();

const getEventsSchema = z.object({
  timeMin: z.string().datetime(),
  timeMax: z.string().datetime(),
});

// GET /api/calendar/events?timeMin=...&timeMax=...
calendarRouter.get("/events", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = getEventsSchema.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Invalid query", details: parsed.error.issues }); return; }
  const { timeMin, timeMax } = parsed.data;

  try {
    const cacheKey = cache.calendarKey(session.user.id, timeMin, timeMax);
    let cached = await cache.get<any>(cacheKey);
    const blockedIds = await cache.getBlockedIds(session.user.id);

    if (cached) { 
      if (blockedIds.length > 0) {
        cached.events = cached.events.filter((e: any) => !blockedIds.includes(e.id));
      }
      res.json(cached); 
      return; 
    }

    const tenant = corsair.withTenant(session.user.id);
    const result = await tenant.googlecalendar.api.events.getMany({ timeMin, timeMax, singleEvents: true, orderBy: "startTime" });
    const data = { events: result.items || [] };
    await cache.set(cacheKey, data, cache.TTL.calendar);
    
    if (blockedIds.length > 0) {
      data.events = data.events.filter((e: any) => !blockedIds.includes(e.id));
    }
    
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const createEventSchema = z.object({
  summary: z.string().optional(),
  description: z.string().optional(),
  start: z.any(),
  end: z.any(),
  attendees: z.array(z.any()).optional(),
}).passthrough();

// POST /api/calendar/events - create event
calendarRouter.post("/events", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid body", details: parsed.error.issues }); return; }

    const usage = await cache.getUsage(session.user.id, "actions");
    if (usage >= 20) {
      res.status(403).json({ error: "Thanks for Testing the beta! You've finished your free trial, see you in full launch." });
      return;
    }
    await cache.incrementUsage(session.user.id, "actions");

    const tenant = corsair.withTenant(session.user.id);
    const eventData = { ...parsed.data };
    // Ensure timeZone is set for Google Calendar API
    if (eventData.start?.dateTime && !eventData.start.timeZone) eventData.start.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (eventData.end?.dateTime && !eventData.end.timeZone) eventData.end.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const event = await tenant.googlecalendar.api.events.create({ event: eventData });
    await cache.delPattern(`cal:${session.user.id}:*`);
    res.json(event);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/calendar/events/:id
calendarRouter.delete("/events/:id", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    await cache.blockId(session.user.id, req.params.id);
    const tenant = corsair.withTenant(session.user.id);
    await tenant.googlecalendar.api.events.delete({ id: req.params.id });
    await cache.delPattern(`cal:${session.user.id}:*`);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/calendar/events/:id - update event
calendarRouter.put("/events/:id", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid body", details: parsed.error.issues }); return; }

    const tenant = corsair.withTenant(session.user.id);
    const event = await tenant.googlecalendar.api.events.update({ id: req.params.id, event: parsed.data });
    await cache.delPattern(`cal:${session.user.id}:*`);
    res.json(event);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
