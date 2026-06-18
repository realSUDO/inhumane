const { fetch } = require("undici");

async function test() {
  console.log("Testing Router Output for: 'schedule an event with justmultiplythinks@gmail.com and also send him a follow up mail for same saying (plz join)'");
  
  // Actually, wait, the API requires a session (better-auth).
  // I can just directly test the router model locally!
  const { generateText } = require("ai");
  const { createOpenAI } = require("@ai-sdk/openai");

  const fast = createOpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const ROUTER_PROMPT = `You are a message classifier. Read the FULL conversation and classify the user's LAST message.

Output EXACTLY one JSON object: {"intents":["LABEL1", "LABEL2"], "sufficient":true/false, "extractedEmails": ["any_spelled_out_emails"]}

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

  const { text } = await generateText({
    model: fast.chat("llama-3.3-70b-versatile"),
    system: ROUTER_PROMPT,
    prompt: "schedule an event with justmultiplythinks@gmail.com and also send him a follow up mail for same saying (plz join)",
  });

  console.log("ROUTER OUTPUT:", text);
}

test();
