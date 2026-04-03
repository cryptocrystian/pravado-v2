# Pre-Launch Audit Report — 2026-04-03

## Executive Summary

**100 routes audited** | **71 LIVE** | **27 STUB** | **2 REDIRECT**
**23 API endpoints checked** | **19 fully wired** | **3 broken/missing** | **1 mock**
**9 AI endpoints audited** | **4 PRODUCTION_READY** | **2 NEEDS_WORK** | **3 not AI-powered**
**~44K TypeScript errors** (95% from missing node_modules; ~50 real code defects)

---

## LAUNCH BLOCKERS (must fix before any beta user logs in)

### 1. Content Brief Generation — Broken API Wiring
- **Dashboard** proxies to `/api/v1/content/briefs/generate`
- **Backend** registers the route at `/api/v1/content/generated-briefs/generate`
- **Result:** Every content brief generation request returns **404** from the backend
- **Fix:** Change dashboard proxy path OR change backend route prefix to match

### 2. PR Coverage Endpoint — Missing
- `/api/pr/coverage` does not exist anywhere (no route.ts, no backend handler)
- PR surface references coverage data but has no data source
- **Fix:** Create the endpoint or remove coverage references from the PR UI

### 3. PR Pitches Summary — Hardcoded Zeros
- `apps/dashboard/src/app/api/pr/pitches/summary/route.ts` returns `{ drafts: 0, awaiting_send: 0, sent: 0, coverage: 0, total: 0 }`
- No database query — pure mock
- **Fix:** Wire to actual pitch count queries from Supabase

### 4. BadgeProps Type Mismatch — 282 TypeScript Errors
- `src/components/ui/badge.tsx` — `className` and `variant` props not on `BadgeProps` type
- Affects nearly every UI surface that uses Badge
- **Fix:** Update BadgeProps interface to include `className` and `variant`

### 5. Null Safety in BullMQ Queue Workers
- `apps/api/src/queue/bullmqQueue.ts` lines 171, 204, 237
- `citationMonitorQueue`, `gscQueue`, `journalistQueue` are possibly null
- **Will crash** the queue worker at runtime
- **Fix:** Add null guards before queue access

### 6. Untyped Objects in Execution Dispatcher
- `apps/api/src/queue/executionDispatcher.ts` lines 90-239
- Accesses `.id`, `.input`, `.status`, `.state` on `{}` typed objects
- **Will silently return undefined** at runtime
- **Fix:** Define proper interfaces for execution payloads

### 7. Missing `fetch`/`AbortController` Types in API Services
- ~15 errors across `citationMonitor.ts`, `gscSyncService.ts`, `mediaCrawlerService.ts`, `executiveCommandCenterService.ts`
- These HTTP-calling services cannot compile
- **Fix:** Add `@types/node` or set `lib: ["ES2022", "DOM"]` in API tsconfig

### 8. 27 Stub Pages Are Dead Ends for Beta Users
- All `/app/pr-legacy/*` (12 routes) — deprecated, show "Coming soon"
- All `/app/exec/*` (8 routes) — show "Coming soon"
- All `/app/scenarios/*` (3 routes) — show "Coming soon"
- `/app/governance`, `/app/risk-radar`, `/app/reality-maps`, `/app/competitive-intelligence`
- If a user navigates to any of these, they see a dead page
- **Fix:** Either remove these routes or add redirect to the active equivalent

---

## HIGH PRIORITY (fix before first week ends)

### 9. Content Surface Shows Mock Data Instead of Empty State
- New users on `/app/content` see `CONTENT_OVERVIEW_MOCK` — fictional content presented as real
- **Fix:** Add proper empty state for users with no content items

### 10. PR Surface Falls Back to Mock Data
- `/app/pr/journalists` has `allowMockFallback` that shows fake journalist records
- `/app/pr/pitches` uses mock fallback for the pipeline board
- **Fix:** Replace mock fallback with empty state UI for new orgs

### 11. PR Outreach Draft Prompt — Lacks Org Context
- Only injects `brandName` (often null) and `brandDescription`
- Missing: brand_voice, competitors, target_audience, industry context
- **Grade: NEEDS_WORK** — pitches will be generic without org personalization
- **Fix:** Inject onboarding data (brand voice, industry, competitors) into prompt

### 12. Content Brief Prompt — Memory Context Stubbed
- `briefGeneratorService.ts` has `recentInteractions: []` and `contentPreferences: { preferredTone: null }`
- System prompt is generic "expert content strategist" without Pravado identity
- **Grade: NEEDS_WORK**
- **Fix:** Wire memory context to actual user data; add SAGE/CiteMind identity to prompt

