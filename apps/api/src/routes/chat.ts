import { Router } from "express";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, generateText, convertToModelMessages, UIMessage, stepCountIs } from "ai";
import { createVercelAiMcpClient } from "@corsair-dev/mcp";
import { auth } from "@repo/auth";
import { fromNodeHeaders } from "better-auth/node";
import { Pool } from "pg";

export const chatRouter = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Fast model (Groq) — routing + short conversational replies
const fast = createOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
  compatibility: "compatible",
});

// Writer model (GPT-4.1-mini) — email drafting, tool execution
const writer = createOpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
});

// ─── ROUTER ───
const ROUTER_PROMPT = `You are a message classifier. Read the FULL conversation and classify the user's LAST message.

Output EXACTLY one JSON object: {"intent":"LABEL","sufficient":true/false}

Labels:
- GREETING: "hi", "hey", "hello", "thanks", "ok", "yes", "no" (single word pleasantries)
- ABOUT: questions about the AI itself, capabilities, help
- SEND_EMAIL: user wants to send/draft/compose an email
- READ_EMAIL: user wants to read/check/fetch emails
- CALENDAR_READ: wants to check schedule/events
- CALENDAR_CREATE: wants to create/book an event
- GENERAL: anything else

"sufficient" = does the conversation contain enough info to ACT?
- For SEND_EMAIL: sufficient=true ONLY if recipient AND purpose/topic are both known from the conversation
- For CALENDAR_CREATE: sufficient=true ONLY if event title AND date/time are known
- For READ/GREETING/ABOUT/GENERAL: always sufficient=true

Output only the JSON. No explanation.`;

// ─── FAST CONVERSATIONAL ───
const FAST_PROMPT = `You are Inhumane — a blazing-fast AI operator for email and calendar.
Keep responses SHORT (1-2 sentences max). Be direct, warm, confident.
If user asks what you can do: "I can send emails, read your inbox, manage your calendar — all through chat. Just tell me what you need."
If user wants to send email but hasn't said who/what: ask BOTH in one short question.
If user says "yes"/"send it"/"do it" to confirm an action: respond with "✓ Done."`;

// ─── WRITER (email drafting) ───
const WRITER_PROMPT = `You are Inhumane — a world-class email copywriter.

Given the conversation context, draft the email NOW. Do not ask questions — you have enough info.

Rules:
- Write naturally, match the tone to the context (casual for friends, professional for work)
- Generate a clear, compelling subject line
- Body should be well-written, appropriate length (not too short, not too long)
- Output ONLY the draft block, no other text before or after:

\`\`\`email-draft
{"to":"email@example.com","subject":"Subject line","body":"Full email body here"}
\`\`\``;

// ─── CALENDAR WRITER ───
const CALENDAR_PROMPT = `You are Inhumane — a calendar scheduling assistant.

Given the conversation context, create the calendar event NOW. Do not ask questions — you have enough info.

Rules:
- Parse the date/time from conversation. If no time given, default to 10:00 AM, 1 hour duration.
- If no date given, assume today or next occurrence of the day mentioned.
- Use ISO 8601 format for start/end times.
- Output ONLY the event block, no other text before or after:

\`\`\`calendar-event
{"summary":"Event title","start":"2024-01-15T10:00:00","end":"2024-01-15T11:00:00","description":"Optional description","location":"Optional location"}
\`\`\``;

// ─── TOOL EXECUTION ───
const TOOL_PROMPT = `You are Inhumane. Use run_script to execute operations. Be brief with results.

# READ EMAILS
run_script: const list = await corsair.gmail.api.messages.list({ maxResults: 5 }); const results = []; for (const m of (list.messages || [])) { const full = await corsair.gmail.api.messages.get({ id: m.id }); results.push({ id: full.id, snippet: full.snippet, from: (full.payload?.headers || []).find(h => h.name === "From")?.value, subject: (full.payload?.headers || []).find(h => h.name === "Subject")?.value, date: (full.payload?.headers || []).find(h => h.name === "Date")?.value }); } return results;

# CALENDAR READ
run_script: return await corsair.googlecalendar.api.events.getMany({ timeMin: new Date().toISOString(), timeMax: new Date(Date.now()+7*86400000).toISOString(), singleEvents: true, orderBy: "startTime" });

Present results as a clean list. ✓ after done.`;

