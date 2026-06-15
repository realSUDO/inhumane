import { Router } from "express";
import { streamChat } from "@repo/agent";
import { auth } from "@repo/auth";
import { fromNodeHeaders } from "better-auth/node";

export const chatRouter = Router();

chatRouter.post("/", async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "messages array required" });
    return;
  }

  const result = await streamChat({
    messages,
    tenantId: session.user.id,
  });

  result.pipeDataStreamToResponse(res);
});
