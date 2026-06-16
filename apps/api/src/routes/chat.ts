import { Router } from "express";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, UIMessage, stepCountIs } from "ai";
import { createVercelAiMcpClient } from "@corsair-dev/mcp";
import { auth } from "@repo/auth";
import { fromNodeHeaders } from "better-auth/node";

export const chatRouter = Router();

const llm = createOpenAI({
  apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
});

const SYSTEM_PROMPT = `You are Inhumane, an AI operator for email and calendar.
Use corsair tools to execute Gmail and Google Calendar operations.
Be concise. Execute directly. Ask only when truly ambiguous.`;

// Lazy-initialized MCP client (connects once, reused across requests)
let mcpClientPromise: ReturnType<typeof createVercelAiMcpClient> | null = null;

function getMcpClient() {
  if (!mcpClientPromise) {
    const port = process.env.PORT || 8000;
    mcpClientPromise = createVercelAiMcpClient({ url: `http://localhost:${port}/mcp` });
  }
  return mcpClientPromise;
}

chatRouter.post("/", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { messages }: { messages: UIMessage[] } = req.body;
  if (!messages?.length) { res.status(400).json({ error: "messages required" }); return; }

  try {
    const client = await getMcpClient();
    const tools = await client.tools();

    const result = streamText({
      model: llm(process.env.LLM_MODEL || "gpt-4.1"),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(10),
    });

    const response = result.toUIMessageStreamResponse();
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: "Chat failed" });
    }
  }
});
