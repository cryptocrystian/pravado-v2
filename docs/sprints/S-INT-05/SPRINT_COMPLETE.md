# Sprint S-INT-05: CiteMind Citation Monitor + Intelligence Canvas Live Feed

**Status:** COMPLETE
**Date:** 2026-03-07

## Objective

Build the CiteMind citation monitoring engine — polls real LLM APIs (Perplexity, OpenAI, Anthropic) to detect whether AI engines are citing the customer's content. Results power the Intelligence Canvas CiteMind feed and the Entity Map Ring 3 (Perceived). EVI Visibility score now includes citation rate as a contributing signal.

## Deliverables

### 1. Database Migration (`83_citation_monitor.sql`)
- `citation_monitor_results` table: engine, query_prompt, query_topic, response_excerpt, brand_mentioned, mention_type, citation_url, job_id
- `citation_summaries` table: period_days, total_queries, total_mentions, mention_rate, by_engine, top_cited_topics, competitor_mentions
- RLS policies for org member SELECT + service INSERT
- Indexes: `idx_citations_org_engine`, `idx_citations_org_date`

### 2. Citation Query Generator (`citationQueryGenerator.ts`)
- `generateQueriesForOrg(supabase, orgId)` — generates up to 20 queries per org
- Pulls from content_topic_clusters, content_topics, seo_keywords
- 3 query types: informational, comparative, best-of
- 30% of queries inject brand name subtly for organic detection
- Uses org name and industry for natural query phrasing

### 3. Citation Monitor (`citationMonitor.ts`)
- `monitorCitations(supabase, orgId)` — main entry point
- Supported engines: Perplexity (search-enabled, `llama-3.1-sonar-small-128k-online`), ChatGPT (`gpt-4o-mini`), Claude (`claude-haiku-4-5-20251001`)
- Graceful engine availability: works with any subset of API keys configured
- Brand mention detection: direct (name match), URL citation (domain match)
- 6-hour dedup: skips if same org+query+engine ran recently
- Cost guardrails: max 20 queries/org, cheapest models, budget checks via LlmRouter ledger
- Auto-updates `citation_summaries` after each cycle
- Emits SAGE signals: `content_low_citation_rate` (<5% mention rate), `competitor_citation_gap` (engine never cited brand in 3+ queries)

### 4. Background Worker (`citationMonitorWorker.ts`)
- BullMQ worker on `citemind:monitor` queue
- Payload: `{ orgId: string }`
- Scheduled: every 6 hours via cron pattern `0 */6 * * *`
- Registered in `bullmqQueue.ts` with `enqueueCitationMonitor()` function
- Concurrency: 1

### 5. API Routes (added to `/api/v1/citemind/`)
- `GET /monitor/summary` — citation summary for org (30-day)
- `GET /monitor/results` — paginated citation results with filters: ?engine, ?days, ?mentioned_only, ?limit, ?offset
- `POST /monitor/run` — trigger immediate monitor cycle

### 6. Intelligence Canvas — Live CiteMind Feed
- Backend `/api/v1/sage/intelligence-canvas` now populates `citation_feed` from `citation_monitor_results` (brand_mentioned=true, last 20, ordered by monitored_at DESC)
- Maps to contract shape: `{ engine, query, excerpt, mentioned, timestamp, topic }`
- Replaces the `citation_feed: []` placeholder from S-INT-03

### 7. Entity Map — Ring 3 (Perceived) with Real Data
- Backend `/api/v1/sage/entity-map` now includes AI engine nodes in Ring 3
- 4 engines: ChatGPT, Perplexity, Claude, Gemini
- Each engine node has `meta.citation_count_30d`, `meta.total_queries_30d`, `meta.has_cited`
- Edge `rel: 'cites_brand'` with `strength` = mention rate, `state` = 'verified_solid' or 'gap'
- Engines that never cited the brand show as dashed gap edges

### 8. Dashboard Integration
- **Proxy routes**: `/api/citemind/monitor/summary` (GET), `/api/citemind/monitor/results` (GET)
- **SWR hooks** (`useCiteMind.ts`): `useCitationResults()`, `useCitationSummary()`
- **IntelligenceCanvasPane**: Fetches real citation data via `useCitationResults()`, falls back to mocks when empty. Dynamic "Last scan" timestamp.