// ─── MCP CACHE ───
const mcpClients = new Map<string, { client: Awaited<ReturnType<typeof createVercelAiMcpClient>>; ts: number }>();
async function getMcpClient(tenantId: string) {
  const c = mcpClients.get(tenantId);
  if (c && Date.now() - c.ts < 300000) return c.client;
  if (c) { await c.client.close?.().catch(() => {}); mcpClients.delete(tenantId); }
  const port = process.env.PORT || 8000;
  const client = await createVercelAiMcpClient({ url: `http://localhost:${port}/mcp/${tenantId}` });
  mcpClients.set(tenantId, { client, ts: Date.now() });
  return client;
}

// ─── HELPERS ───
async function streamToResponse(result: any, res: any, threadId?: string) {
  try {
    const response = result.toUIMessageStreamResponse();
    res.status(response.status);
    response.headers.forEach((v: string, k: string) => res.setHeader(k, v));
    if (response.body) {
      const reader = response.body.getReader();
      while (true) { const { done, value } = await reader.read(); if (done) break; res.write(value); }
    }
  } catch (e) {
    console.error("[stream] error:", e);
  } finally {
    res.end();
  }
  // Persist async
  result.text.then((text: string) => {
    if (threadId && text) pool.query(`INSERT INTO messages (id, thread_id, role, content, created_at) VALUES (gen_random_uuid(), $1, 'assistant', $2, NOW())`, [threadId, text]).catch(() => {});
  }).catch(() => {});
}

// ─── MAIN HANDLER ───
chatRouter.post("/", async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { messages, threadId }: { messages: UIMessage[]; threadId?: string } = req.body;
  if (!messages?.length) { res.status(400).json({ error: "messages required" }); return; }

  // Persist user message
  const lastMsg = messages[messages.length - 1];
  if (threadId && lastMsg.role === "user") {
    const t = lastMsg.parts?.find((p: any) => p.type === "text") as any;
    if (t?.text) await pool.query(`INSERT INTO messages (id, thread_id, role, content, created_at) VALUES (gen_random_uuid(), $1, 'user', $2, NOW())`, [threadId, t.text]).catch(() => {});
  }

  try {
    const modelMessages = await convertToModelMessages(messages);

    // Step 1: Route (Groq, ~200ms)
    const { text: routerResponse } = await generateText({
      model: fast.chat("llama-3.3-70b-versatile"),
      system: ROUTER_PROMPT,
      messages: modelMessages,
    });

    let intent = "GENERAL", sufficient = true;
    try {
      const parsed = JSON.parse(routerResponse.trim());
      intent = parsed.intent || "GENERAL";
      sufficient = parsed.sufficient !== false;
    } catch { intent = routerResponse.trim().toUpperCase(); }

    console.log("[chat] intent:", intent, "sufficient:", sufficient);

    // Step 2: Handle based on intent + sufficiency

    // Greetings, about, or insufficient info → fast model responds conversationally
    if (intent === "GREETING" || intent === "ABOUT" || !sufficient) {
      const result = streamText({
        model: fast.chat("llama-3.3-70b-versatile"),
        system: FAST_PROMPT,
        messages: modelMessages,
      });
      await streamToResponse(result, res, threadId);
      return;
    }

    // Send email with sufficient info → writer drafts
    if (intent === "SEND_EMAIL") {
      const result = streamText({
        model: writer(process.env.LLM_MODEL || "gpt-4.1-mini"),
        system: WRITER_PROMPT,
        messages: modelMessages,
      });
      await streamToResponse(result, res, threadId);
      return;
    }

    // Read operations → writer + tools
    if (intent === "READ_EMAIL" || intent === "CALENDAR_READ") {
      const client = await getMcpClient(session.user.id);
      const tools = await client.tools();
      const result = streamText({
        model: writer(process.env.LLM_MODEL || "gpt-4.1-mini"),
        system: TOOL_PROMPT,
        messages: modelMessages,
        tools,
        stopWhen: stepCountIs(10),
      });
      await streamToResponse(result, res, threadId);
      return;
    }

    // Calendar create with sufficient info → writer drafts event
    if (intent === "CALENDAR_CREATE") {
      const result = streamText({
        model: writer(process.env.LLM_MODEL || "gpt-4.1-mini"),
        system: CALENDAR_PROMPT,
        messages: modelMessages,
      });
      await streamToResponse(result, res, threadId);
      return;
    }

    // GENERAL fallback → writer with tools
    const client = await getMcpClient(session.user.id);
    const tools = await client.tools();
    const result = streamText({
      model: writer(process.env.LLM_MODEL || "gpt-4.1-mini"),
      system: FAST_PROMPT + "\n\nYou also have tools: run_script for Gmail/Calendar operations.",
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(10),
    });
    await streamToResponse(result, res, threadId);

  } catch (err) {
    console.error("[chat] error:", err);
    if (!res.headersSent) res.status(500).json({ error: "Chat failed" });
  }
});
