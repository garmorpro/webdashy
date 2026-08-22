# WebDashy — production Docker image
#
# Multi-stage build: install deps, build with Prisma client + Next.js
# standalone output, then run on a slim, non-root final image.
#
# Debian-slim (not Alpine) is used deliberately — Prisma's query engine
# binaries target glibc by default, which avoids musl/Alpine binary-target
# headaches. See https://www.prisma.io/docs/orm/reference/prisma-schema-reference#binarytargets-options

ARG NODE_VERSION=22-slim

# --- deps: full install (incl. devDependencies), used to build the app ---
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

# --- prod-deps: production-only install, for the runner's node_modules ---
# A clean `npm ci --omit=dev` (rather than cherry-picking files out of the
# `deps` install) so npm's own symlinks — e.g. node_modules/.bin/prisma,
# which points into node_modules/prisma/build/ where its .wasm files live —
# stay intact. Docker COPY of an individual symlinked file dereferences it
# into a flat file in the wrong directory, breaking Prisma's relative
# lookup of its bundled schema-engine .wasm at runtime.
FROM node:${NODE_VERSION} AS prod-deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev

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

# Full production node_modules (see prod-deps stage comment above) — layered
# on top of standalone's traced subset so `docker compose exec app npx
# prisma migrate deploy` / `npm run db:seed` work from the running
# container, not just the app itself.
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
