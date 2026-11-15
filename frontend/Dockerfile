# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22

# ========= Base =========
FROM node:${NODE_VERSION}-alpine AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app

# ========= Dependencies =========
# Only manifests are copied, so this layer is cached until deps change.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ========= Builder =========
FROM base AS builder

# NEXT_PUBLIC_* values are inlined at build time, so pass them as build args.
ARG NEXT_PUBLIC_RUN_MODE=production
ARG NEXT_PUBLIC_API_URL_PROD
ARG NEXT_PUBLIC_API_URL_DEV
ARG NEXT_PUBLIC_TOKEN_KEY
ARG NEXT_PUBLIC_MEASUREMENT_ID
ARG SITE_URL

ENV NEXT_PUBLIC_RUN_MODE=$NEXT_PUBLIC_RUN_MODE \
    NEXT_PUBLIC_API_URL_PROD=$NEXT_PUBLIC_API_URL_PROD \
    NEXT_PUBLIC_API_URL_DEV=$NEXT_PUBLIC_API_URL_DEV \
    NEXT_PUBLIC_TOKEN_KEY=$NEXT_PUBLIC_TOKEN_KEY \
    NEXT_PUBLIC_MEASUREMENT_ID=$NEXT_PUBLIC_MEASUREMENT_ID \
    SITE_URL=$SITE_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN --mount=type=cache,target=/app/.next/cache \
    pnpm build

# ========= Runner =========
FROM node:${NODE_VERSION}-alpine AS runner

# Override with `--build-arg PORT=8080` (e.g. for Cloud Run).
ARG PORT=3000

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=${PORT} \
    HOSTNAME=0.0.0.0

WORKDIR /app

# Standalone output bundles only the traced runtime deps, no pnpm needed here.
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${PORT}/" >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]
