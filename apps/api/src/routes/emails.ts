import { Router } from "express";
import { corsair } from "../corsair";
import { auth } from "@repo/auth";
import { fromNodeHeaders } from "better-auth/node";
import { cache } from "../cache";
import pLimit from "p-limit";
import { z } from "zod";

export const emailsRouter = Router();

const querySchema = z.object({
  maxResults: z.coerce.number().min(1).max(50).default(20),
  pageToken: z.string().optional(),
  label: z.string().default("INBOX"),
});

// GET /api/emails?pageToken=...&maxResults=20&label=INBOX
emailsRouter.get("/", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Invalid query", details: parsed.error.issues }); return; }
  const { maxResults, pageToken, label } = parsed.data;

  try {
    const tenant = corsair.withTenant(session.user.id);
    const listParams: any = { maxResults };
    if (pageToken) listParams.pageToken = pageToken;

    // Check cache
    const cacheKey = cache.emailsKey(session.user.id, label, pageToken || "1");
    let cached = await cache.get<any>(cacheKey);
    const blockedIds = await cache.getBlockedIds(session.user.id);
    
    if (cached) { 
      if (blockedIds.length > 0) {
        cached.emails = cached.emails.filter((m: any) => !blockedIds.includes(m.id));
      }
      res.json(cached); 
      return; 
    }

    // Use q param for filtering - more reliable across wrappers
    if (label === "INBOX") listParams.q = "in:inbox";
    else if (label === "SENT") listParams.q = "in:sent";
    else if (label === "STARRED") listParams.q = "is:starred";
    else if (label === "DRAFT") listParams.q = "in:drafts";
    else if (label === "TRASH") { listParams.q = "in:trash"; listParams.includeSpamTrash = true; }
    else if (label === "SPAM") { listParams.q = "in:spam"; listParams.includeSpamTrash = true; }
    else listParams.labelIds = [label];

    const list = await tenant.gmail.api.messages.list(listParams);
    const messages = list.messages || [];

    // Fetch full details for each message
    const limit = pLimit(5);
    const detailed = await Promise.all(
      messages.map((m: any) => limit(async () => {
        const full = await tenant.gmail.api.messages.get({ id: m.id });
        const headers = full.payload?.headers || [];
        const getHeader = (name: string) => headers.find((h: any) => h.name === name)?.value || "";

        // Decode body
        let body = "";
        if (full.payload?.body?.data) {
          body = Buffer.from(full.payload.body.data, "base64url").toString("utf-8");
        } else if (full.payload?.parts) {
          const textPart = full.payload.parts.find((p: any) => p.mimeType === "text/plain");
          if (textPart?.body?.data) {
            body = Buffer.from(textPart.body.data, "base64url").toString("utf-8");
          } else {
            const htmlPart = full.payload.parts.find((p: any) => p.mimeType === "text/html");
            if (htmlPart?.body?.data) {
              body = Buffer.from(htmlPart.body.data, "base64url").toString("utf-8");
            }
          }
        }

        return {
          id: full.id,
          threadId: full.threadId,
          snippet: full.snippet,
          from: getHeader("From"),
          to: getHeader("To"),
          subject: getHeader("Subject"),
          date: getHeader("Date"),
          body,
          labelIds: full.labelIds || [],
          unread: (full.labelIds || []).includes("UNREAD"),
        };
      }))
    );

    // Filter out optimistically blocked emails
    const filteredDetailed = blockedIds.length > 0 
      ? detailed.filter(m => !blockedIds.includes(m.id))
      : detailed;

    res.json({
      emails: filteredDetailed,
      nextPageToken: list.nextPageToken || null,
    });
    // Cache result
    await cache.set(cacheKey, { emails: detailed, nextPageToken: list.nextPageToken || null }, cache.TTL.emails);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch emails" });
  }
});

// GET /api/emails/:id - get single email
emailsRouter.get("/:id", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const tenant = corsair.withTenant(session.user.id);
    const full = await tenant.gmail.api.messages.get({ id: req.params.id });
    const headers = full.payload?.headers || [];
    const getHeader = (name: string) => headers.find((h: any) => h.name === name)?.value || "";

    let body = "";
    if (full.payload?.body?.data) {
      body = Buffer.from(full.payload.body.data, "base64url").toString("utf-8");
    } else if (full.payload?.parts) {
      const textPart = full.payload.parts.find((p: any) => p.mimeType === "text/plain");
      if (textPart?.body?.data) body = Buffer.from(textPart.body.data, "base64url").toString("utf-8");
    }

    res.json({
      id: full.id,
      threadId: full.threadId,
      snippet: full.snippet,
      from: getHeader("From"),
      to: getHeader("To"),
      subject: getHeader("Subject"),
      date: getHeader("Date"),
      body,
      labelIds: full.labelIds || [],
      unread: (full.labelIds || []).includes("UNREAD"),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch email" });
  }
});

// POST /api/emails/:id/trash
emailsRouter.post("/:id/trash", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    await cache.blockId(session.user.id, req.params.id);
    const tenant = corsair.withTenant(session.user.id);
    await tenant.gmail.api.messages.trash({ id: req.params.id });
    await cache.delPattern(`emails:${session.user.id}:*`);
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/emails/:id/untrash
emailsRouter.post("/:id/untrash", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const tenant = corsair.withTenant(session.user.id);
    await tenant.gmail.api.messages.untrash({ id: req.params.id });
    await cache.delPattern(`emails:${session.user.id}:*`);
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

const modifyEmailSchema = z.object({
  addLabelIds: z.array(z.string()).optional(),
  removeLabelIds: z.array(z.string()).optional(),
});

// POST /api/emails/:id/modify - add/remove labels (star, archive, etc)
emailsRouter.post("/:id/modify", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const parsed = modifyEmailSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid body", details: parsed.error.issues }); return; }
    
    const tenant = corsair.withTenant(session.user.id);
    const { addLabelIds, removeLabelIds } = parsed.data;
    await tenant.gmail.api.messages.modify({ id: req.params.id, addLabelIds, removeLabelIds });
    await cache.delPattern(`emails:${session.user.id}:*`);
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
