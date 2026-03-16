# Pravado v2 — Full Codebase Audit
_Generated: February 25, 2026_

## Architecture Overview

```
Browser → Next.js Dashboard (101 API routes) → Hono/Fastify Backend (50+ route groups) → Supabase (143 tables)
```

- **Database:** Supabase PostgreSQL, 79 migrations, 143 tables, 130+ enums, RLS on all tables
- **No ORM** — direct Supabase PostgREST queries
- **Auth:** Supabase Auth (email/password, OAuth Google/Microsoft, magic link), cookie-based sessions, RLS
- **LLM:** OpenAI + Anthropic with stub fallback (provider-agnostic router)
- **Email:** Mailgun (production) / console (dev)
- **Billing:** Stripe (plans, checkout, portal, webhooks)
- **Monitoring:** Sentry + PostHog
- **Enrichment:** WhoisXML, People Data Labs
- **Caching:** Upstash Redis

---

## 1. Backend API Routes

### Data Source Classification

| Pattern | Count | Description |
|---|---|---|
| Real DB (Supabase) | ~30+ route groups | Full service layer with queries |
| Proxy (Dashboard → Backend) | ~85 dashboard routes | backendFetch() forwarding |
| Direct Supabase (Dashboard) | ~8 routes | PR journalists, lists, pitches bypass backend |
| Mock/Contract JSON | ~8 routes | Command Center returns fixture JSON |
| Stubs | ~20 backend routes | Return empty arrays (S3-era) |

### Command Center — ALL MOCK

| Route | Source |
|---|---|
| /api/command-center/action-stream | contracts/examples/action-stream.json |
| /api/command-center/entity-map | contracts/examples/entity-map.json |
| /api/command-center/intelligence-canvas | contracts/examples/intelligence-canvas.json |
| /api/command-center/strategy-panel | contracts/examples/strategy-panel.json |
| /api/command-center/orchestration-calendar | contracts/examples/orchestration-calendar.json |

### PR — MIXED (Architectural Inconsistency)

- Journalists, Lists, Pitch Sequences: Direct Supabase in dashboard via `createPRService()` — bypasses backend entirely
- Outreach, Deliverability, Releases: Proper proxy to backend via `backendFetch()`
- **This breaks the "Gate 1A" proxy invariant**

### Content, SEO, Playbooks, Billing, Ops, Exec — PROPER PROXY

All use `backendFetch()` → backend service → Supabase

---

## 2. Database Schema

79 migrations, 143 tables, organized by domain:

| Domain | Tables | Key Entities |
|---|---|---|
| Core | 7 | orgs, users, org_members, org_invites, roles, permissions |
| PR Intelligence | 46 | journalists, media_outlets, pr_pitch_sequences, pr_outreach_*, media_monitoring_*, media_briefings, earned_mentions |
| Content | 15 | content_items, content_briefs, content_generated_briefs, content_quality_scores, content_topics |
| SEO/AEO | 13 | seo_keywords, seo_serp_results, seo_pages, seo_backlinks, seo_competitors |
| Automation | 18 | playbooks, playbook_runs, playbook_versions, scheduler_tasks |
| AI/Agents | 5 | agent_personalities, agent_memories, agent_episode_runs |
| Billing | 6 | billing_plans, org_billing_state, org_billing_usage_monthly |
| Audit | 7 | audit_log, audit_exports, audit_replay_runs |
| Crisis | 7 | crisis_incidents, crisis_signals, crisis_escalation_rules, crisis_briefs |
| Executive | 15 | exec_digests, exec_board_reports, investor_* |
| Intelligence | 28 | competitors, brand_reputation_*, strategic_*, unified_*, reality_maps |
| Scenario/Sim | 20 | scenario_playbook_*, ai_scenario_*, scenario_orchestration_* |

Seed data: Demo org with 10 outlets, 10 journalists, RSS feeds, sample articles (`seedDemoOrg.ts` + migration 78)

---

## 3. Frontend Surfaces

### Fully Wired to Real Data

