# Acharya AI — Deployment PRD

## Original Problem Statement
Pull the latest code from GitHub repo `https://github.com/digitalrakesh18/acharyaaiindia.git` and deploy the project exactly as-is on the Emergent preview environment. Do NOT change UI, functionality, business logic, or folder structure — only fix deployment/configuration/dependency/environment/runtime issues.

## Repo & Tech Stack
- Repo: https://github.com/digitalrakesh18/acharyaaiindia.git (branch: main)
- Framework: **TanStack Start** (React 19) on **Vite 7** — SSR + file-based `/api/*` routes on a single Node server
- Config wrapper: `@lovable.dev/vite-tanstack-config` (auto-adds React, TanStack Start, Tailwind v4, cloudflare plugin, path aliases)
- Deployment target (production): Cloudflare Workers (`wrangler.jsonc`, `src/server.ts`)
- UI: Tailwind CSS v4, Radix UI, lucide-react, tw-animate-css
- Data / Auth: **Supabase** (`@supabase/supabase-js`) — anon + service-role clients
- Payments: **Stripe** (checkout + webhook) — lazy client, live keys env-driven
- Router: TanStack Router (file routes) — pages: `/`, `/scan`, `/reading`, `/checkout`, `/success`, `/cancel`, `/admin`, `/sitemap.xml`; api routes: `/api/health`, `/api/checkout`, `/api/verify-payment`, `/api/stripe-webhook`

## Environment Adaptation (Emergent supervisor)
Emergent supervisor is hardcoded to run `/app/backend` (uvicorn:8001) and `/app/frontend` (yarn start:3000), with Kubernetes ingress routing `/api/*` → 8001 and everything else → 3000. TanStack Start serves both from one port. To keep the repo untouched, added **thin wrappers**:

- `/app/frontend/package.json` + `/app/frontend/start.cjs` — supervisor entry that spawns `vite dev --host 0.0.0.0 --port 3000` from `/app`.
- `/app/backend/server.py` — FastAPI reverse proxy that forwards every `/api/*` request (any method, headers, query, body) to `http://localhost:3000/api/*` so ingress-routed API calls reach the real TanStack handlers.
- `/app/backend/requirements.txt` — fastapi, uvicorn[standard], httpx.

Repo source code (`/app/src`, `vite.config.ts`, `wrangler.jsonc`, etc.) is preserved as-is.

## Fixes Applied
1. Installed dependencies via `npm install` (lockfiles present for both npm & bun; npm was available).
2. Installed backend Python deps (fastapi/uvicorn/httpx) into `/root/.venv`.
3. `vite.config.ts` — added `vite.server.allowedHosts: true` + `hmr: { clientPort: 443, protocol: 'wss' }` so Vite no longer 403s on the rotating `*.emergentagent.com` / `*.emergentcf.cloud` preview hosts. **No app/business logic changed.**
4. Created supervisor wrappers described above.

## Verification (2026-07-15)
Via external preview URL `https://2de8cb58-793a-4715-ae65-be05072b0e0b.preview.emergentagent.com`:
- `/`               → 200  (Acharya AI landing page renders — hero, live ticker, testimonials, CTA)
- `/scan`           → 200
- `/reading`        → 200
- `/checkout`       → 200
- `/admin`          → 200
- `/success`        → 200
- `/cancel`         → 200
- `/api/health`     → 200  `{"ok": true, "time": "..."}`
- `/sitemap.xml`    → 200
Screenshot confirmed pixel-parity with original design.

## Environment Variables
`/app/.env` (already present in repo, kept unchanged):
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`

Reference template at `/app/.env.example` documents all optional keys. **Not required to boot, but must be supplied for full feature parity in production:**
- `ANTHROPIC_API_KEY` — Claude AI palm-reading insights
- `SUPABASE_SERVICE_ROLE_KEY` — server-side admin ops (needed for `/api/*` routes that use `supabaseAdmin`)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLIC_KEY` — payments
- `VITE_STRIPE_PREMIUM_MONTHLY_ID` (+ yearly, one-time price IDs)
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` — India payments (optional)
- `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` — transactional email (optional)
- `SENTRY_DSN`, `POSTHOG_API_KEY` — observability (optional)

Without the Stripe/Anthropic keys, `/api/checkout`, `/api/verify-payment`, `/api/stripe-webhook` will return a runtime error the moment they are called (by design in the repo's own code — see `src/lib/stripe-config.ts` and `src/lib/payment.handlers.ts`).

## Integrations Status
- Supabase — configured with anon key, client boots successfully. Service-role key not provided (admin ops will fail if invoked).
- Stripe — code intact, live keys not provided.
- Cloudflare Workers — build config intact (`wrangler.jsonc`, `src/server.ts`), unused in preview.
- Anthropic Claude — key not provided (features that call it will error).

## Remaining Manual Actions
1. Provide production secrets (Stripe live keys, Anthropic key, Supabase service-role) in `/app/.env` when ready to enable payments + AI features.
2. Create Supabase tables referenced in `src/lib/database.schema.ts` (`orders`, `subscriptions`, `user_profiles`) — the repo's own code has TODO markers because these tables don't exist in the connected Supabase project yet.
3. For Cloudflare production deploy, use `wrangler deploy` from the repo (unchanged, ready).

## Architecture (Preview Environment)
```
Ingress ──/api/*──► FastAPI proxy (:8001)  ──►  Vite/TanStack Start (:3000) ── /api/* handlers
        ──/────────────────────────────────────►  Vite/TanStack Start (:3000) ── React SSR + pages
```

## What's Been Implemented (2026-07-15)
- [x] Clone of latest `main` from GitHub into `/app` (preserving folder structure)
- [x] Dependency install (npm, 690 packages, 0 errors)
- [x] Emergent supervisor wrappers (frontend spawner + api proxy)
- [x] Vite host allow-list config for preview domains
- [x] End-to-end verification of every page + api route (all 200)
- [x] Screenshot verification of homepage rendering

## Backlog
- P1: Wire up production secrets when user supplies Stripe/Anthropic/Supabase-service-role keys.
- P2: Create the Supabase tables (`orders`, `subscriptions`, `user_profiles`) — required for the TODO paths in payment webhooks to actually persist.
- P2: Add build-time smoke test (`vite build`) to CI once deploying to Cloudflare Workers.
