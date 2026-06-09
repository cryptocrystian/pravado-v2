# Phase 0.5 / Plan 02 — Structured Logging + Request IDs

**Track owner:** Architect-directed
**Sprint:** Phase 0.5 Observability
**Status:** in flight (this PR)
**Date opened:** 2026-06-09

---

## Why this exists

Pravado's production code paths log via ad-hoc `console.log` / `console.error` calls scattered across `apps/api` and `apps/dashboard`. The result:

- Unstructured strings — Vercel + Render parse JSON natively but receive arbitrary text instead
- No request correlation — an error in `apps/dashboard` can't be traced to the originating API request (and vice-versa)
- Manual log review is the only way to follow a single request through the system
- Sentry (Plan 01) needs structured context to set `request_id` tags and link errors to a trace

Plan 02 ships the foundation: Pino on the api side with per-request child loggers, structured client + server loggers on the dashboard, and a propagated `X-Request-Id` header end-to-end.

## Scope

### apps/api
- Add `pino` (+ `pino-pretty` for dev) to `apps/api/package.json`
- Fastify gets `logger: { level: env.LOG_LEVEL, transport: dev ? 'pino-pretty' : undefined }`
- Fastify `genReqId` returns UUID v4 per request
- `onRequest` hook sets `reply.header('X-Request-Id', request.id)` so downstream callers can correlate
- New `apps/api/src/lib/logger.ts` re-exports the request `child` logger pattern + a boot-time `serviceLogger`
- Sweep `apps/api/src/{services,routes,lib}/**` replacing `console.*` with `request.log.info` (in-request) or `serviceLogger.info` (boot)
- Preserve `console.*` in `apps/api/scripts/**` per architect spec
- Preserve `console.error` for pre-logger-init boot failures with inline `// pre-logger boot phase` comment

### apps/dashboard
- New `apps/dashboard/src/lib/clientLogger.ts` — minimal browser-side structured logger (`debug` / `info` / `warn` / `error`). When Sentry is wired (Plan 01), `warn+` calls `Sentry.captureMessage` — conditional, so this PR doesn't depend on Plan 01.
- New `apps/dashboard/src/lib/serverLogger.ts` — server-component logger emitting JSON (Vercel parses natively); reads `request-id` from `next/headers` if present
- Sweep `apps/dashboard/src/{lib,server,components}/**` replacing `console.*` with the new loggers. Page-level `.tsx` files left for Phase 1.
- `apps/dashboard/src/middleware.ts` injects `x-request-id` header if absent, so all downstream API calls from the dashboard carry it through

### Cross-cutting
- `.env.example` documents `LOG_LEVEL` (default `info`)
- DECISIONS_LOG entries under today's date

## Architect-approved refinements (from sprint kickoff)

- Commit console.* → logger sweep **per-directory** (not in one giant commit). Diff-noisy work + easier to review + faster to bisect if a sweep accidentally swallows a useful log.
- Preserve `console.error` for **pre-logger-init boot failures** with an inline `// pre-logger boot phase` comment so future readers know it's intentional.

## Verification

- [ ] `pnpm typecheck` green
- [ ] `pnpm lint` + `pnpm format:check` green
- [ ] `pnpm test` green
- [ ] `pnpm build` green
- [ ] API startup smoke test (Plan 06d) continues to pass — logger config doesn't crash boot
- [ ] `mock-leak grep` exits 0
- [ ] Manual: `curl -i https://app.pravado.io/api/auth/session-check` (via dashboard preview) → response includes `X-Request-Id` header
- [ ] Manual: trigger a known api error → confirm log line contains the `requestId` AND the dashboard's fetch wrapper passes that ID into a Sentry breadcrumb (latter only verifiable post-Plan-01)
- [ ] Pre-existing `no-console` ESLint warnings in `apps/dashboard/src/server/**` clear post-sweep

## Risks

- **Pino default JSON output may break local dev readability.** Mitigated by gating `pino-pretty` transport on `NODE_ENV === 'development'`.
- **Replacing `console.*` is a wide sweep.** Per-directory commits + verify CI green after each batch within the PR.
- **`next/headers` `cookies()` / `headers()` are server-only.** `serverLogger` must not be imported from a `'use client'` file. Add a unit test if needed.
- **`request.log` child loggers can leak memory** if a request handler stashes them somewhere persistent. Sweep watches for that pattern.

## Out of scope

- OpenTelemetry / W3C trace context — Phase 1 distributed tracing
- Log aggregation service (Vercel + Render natively show JSON logs; aggregation is Phase 1)
- Log retention policies — Phase 1
- Page-level `.tsx` `console.*` cleanup — Phase 1
- Sentry breadcrumb wiring on the dashboard side — Plan 01 (this PR provides the hook, Plan 01 uses it)

## Coordination

- **Plan 01 (Sentry)** consumes this PR's loggers. PRs are independent; whichever merges first, the other rebases. The `clientLogger`'s Sentry hook is conditional (`typeof Sentry !== 'undefined'`) so neither order breaks.
- **Plan 03 (`/health`)** uses the new logger for endpoint instrumentation if merged first; otherwise falls back to bare `console.log` initially and gets swept here.

## Phase 1 issues filed during implementation

(populated as discoveries land)
