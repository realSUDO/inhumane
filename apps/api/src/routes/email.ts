import { Router } from "express";
import { corsair } from "../corsair";
import { auth } from "@repo/auth";
import { fromNodeHeaders } from "better-auth/node";
import { z } from "zod";
import { cache } from "../cache";

export const emailRouter = Router();

const sendEmailSchema = z.object({
  to: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  threadId: z.string().optional(),
  messageId: z.string().optional(),
});

// POST /api/send-email — user-confirmed email send
emailRouter.post("/", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = sendEmailSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body", details: parsed.error.issues }); return; }
  const { to, subject, body, threadId, messageId } = parsed.data;

  try {
    const usage = await cache.getUsage(session.user.id, "actions");
    if (usage >= 20) {
      res.status(403).json({ error: "Thanks for Testing the beta! You've finished your free trial, see you in full launch." });
      return;
    }
    await cache.incrementUsage(session.user.id, "actions");

    const tenant = corsair.withTenant(session.user.id);
    const mimeLines = [
      "To: " + to,
      "Subject: " + subject,
      "Content-Type: text/plain; charset=utf-8",
    ];
    if (messageId) {
      mimeLines.push(`In-Reply-To: <${messageId}>`);
      mimeLines.push(`References: <${messageId}>`);
    }
    mimeLines.push("", body);
    
    const mime = mimeLines.join("\r\n");
    const raw = Buffer.from(mime).toString("base64url");
    
    const requestBody: any = { raw };
    if (threadId) requestBody.threadId = threadId;
    
    const result = await tenant.gmail.api.messages.send({ requestBody });
    res.json({ success: true, messageId: result.data?.id || result.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to send" });
  }
});
