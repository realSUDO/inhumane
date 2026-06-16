import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";

import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";

import { serverRouter, createContext } from "@repo/trpc/server";
import { auth } from "@repo/auth";
import { toNodeHandler } from "better-auth/node";

import { env } from "./env";

export const app = express();
const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "Inhumane OpenAPI",
  version: "1.0.0",
  baseUrl: env.BASE_URL.concat("/api"),
});

app.use(
  cors({
    origin: env.NODE_ENV === "prod" || env.NODE_ENV === "production"
      ? ["https://inhumane.in", "https://chat.inhumane.in", "https://www.inhumane.in"]
      : "*",
    credentials: true,
  }),
);

app.use(express.json());

// Better Auth handles /api/auth/*
app.all("/api/auth/*splat", toNodeHandler(auth));

app.get("/", (req, res) => {
  return res.json({ message: "Inhumane is up and running..." });
});

app.get("/health", (req, res) => {
  return res.json({ message: "Inhumane server is healthy", healthy: true });
});

logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
app.get("/openapi.json", (req, res) => {
  return res.json(openApiDocument);
});

logger.debug(`docs: ${env.BASE_URL}/docs`);
app.use("/docs", apiReference({ url: "/openapi.json" }));

app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

export default app;