### 13. CLAUDE.md Says "Hono.js" — Backend Is Actually Fastify
- `apps/api/package.json` uses `fastify` 4.x
- Route handlers import `FastifyInstance`
- CLAUDE.md is stale and misleading for any developer
- **Fix:** Update CLAUDE.md to say Fastify

### 14. `journalist_enrichment_records` Missing `recent_articles` Column
- The table (migration 55) tracks contact enrichment (email, phone, social) but has no `recent_articles` column
- If any code references this column, it will fail
- **Fix:** Add migration for the column or update code to use timeline tables instead

### 15. 30+ Orphaned Routes — No Navigation Path
- Playbooks, Billing, Audit, Media Monitoring, Ops, Personas, Agents, Reputation — all LIVE but unreachable from sidebar
- Users can only find these via direct URL
- **Fix:** Add sidebar entries for production-ready features or remove the routes

### 16. Calendar Icon Bug
- Calendar nav item reuses `icons.commandCenter` (chip icon) instead of a calendar icon
- **Fix:** Add a calendar icon to the icon set

---

## ACCEPTABLE FOR BETA (known gaps, documented)

### 17. Mixed RLS Strategies in Supabase
- Most tables use `auth.uid()` for RLS
- Enrichment tables (migration 55) use `current_setting('app.current_org_id')`
- Not a bug if API uses service role key (bypasses RLS), but inconsistent

### 18. `.env.production` Committed to Git
- Contains Stripe live publishable key, Sentry DSN, PostHog key
- All are `NEXT_PUBLIC_*` (inherently public), but rotation requires code change
- **Recommendation:** Move to Vercel env vars

