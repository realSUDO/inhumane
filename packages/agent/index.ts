import { openai } from "@ai-sdk/openai";
import { streamText, type CoreMessage } from "ai";
import { getCorsairTenant } from "./corsair";

const SYSTEM_PROMPT = `You are Inhumane, an AI operator that helps users manage their email, calendar, and everyday workflows at inhuman speed.

You have access to Gmail and Google Calendar through tool calls. When the user asks you to do something:
1. Understand their intent
2. Use the available tools to accomplish it
3. Report back with results

Be concise, professional, and action-oriented. Don't explain what you're going to do — just do it. If you need clarification, ask briefly.`;

export interface StreamChatOptions {
  messages: CoreMessage[];
  tenantId: string;
  onToolCall?: (toolCall: { toolName: string; args: unknown }) => void;
}

export async function streamChat({ messages, tenantId, onToolCall }: StreamChatOptions) {
  const tenant = getCorsairTenant(tenantId);
  const mcpClient = await tenant.mcp.createVercelClient();
  const tools = await mcpClient.tools();

  const result = streamText({
    model: openai("gpt-4.1"),
    system: SYSTEM_PROMPT,
    messages,
    tools,
    maxSteps: 10,
    onStepFinish({ toolCalls }) {
      if (toolCalls && onToolCall) {
        for (const tc of toolCalls) {
          onToolCall({ toolName: tc.toolName, args: tc.args });
        }
      }
    },
  });

  return result;
}

export { getCorsairTenant } from "./corsair";