### 9. EVI Visibility Score — Citation Rate Component
- Added `citationMentionRate: number` to `VisibilitySignals` interface
- `eviSignalAggregator.ts` now pulls `mention_rate` from `citation_summaries` table
- Visibility score reweighted: pitch activity 30%, engagement 25%, journalist quality 20%, citation rate 25%
- Citation rate: 20%+ mention rate = 100 score (linear scale)
- `SignalBreakdown` type updated with `citation_rate_score` component

### 10. SAGE Signal Integration
- Two new signal types: `content_low_citation_rate`, `competitor_citation_gap`
- Action stream mappings: both map to 'visibility' EVI driver
- CTAs: "Improve AEO" / "Analyze Gap"
- Stub proposal templates in `proposal.ts`

### 11. Environment
- `PERPLEXITY_API_KEY` added to `.env` (optional — system works without it)
- Perplexity API called directly via fetch (OpenAI-compatible format at api.perplexity.ai)
- OpenAI/Anthropic called via existing LlmRouter with ledger tracking

## Architecture Decisions

1. **Multi-engine polling**: Each query is sent to all available engines. Missing API keys skip that engine gracefully.
2. **Perplexity first**: Perplexity's search-enabled model (`sonar-small`) is best for citation detection because it actually searches the web. Non-search models (GPT, Claude) provide training data coverage signals.
3. **6-hour dedup**: Prevents duplicate API costs when the scheduler re-runs. Same org+query+engine combo is skipped if polled within 6 hours.
4. **Separate summary table**: `citation_summaries` is a materialized view pattern — updated after each monitor cycle, not computed on every read. Keeps dashboard queries fast.
5. **EVI reweight**: Citation rate takes 25% of Visibility score, balanced by reducing pitch activity (40→30%) and engagement (35→25%). This reflects PRAVADO's positioning: AI citation is a primary visibility signal.

## Files Created/Modified

### Created
- `apps/api/supabase/migrations/83_citation_monitor.sql`
- `apps/api/src/services/citeMind/citationQueryGenerator.ts`
- `apps/api/src/services/citeMind/citationMonitor.ts`
- `apps/api/src/queue/workers/citationMonitorWorker.ts`
- `apps/dashboard/src/app/api/citemind/monitor/summary/route.ts`
- `apps/dashboard/src/app/api/citemind/monitor/results/route.ts`

### Modified
- `apps/api/src/routes/citeMind/index.ts` — 3 new monitor routes
- `apps/api/src/routes/sage/index.ts` — intelligence-canvas citation_feed + entity-map Ring 3
- `apps/api/src/queue/bullmqQueue.ts` — citation monitor queue + worker + scheduler + enqueue
- `apps/api/src/services/evi/eviSignalAggregator.ts` — citationMentionRate in VisibilitySignals
- `apps/api/src/services/evi/eviCalculationService.ts` — citation_rate_score component + SignalBreakdown
- `apps/api/src/services/sage/sageActionStreamService.ts` — 2 new signal type mappings
- `apps/api/src/prompts/sage/proposal.ts` — 2 new stub templates
- `apps/dashboard/src/lib/useCiteMind.ts` — useCitationResults + useCitationSummary hooks
- `apps/dashboard/src/components/command-center/IntelligenceCanvasPane.tsx` — real data fetching
- `apps/api/.env` — PERPLEXITY_API_KEY

## Exit Criteria Met

1. `citation_monitor_results` table created with proper schema and RLS
2. `citation_summaries` table created with UNIQUE constraint on (org_id, period_days)
3. Intelligence Canvas `citation_feed` populated from real data (not empty placeholder)
4. Entity Map Ring 3 nodes reflect AI engines with citation counts and gap/solid states
5. EVI Visibility score includes citation_rate_score as 25% component
6. SAGE signals generated for low citation rate and competitor gaps
7. Zero TypeScript errors (API clean, dashboard pre-existing only)
8. Sprint doc written

## Dependencies

- **S-INT-01** (EVI pipeline) — EVI calculation modified to include citation rate
- **S-INT-02** (Signal pipeline) — SAGE signal table used for citation signals
- **S-INT-03** (Action stream) — Intelligence canvas + entity map routes modified
- **S-INT-04** (CiteMind) — ENABLE_CITEMIND flag, citeMind routes prefix reused