### 19. 6 Dashboard Env Vars Not Validated by Zod Schema
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_MSW_ENABLED`, `NEXT_PUBLIC_BETA_INVITE_REQUIRED`
- Typos would fail silently

### 20. Browser Supabase Client Logs Keys to Console
- `supabaseClient.ts` lines 12-15 log URL and key prefix on every page load
- Not a security issue (public values) but noisy

### 21. No Shared Prompt Library
- Only one prompt template file exists (`/apps/api/src/prompts/sage/proposal.ts`)
- All other prompts are inline in service files — hard to audit or A/B test

### 22. Double Onboarding Guard
- Both middleware.ts AND app/layout.tsx check org membership and redirect
- Adds redundant DB queries but is defensively correct

### 23. API Has No Real Build Step
- Uses `tsx` runtime directly in production (`node --import tsx`)
- Works but is slower than a compiled build

### 24. Agent Orchestration Endpoint Is a Static Stub
- `GET /api/v1/agents` returns 10 hardcoded agent definitions
- No actual agent execution logic

---

## Route Status Map

### Core Navigation Routes (in sidebar)

| URL Path | Status | Description |
|----------|--------|-------------|
| `/app/command-center` | LIVE | Tri-pane strategic briefing room |
| `/app/pr` | LIVE | Three-mode PR action queue |
| `/app/content` | LIVE | Full content work surface with tabs |
| `/app/seo` | LIVE | Mode-aware SEO overview |
| `/app/calendar` | LIVE | Orchestration calendar shell |
| `/app/analytics` | LIVE | Analytics overview with EVI chart |
| `/app/team` | LIVE | Team management |
| `/app/settings` | LIVE | Settings with tabs |

### PR Surface (all LIVE except noted)

| URL Path | Status |
|----------|--------|
| `/app/pr/discovery` | LIVE |
| `/app/pr/journalists` | LIVE |
| `/app/pr/journalists/[id]` | LIVE |
| `/app/pr/pitches` | LIVE |
| `/app/pr/pitches/new` | LIVE |
| `/app/pr/outreach` | LIVE |
| `/app/pr/media-lists` | LIVE |
| `/app/pr/media-monitoring` | LIVE |
| `/app/pr/generator` | LIVE |
| `/app/pr/deliverability` | LIVE |
| `/app/pr/enrichment` | LIVE |
| `/app/pr/crisis` | LIVE |
| `/app/pr/[id]` | LIVE |
| `/app/pr/intelligence` | **STUB** — "Coming in next sprint" |

### Content Surface (all LIVE)

| URL Path | Status |
|----------|--------|
| `/app/content` | LIVE |
| `/app/content/[documentId]` | LIVE |
| `/app/content/new` | LIVE |
| `/app/content/new/brief/[id]` | LIVE |
| `/app/content/new/template/[id]` | LIVE |
| `/app/content/asset/[id]` | LIVE |
| `/app/content/brief/[id]` | LIVE |
| `/app/content/orchestrate/[actionId]` | LIVE |

### SEO Surface (all LIVE)

| URL Path | Status |
|----------|--------|
| `/app/seo` | LIVE |
| `/app/seo/citations` | LIVE |
| `/app/seo/topics` | LIVE |
| `/app/seo/competitors` | LIVE |
| `/app/seo/recommendations` | LIVE |

### Stub Routes (27 total — all show "Coming soon")

| URL Path | Notes |
|----------|-------|
| `/app/pr-legacy/*` (12 routes) | Deprecated — superseded by `/app/pr/*` |
| `/app/exec/*` (8 routes) | Executive suite — not in scope for beta |
| `/app/scenarios/*` (3 routes) | Scenario playbooks — not in scope |
| `/app/governance` | Not in scope |
| `/app/risk-radar` | Not in scope |
| `/app/reality-maps` | Not in scope |
| `/app/competitive-intelligence` | Not in scope |
| `/app/crisis` (top-level) | Not in scope (note: `/app/pr/crisis` IS live) |
| `/app/insight-conflicts` | Not in scope |
| `/app/media-alerts` | Not in scope |
| `/app/media-briefings` | Not in scope |
| `/app/reputation` | Not in scope |
| `/app/reputation/alerts` | Not in scope |
| `/app/unified-narratives` | Not in scope |
| `/app/analytics/reports` | Partially built — "Coming soon" labels |

---

## API Endpoint Status

| Group | Endpoint | Status | Data Source |
|-------|----------|--------|-------------|
| **Command Center** | `/api/command-center/entity-map` | WIRED | Supabase (orgs, content_topics, journalist_profiles, citation_monitor_results) |
| | `/api/command-center/strategy-panel` | WIRED | Supabase (EVI calculation, sage_proposals) |
| | `/api/command-center/action-stream` | WIRED | Supabase (action stream service) |
| | `/api/command-center/intelligence-canvas` | WIRED | Supabase (content_topics, citation_monitor_results) |
| | `/api/evi/current` | WIRED | Supabase (EVI calculation + delta) |
| **PR** | `/api/pr/journalists` | WIRED | Supabase direct (journalist_profiles) — has mock fallback |
| | `/api/journalists/discover` | WIRED | Backend (journalist enrichment service) |
| | `/api/pr/outreach/generate-draft` | WIRED | Backend (AI draft service) |
| | `/api/pr/releases/generate` | WIRED | Backend (press release service, 3-stage AI pipeline) |
| | `/api/pr/coverage` | **MISSING** | No handler exists |
| | `/api/pr/pitches/summary` | **MOCK** | Returns hardcoded zeros |
| **Content** | `/api/content/items` | WIRED | Supabase (content_items) |
| | `/api/content/briefs/generate` | **BROKEN** | Path mismatch — dashboard sends `/briefs/generate`, backend registers `/generated-briefs/generate` |
| | `/api/content/gaps` | WIRED | Supabase (SEO keywords vs content) |
| | `/api/content/quality/analyze` | WIRED | Backend (heuristic quality scoring) |
| **SEO** | `/api/seo/keywords` | WIRED | Supabase (SEO keyword service) |
| | `/api/seo/opportunities` | WIRED | Supabase (SEO opportunity service) |
| | `/api/seo/serp` | WIRED | Supabase (SEO SERP service) |
| | `/api/citemind/monitor/summary` | WIRED | Supabase (citation_summaries) |
| **Onboarding** | `/api/onboarding/status` | WIRED | Supabase (orgs, org_competitors, journalists, content_items) |
| | `/api/onboarding/brand` | WIRED | Supabase (creates/updates orgs + org_members) |
| | `/api/onboarding/competitors` | WIRED | Supabase (upserts org_competitors) |
| | `/api/onboarding/complete` | WIRED | Supabase (sets completed_onboarding_at, enqueues EVI + SAGE jobs) |

**Scorecard: 19/23 wired | 1 broken | 2 missing | 1 mock**

---

## AI Prompt Quality Report

| Endpoint | LLM? | Model | Org Context | Output Format | Grade |
|----------|-------|-------|-------------|---------------|-------|
| PR Outreach Draft | Yes | gpt-4o-mini / claude-3-5-sonnet | brandName only | JSON schema | **NEEDS_WORK** |
| Press Release Gen | Yes | LlmRouter | Company, SEO, personality, spokesperson | Structured JSON (3-stage) | **PRODUCTION_READY** |
| PR Pitch Sequence | Yes | LlmRouter | Journalist, PR, company, personality, history | Structured JSON | **PRODUCTION_READY** |
| SAGE Strategy Panel | No | — | — | — | N/A (data only) |
| SAGE Proposals | Yes | claude-sonnet-4-20250514 | org_name + signal data | Strict JSON | **PRODUCTION_READY** |
| Content Brief Gen | Yes | LlmRouter | Personality, SEO, content gaps | Detailed JSON | **NEEDS_WORK** |
| Content Quality | No | — | — | — | N/A (heuristic) |
| CiteMind Scoring | Optional | claude-sonnet-4-20250514 | Score breakdown | JSON array | **PRODUCTION_READY** |
| Agent Orchestration | No | — | — | — | N/A (static stub) |

**Key prompt issues:**
- No endpoint injects `brand_voice`, `target_audience`, or `competitors` from onboarding
- Only 1 prompt template file exists — all others are inline in services
- Content brief memory context is completely stubbed (`recentInteractions: []`)
- All LLM endpoints have fallback/stub mechanisms (good)
- Budget enforcement exists for SAGE and CiteMind (500K monthly token limit)

---

## TypeScript Errors

### Build Environment (95% of errors — fix with `pnpm install`)
- ~37,331 errors from missing React types
- ~1,300 errors from missing `@types/node`
- ~1,500 errors from unresolved workspace packages

### Real Code Defects

| Severity | Issue | Count | Fix |
|----------|-------|-------|-----|
| BLOCKING | BadgeProps missing className/variant | 282 | Update BadgeProps interface |
| BLOCKING | Component props reject `key` | ~25 | Use React.FC or add key to interfaces |
| BLOCKING | ErrorBoundary class broken | 10 | Fix React.Component extension |
| BLOCKING | Untyped `{}` objects in API | 15 | Define proper interfaces |
| BLOCKING | Null queue references in BullMQ | 3 | Add null guards |
| BLOCKING | `unknown` used as `string` | 4 | Add type narrowing |
| BLOCKING | Missing `fetch` global type | ~15 | Fix tsconfig lib or add @types/node |
| WARNING | Implicit `any` parameters | ~2,200 | Add type annotations (non-urgent) |
| WARNING | `unknown` in reduce callbacks | ~20 | Narrow types |

---

## Navigation & Onboarding

### Sidebar Navigation (8 items)
Command Center | PR | Content | SEO | Calendar | Analytics | Team | Settings
(+ conditional Admin link for admins)

### Auth Flow
```
/login → OAuth/Email/Magic Link → /callback or /auth/callback
  → /app (redirects to /app/command-center)
  → middleware checks: session? → org? → onboarding complete?
  → if no org or incomplete onboarding → /onboarding/ai-intro
```

### Onboarding (7 steps, all API-wired)
1. Brand Setup (name, domain, industry, size) — required
2. Google Search Console — skippable
3. Competitors (1-5 domains) — skippable
4. Journalists (name, email, outlet, beat) — skippable
5. Content URLs — skippable
6. SAGE Activation (progress screen, polls EVI) — automatic
7. Proposals (display only) → "Enter Dashboard"

### Empty State Quality
- **Command Center:** Good — proper empty state messages
- **PR:** Mixed — falls back to mock data instead of empty state
- **Content:** Poor — shows mock data as if real
- **SEO:** Delegates to sub-views, unclear

---

## Recommendations

### Before Beta Launch (This Week)
1. Fix content brief API path mismatch (blocker #1)
2. Fix or hide PR coverage references (blocker #2)
3. Wire PR pitches summary to real data (blocker #3)
4. Fix BadgeProps type (blocker #4 — 282 errors in one change)
5. Add null guards in BullMQ (blocker #5 — prevents crashes)
6. Delete or redirect all 27 stub routes (blocker #8)
7. Replace mock data fallbacks with empty states on PR and Content

### First Week Post-Launch
8. Inject brand_voice, competitors, target_audience into AI prompts
9. Wire content brief memory context
10. Add sidebar entries for Playbooks, Billing, Audit, Media Monitoring
11. Fix Calendar icon bug
12. Update CLAUDE.md to say Fastify instead of Hono
13. Add `recent_articles` column to journalist_enrichment_records or update code

### Future Sprints
14. Create shared prompt template library
15. Validate all dashboard env vars with Zod schema
16. Remove console logging from Supabase client
17. Add proper build step for API (compile TypeScript)
18. Implement agent orchestration (currently static stub)
19. Remove dead icon definitions (playbooks, agents) from sidebar component