| Page | Data Source | Notes |
|---|---|---|
| Login (/login) | Supabase Auth | OAuth, email/password, magic link |
| Auth Callback (/callback) | Supabase Auth | Session exchange |
| App Layout (/app/layout.tsx) | getCurrentUser() → Supabase | Server component, org routing |
| Team (/app/team) | apiRequest() → backend | Members, invites CRUD |
| Billing (/app/billing) | billingApi.ts → Stripe | Plans, usage, checkout |
| Media Briefings (/app/media-briefings) | mediaBriefingApi.ts → backend | Full CRUD, generation, approval |
| Crisis (/app/crisis) | crisisApi.ts → backend | Incidents, signals, detection, escalation |
| Executive (/app/exec) | executiveCommandCenterApi.ts → backend | Dashboards, insight synthesis |

### Rendering Mock/Static Data Only

| Page | Mock Source | Notes |
|---|---|---|
| Command Center (/app/command-center) | Component-internal mocks + contract JSON | TriPaneShell, EntityMap, ActionStream, StrategyPanel |
| Content Dashboard (/app/content) | content-mock-data.ts | Document grid, brief queue |
| Content Editor (/app/content/asset/[id]) | Hardcoded MOCK_ASSET | ArticleEditor, save = console.log |
| Content Brief (/app/content/brief/[id]) | Hardcoded MOCK_BRIEF | "Generate Draft" doesn't execute |
| Content Orchestrate (/app/content/orchestrate/[actionId]) | MOCK_TRIGGER_ACTIONS | Handlers are console.log |
| PR Dashboard (/app/pr) | pr-mock-data.ts | Action queue, conversation thread stub |
| PR Journalists (/app/pr/journalists) | mockJournalists, mockSageJournalists | Despite real API existing |
| PR Pitches (/app/pr/pitches) | mockPitches | 4-column pipeline board |
| Analytics (/app/analytics) | Component-internal | Charts render with static data |
| SEO (/app/seo) | Component-internal | EVI hero, engine breakdown |
| Calendar (/app/calendar) | Component-internal | Orchestration calendar shell |
| Settings (/app/settings) | Static placeholders | All tabs show "coming soon" |

---

## 4. Services & Lib Layer

### Dashboard Lib (`/apps/dashboard/src/lib/`) — 57 files

Real integrations:
- `supabaseClient.ts` — Browser client (@supabase/ssr, cookie-based)
- `serverSupabaseClient.ts` — Server client (service role key for RLS bypass)
- `getCurrentUser.ts` — Server-side user + org context loader
- `serverApiClient.ts` — Authenticated fetch wrapper to backend
- `billingApi.ts` — Stripe billing client
- `evi/compute.ts` — EVI formula computation (with unit tests)

