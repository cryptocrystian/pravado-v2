# PRAVADO v2 — Production Readiness Audit
**Date:** 2026-03-07  
**Auditor:** Claude Code (source-level inspection)  
**Confidence:** High — based on reading actual file contents, not filenames  
**Status:** CANONICAL — do not modify. This is a point-in-time snapshot.

---

## MONOREPO MAP

| Workspace | Type | Version | Purpose |
|-----------|------|---------|---------|
| @pravado/dashboard | App | 1.0.0-rc1 | Next.js 14 frontend (App Router, Tailwind, Tiptap editor) |
| @pravado/api | App | 1.0.0-rc1 | Fastify backend (Supabase, Stripe, OpenAI) |
| @pravado/mobile | App | 0.0.0-s0 | Expo/React Native shell (pre-release, minimal) |
| @pravado/types | Package | 1.0.0-rc1 | Shared TypeScript type definitions |
| @pravado/utils | Package | 1.0.0-rc1 | Shared utilities + Supabase helpers |
| @pravado/validators | Package | 1.0.0-rc1 | Zod validation schemas |
| @pravado/feature-flags | Package | 1.0.0-rc1 | Runtime feature flags (63 flags defined) |

**Tooling:** pnpm 9 workspaces, Turbo v2 build orchestration, TypeScript composite projects.  
**Deployment:** Dashboard on Vercel, API on Render (Oregon, Starter plan), DB on Supabase.

---

## BACKEND SERVICES

### Fastify API (apps/api/)
**Status: REAL — substantial implementation**
- 52 route modules under `src/routes/` covering all three pillars + executive + advanced features
- 63 service files (~69K LOC total) with direct Supabase queries
- Auth plugin: Extracts JWT from Authorization header or `sb-access-token` cookie, validates via `supabase.auth.getUser()`
- Middleware: `requireUser`, `requireOrg`, `requireRole`, `requireAdmin`
- Platform freeze plugin: Feature-flag gated write blocking for maintenance
- Queue system: Job abstraction (`queue.ts`, `worker.ts`, `executionDispatcher.ts`) — structure exists but Redis not fully wired
- SSE streaming: Real-time playbook execution and action streaming

### Next.js API Routes (apps/dashboard/src/app/api/)
**Status: REAL — dual-path architecture**
- ~100 `route.ts` files across content, PR, SEO, billing, playbooks, command-center
- Proxy routes: Content, SEO, orgs, playbooks → forward to Fastify backend
- Direct Supabase routes: PR pillar queries Supabase directly (Sprint S100.1 optimization)
- MSW-intercepted routes: Command Center endpoints (action-stream, entity-map, intelligence-canvas, strategy-panel, orchestration-calendar) — **all mocked**

---

## DATABASE STATUS

| Metric | Value |
|--------|-------|
| Migration count | 79 sequential SQL files |
| Provider | Supabase (hosted PostgreSQL) |
| ORM | None — raw supabase-js queries |
| RLS | Yes — org-based policies on all tables |
| Latest migration | `79_fix_org_members_rls_recursion.sql` |

### Table Groups

| Domain | Key Tables | Migration Range |
|--------|-----------|-----------------|
| Core tenancy | orgs, org_members, org_invites, tags | 01–07 |
| Content pillar | content_items, content_briefs, content_topics, content_quality_scores, content_rewrites | 09, 26–29 |
| PR pillar | journalist_profiles, pr_pitch_sequences, pr_pitches, pr_outreach_runs, pr_outreach_events, media_lists, journalist_timeline_events | 08, 18–20, 43–55 |
| SEO pillar | seo_keywords, seo_keyword_metrics, seo_serp_results, seo_page_audits, seo_backlinks | 10–17 |
| Billing | billing_plans, org_billing_usage, llm_usage_ledger, billing_alerts | 34–39 |
| Execution | playbooks, playbook_runs, playbook_steps, playbook_versions | 21–23, 30–32 |
| Crisis/Reputation | crisis_incidents, brand_reputation_mentions, brand_reputation_alerts | 60–62 |
| Advanced | unified_graph_nodes/edges, scenario_playbooks, unified_narratives, reality_maps, insight_conflicts | 63–76 |
| Audit | audit_logs, audit_exports, audit_replay_runs | 40–42 |
| Scheduling | scheduler_tasks, scheduler_task_runs, media_crawl_jobs, media_rss_feeds | 45–49 |

**Seed data:** `78_seed_pr_demo_data.sql` + `seedDemoOrg.ts` script. Demo org with sample journalists, pitches, coverage.

---

## INTELLIGENCE LAYER STATUS

### SAGE (Strategy Mesh)
| Aspect | Status |
|--------|--------|
| BUILT | UI labels (SagePulse.tsx, SageRecommendations.tsx, SageJournalistCard.tsx). Canonical spec in SAGE_v2.md. |
| SIMULATED | Command Center shows mock SAGE proposals via MSW handlers returning contracts/examples JSON. |
| MISSING | No proposal generation engine. No service calculates signal weights, no cross-pillar analysis, no recommendation ranking. **The entire brain of the product does not exist.** |

