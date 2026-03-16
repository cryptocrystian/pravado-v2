# Sprint S-INT-04: CiteMind Quality Scorer + Publish Gate

**Status:** COMPLETE
**Date:** 2026-03-07

## Objective

Build the CiteMind content quality scoring engine and publish gate. When content is saved or published, CiteMind scores it across 6 weighted factors that predict whether AI engines will cite it. Low-scoring content is blocked from publishing.

## Deliverables

### 1. Database Migration (`82_citemind_tables.sql`)
- `citemind_scores` table: 6 factor scores, overall score, gate_status, recommendations, factor_breakdown JSONB
- `citemind_schemas` table: schema_type, schema_json JSONB for JSON-LD structured data
- RLS policies for org member access
- Performance indexes: `idx_citemind_latest(content_item_id, scored_at DESC)`, `idx_citemind_org(org_id, gate_status)`

### 2. CiteMind Quality Scorer (`citeMindQualityScorer.ts`)
- 6-factor heuristic scoring engine (no LLM required for scoring)
- Weighted formula: `overall = (entity x 0.20) + (claim x 0.20) + (structure x 0.15) + (authority x 0.20) + (schema x 0.10) + (citation x 0.15)`
- Gate thresholds: >= 75 passed, >= 55 warning, < 55 blocked
- Optional LLM-powered recommendations via `generateLLMRecommendations()`
- Template-based fallback recommendations from lowest-scoring factors
- Functions: `scoreContentItem()`, `scoreAndPersist()`, factor-specific scorers

### 3. CiteMind Schema Generator (`citeMindSchemaGenerator.ts`)
- JSON-LD structured data generation for content items
- Heuristic type detection: FAQPage, HowTo, BlogPosting, Article
- Template generators for each schema type
- Upserts to `citemind_schemas` table

### 4. CiteMind Publish Gate Service (`citeMindPublishGateService.ts`)
- `checkGate()` - returns allowed/score/gate_status/recommendations
- `acknowledgeGate()` - logs warning override to audit_logs
- `getLatestScore()` - fetch latest score from DB
- `listScoresForOrg()` - list scores with optional gate_status filter
- Feature flag bypass: if `ENABLE_CITEMIND` false, always allows publishing

### 5. Background Worker (`citeMindScoringWorker.ts`)
- BullMQ worker processing `citemind:score` queue jobs
- Registered in `bullmqQueue.ts` with `enqueueCiteMindScore()` function
- Fire-and-forget integration in content PUT `/items/:id` route (triggered on body updates)
- Concurrency: 2 workers

### 6. API Routes (`/api/v1/citemind/`)
- `POST /score/:contentItemId` - trigger scoring (sync, returns score)
- `GET /score/:contentItemId` - get latest score
- `GET /scores` - list scores for org (with gate_status filter)
- `POST /gate/:contentItemId/acknowledge` - override warning gate
- `POST /schema/:contentItemId/generate` - generate JSON-LD schema
- `GET /gate/:contentItemId` - check gate status

### 7. Dashboard Integration
- **Proxy routes**: `/api/citemind/score/[id]` (GET/POST), `/api/citemind/gate/[id]/acknowledge` (POST)
- **SWR hooks** (`useCiteMind.ts`): `useCiteMindScore()`, `useCiteMindTrigger()`, `useCiteMindGateAcknowledge()`
- **CiteMindStatusIndicator**: Rewritten with 6-factor score breakdown, expandable bars, recommendations
- **CiteMindGatingPanel**: Real API integration via `contentItemId` prop
- **ContextRailEditor**: Live CiteMind data from API, "Run CiteMind Analysis" button

### 8. SAGE Integration
- `content_low_citemind` signal emitted when content scores < 55 (blocked)
- Signal includes: score, gate_status, top recommendation
- 7-day TTL, medium/high priority based on score severity
- Action stream mapping: type=alert, driver=authority, CTA="Improve Content"
- Stub proposal template in `proposal.ts`

### 9. Feature Flag
- `ENABLE_CITEMIND: true` in `packages/feature-flags/src/flags.ts`

## Architecture Decisions

1. **Heuristic-only scoring**: All 6 factors scored via regex/NLP heuristics. No LLM calls during scoring to keep latency low and costs minimal.
2. **LLM-optional recommendations**: LLM generates improvement suggestions only when `generateLLMRecommendations()` is explicitly called. Template-based fallback always available.
3. **`ReturnType<typeof createClient>` vs `SupabaseClient`**: Used `getSupabaseClient()` from `lib/supabase.ts` to avoid Supabase v2.81 generic type incompatibilities between `createClient()` return type and `SupabaseClient` default generics.
4. **Fire-and-forget scoring**: Content updates enqueue background scoring jobs rather than blocking the save response.

## Files Created/Modified

### Created
- `apps/api/supabase/migrations/82_citemind_tables.sql`
- `apps/api/src/services/citeMind/citeMindQualityScorer.ts`
- `apps/api/src/services/citeMind/citeMindSchemaGenerator.ts`
- `apps/api/src/services/citeMind/citeMindPublishGateService.ts`
- `apps/api/src/queue/workers/citeMindScoringWorker.ts`
- `apps/api/src/routes/citeMind/index.ts`
- `apps/dashboard/src/app/api/citemind/score/[id]/route.ts`
- `apps/dashboard/src/app/api/citemind/gate/[id]/acknowledge/route.ts`
- `apps/dashboard/src/lib/useCiteMind.ts`

### Modified
- `apps/api/src/server.ts` - registered citeMind routes
- `apps/api/src/queue/bullmqQueue.ts` - added CiteMind queue + worker + enqueue function
- `apps/api/src/routes/content/index.ts` - fire-and-forget scoring on content update
- `apps/api/src/services/sage/sageActionStreamService.ts` - content_low_citemind mappings
- `apps/api/src/prompts/sage/proposal.ts` - content_low_citemind stub template
- `packages/feature-flags/src/flags.ts` - ENABLE_CITEMIND flag
- `apps/dashboard/src/components/content/components/CiteMindStatusIndicator.tsx` - real score data
- `apps/dashboard/src/components/content/components/CiteMindGatingPanel.tsx` - API integration
- `apps/dashboard/src/components/content/editor/ContextRailEditor.tsx` - live CiteMind data

## Exit Criteria Met

1. Content items can be scored via POST `/api/v1/citemind/score/:id`
2. Score breakdown shows 6 factors with weights
3. Gate status enforced: passed (>= 75), warning (>= 55), blocked (< 55)
4. Warning gate acknowledgment persisted to audit_logs
5. JSON-LD schema generated and stored
6. Background worker scores content on body updates
7. SAGE signal emitted for blocked content
8. Dashboard shows live CiteMind data with real API hooks
