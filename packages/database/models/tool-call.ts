import { pgTable, uuid, varchar, text, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { threadsTable } from "./thread";

export const toolCallStatusEnum = pgEnum("tool_call_status", [
  "pending",
  "waiting_confirmation",
  "approved",
  "running",
  "completed",
  "failed",
]);

export const toolCallsTable = pgTable("tool_calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id").notNull().references(() => threadsTable.id),
  toolName: varchar("tool_name", { length: 255 }).notNull(),
  status: toolCallStatusEnum("status").notNull().default("pending"),
  input: jsonb("input"),
  output: jsonb("output"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export type SelectToolCall = typeof toolCallsTable.$inferSelect;
export type InsertToolCall = typeof toolCallsTable.$inferInsert;
