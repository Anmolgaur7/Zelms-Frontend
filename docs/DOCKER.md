# Docker — Zelms Frontend

The frontend ships with a three-stage `Dockerfile` and a `docker-compose.yml`
for local + small-prod deployments. The runtime image is based on
`node:20-alpine` and uses Next.js [standalone output][standalone] so it ships
only the resolved server bundle + the `node_modules` actually used at runtime.

[standalone]: https://nextjs.org/docs/app/api-reference/config/next-config-js/output

## Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build: `deps` → `builder` → `runner`. |
| `.dockerignore` | Keeps `node_modules`, `.next`, `.env*`, git history out of the build context. |
| `docker-compose.yml` | One-command local run on port 3000. |
| `.env.example` | Template for `NEXT_PUBLIC_API_URL` + `PORT`. |
| `next.config.mjs` | `output: 'standalone'` enables the slim runtime layer. |

## Quick start

```bash
# 1. Configure the API URL (or accept the default in .env.example).
cp .env.example .env
# edit .env if you need a different backend

# 2. Build + run.
docker compose up --build

# Frontend is now at http://localhost:3000
```

## Plain `docker build` / `docker run`

If you prefer not to use compose:

```bash
# Build (NEXT_PUBLIC_* values are inlined at build time, so pass them here).
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://klonixpharback.onrender.com \
  -t zelms-frontend:latest .

# Run on http://localhost:3000.
docker run --rm -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://klonixpharback.onrender.com \
  zelms-frontend:latest
```

## Configuration

| Variable | Where it matters | Notes |
|----------|------------------|-------|
| `NEXT_PUBLIC_API_URL` | Build **and** runtime | Inlined into the client bundle, so changing it requires a rebuild. |
| `PORT` | Runtime | Defaults to `3000`. The container listens on `0.0.0.0:$PORT`. |
| `NODE_ENV` | Runtime | Set to `production` by both the `Dockerfile` and compose. |

The httpOnly `pharma_token` auth cookie is set by the backend through the
browser; Docker doesn't need to know anything about it.

## Image size & layers

The final image only contains:

- The Alpine Node 20 runtime.
- `/.next/standalone/server.js` + its bundled `node_modules`.
- `/.next/static` (CSS, fonts, hashed chunks).
- `/public` (static assets).

Expect ~150–200 MB compressed depending on the host's Alpine cache.

## Health check

The image declares a `HEALTHCHECK` that hits `GET /` every 30s. The root route
is statically prerendered, so the check stays cheap and never depends on the
backend being reachable.

You can inspect it with:

```bash
docker inspect --format='{{json .State.Health}}' zelms-frontend | jq
```

## Troubleshooting

- **`NEXT_PUBLIC_API_URL` change doesn't take effect.** Next inlines public env
  vars at build time. Re-run `docker compose build --no-cache` (or
  `docker build --build-arg NEXT_PUBLIC_API_URL=...`).
- **Module resolution errors on Alpine.** The `deps` stage installs
  `libc6-compat` already; rebuild from scratch if you previously cached a
  failed install.
- **Port collision.** Override with `PORT=4000 docker compose up`.
- **Behind a reverse proxy.** Terminate TLS at the proxy and forward to
  `:3000`. Don't try to terminate TLS inside the container.