### EVI (Earned Visibility Index)
| Aspect | Status |
|--------|--------|
| BUILT | Formula documented: `EVI = (Visibility × 0.40) + (Authority × 0.35) + (Momentum × 0.25)`. UI components exist (EviScoreCard.tsx, EviGrowthChart.tsx). |
| SIMULATED | Charts render hardcoded/mock values. |
| MISSING | No calculation pipeline. No service aggregates PR coverage signals, content authority metrics, or SEO momentum into an EVI score. No data flows into the formula. |

### CiteMind (Citation Intelligence)
| Aspect | Status |
|--------|--------|
| BUILT | Canonical spec (CITEMIND_SYSTEM.md). UI stubs: CiteMindStatusIndicator.tsx, CiteMindMark.tsx (Tiptap mark schema), CiteMindGatingPanel.tsx, CiteMindPublishGate.tsx. |
| SIMULATED | Status indicators show hardcoded values (pending/analyzing/passed). |
| MISSING | Everything functional. No citation detection. No LLM answer monitoring. No schema generation. No IndexNow/Google Indexing API. No quality governance logic. Tiptap mark explicitly commented as "Phase 2 stub." |

### AUTOMATE (Execution Layer)
| Aspect | Status |
|--------|--------|
| BUILT | Audit logging (immutable audit_logs table + service + replay). Orchestration Calendar contract. Mode preferences (Copilot/Autopilot/Manual per pillar). Feature flags for execution gating. |
| SIMULATED | Action Stream and calendar data via MSW mock handlers. |
| MISSING | No task execution engine. No job orchestrator. No cost guardrail enforcement. No SAGE→AUTOMATE integration. Queue abstraction exists but isn't wired to Redis. |

---

## API ROUTES STATUS

### Command Center — ALL MOCKED via MSW
| Route | Type | Notes |
|-------|------|-------|
| /api/command-center/action-stream | MOCK | MSW returns contracts/examples/action-stream.json |
| /api/command-center/intelligence-canvas | MOCK | MSW returns contracts/examples/intelligence-canvas.json |
| /api/command-center/strategy-panel | MOCK | MSW returns contracts/examples/strategy-panel.json |
| /api/command-center/orchestration-calendar | MOCK | MSW returns contracts/examples/orchestration-calendar.json |
| /api/command-center/entity-map | MOCK | MSW returns contracts/examples/entity-map.json |

