import { Router } from "express";
import { Pool } from "pg";
import { auth } from "@repo/auth";
import { fromNodeHeaders } from "better-auth/node";
import { cache } from "../cache";
import { z } from "zod";

export const threadsRouter = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// GET /api/threads
threadsRouter.get("/", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const showArchived = req.query.archived === "true";
  const cacheKey = cache.threadsKey(session.user.id) + (showArchived ? ":arch" : "");
  let cached = await cache.get<any>(cacheKey);
  const blockedIds = await cache.getBlockedIds(session.user.id);

  if (cached) { 
    if (blockedIds.length > 0) {
      cached = cached.filter((t: any) => !blockedIds.includes(t.id));
    }
    res.json(cached); 
    return; 
  }

  let { rows } = await pool.query(
    `SELECT id, title, pinned, archived, created_at, updated_at FROM threads WHERE user_id = $1 AND archived = $2 ORDER BY pinned DESC, updated_at DESC`,
    [session.user.id, showArchived]
  );
  await cache.set(cacheKey, rows, cache.TTL.threads);
  
  if (blockedIds.length > 0) {
    rows = rows.filter((t: any) => !blockedIds.includes(t.id));
  }
  
  res.json(rows);
});

const createThreadSchema = z.object({
  title: z.string().max(255).optional(),
});

// POST /api/threads - create
threadsRouter.post("/", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = createThreadSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body", details: parsed.error.issues }); return; }
  const { title } = parsed.data;

  const { rows } = await pool.query(
    `INSERT INTO threads (id, user_id, title, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, NOW(), NOW()) RETURNING id, title, pinned, archived, created_at`,
    [session.user.id, title || "New conversation"]
  );
  await cache.del(cache.threadsKey(session.user.id));
  await cache.del(cache.threadsKey(session.user.id) + ":arch");
  res.json(rows[0]);
});

const updateThreadSchema = z.object({
  title: z.string().max(255).optional(),
  pinned: z.boolean().optional(),
  archived: z.boolean().optional(),
});

// PATCH /api/threads/:id - rename, pin, archive
threadsRouter.patch("/:id", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = updateThreadSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body", details: parsed.error.issues }); return; }
  const { title, pinned, archived } = parsed.data;
  
  if (title === undefined && pinned === undefined && archived === undefined) {
    res.json({ ok: true }); return;
  }

  const updates: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (title !== undefined) { updates.push(`title = $${idx++}`); values.push(title); }
  if (pinned !== undefined) { updates.push(`pinned = $${idx++}`); values.push(pinned); }
  if (archived !== undefined) { updates.push(`archived = $${idx++}`); values.push(archived); }
  updates.push(`updated_at = NOW()`);

  values.push(req.params.id, session.user.id);
  const { rows } = await pool.query(
    `UPDATE threads SET ${updates.join(", ")} WHERE id = $${idx++} AND user_id = $${idx} RETURNING id, title, pinned, archived`,
    values
  );
  await cache.del(cache.threadsKey(session.user.id));
  await cache.del(cache.threadsKey(session.user.id) + ":arch");
  res.json(rows[0] || { error: "Not found" });
});

// GET /api/threads/:id/messages
threadsRouter.get("/:id/messages", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { rows: thread } = await pool.query(`SELECT id FROM threads WHERE id = $1 AND user_id = $2`, [req.params.id, session.user.id]);
  if (!thread.length) { res.status(404).json({ error: "Not found" }); return; }

  const msgKey = cache.messagesKey(session.user.id, req.params.id);
  const cached = await cache.get<any>(msgKey);
  if (cached) { res.json(cached); return; }

  const { rows } = await pool.query(`SELECT id, role, content, created_at FROM messages WHERE thread_id = $1 ORDER BY created_at ASC`, [req.params.id]);
  await cache.set(msgKey, rows, cache.TTL.messages);
  res.json(rows);
});

const createMessageSchema = z.object({
  role: z.enum(["user", "assistant", "tool", "system"]),
  content: z.string().min(1),
});

// POST /api/threads/:id/messages
threadsRouter.post("/:id/messages", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = createMessageSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body", details: parsed.error.issues }); return; }
  const { role, content } = parsed.data;
  
  const { rows } = await pool.query(
    `INSERT INTO messages (id, thread_id, role, content, created_at) VALUES (gen_random_uuid(), $1, $2, $3, NOW()) RETURNING id, role, content, created_at`,
    [req.params.id, role, content]
  );
  await pool.query(`UPDATE threads SET updated_at = NOW() WHERE id = $1`, [req.params.id]);
  await cache.del(cache.messagesKey(session.user.id, req.params.id));
  await cache.del(cache.threadsKey(session.user.id));
  await cache.del(cache.threadsKey(session.user.id) + ":arch");
  res.json(rows[0]);
});

// DELETE /api/threads/:id
threadsRouter.delete("/:id", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  await cache.blockId(session.user.id, req.params.id);
  await pool.query(`DELETE FROM threads WHERE id = $1 AND user_id = $2`, [req.params.id, session.user.id]);
  await cache.del(cache.threadsKey(session.user.id));
  await cache.del(cache.threadsKey(session.user.id) + ":arch");
  await cache.del(cache.messagesKey(session.user.id, req.params.id));
  res.json({ ok: true });
});
