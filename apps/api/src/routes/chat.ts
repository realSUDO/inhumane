import { Router } from "express";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, stepCountIs } from "ai";
import { createBaseMcpServer, createMcpRouter } from "@corsair-dev/mcp";
import { experimental_createMCPClient as createMCPClient } from "ai";
import { Experimental_StdioMCPTransport as StdioTransport } from "ai/mcp-stdio";
import { corsair } from "../corsair";
import { auth } from "@repo/auth";
import { fromNodeHeaders } from "better-auth/node";

export const chatRouter = Router();

const llm = createOpenAI({
  apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
});

const SYSTEM_PROMPT = `You are Inhumane, an AI operator that helps users manage email and calendar at inhuman speed.

You have access to Gmail and Google Calendar via Corsair tools. When the user asks:
- Search/read emails → use gmail operations
- Send/draft emails → use gmail operations  
- Check schedule/availability → use googlecalendar operations
- Create/update/delete events → use googlecalendar operations

Be concise and action-oriented. Execute tasks directly. Ask for clarification only when truly ambiguous.`;

chatRouter.post("/", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { messages } = req.body;
  if (!messages?.length) { res.status(400).json({ error: "messages required" }); return; }

  const tenantCorsair = corsair.withTenant(session.user.id);

  // Create in-process MCP server scoped to this tenant
  const mcpServer = createBaseMcpServer({ corsair: tenantCorsair });
  const tools = mcpServer.tools;

  const result = streamText({
    model: llm(process.env.LLM_MODEL || "gpt-4.1"),
    system: SYSTEM_PROMPT,
    messages,
    tools,
    stopWhen: stepCountIs(10),
  });

  result.pipeDataStreamToResponse(res);
});
