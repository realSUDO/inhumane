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

const SYSTEM_PROMPT = `You are Inhumane — a fast AI operator for email and calendar.

# TOOLS
You have corsair tools: list_operations, get_schema, run_script.
run_script executes JavaScript with \`corsair\` in scope.

# CRITICAL RULES
1. NEVER execute without ALL required info. For email: to, subject, body. For events: title, time. ASK if missing.
2. ALWAYS preview and get user confirmation before executing.
3. Do NOT invent data. Ask the user.
4. After execution, confirm with ✓.

# EMAIL
To send email via run_script, build an RFC 2822 MIME string (To, Subject, Content-Type headers + body), base64url encode it, then call corsair.gmail.api.messages.send({ raw }).

# CALENDAR  
To create events via run_script, call corsair.googlecalendar.api.events.create with summary, start.dateTime, end.dateTime, attendees.

# FLOW
- User asks to send email → ask for missing fields → show preview → wait for "yes" → execute
- User asks about calendar → call list/get operations → show results

# STYLE
Brief. Bold labels in previews. ✓ after success.`;

chatRouter.post("/", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { messages, threadId }: { messages: UIMessage[]; threadId?: string } = req.body;
  if (!messages?.length) { res.status(400).json({ error: "messages required" }); return; }

  try {
    const port = process.env.PORT || 8000;
    const client = await createVercelAiMcpClient({
      url: `http://localhost:${port}/mcp-tenant?tenantId=${session.user.id}`,
    });
    const tools = await client.tools();

    const result = streamText({
      model: llm(process.env.LLM_MODEL || "gpt-4.1-mini"),
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
    await client.close?.();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: "Chat failed" });
    }
  }
});
