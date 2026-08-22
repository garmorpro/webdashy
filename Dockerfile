# WebDashy — production Docker image
#
# Multi-stage build: install deps, build with Prisma client + Next.js
# standalone output, then run on a slim, non-root final image.
#
# Debian-slim (not Alpine) is used deliberately — Prisma's query engine
# binaries target glibc by default, which avoids musl/Alpine binary-target
# headaches. See https://www.prisma.io/docs/orm/reference/prisma-schema-reference#binarytargets-options

ARG NODE_VERSION=22-slim

# --- deps: install all node_modules ---
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
# package.json's postinstall runs `prisma generate`, which needs the schema
# present — copy just that in before installing (full source comes later,
# in the builder stage, to keep this layer cache-friendly on source edits).
COPY prisma ./prisma
RUN npm ci

# --- builder: generate Prisma client + build Next.js ---
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# DATABASE_URL isn't needed to generate the client or build the app (no DB
# connection happens at build time), but Prisma's generate step wants the
# env var to exist.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN npx prisma generate
RUN npm run build

# --- runner: minimal production image ---
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Next.js standalone server + static assets.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma schema + CLI so `docker compose exec app npx prisma migrate deploy`
# works from the running container (the standalone build only traces
# @prisma/client, not the `prisma` CLI itself, since app code never imports
# it directly).
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
