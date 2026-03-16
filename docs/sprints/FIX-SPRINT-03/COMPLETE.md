# FIX-SPRINT-03 — Complete

**Date**: 2026-03-14
**Scope**: Targeted fixes across TypeScript errors, MSW cleanup, Redis health, and intelligence eval framework

---

## Task 1 — TypeScript Errors in PR/SEO Surfaces

**Status**: Already clear — `pnpm tsc --noEmit` returned zero errors before any changes.

The TS errors referenced in the task description were resolved in a prior session. Verified clean on both `apps/dashboard` and `apps/api`.

## Task 2 — MSW Stale Service Worker Auto-Unregister

**File**: `apps/dashboard/src/mocks/MSWProvider.tsx`

**Change**: Updated the `useEffect` to properly chain `.then()` on the `reg.unregister()` promise and log `[MSW] Stale service worker unregistered` when a stale `mockServiceWorker` registration is cleaned up while `NEXT_PUBLIC_MSW_ENABLED` is not `true`.

The previous implementation called `unregister()` without awaiting/chaining the promise. Now the success callback confirms cleanup.

## Task 3 — Redis Health Liveness Check

**File**: `apps/api/src/routes/health.ts`

**Change**: Replaced the static `configured` status with a real Redis liveness check:
- Dynamically imports `ioredis` and creates a short-lived connection
- Calls `ping()` with a 2-second timeout via `Promise.race`
- Returns `ok` if ping returns `PONG`
- Returns `degraded` with error message if ping fails or times out
- Returns `not_configured` if `REDIS_URL` is not set
- Overall health status is `healthy` only when ALL checks return `ok` or `not_configured`

**Dependency added**: `ioredis` added as explicit dependency to `apps/api/package.json` (was previously only available as a transitive dep of `bullmq`).

## Task 4 — Intelligence Eval Framework

Created 4 documents in `docs/evals/`:

| File | Purpose |
|------|---------|
| `README.md` | Framework overview — two tracks (QA functional vs Intelligence quality), how to run each, what "passing" means |
| `CITEMIND_BENCHMARK.md` | 10-URL benchmark dataset with expected scores and gate statuses, scoring rubric (6 factors, thresholds: >=75 pass, >=55 warn, <55 block), tolerance and failure protocol |
| `SAGE_EVAL_RUBRIC.md` | Human evaluation rubric with 4 dimensions (Relevance, Specificity, Prioritization, Novelty), each rated 1-5 with clear definitions, weekly log table template |
| `EVI_BASELINE_PROTOCOL.md` | Baseline establishment at org creation, 2-week measurement cadence, meaningful change thresholds, 5 recalibration triggers with fix protocols |

---

## Exit Criteria Verification

| # | Criterion | Status |
|---|-----------|--------|
| 1 | `tsc --noEmit` — zero errors | Verified (dashboard + API) |
| 2 | MSWProvider unregisters stale workers when MSW disabled | Updated with `.then()` chain |
| 3 | `GET /health` returns `redis: "ok"` when Redis ping succeeds | Implemented with ioredis ping + 2s timeout |
| 4 | `GET /health` overall `healthy` only when both checks pass | `allOk` logic unchanged — requires all checks `ok` or `not_configured` |
| 5 | All 4 eval docs created in `docs/evals/` | Created: README, CITEMIND_BENCHMARK, SAGE_EVAL_RUBRIC, EVI_BASELINE_PROTOCOL |
| 6 | Sprint summary written | This file |
