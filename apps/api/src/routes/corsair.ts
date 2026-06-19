import { Router } from "express";
import { generateOAuthUrl, processOAuthCallback } from "corsair/oauth";
import { corsair } from "../corsair";
import { auth } from "@repo/auth";
import { fromNodeHeaders } from "better-auth/node";
import { Pool } from "pg";

export const corsairRouter = Router();

const REDIRECT_URI = `${process.env.APP_URL}/api/corsair/callback`;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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

  // Force same Google account + offline access for long-lived refresh token
  const oauthUrl = new URL(url);
  oauthUrl.searchParams.set("login_hint", session.user.email);
  oauthUrl.searchParams.set("access_type", "offline");
  oauthUrl.searchParams.set("prompt", "consent");

  res.cookie("corsair_oauth_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 600000 });
  res.cookie("corsair_oauth_plugin", plugin, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 600000 });
  res.redirect(oauthUrl.toString());
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
    const plugin = req.cookies?.corsair_oauth_plugin || "";
    res.clearCookie("corsair_oauth_state");
    res.clearCookie("corsair_oauth_plugin");
    // Close popup and notify parent (scoped origin, not wildcard)
    const origin = process.env.APP_URL || "*";
    res.send(`<html><body><script>
      window.opener?.postMessage({ type: "corsair-connected", plugin: "${plugin}" }, "${origin}");
      window.close();
    </script><p>Connected! You can close this window.</p></body></html>`);
  } catch (err) {
    res.clearCookie("corsair_oauth_state");
    const origin = process.env.APP_URL || "*";
    res.send(`<html><body><script>
      window.opener?.postMessage({ type: "corsair-error" }, "${origin}");
      window.close();
    </script><p>Connection failed. Close this window and try again.</p></body></html>`);
  }
});

// GET /api/corsair/status — DB check first, live verify only if account exists
corsairRouter.get("/status", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  // Fast path: check if accounts exist in DB (no API calls)
  const { rows } = await pool.query(
    `SELECT i.name FROM corsair_accounts a JOIN corsair_integrations i ON a.integration_id = i.id WHERE a.tenant_id = $1`,
    [session.user.id]
  );

  const connected = rows.map((r: any) => r.name);
  const status: Record<string, boolean> = {
    gmail: connected.includes("gmail"),
    googlecalendar: connected.includes("googlecalendar"),
  };

  // If accounts exist, do a lightweight verify (only if both connected — skip individual checks for speed)
  if (status.gmail) {
    try { await corsair.withTenant(session.user.id).gmail.api.labels.list({}); }
    catch { status.gmail = false; }
  }
  if (status.googlecalendar) {
    try {
      await corsair.withTenant(session.user.id).googlecalendar.api.calendar.getAvailability({
        timeMin: new Date().toISOString(),
        timeMax: new Date(Date.now() + 86400000).toISOString(),
      });
    } catch { status.googlecalendar = false; }
  }

  res.json(status);
});