56 API wrapper files (one per feature domain) — all use fetch() to internal /api/* routes

### Backend Services (`/apps/api/src/services/`) — 69 files

All use Supabase queries. Key services:
- `billingService.ts` — Stripe subscription management
- `crisisService.ts` — Crisis detection and response
- `executiveCommandCenterService.ts` — Cross-pillar aggregation
- `playbookExecutionEngineV2.ts` — Automation execution
- `aiDraftService.ts` — LLM-powered content generation
- `pressReleaseService.ts` — Press release generation
- `riskRadarService.ts` — Risk forecasting

### Shared Packages (`/packages/`)

| Package | Files | Status |
|---|---|---|
| @pravado/types | 48 type modules | Actively used everywhere |
| @pravado/validators | 30+ Zod schemas | Used in backend validation |
| @pravado/utils | 8 modules (logger, mailer, llmRouter, errors) | Actively used |
| @pravado/feature-flags | Flag definitions + provider | Used in backend gating |

---

## 5. Auth — End-to-End Assessment

| Component | Status | Details |
|---|---|---|
| Login (email/password) | ✅ Working | supabase.auth.signInWithPassword() |
| Login (OAuth) | ✅ Working | Google + Microsoft via Supabase OAuth |
| Login (magic link) | ✅ Working | supabase.auth.signInWithOtp() |
| Signup | ✅ Working | With email confirmation redirect |
| Password reset | ✅ Working | Backend route /api/v1/auth/password-reset |
| Middleware | ✅ Working | Cookie check, route protection |
| Session management | ✅ Working | Cookie-based, no localStorage |
| RLS | ✅ Configured | All 100+ tables, org-scoped isolation |
| Org membership | ✅ Working | Multi-org, role-based (owner/admin/member) |
| Invite flow | ✅ Working | Token-based org invites |

Auth is fully implemented end-to-end.

---

## 6. Summary Table

| Feature | Backend | Frontend | Status |
|---|---|---|---|
| Auth (login/signup/OAuth) | Real (Supabase Auth) | Real (login page) | ✅ Ready |
| Org Management | Real (Supabase) | Real (team page) | ✅ Ready |
| Billing/Stripe | Real (Stripe SDK) | Real (billing page) | ✅ Ready |
| Media Briefings | Real (service + DB) | Real (API wired) | ✅ Ready |
| Crisis Management | Real (service + DB) | Real (API wired) | ✅ Ready |
| Executive Dashboard | Real (service + DB) | Real (API wired) | ✅ Ready |
| LLM Generation | Real (OpenAI/Anthropic) | Via backend proxy | ✅ Ready |
| Email (Mailgun) | Real (Mailgun SDK) | N/A | ✅ Ready |
| PR Journalists (CRUD) | Real (direct Supabase) | Mock UI (not wired) | ⚠️ Partial |
| PR Outreach | Real (service + DB) | Proxy wired | ⚠️ Partial |
| PR Pitches | Real (direct Supabase) | Mock UI (not wired) | ⚠️ Partial |
| PR Releases | Real (service + DB) | Proxy wired | ⚠️ Partial |
| PR Deliverability | Real (service + DB) | Proxy wired | ⚠️ Partial |
| Content Items | Real (service + DB) | Mock (MOCK_ASSET) | ⚠️ Partial |
| Content Briefs | Real (service + DB) | Mock (MOCK_BRIEF) | ⚠️ Partial |
| Content Quality | Real (service + DB) | Not wired | ⚠️ Partial |
| Content Editor | N/A (client-only) | Tiptap editor works | ⚠️ Partial |
| SEO Keywords | Real (service + DB) | Mock UI | ⚠️ Partial |
| SEO SERP | Real (service + DB) | Mock UI | ⚠️ Partial |
| Playbooks | Real (service + DB) | Proxy wired | ⚠️ Partial |
| Audit Log | Real (service + DB) | Likely wired | ⚠️ Partial |
| Governance | Real (service + DB) | Likely wired | ⚠️ Partial |
| Scenario Simulations | Real (service + DB) | Likely wired | ⚠️ Partial |
| Unified Graph | Real (service + DB) | Likely wired | ⚠️ Partial |
| Data Enrichment | Configured (WhoisXML, PDL) | N/A | ⚠️ Partial |
| Command Center | Mock (contract JSON) | Mock (component data) | 🔴 Shell |
| Entity Map | Mock (contract JSON) | SVG renders mock nodes | 🔴 Shell |
| Calendar | Mock (contract JSON) | Shell component | 🔴 Shell |
| Analytics | No dedicated routes | Static charts | 🔴 Shell |
| Settings | No routes | Placeholder tabs | 🔴 Shell |

---

## 7. Key Architectural Issues

1. **PR routes bypass backend** — Journalists, lists, pitch sequences query Supabase directly from dashboard, breaking the proxy invariant
2. **Frontend pages use mock data despite real APIs existing** — PR journalists page renders `mockJournalists` even though `/api/pr/journalists` hits real Supabase
3. **Command Center is entirely contract-driven** — No real backend service; all 5 routes return JSON fixtures
4. **Content item detail returns hardcoded mock** — `/api/content/items/[id]` returns `MOCK_ASSET` instead of proxying
5. **Response shape inconsistency** — Some routes use `{ success, data }`, others return raw objects
6. **~20 backend route groups are S3-era stubs** returning empty arrays

---

## Bottom Line

The backend is substantially built (143 tables, 69 services, 50+ route groups). The frontend has the UI shells for everything but only ~6 surfaces are actually wired to real data. **The biggest gap is connecting the existing frontend mock UIs to the existing backend APIs.**

The work to reach V1 is primarily a frontend wiring sprint, not backend construction.
