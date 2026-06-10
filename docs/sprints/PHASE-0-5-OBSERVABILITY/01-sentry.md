# Phase 0.5 / Plan 01 — Sentry Wiring

**Sprint:** Phase 0.5 Observability
**Closes:** Phase 1 issue #19 (api Sentry DSN on Render invalid format)
**Status:** in flight
**Date opened:** 2026-06-09

## Why this exists

Phase 0.5 Plan 02 (Pino + custom client/server loggers) shipped a conditional Sentry hook that no-ops until this PR wires the real `@sentry/nextjs` SDK on the dashboard. The api already has Sentry init code (`apps/api/src/server.ts`) but the Render `SENTRY_DSN` env var is mis-formatted, so Sentry is currently disabled in production (per Phase 0.5 06b investigation log entry).

## Scope

### apps/dashboard (`@sentry/nextjs`)

| File                                     | Action                                                                                                                                  |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/dashboard/package.json`            | add `@sentry/nextjs` (Next 14 compatible version pinned)                                                                                |
| `apps/dashboard/sentry.client.config.ts` | client init, env-gated on `NEXT_PUBLIC_SENTRY_DSN`, `tracesSampleRate: 0.1` in prod / `1.0` in dev                                      |
| `apps/dashboard/sentry.server.config.ts` | server init, env-gated on `SENTRY_DSN`, same sampling                                                                                   |
| `apps/dashboard/sentry.edge.config.ts`   | edge runtime init for middleware                                                                                                        |
| `apps/dashboard/next.config.js`          | wrap with `withSentryConfig` for source-map upload (gated on `SENTRY_AUTH_TOKEN` presence so dev builds don't try to upload)            |
| `apps/dashboard/src/lib/clientLogger.ts` | replace the `globalThis.Sentry` lookup with a real `@sentry/nextjs` import so warn/error events route to Sentry without the indirection |

### PII scrubbing rules (in both `beforeSend` hooks)

Per architect refinement to the master plan:

- Redact `event.user.email`, `event.user.username`, `event.user.ip_address` → `[redacted]`
- Walk `event.request.cookies` + `event.request.headers.cookie` → `[redacted]`
- Walk `event.request.headers.authorization` → `[redacted]`
- Walk `event.extra` + `event.tags` recursively, redact any value matching an email regex
- **NEW per architect refinement: routes matching `/webhooks/*` drop `event.request.data` entirely in `beforeSend`** (webhooks carry signed payloads that may contain customer PII)
- Drop events where `event.exception.values[0].value` contains `JWT` or `Bearer ` (token leak guard)

### apps/api

- `apps/api/src/server.ts` — Sentry init already present (lines 100-117). No code change needed.
- **Issue #19 fix:** update Render env var `SENTRY_DSN` to a real DSN (architect-owned via Render dashboard). Cannot be done in code; tracked in the issue.

### Verification flow (per architect refinement — keep through CI green + manual verify, delete BEFORE ready-for-review)

| File                                               | Action                                                                                                                                                                                                                                 |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/dashboard/src/app/api/_test/sentry/route.ts` | NEW — throws on GET. Gated to `@saipienlabs.com` emails. Used once to verify the dashboard Sentry wiring catches the event with PII scrubbed. **Deleted in a follow-up commit on the same branch BEFORE marking PR ready-for-review.** |

The same test route on api side is not needed — the existing 500 error handler at `server.ts:489-515` calls `Sentry.captureException` for 5xx errors and verifies wiring once a test 5xx is triggered manually.

### .env.example

Document `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.

## Verification

- [ ] `pnpm typecheck` + `pnpm lint` + `pnpm format:check` + `pnpm test` + `pnpm build` green
- [ ] `bash scripts/detect-mock-leaks.sh` exit 0
- [ ] Plan 06d API startup smoke test continues to pass
- [ ] Manual once-off: hit `/api/_test/sentry` → confirm event lands in Sentry dashboard with PII scrubbed → delete the route in same PR before merge
- [ ] Source maps uploaded to Sentry (verify via Sentry → Releases on the Vercel build)
- [ ] All 16 CI checks green
- [ ] Issue #19 closed with reference to merge SHA after Render env var is updated

## Risks

- **Source-map upload requires `SENTRY_AUTH_TOKEN` as Vercel secret.** Set via `vercel env add SENTRY_AUTH_TOKEN production` (architect action; not in code). Graceful skip if absent.
- **`@sentry/nextjs` version compatibility with Next 14.** Will lock to a known-compatible version + pin in PR.
- **Performance sampling at 10%** is intentional cost-control — under beta load (3-5 users) traces are negligible. Architect can override during beta.

## Out of scope

- Sentry Cron monitors (Plan 04 overlap)
- Replay (extra cost, defer to Phase 1)
- Session sampling per user-cohort (beta too small to need cohorts)

## Coordination

- **Plan 02 (already merged)** wired the conditional Sentry hook in `clientLogger`. This PR replaces the `globalThis.Sentry` lookup with a real `@sentry/nextjs` import, deactivating the conditional path.
- **Plan 03 (`/health`)** independent — health endpoints don't depend on Sentry.
- **Plan 04 (cron)** independent — failure notification uses email, not Sentry.
- **Plan 05 (pre-commit)** independent.
- **Plan 06c (`@types/node`)** independent.

## DECISIONS_LOG entries

To land in this PR:

- DECISION (Plan 01 — Sentry wired on dashboard + api with PII scrubbing)
- DECISION (Plan 01 — webhooks/\*: drop event.request.data per architect refinement)
- DECISION (Plan 01 — test route lifecycle: ship through CI green, delete before review)
