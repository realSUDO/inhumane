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
    // Close popup and notify parent window
    res.send(`<html><body><script>
      window.opener?.postMessage({ type: "corsair-connected" }, "*");
      window.close();
    </script><p>Connected! You can close this window.</p></body></html>`);
  } catch (err) {
    res.clearCookie("corsair_oauth_state");
    res.send(`<html><body><script>
      window.opener?.postMessage({ type: "corsair-error" }, "*");
      window.close();
    </script><p>Connection failed. Close this window and try again.</p></body></html>`);
  }
});

// GET /api/corsair/status - verify integrations actually work
corsairRouter.get("/status", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const tenant = corsair.withTenant(session.user.id);
  const status: Record<string, boolean> = { gmail: false, googlecalendar: false };

  try {
    await tenant.gmail.api.labels.list({});
    status.gmail = true;
  } catch { status.gmail = false; }

  try {
    await tenant.googlecalendar.api.calendar.getAvailability({
      timeMin: new Date().toISOString(),
      timeMax: new Date(Date.now() + 86400000).toISOString(),
    });
    status.googlecalendar = true;
  } catch { status.googlecalendar = false; }

  res.json(status);
});
