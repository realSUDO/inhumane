import { Router } from "express";
import { Pool } from "pg";
import { auth } from "@repo/auth";
import { fromNodeHeaders } from "better-auth/node";

export const threadsRouter = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// GET /api/threads - list user's threads
threadsRouter.get("/", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { rows } = await pool.query(
    `SELECT id, title, created_at, updated_at FROM threads WHERE user_id = $1 ORDER BY updated_at DESC`,
    [session.user.id]
  );
  res.json(rows);
});

// POST /api/threads - create new thread
threadsRouter.post("/", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { title } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO threads (id, user_id, title, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, NOW(), NOW()) RETURNING id, title, created_at`,
    [session.user.id, title || "New conversation"]
  );
  res.json(rows[0]);
});

// GET /api/threads/:id/messages - get messages for a thread
threadsRouter.get("/:id/messages", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  // Verify thread belongs to user
  const { rows: thread } = await pool.query(
    `SELECT id FROM threads WHERE id = $1 AND user_id = $2`,
    [req.params.id, session.user.id]
  );
  if (!thread.length) { res.status(404).json({ error: "Thread not found" }); return; }

  const { rows } = await pool.query(
    `SELECT id, role, content, created_at FROM messages WHERE thread_id = $1 ORDER BY created_at ASC`,
    [req.params.id]
  );
  res.json(rows);
});

// POST /api/threads/:id/messages - save a message
threadsRouter.post("/:id/messages", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { role, content } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO messages (id, thread_id, role, content, created_at) VALUES (gen_random_uuid(), $1, $2, $3, NOW()) RETURNING id, role, content, created_at`,
    [req.params.id, role, content]
  );

  // Update thread's updated_at
  await pool.query(`UPDATE threads SET updated_at = NOW() WHERE id = $1`, [req.params.id]);

  res.json(rows[0]);
});

// DELETE /api/threads/:id - delete a thread
threadsRouter.delete("/:id", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  await pool.query(`DELETE FROM messages WHERE thread_id = $1`, [req.params.id]);
  await pool.query(`DELETE FROM threads WHERE id = $1 AND user_id = $2`, [req.params.id, session.user.id]);
  res.json({ ok: true });
});
