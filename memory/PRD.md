# Acharya AI — Product & Engineering PRD

## Original problem statement
Deploy the acharyaaiindia GitHub repo as-is, then in a follow-up: integrate Razorpay TEST payments, build a real functional admin panel with fresh JWT auth, do a full visual refresh with less copy + FOMO, use real bg-removed palm photographs across the app, keep the palm-scanning experience "super real" (line drawing over the seeker's own captured image), refresh the Acharya bot, audit end-to-end, and be ready to ship.

## Repo & Tech Stack
- Repo: https://github.com/digitalrakesh18/acharyaaiindia.git (branch `main`, cloned in place at /app)
- Framework: **TanStack Start** (React 19) on **Vite 7** — SSR + file-based `/api/*` routes on one Node server
- Deploy target (production): Cloudflare Workers (`wrangler.jsonc`, `src/server.ts`). Preview here runs `vite dev`.
- Backend companion: **FastAPI** at `/app/backend/server.py` — owns admin auth, MongoDB storage, LLM proxy, and reverse-proxies every other `/api/*` to Vite.
- UI: Tailwind CSS v4, Radix UI, lucide-react, tw-animate-css
- Data / Auth (public app): Supabase — anon client only
- Data / Auth (admin console): custom JWT (HS256 via PyJWT), single seat, credentials from env
- Storage (orders / readings / users): MongoDB
- Payments: **Razorpay** in TEST mode (INR)
- AI: **Claude Sonnet 4.5** via `emergentintegrations` (routed through a local `/llm/anthropic/v1/messages` proxy that translates Anthropic Messages API ↔ Emergent LLM key)

## User personas
1. **The seeker** — anonymous public visitor. No sign-in. Wants a fast palm reading, curious about their future, willing to pay ₹49–₹5,999 to unlock the deeper reading.
2. **The admin (site owner)** — single-seat console at `/admin` protected by JWT. Watches orders, readings, and returning seekers, runs API health checks, sees Razorpay test-card recipe.

## What was built (2026-07-15)

### Deployment adaptation
- Kept the repo's folder structure untouched.
- Added supervisor-friendly wrappers only: `/app/frontend/start.cjs` (boots `vite dev` on 3000) and `/app/backend/server.py` (FastAPI on 8001).
- `vite.config.ts` extended with `server.allowedHosts: true` + HMR-over-wss so the rotating preview hosts don't get 403'd.
- All `/api/*` requests are Kubernetes-ingressed to port 8001. FastAPI serves the admin/events/LLM routes natively and reverse-proxies everything else to the Vite server (order matters — FastAPI-native routes are declared first).

### Razorpay (test mode)
- Server-side helpers in `src/lib/razorpay.ts` (`createOrder`, `verifyCheckoutSignature`, `verifyWebhookSignature`, `fetchPayment`) with a canonical `PLAN_CATALOG` in paise so client can't tamper with the amount.
- API routes: `POST /api/razorpay-order`, `POST /api/razorpay-verify`, `POST /api/razorpay-webhook`.
- `/checkout` opens the Razorpay modal via `https://checkout.razorpay.com/v1/checkout.js` with the returned order, prefilled email/name/phone.
- `/success` verifies signature server-side, cross-checks payment via Razorpay's Payments API, unlocks the reading on success, shows a clear failed/pending state otherwise.
- Every payment event (created / paid / signature_failed / webhook_*) is logged to the admin store via `logEvent()`.
- **CSP updated** in `src/lib/security.ts` to whitelist `checkout.razorpay.com`, `api.razorpay.com`, `*.razorpay.com` across `script-src / connect-src / frame-src / form-action`.

### Admin console (`/admin`)
- Fresh JWT auth. Login form at `/admin` if no token; otherwise the console.
- Credentials via env: `ADMIN_USERNAME=admin`, `ADMIN_PASSWORD=Admin@12345`, `JWT_SECRET`. On backend boot the password is bcrypt-hashed and upserted into `admins` collection so rotating env password just works.
- Dashboard shows:
  - 4 metric cards — Revenue (₹), Total orders (+paid count), Palm readings, Seekers.
  - Tabbed tables — Orders / Readings / Seekers — live from MongoDB with status badges, timestamps in en-IN.
  - Health-checks panel (Razorpay endpoint, backend health).
  - Test-card recipe sidebar.
- All data-testids in place (`admin-login-*`, `admin-metric-*`, `admin-orders-row-N`, `admin-refresh`, `admin-logout`).

### AI palm reading (real)
- `src/lib/reading.functions.ts` now calls Claude via a configurable `ANTHROPIC_BASE_URL` (`http://localhost:8001/llm/anthropic`) using model `claude-sonnet-4-5-20250929`.
- The FastAPI proxy translates the Anthropic Messages API format → `emergentintegrations.LlmChat` under the hood, so the shared Emergent LLM key is used and no raw Anthropic key is required.
- The graceful fallback (`buildFallbackReadingResult`, `buildFallbackChatAnswer`) stays intact if the proxy is unreachable.
- Every successful reading is logged to the admin store.

### Visual refresh
- **Real palm photograph** (bg-removed via `rembg` u2net + alpha matting) is now the hero centerpiece — `/app/src/assets/palms/palm-open-1200.png` (a second angle at `palm-open-alt-1200.png`).
- New `PalmHologram` component uses the real palm PNG with SVG overlays animating Life / Head / Heart / Fate rekhas being drawn onto the hand + mount dots popping in + a scan sweep.
- Homepage rewrite (`src/routes/index.tsx`): tight three-line hero (**"Your palm. Your destiny. In 60 seconds."**), live-count FOMO card (247 seekers reading now, 22,481+ read, whisper card "a destiny line breaks at 28…"), 3-step ritual explainer with icons instead of paragraphs, popular-question chip grid, FOMO strip with the second palm photo.
- Checkout rebuilt with a plan-picker card grid, larger money display, Razorpay-native prefill, and test-card recipe under the pay button.
- Reading paywall reworded to Razorpay ("Starts at ₹49 · Razorpay test mode · UPI, cards, netbanking").

### Auditing / observability
- Every order, reading, and user-touch flows through `/api/events` → MongoDB.
- `test_credentials.md` written to `/app/memory/`.
- Backend regression suite lives in `/app/backend/tests/backend_test.py` — 19 pytest cases, all green.

## Verification (2026-07-15)
| Surface | Result |
|---|---|
| `/` (homepage) | 200 · new hero + palm photo + FOMO renders |
| `/scan` | 200 · hand picker → capture → focus → analyzing flow |
| `/reading` | 200 · palm overlay + AI reading via Claude 4.5 |
| `/checkout` | 200 · plan cards + Razorpay modal opens |
| `/success` | 200 · signature-verified branches (complete/failed/pending) |
| `/admin` | 200 · JWT login → dashboard with real metrics + tables |
| `/api/health` | 200 |
| `/api/admin/login` | 200 with correct creds, 401 otherwise |
| `/api/razorpay-order` | 200 · returns real `order_...` id + test key |
| `/api/razorpay-verify` (bad sig) | 400 · `status: "failed"` |
| Backend pytest | **19/19 pass** (iteration_2) |
| Razorpay modal launch | ✅ verified in real browser (CSP whitelist fixed) |

## Remaining manual actions
1. **Razorpay live keys** — when going live, swap `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`/`VITE_RAZORPAY_KEY_ID` in `/app/.env` from `rzp_test_*` to live values and register the webhook URL in the Razorpay dashboard.
2. **Webhook secret** — set `RAZORPAY_WEBHOOK_SECRET` from Razorpay dashboard → Settings → Webhooks after you register the webhook.
3. **MongoDB backup** — the preview MongoDB is process-local. In production, point `MONGO_URL` to a managed cluster (Atlas / self-hosted) and enable backups.
4. **Custom domain + Supabase tables (optional for production)** — the schema in `src/lib/database.schema.ts` (`orders`, `subscriptions`, `user_profiles`) can be created in Supabase and used to replace MongoDB later. Right now everything is served from MongoDB, which is enough for real-world shipping.

## Backlog
- P1: Email/receipt integration (SendGrid template — envs are pre-scaffolded, just needs a key).
- P2: Two-factor for admin (TOTP).
- P2: CSV export from admin.
- P3: Reading share URL (SEO + virality).
