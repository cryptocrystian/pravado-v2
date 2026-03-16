# Sprint S-INT-02: SAGE Signal Ingestion Pipeline + Opportunity Scorer

**Status:** Complete
**Date:** 2026-03-07
**Scope:** SAGE signal ingestors for all three pillars, opportunity scorer, background worker, API routes

---

## What Was Built

### 1. Database Migration
- `apps/api/supabase/migrations/81_sage_signals_proposals.sql`
- Table: `sage_signals` with org_id, signal_type, pillar, source_table, source_id, signal_data (jsonb), evi_impact_estimate, confidence, priority, expires_at, scored_at
- Table: `sage_proposals` (schema ready for Sprint S-INT-03)
- RLS: org members can SELECT; service role can INSERT/manage
- Indexes: `(org_id, scored_at DESC)`, `(org_id, priority, scored_at DESC)`, `(source_table, source_id)`, `(expires_at)` partial

### 2. PR Signal Ingestor (`sagePRSignalIngestor.ts`)

| Signal Type | Source | Logic |
|------------|--------|-------|
| `pr_stale_followup` | `pr_pitch_contacts` | Contacts with status 'sent', sequence created > 5 days ago, no 'replied' event in `pr_outreach_events` |
| `pr_high_value_unpitched` | `journalist_profiles` | Profiles with `engagement_score > 70` that have never been pitched by this org (no matching `pr_pitch_contacts`) |
| `pr_pitch_window` | `journalist_relationship_events` | Events from last 7 days with positive sentiment and positive relationship_impact |

### 3. Content Signal Ingestor (`sageContentSignalIngestor.ts`)

| Signal Type | Source | Logic |
|------------|--------|-------|
| `content_stale_draft` | `content_items` | Draft status, `updated_at` > 14 days ago |
| `content_low_quality` | `content_quality_scores` | Published content with `score < 50` |
| `content_coverage_gap` | `content_topics` | Topics linked to non-published content items |

### 4. SEO Signal Ingestor (`sageSEOSignalIngestor.ts`)

| Signal Type | Source | Logic |
|------------|--------|-------|
| `seo_position_drop` | `seo_keywords` | `current_position - target_position > 5` (regression from target) |
| `seo_opportunity_keyword` | `seo_keyword_metrics` | Keywords with `search_volume > 1000` and `current_position > 20` |
| `seo_content_gap` | `seo_keywords` | Keywords with `target_position < 10` but no matching content topic |

### 5. Master Ingestor (`sageSignalIngestor.ts`)
- Orchestrates all three pillar ingestors via `Promise.allSettled`
- Deduplicates against existing signals (same signal_type + source_table + source_id within 7 days)
- Writes new signals to `sage_signals` table
- Returns `ScanResult` with counts by pillar and any errors

### 6. Opportunity Scorer (`sageOpportunityScorer.ts`)
- Formula: `opportunity_score = (evi_impact × 0.50) + (confidence × 0.30 × 100) + (priority_weight × 0.20)`
- Priority weights: critical=100, high=75, medium=50, low=25
- Filters out expired signals
- Returns top N opportunities sorted by score descending

### 7. API Routes (`/api/v1/sage/`)
- `POST /scan` — Triggers a full SAGE signal scan for the user's org
- `GET /signals` — Returns recent signals with optional `?pillar=PR|Content|SEO&limit=N` filtering
- `GET /opportunities` — Returns ranked opportunities with optional `?limit=N`
- All routes: auth-required, org-scoped, feature-flagged (`ENABLE_SAGE_SIGNALS`)

### 8. Background Worker (`sageSignalScanWorker.ts`)
- BullMQ worker for `sage:signal-scan` queue
- Payload: `{ orgId: string }`
- Concurrency: 1 (sequential scans to avoid DB pressure)
- Integrated into `bullmqQueue.ts` initialization when `ENABLE_SAGE_SIGNALS` is true

### 9. Feature Flag
- Added `ENABLE_SAGE_SIGNALS: true` to `packages/feature-flags/src/flags.ts`
- Routes return 404 if flag is disabled
- BullMQ SAGE worker only initializes if flag is true

---

## Schema Corrections from Spec

The original spec assumed table/column names that don't match the actual migrations. These were corrected:

| Spec Assumed | Actual | Fix Applied |
|-------------|--------|-------------|
| `pr_pitches` | `pr_pitch_contacts` + `pr_pitch_sequences` | PR ingestor joins contacts to sequences via `sequence_id` |
| `journalist_profiles.domain_authority` | `engagement_score`, `responsiveness_score`, `relevance_score` | Use `engagement_score > 70` for high-value detection |
| `journalist_timeline_events` | `journalist_relationship_events` | Correct table name used |
| `content_quality_scores.overall_score` | `score` | Correct column name used |
| `content_quality_scores.scored_at` | `updated_at` | Correct timestamp column used |
| `seo_keyword_metrics.position` | No position column in metrics | Use `seo_keywords.current_position` instead |

---

## Exit Criteria Checklist

- [x] `POST /api/v1/sage/scan` triggers a signal scan and returns results
- [x] Three pillar-specific ingestors scan real tables with correct column names
- [x] Master ingestor deduplicates and writes to `sage_signals`
- [x] Opportunity scorer ranks signals by composite score
- [x] BullMQ worker (`sageSignalScanWorker.ts`) can process scan jobs
- [x] Feature flag `ENABLE_SAGE_SIGNALS` gates all routes and worker
- [x] Zero NEW TypeScript errors in `@pravado/api` (pre-existing dashboard errors unchanged)

---

## Files Created/Modified

### Created
| File | Purpose |
|------|---------|
| `apps/api/supabase/migrations/81_sage_signals_proposals.sql` | DB migration |
| `apps/api/src/services/sage/sagePRSignalIngestor.ts` | PR signal detection |
| `apps/api/src/services/sage/sageContentSignalIngestor.ts` | Content signal detection |
| `apps/api/src/services/sage/sageSEOSignalIngestor.ts` | SEO signal detection |
| `apps/api/src/services/sage/sageSignalIngestor.ts` | Master orchestrator |
| `apps/api/src/services/sage/sageOpportunityScorer.ts` | Opportunity ranking |
| `apps/api/src/queue/workers/sageSignalScanWorker.ts` | BullMQ worker |
| `apps/api/src/routes/sage/index.ts` | API routes |

### Modified
| File | Change |
|------|--------|
| `packages/feature-flags/src/flags.ts` | Added `ENABLE_SAGE_SIGNALS: true` |
| `apps/api/src/server.ts` | Imported + registered SAGE routes at `/api/v1/sage` |
| `apps/api/src/queue/bullmqQueue.ts` | Added SAGE queue, worker, enqueue function, shutdown |

---

## Open Questions

1. **Signal freshness** — Deduplication window is 7 days. Signals older than 7 days with the same source will be re-created. This is intentional to catch recurring issues, but may need tuning.

2. **Scan frequency** — No nightly scheduler was added for SAGE scans (unlike EVI). Sprint S-INT-03 may add a scheduled scan or trigger scans on data changes.

3. **content_topics join pattern** — The coverage gap detection joins content_topics to content_items via `content_item_id`. This assumes the FK relationship exists. If content_topics has no items, this signal type will produce no results.
