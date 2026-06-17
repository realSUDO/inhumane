import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";
import cookieParser from "cookie-parser";

import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";

import { serverRouter, createContext } from "@repo/trpc/server";
import { auth } from "@repo/auth";
import { toNodeHandler } from "better-auth/node";
import { chatRouter } from "./routes/chat";
import { corsairRouter } from "./routes/corsair";
import { threadsRouter } from "./routes/threads";
import { emailRouter } from "./routes/email";
import { emailsRouter } from "./routes/emails";
import { createBaseMcpServer, createMcpRouter } from "@corsair-dev/mcp";
import { corsair } from "./corsair";

import { env } from "./env";

export const app = express();

app.use(cors({
  origin: env.NODE_ENV === "prod" || env.NODE_ENV === "production"
    ? ["https://inhumane.in", "https://chat.inhumane.in", "https://www.inhumane.in"]
    : "*",
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

// Auth
app.all("/api/auth/*splat", toNodeHandler(auth));

// Corsair OAuth + status
app.use("/api/corsair", corsairRouter);

// Corsair MCP endpoint — one router per tenant, cached
const mcpRouters = new Map<string, ReturnType<typeof createMcpRouter>>();

app.use("/mcp/:tenantId", (req, res, next) => {
  const { tenantId } = req.params;
  if (!mcpRouters.has(tenantId)) {
    const scoped = corsair.withTenant(tenantId);
    mcpRouters.set(tenantId, createMcpRouter(() => createBaseMcpServer({ corsair: scoped })));
  }
  mcpRouters.get(tenantId)!(req, res, next);
});

// Chat streaming
app.use("/api/chat", chatRouter);

// Email send (user-confirmed)
app.use("/api/send-email", emailRouter);

// Email inbox (fetch real emails)
app.use("/api/emails", emailsRouter);

// Threads/messages persistence
app.use("/api/threads", threadsRouter);

// Health
app.get("/", (_req, res) => res.json({ message: "Inhumane is up and running..." }));
app.get("/health", (_req, res) => res.json({ healthy: true }));

// OpenAPI docs
const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "Inhumane OpenAPI",
  version: "1.0.0",
  baseUrl: env.BASE_URL.concat("/api"),
});
app.get("/openapi.json", (_req, res) => res.json(openApiDocument));
app.use("/docs", apiReference({ url: "/openapi.json" }));

// tRPC
app.use("/api/trpc", createOpenApiExpressMiddleware({ router: serverRouter, createContext }));
app.use("/trpc", trpcExpress.createExpressMiddleware({ router: serverRouter, createContext }));

export default app;
