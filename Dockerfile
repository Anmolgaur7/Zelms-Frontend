# syntax=docker/dockerfile:1.7

# ───────────────────────────────────────────────────────────────────────────────
# Zelms Frontend — production Docker image
#
# Three stages:
#   1. deps     — install full npm dependency tree (cached via package-lock).
#   2. builder  — run `next build` against the resolved dependencies.
#   3. runner   — copy the Next.js `standalone` output + static assets only,
#                 run as a non-root user.
#
# Build:
#   docker build -t zelms-frontend .
#
# Run (override the API URL if needed):
#   docker run --rm -p 3000:3000 \
#     -e NEXT_PUBLIC_API_URL=https://api.example.com \
#     zelms-frontend
# ───────────────────────────────────────────────────────────────────────────────

ARG NODE_VERSION=20-alpine

# ─── 1. deps ──────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

# libc6-compat keeps some npm postinstall scripts happy on Alpine.
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ─── 2. builder ───────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

# NEXT_PUBLIC_* values are inlined at build time, so they must be available
# when `next build` runs. Pass them with `--build-arg` (CI) or set safe
# defaults here.
ARG NEXT_PUBLIC_API_URL=https://klonixpharback.onrender.com
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ─── 3. runner ────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Non-root user (matches the user Next.js docs recommend).
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 --ingroup nodejs nextjs

# Standalone output bundles the minimum node_modules required for runtime.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Cheap liveness check — the root route is statically prerendered and 200s
# without hitting the API.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
