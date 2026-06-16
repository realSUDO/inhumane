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

// Corsair MCP endpoint — uses tenantId from query string
const tenantMcpMap = new Map<string, string>();

app.use("/mcp/:tenantId", (req, res, next) => {
  const { tenantId } = req.params;
  (req as any).__tenantId = tenantId;
  next();
}, createMcpRouter(() => createBaseMcpServer({ corsair })));

// Override: patch createMcpRouter to use tenant-scoped corsair
app.use("/mcp-tenant", (req, res, next) => {
  const tenantId = req.query.tenantId as string;
  if (!tenantId) { res.status(400).json({ error: "tenantId required" }); return; }
  const scoped = corsair.withTenant(tenantId);
  const router = createMcpRouter(() => createBaseMcpServer({ corsair: scoped }));
  router(req, res, next);
});

// Chat streaming
app.use("/api/chat", chatRouter);

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
