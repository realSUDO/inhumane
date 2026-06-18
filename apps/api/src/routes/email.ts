import { Router } from "express";
import { corsair } from "../corsair";
import { auth } from "@repo/auth";
import { fromNodeHeaders } from "better-auth/node";
import { z } from "zod";

export const emailRouter = Router();

const sendEmailSchema = z.object({
  to: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
});

// POST /api/send-email — user-confirmed email send
emailRouter.post("/", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = sendEmailSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body", details: parsed.error.issues }); return; }
  const { to, subject, body } = parsed.data;

  try {
    const tenant = corsair.withTenant(session.user.id);
    const mime = ["To: " + to, "Subject: " + subject, "Content-Type: text/plain; charset=utf-8", "", body].join("\r\n");
    const raw = Buffer.from(mime).toString("base64url");
    const result = await tenant.gmail.api.messages.send({ raw });
    res.json({ success: true, messageId: result.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to send" });
  }
});
