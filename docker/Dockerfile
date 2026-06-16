FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# Build everything in one stage - pnpm needs proper workspace context
FROM base AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1
RUN pnpm install --frozen-lockfile
RUN pnpm build
RUN pnpm --filter @repo/api deploy --prod /app/deploy/api

# --- Web runner ---
FROM base AS web
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]

# --- API runner ---
FROM node:20-alpine AS api
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/deploy/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
EXPOSE 4000
CMD ["node", "dist/index.js"]
