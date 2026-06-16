import { Router } from "express";
import { generateOAuthUrl, processOAuthCallback } from "corsair/oauth";
import { corsair } from "../corsair";
import { auth } from "@repo/auth";
import { fromNodeHeaders } from "better-auth/node";

export const corsairRouter = Router();

const REDIRECT_URI = `${process.env.APP_URL}/api/corsair/callback`;

// GET /api/corsair/connect?plugin=gmail
corsairRouter.get("/connect", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const plugin = req.query.plugin as string;
  if (!plugin) { res.status(400).json({ error: "Missing plugin param" }); return; }

  const { url, state } = await generateOAuthUrl(corsair, plugin, {
    tenantId: session.user.id,
    redirectUri: REDIRECT_URI,
  });

  res.cookie("corsair_oauth_state", state, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 600000 });
  res.redirect(url);
});

// GET /api/corsair/callback?code=...&state=...
corsairRouter.get("/callback", async (req, res) => {
  const code = req.query.code as string;
  const state = req.query.state as string;
  const storedState = req.cookies?.corsair_oauth_state;

  if (!code || !state) { res.status(400).send("Missing code or state"); return; }
  if (!storedState || storedState !== state) { res.status(400).send("Invalid state"); return; }

  try {
    await processOAuthCallback(corsair, { code, state, redirectUri: REDIRECT_URI });
    res.clearCookie("corsair_oauth_state");
    res.redirect("/?connected=true");
  } catch (err) {
    res.clearCookie("corsair_oauth_state");
    res.status(500).send("OAuth failed");
  }
});

// GET /api/corsair/status - check which integrations user has connected
corsairRouter.get("/status", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const tenant = corsair.withTenant(session.user.id);
  // Check if credentials exist by trying to get keys
  const status: Record<string, boolean> = {};
  try { status.gmail = !!(await tenant.gmail.api.labels.list({})); } catch { status.gmail = false; }
  try { status.googlecalendar = !!(await tenant.googlecalendar.api.events.list({})); } catch { status.googlecalendar = false; }

  res.json(status);
});
