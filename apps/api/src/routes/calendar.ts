import { Router } from "express";
import { corsair } from "../corsair";
import { auth } from "@repo/auth";
import { fromNodeHeaders } from "better-auth/node";

export const calendarRouter = Router();

// GET /api/calendar/events?timeMin=...&timeMax=...
calendarRouter.get("/events", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const timeMin = req.query.timeMin as string;
  const timeMax = req.query.timeMax as string;

  if (!timeMin || !timeMax) { res.status(400).json({ error: "timeMin and timeMax required" }); return; }

  try {
    const tenant = corsair.withTenant(session.user.id);
    const result = await tenant.googlecalendar.api.events.getMany({ timeMin, timeMax, singleEvents: true, orderBy: "startTime" });
    res.json({ events: result.items || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/calendar/events - create event
calendarRouter.post("/events", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const tenant = corsair.withTenant(session.user.id);
    const event = await tenant.googlecalendar.api.events.create({ event: req.body });
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
    const tenant = corsair.withTenant(session.user.id);
    await tenant.googlecalendar.api.events.delete({ id: req.params.id });
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
    const tenant = corsair.withTenant(session.user.id);
    const event = await tenant.googlecalendar.api.events.update({ id: req.params.id, event: req.body });
    res.json(event);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
