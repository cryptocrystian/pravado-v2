# Phase 0.5 / Plan 03 — /health Endpoints + Uptime Monitoring

**Sprint:** Phase 0.5 Observability
**Status:** in flight
**Date opened:** 2026-06-09

## Why this exists

The api ships a basic `/health` ({status, version, checks: {database, redis}}). It's not aware of Resend, Stripe, or any other downstream dep. The dashboard has no /health at all. UptimeRobot can't tell us anything richer than "200 OK" without endpoints designed for monitoring.

Plan 03 ships:
- `apps/api` /health expanded with downstream dep status (Supabase, Resend SDK init, Stripe SDK init) — but **no real calls to those services** per spec
- `apps/dashboard` /health new — JSON response with Next.js + Vercel deployment metadata + Supabase reachability
- Both responses include `version: process.env.VERCEL_GIT_COMMIT_SHA || process.env.RENDER_GIT_COMMIT || 'unknown'` per architect refinement
- Tests asserting the `deps` object never leaks API keys, internal URLs, or error stack traces per architect refinement
- `docs/operations/UPTIME_MONITORING.md` — copy-paste UptimeRobot config

## Scope

### apps/api

| File | Action |
|---|---|
| `apps/api/src/routes/health/index.ts` | expand: `{status, version, deps: {supabase, resend, stripe}, checks: {database, redis}}`. supabase = ping `auth.getSession` (no-op); resend = verify SDK initializes with `RESEND_API_KEY`; stripe = verify SDK initializes with `STRIPE_SECRET_KEY`. NO real outbound calls. 200 if all up; 503 with detail if any degraded. Version from `RENDER_GIT_COMMIT` env or `'unknown'`. |
| `apps/api/tests/health.test.ts` | new — happy path + each dep failure case + **assertions that the response body contains no API key fragments, no internal URLs, no stack traces** |

### apps/dashboard

| File | Action |
|---|---|
| `apps/dashboard/src/app/health/route.ts` | new — Next.js Route Handler. `{status, version, vercel: {env, deployment, region}, deps: {supabase}}`. supabase ping = same as api side. Version from `VERCEL_GIT_COMMIT_SHA` env or `'unknown'`. |
| `apps/dashboard/src/app/health/route.test.ts` | new — same key-leak / URL-leak / stack-leak assertions |

### Uptime monitoring

| File | Action |
|---|---|
| `docs/operations/UPTIME_MONITORING.md` | new — instructions to set up UptimeRobot monitors at `https://pravado-api.onrender.com/health` and `https://app.pravado.io/health`, 5-min interval, email alerts to `christian@saipienlabs.com`. **Setup itself happens outside this PR** — doc is copy-paste config. |

## Architect-approved refinement

- `version` field on BOTH responses uses `process.env.VERCEL_GIT_COMMIT_SHA || process.env.RENDER_GIT_COMMIT || 'unknown'` so uptime monitors + manual curls show the running SHA.
- Tests assert the `deps` object never leaks API keys, internal URLs, or error stack traces. This is the real risk — health endpoints are unauth and broadcast their state.

## Verification

- [ ] `pnpm typecheck` + `pnpm lint` + `pnpm format:check` + `pnpm test` + `pnpm build` green
- [ ] Plan 06d API startup smoke test continues to pass
- [ ] `curl https://pravado-api.onrender.com/health` returns 200 with `version` + all deps `up`
- [ ] `curl https://app.pravado.io/health` returns 200 with `version` + Vercel deployment metadata
- [ ] `curl` against a deliberately-broken `SUPABASE_URL` (Render staging env tweak) returns 503 with `deps.supabase: 'degraded'`
- [ ] Tests assert no API key fragment, internal URL, or stack trace appears in the response body
- [ ] UptimeRobot monitors configured per the doc and architect confirms they show "Up"
- [ ] All 16 CI checks green

## Risks

- **`/health` becomes a poll target.** Endpoints must be cheap. Spec mandates "do NOT make real Stripe calls" — SDK init only.
- **CORS for browser-based health pings.** Not a concern — health is server-to-server.

## Out of scope

- SLO definitions / error budget tracking — Phase 1
- Synthetic transaction monitors — Phase 1
- Latency percentile tracking beyond Sentry's defaults — Phase 1

## Coordination

- **Plan 01 (Sentry)** independent.
- **Plan 02 (already merged)** — health route handlers use the new logger.
- **Plan 04 (cron)** independent.
- **Plan 05 (pre-commit)** independent.
- **Plan 06c (`@types/node`)** independent.

## DECISIONS_LOG entries

- DECISION (Plan 03 — /health on api + dashboard with version + dep status, no PII leak)
- DECISION (Plan 03 — UptimeRobot architect-managed)
