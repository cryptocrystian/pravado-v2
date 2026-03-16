# Sprint S-INT-03: SAGE Proposal Generator + Command Center De-Mock

**Status:** Complete
**Date:** 2026-03-07
**Scope:** LLM-powered proposal generation from scored signals, action stream service, 5 real API routes replacing MSW mocks, feature flag

---

## What Was Built

### 1. Proposal Prompt Template (`apps/api/src/prompts/sage/proposal.ts`)
- `buildProposalSystemPrompt(orgName)` — SAGE brand voice, requires JSON output `{ title, rationale, suggested_action }`
- `buildProposalUserPrompt(ctx)` — Signal data + org context for LLM
- `generateStubProposal(ctx)` — Deterministic fallback with templates for all 9 signal types (pr_stale_followup, pr_high_value_unpitched, pr_pitch_window, content_stale_draft, content_low_quality, content_coverage_gap, seo_position_drop, seo_opportunity_keyword, seo_content_gap)

### 2. Proposal Generator (`apps/api/src/services/sage/sageProposalGenerator.ts`)
- `generateProposals(supabase, orgId)` — Main entry point
- Gets top unprocessed signals (no existing proposal), sorted by evi_impact_estimate DESC
- Checks monthly LLM budget (500K tokens) via `llm_usage_ledger`
- Uses LlmRouter: Claude Sonnet primary, stub fallback on budget exceeded or LLM error
- Parses structured JSON from LLM response; falls back to stub on parse failure
- Saves proposals to `sage_proposals` table with reasoning_trace
- Max 10 proposals per scan cycle
- Deep links built per pillar and signal type

### 3. Action Stream Service (`apps/api/src/services/sage/sageActionStreamService.ts`)
- `getActionStreamForOrg(supabase, orgId, filters?)` — Maps sage_proposals → ActionItem contract
- Pillar case conversion: DB 'PR'/'Content'/'SEO' → frontend 'pr'/'content'/'seo'
- Signal type → action type mapping (proposal/alert/task)
- Signal type → EVI driver mapping (visibility/authority/momentum)
- Signal type → CTA mapping (primary/secondary actions)
- Builds signals[] array from EVI impact, confidence, priority
- Splits stored rationale at `\n\nRecommended: ` for summary vs recommended_next_step

### 4. Six New Fastify Routes (`apps/api/src/routes/sage/index.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/v1/sage/generate-proposals` | POST | Trigger proposal generation (feature-flagged) |
| `/api/v1/sage/action-stream` | GET | Real action stream from sage_proposals |
| `/api/v1/sage/strategy-panel` | GET | Real EVI + top movers from proposals |
| `/api/v1/sage/orchestration-calendar` | GET | Calendar items from content_items |
| `/api/v1/sage/entity-map` | GET | Graph from orgs, topics, journalists |
| `/api/v1/sage/intelligence-canvas` | GET | Graph with citation_feed placeholder |

### 5. Dashboard Route Handler Rewrites
All 5 Command Center Next.js route handlers rewritten from static JSON to `backendFetch()` proxy:

| Dashboard Route | Backend Target |
|----------------|---------------|
| `/api/command-center/action-stream` | `/api/v1/sage/action-stream` |
| `/api/command-center/strategy-panel` | `/api/v1/sage/strategy-panel` |
| `/api/command-center/orchestration-calendar` | `/api/v1/sage/orchestration-calendar` |
| `/api/command-center/entity-map` | `/api/v1/sage/entity-map` |
| `/api/command-center/intelligence-canvas` | `/api/v1/sage/intelligence-canvas` |

### 6. MSW Cleanup
- All 5 Command Center MSW handlers removed from `apps/dashboard/src/mocks/handlers.ts`
- Handlers array now empty — no MSW-intercepted CC requests
- Contract example JSON files retained as reference

### 7. Feature Flag
- `SAGE_PROPOSALS_ENABLED: true` added to `packages/feature-flags/src/flags.ts`
- `POST /generate-proposals` gated on this flag
- Action stream returns empty items when flag is off

---

## Files Changed

| File | Action |
|------|--------|
| `apps/api/src/prompts/sage/proposal.ts` | **Created** — Prompt template + stub generator |
| `apps/api/src/services/sage/sageProposalGenerator.ts` | **Created** — LLM proposal generator |
| `apps/api/src/services/sage/sageActionStreamService.ts` | **Created** — Proposal → ActionItem mapper |
| `apps/api/src/routes/sage/index.ts` | **Modified** — Added 6 new routes |
| `apps/dashboard/src/app/api/command-center/action-stream/route.ts` | **Rewritten** — backendFetch proxy |
| `apps/dashboard/src/app/api/command-center/strategy-panel/route.ts` | **Rewritten** — backendFetch proxy |
| `apps/dashboard/src/app/api/command-center/orchestration-calendar/route.ts` | **Rewritten** — backendFetch proxy |
| `apps/dashboard/src/app/api/command-center/entity-map/route.ts` | **Rewritten** — backendFetch proxy |
| `apps/dashboard/src/app/api/command-center/intelligence-canvas/route.ts` | **Rewritten** — backendFetch proxy |
| `apps/dashboard/src/mocks/handlers.ts` | **Cleaned** — All 5 CC handlers removed |
| `packages/feature-flags/src/flags.ts` | **Modified** — Added SAGE_PROPOSALS_ENABLED |

---

## Exit Criteria

| Criterion | Status |
|-----------|--------|
| Zero MSW-intercepted CC requests | Done — handlers array empty |
| Real SAGE proposals in Action Stream | Done — queries sage_proposals |
| Real EVI in Strategy Panel | Done — calls calculateEVI |
| Real calendar items from content_items | Done — queries DB |
| Feature flag works (flag off → empty stream) | Done |
| Zero TS errors (API) | Done |
| Zero TS errors (Dashboard — our changes) | Done (pre-existing PR/onboarding errors unrelated) |
| Sprint doc written | Done |

---

## Dependencies

- **S-INT-01** (EVI pipeline) — calculateEVI, getEVIDelta used by strategy-panel route
- **S-INT-02** (Signal pipeline) — sage_signals table provides input for proposal generation
- **LlmRouter** (`packages/utils`) — Handles provider selection, fallback, ledger tracking
