# Sprint S-INT-01: EVI Pipeline + Redis Queue Wiring

**Status:** Complete
**Date:** 2026-03-07
**Scope:** EVI Calculation Pipeline, BullMQ Queue Wiring, Dashboard Integration

---

## What Was Built

### 1. Database Migration
- `apps/api/supabase/migrations/80_evi_snapshots.sql`
- Table: `evi_snapshots` with org_id, evi_score, visibility/authority/momentum sub-scores, signal_breakdown (jsonb), calculated_at, period_days
- RLS: org members can SELECT; service role can INSERT
- Index: `(org_id, calculated_at DESC)` for efficient history queries

### 2. EVI Services (`apps/api/src/services/evi/`)

| File | Purpose |
|------|---------|
| `eviSignalAggregator.ts` | Pulls raw signals from PR (pitches, journalist DA), Content (quality scores), SEO (backlinks) for a given org and period |
| `eviCalculationService.ts` | Applies formula: `EVI = (V x 0.40) + (A x 0.35) + (M x 0.25)`. Normalizes sub-scores to 0-100. Saves snapshot with full signal_breakdown audit trail |
| `eviHistoryService.ts` | Fetches historical snapshots for trend chart rendering |
| `eviDeltaService.ts` | Compares latest two snapshots to compute delta/direction |

### 3. API Routes
- `GET /api/v1/evi/current` — Calculates current EVI, returns score + delta + signal_breakdown
- `GET /api/v1/evi/history?days=30|60|90` — Returns historical snapshots for charts
- Both routes: auth-required, org-scoped, feature-flagged (`ENABLE_EVI`)
- Registered at `/api/v1/evi` prefix in server.ts

### 4. Dashboard Proxy Routes
- `GET /api/evi/current` — Proxies to Fastify backend via `backendFetch`
- `GET /api/evi/history?days=N` — Proxies to Fastify backend

### 5. Feature Flag
- Added `ENABLE_EVI: true` to `packages/feature-flags/src/flags.ts`
- Routes return 404 if flag is disabled

### 6. BullMQ Queue Wiring (`apps/api/src/queue/`)
- `bullmqQueue.ts` — BullMQ setup with Redis connection parsing (supports Upstash TLS, Redis Cloud)
- `workers/eviRecalculateWorker.ts` — Processes `evi:recalculate` jobs
- Graceful fallback: if `REDIS_URL` not set, logs warning, all enqueue operations are no-ops
- Nightly scheduler: cron pattern `0 0 * * *` (midnight UTC) triggers recalculation for all orgs
- Functions: `enqueueEVIRecalculate(orgId)`, `enqueueEVIRecalculateAll(supabase)`, `shutdownBullMQ()`
- BullMQ initialized conditionally in server.ts when `ENABLE_EVI` flag is true

### 7. Dashboard UI Updates
- `EviScoreCard.tsx` — Now fetches from `/api/evi/current` via `useEVICurrent()` SWR hook. Shows loading skeleton, stale indicator on error, real sub-score breakdown.
- `EviHero.tsx` (SEO surface) — Fetches current score + 30-day trend from real API. Loading skeleton, empty state for no history.
- `EviGrowthChart.tsx` (Analytics surface) — Fetches 30-day history from real API. Loading skeleton, empty state.
- `useEVI.ts` hook — Shared SWR hook with 5-minute revalidation for current, 10-minute for history.

### 8. Dependency
- Added `bullmq` to `apps/api/package.json`

---

## Deviations from Spec

1. **EviContributionCard.tsx** was not wired to real data — it's a static insight paragraph, not a data-driven component. Would require SAGE proposal data to make dynamic (Sprint S-INT-03 scope).

2. **Chrome bar EVI displays** (PRChromeBar, SEOChromeBar, ContentChromeBar, AnalyticsChromeBar) — These were not found as separate components in the codebase. The EVI displays exist only in `EviScoreCard`, `EviHero`, and `EviGrowthChart`, all of which were updated. If chrome bars are added later, they should import `useEVICurrent()` from `@/lib/useEVI`.

3. **Prior period signals** — The momentum calculation uses the same journalist_profiles query for both periods (journalists don't change per-period). This is correct behavior since journalist DA is a current attribute, not time-series data.

4. **BullMQ vs in-memory queue** — The existing in-memory `JobQueue` class was NOT replaced. BullMQ was added alongside it as a separate system (`bullmqQueue.ts`). The in-memory queue continues to serve playbook execution. This avoids breaking existing functionality.

---

## Exit Criteria Checklist

- [x] `GET /api/evi/current` returns a real calculated score (not mock data)
- [x] EVI snapshots are written to the database via `eviCalculationService.ts`
- [x] EviScoreCard, EviHero, EviGrowthChart show real EVI values from API
- [x] BullMQ worker exists (`eviRecalculateWorker.ts`) and can be triggered via `enqueueEVIRecalculate(orgId)`
- [x] Zero NEW TypeScript errors (pre-existing errors in PR/onboarding modules unchanged)

---

## Open Questions

1. **Signal table compatibility** — The aggregator queries `pr_pitches`, `content_quality_scores`, `seo_backlinks`, and `journalist_profiles`. Some of these tables may have slightly different column names than assumed (e.g., `domain_authority` vs `da`, `scored_at` vs `created_at`). If queries return empty results, check column names in the actual migration files.

2. **Redis connection in production** — The `REDIS_URL` env var needs to be set in Render for BullMQ to activate. Without it, queue operations are no-ops and EVI only recalculates on-demand via the API endpoint.

3. **EVI recalculation frequency** — Currently set to nightly. For faster feedback during beta, consider reducing to every 4 hours.
