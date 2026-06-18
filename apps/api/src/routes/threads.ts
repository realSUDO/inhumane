import { Router } from "express";
import { Pool } from "pg";
import { auth } from "@repo/auth";
import { fromNodeHeaders } from "better-auth/node";
import { cache } from "../cache";

export const threadsRouter = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// GET /api/threads
threadsRouter.get("/", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const showArchived = req.query.archived === "true";
  const cacheKey = cache.threadsKey(session.user.id) + (showArchived ? ":arch" : "");
  const cached = await cache.get<any>(cacheKey);
  if (cached) { res.json(cached); return; }

  const { rows } = await pool.query(
    `SELECT id, title, pinned, archived, created_at, updated_at FROM threads WHERE user_id = $1 AND archived = $2 ORDER BY pinned DESC, updated_at DESC`,
    [session.user.id, showArchived]
  );
  await cache.set(cacheKey, rows, cache.TTL.threads);
  res.json(rows);
});

// POST /api/threads - create
threadsRouter.post("/", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { title } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO threads (id, user_id, title, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, NOW(), NOW()) RETURNING id, title, pinned, archived, created_at`,
    [session.user.id, title || "New conversation"]
  );
  await cache.del(cache.threadsKey(session.user.id));
  await cache.del(cache.threadsKey(session.user.id) + ":arch");
  res.json(rows[0]);
});

// PATCH /api/threads/:id - rename, pin, archive
threadsRouter.patch("/:id", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { title, pinned, archived } = req.body;
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

// POST /api/threads/:id/messages
threadsRouter.post("/:id/messages", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { role, content } = req.body;
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

  await pool.query(`DELETE FROM threads WHERE id = $1 AND user_id = $2`, [req.params.id, session.user.id]);
  await cache.del(cache.threadsKey(session.user.id));
  await cache.del(cache.threadsKey(session.user.id) + ":arch");
  await cache.del(cache.messagesKey(session.user.id, req.params.id));
  res.json({ ok: true });
});
