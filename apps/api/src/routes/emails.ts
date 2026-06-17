import { Router } from "express";
import { corsair } from "../corsair";
import { auth } from "@repo/auth";
import { fromNodeHeaders } from "better-auth/node";

export const emailsRouter = Router();

// GET /api/emails?pageToken=...&maxResults=20&label=INBOX
emailsRouter.get("/", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const maxResults = parseInt(req.query.maxResults as string) || 20;
  const pageToken = req.query.pageToken as string | undefined;
  const label = (req.query.label as string) || "INBOX";

  try {
    const tenant = corsair.withTenant(session.user.id);
    const listParams: any = { maxResults, labelIds: [label] };
    if (pageToken) listParams.pageToken = pageToken;

    const list = await tenant.gmail.api.messages.list(listParams);
    const messages = list.messages || [];

    // Fetch full details for each message
    const detailed = await Promise.all(
      messages.map(async (m: any) => {
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
      })
    );

    res.json({
      emails: detailed,
      nextPageToken: list.nextPageToken || null,
    });
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
    const tenant = corsair.withTenant(session.user.id);
    await tenant.gmail.api.messages.trash({ id: req.params.id });
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
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/emails/:id/modify - add/remove labels (star, archive, etc)
emailsRouter.post("/:id/modify", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const tenant = corsair.withTenant(session.user.id);
    const { addLabelIds, removeLabelIds } = req.body;
    await tenant.gmail.api.messages.modify({ id: req.params.id, addLabelIds, removeLabelIds });
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