### Content Pillar — REAL (proxy to Fastify)
| Route | Type | Notes |
|-------|------|-------|
| /api/content/items | REAL | CRUD via ContentService → Supabase |
| /api/content/items/[id]/analyze | REAL | Quality analysis via ContentQualityService |
| /api/content/briefs/* | REAL | Brief generation pipeline |
| /api/content/clusters | REAL | Topic cluster management |
| /api/content/gaps | REAL | Content gap analysis |
| /api/content/quality/analyze | REAL | Quality scoring |

### PR Pillar — REAL (direct Supabase)
| Route | Type | Notes |
|-------|------|-------|
| /api/pr/journalists/* (15 routes) | REAL | Full CRUD, enrichment, graph, merge, discovery |
| /api/pr/pitches/* (8 routes) | REAL | Pitch sequences, contacts, manual send |
| /api/pr/outreach/* (16 routes) | REAL | Runs, events, sequences, steps, deliverability |
| /api/pr/coverage | REAL | Coverage tracking |
| /api/pr/lists/* | REAL | Media lists + members |
| /api/pr/releases/* | REAL | Press release generation + CRUD |
| /api/pr/deliverability/* (8 routes) | REAL | Engagement metrics, test sends |

### SEO Pillar — REAL (proxy to Fastify)
| Route | Type | Notes |
|-------|------|-------|
| /api/seo/keywords | REAL | Keyword tracking |
| /api/seo/serp | REAL | SERP snapshots |
| /api/seo/opportunities | REAL | SEO opportunity detection |

### Other
| Route | Type | Notes |
|-------|------|-------|
| /api/orgs/* | REAL | Org CRUD, invites, join-demo |
| /api/billing/* | REAL | Alerts, acknowledgment |
| /api/playbooks/* (15 routes) | REAL | Full CRUD, execution, SSE streaming, collaboration |
| /api/whoami | REAL | Identity/version check |
| /api/agents | STUB | Static agent definitions |
| /api/personalities | STUB | Static personality configs |

---

## AUTH STATUS
**Status: REAL AND PRODUCTION-READY**

| Component | Implementation | Details |
|-----------|---------------|---------|
| Login page | Real | Email/password, Google OAuth, Microsoft OAuth, Magic Link (OTP) |
| OAuth callback | Real | /app/auth/callback/route.ts handles code exchange |
| Session refresh | Real | Next.js middleware refreshes JWT on every request via @supabase/ssr |
| Route protection | Real | Middleware redirects /app/* and /onboarding/* to /login if no session |
| Backend auth | Real | Fastify plugin validates JWT from header/cookie via supabase.auth.getUser() |
| RLS policies | Real | All tables have org-scoped SELECT/INSERT/UPDATE/DELETE policies |
| Role-based access | Real | requireRole('admin'), requireRole('owner') middleware |
| Multi-tenancy | Real | org_id filter on every query + RLS enforcement |

**Missing:** No MFA/2FA. No session revocation UI. No API key management for external integrations.

---

## EXTERNAL INTEGRATIONS

| Service | Status | Implementation |
|---------|--------|---------------|
| Supabase (DB + Auth) | REAL | Core infrastructure, fully integrated |
| OpenAI | REAL (optional) | LLM_PROVIDER=openai activates. Used for content quality, brief generation, press releases, executive digests, media monitoring analysis. Defaults to stub mode. |
| Anthropic | WIRED (optional) | Router abstraction supports Claude models. Not directly called in services. |
| Stripe | REAL (flag-gated) | ENABLE_STRIPE_BILLING=true. Customer/subscription management, webhooks, portal. |
| SendGrid | REAL (optional) | PR outreach email delivery. Webhook signature validation. Engagement tracking (open/click/bounce). Falls back to stub provider. |
| Redis | CONFIGURED | Env var REDIS_URL exists. Queue abstraction references it. Not fully wired — no active job processing. |
| Muckrack/Cision | NOT IMPLEMENTED | No external journalist database integration. Using seeded demo data. |
| Google Analytics | NOT IMPLEMENTED | No tracking code. |
| IndexNow/Google Indexing | NOT IMPLEMENTED | Referenced in CiteMind spec only. |
| Mailgun | CONFIGURED | Env vars exist (MAILGUN_API_KEY). No implementation found. |

---

## VERDICT

Pravado v2 has a solid foundation but is not production-ready. The infrastructure layer is genuinely impressive: real auth with OAuth + RLS multi-tenancy, 79 database migrations covering a comprehensive schema, a 52-route Fastify backend with 63 service files doing real Supabase queries, Stripe billing, SendGrid email delivery, and LLM integration with provider abstraction. The CRUD layer for all three pillars (Content, PR, SEO) works against real data.

The critical gap is the intelligence layer — which is the entire product thesis. SAGE (the strategy mesh that decides what to do), EVI (the unified visibility score), CiteMind (the citation intelligence engine), and AUTOMATE (the task execution layer) exist only as specifications and UI labels. The Command Center — the primary user surface — returns 100% mock data via MSW. A user logging in today would see a beautifully designed dashboard populated entirely with fake proposals, fake scores, and fake intelligence.

In its current state, Pravado is a well-built CRUD platform with a compelling vision rendered in static mockups. The path from here to beta requires building the computational core that transforms data across pillars into actionable intelligence — the thing that makes this a "Visibility Operating System" rather than three separate tools sharing a login.

---

## GAP ANALYSIS — CRITICAL PATH TO BETA

### Tier 1: Core Intelligence (~35–45 days)
| # | Gap | Description | Effort |
|---|-----|-------------|--------|
| 1 | SAGE Proposal Engine | Build the service that ingests signals from all three pillars, scores opportunities, and generates prioritized action proposals. This IS the product. | 10–15 days |
| 2 | EVI Calculation Pipeline | Aggregate PR coverage, content authority, SEO/AEO metrics into the EVI formula. Connect to real data sources. | 5–7 days |
| 3 | CiteMind Engine | Citation detection in LLM answers, content quality governance, schema generation, publish gating with real logic. | 12–18 days |
| 4 | AUTOMATE Task Executor | Wire the queue system to Redis. Build job dispatcher, cost guardrails, approval workflows. Connect SAGE proposals to execution. | 8–12 days |

### Tier 2: Command Center (~9–14 days)
| # | Gap | Description | Effort |
|---|-----|-------------|--------|
| 5 | Replace MSW mocks with real data | All 5 Command Center endpoints return mock JSON. Need real services that query across pillars. | 5–8 days |
| 6 | Entity Map real data | Graph visualization currently renders mock nodes/edges. Need real entity extraction and relationship mapping. | 4–6 days |

### Tier 3: Integration & Infrastructure (~13–19 days)
| # | Gap | Description | Effort |
|---|-----|-------------|--------|
| 7 | Redis job queue | Wire existing queue abstraction to Redis. | 2–3 days |
| 8 | External journalist data | Integrate with journalist database API. | 5–7 days |
| 9 | SEO data ingestion | Connect GSC or third-party SEO API. | 5–7 days |
| 10 | Analytics tracking | PostHog or equivalent for user behavior. | 1–2 days |

### Tier 4: Hardening (~8–13 days)
| # | Gap | Description | Effort |
|---|-----|-------------|--------|
| 11 | Rate limiting | API rate limiting per org/endpoint. | 1–2 days |
| 12 | Error monitoring | Sentry for both apps. | 1 day |
| 13 | MFA / session management | TOTP 2FA, session revocation UI. | 3–4 days |
| 14 | E2E test coverage | Playwright test suite. | 3–5 days |
| 15 | Mobile app | Expo shell at v0.0.0. No screens. | Scope TBD |

**Total estimated effort for Tier 1+2 (minimum viable intelligence): ~45–65 days of focused development.**
