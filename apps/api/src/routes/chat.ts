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
1. For SENDING email: gather to, subject, body. ASK if missing. Preview, then execute on confirmation.
2. For READING email: immediately call run_script. Do NOT ask permission.
3. For calendar: immediately call run_script.
4. ALWAYS use run_script for any Gmail/Calendar action. NEVER say you cannot access them.

# HOW TO READ EMAILS (use this exact pattern)
run_script code: const list = await corsair.gmail.api.messages.list({ maxResults: 5 }); const results = []; for (const m of (list.messages || [])) { const full = await corsair.gmail.api.messages.get({ id: m.id }); results.push({ id: full.id, snippet: full.snippet, from: (full.payload?.headers || []).find(h => h.name === "From")?.value, subject: (full.payload?.headers || []).find(h => h.name === "Subject")?.value, date: (full.payload?.headers || []).find(h => h.name === "Date")?.value }); } return results;

# HOW TO SEND EMAIL (only after user confirms)
run_script code: const mime = ["To: RECIPIENT", "Subject: SUBJECT", "Content-Type: text/plain; charset=utf-8", "", BODY].join("\\r\\n"); const raw = Buffer.from(mime).toString("base64url"); return await corsair.gmail.api.messages.send({ raw });

# HOW TO LIST CALENDAR EVENTS
run_script code: return await corsair.googlecalendar.api.events.list({});

# HOW TO CREATE CALENDAR EVENT (only after user confirms)
run_script code: return await corsair.googlecalendar.api.events.create({ summary: "TITLE", start: { dateTime: "ISO_DATETIME" }, end: { dateTime: "ISO_DATETIME" } });

# STYLE
Brief. Bold labels in previews. ✓ after success. Show email results as a clean list with From, Subject, Date.`;

chatRouter.post("/", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { messages, threadId }: { messages: UIMessage[]; threadId?: string } = req.body;
  if (!messages?.length) { res.status(400).json({ error: "messages required" }); return; }

  try {
    const port = process.env.PORT || 8000;
    const client = await createVercelAiMcpClient({
      url: `http://localhost:${port}/mcp/${session.user.id}`,
    });
    const tools = await client.tools();
    console.log("[chat] tools loaded:", Object.keys(tools));

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
