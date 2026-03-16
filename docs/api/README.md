# Pravado API Reference

**Base URL:** `https://api.pravado.com` (production) | `http://localhost:3001` (development)
**Auth:** Bearer token via Supabase Auth JWT in cookie or Authorization header
**Response format:** `{ success: boolean, data?: T, error?: { code: string, message: string } }`

---

## Infrastructure

| Prefix | Domain | Auth |
|--------|--------|------|
| `/health` | Health checks (/, /ready, /live, /info) | Public |
| `/api/v1/auth` | Authentication (login, signup, session) | Public/Auth |
| `/api/v1/logs` | Client-side error logging | Auth |

## Core Pillars

| Prefix | Domain | Description |
|--------|--------|-------------|
| `/api/v1/content` | Content Hub | Content items CRUD, briefs, topics |
| `/api/v1/content/generated-briefs` | Brief Generator | AI-generated content briefs |
| `/api/v1/content/quality` | Content Quality | Quality scoring and analysis |
| `/api/v1/content/rewrites` | Content Rewrite | AI-powered rewriting |
| `/api/v1/pr` | PR Intelligence | Press releases, contacts, coverage |
| `/api/v1/seo` | SEO/AEO Command | Keywords, rankings, technical SEO |

## Organization & Teams

| Prefix | Domain | Description |
|--------|--------|-------------|
| `/api/v1/orgs` | Organizations | Org CRUD, settings, members |
| `/api/v1/invites` | Team Invites | Invite members to org |

## Intelligence Layer

| Prefix | Domain | Description |
|--------|--------|-------------|
| `/api/v1/evi` | EVI Pipeline | Earned Visibility Index calculation, history, deltas |
| `/api/v1/sage` | SAGE Protocol | Signal scan, proposal generation, action stream, strategy panel |
| `/api/v1/citemind` | CiteMind Engine | Quality scoring, publish gate, schema generation, citation monitoring |

## PR Operations

| Prefix | Domain | Description |
|--------|--------|-------------|
| `/api/v1/pr-outreach` | Outreach Engine | Automated journalist outreach sequences |
| `/api/v1/pr-outreach-deliverability` | Deliverability | Email engagement analytics |
| `/api/v1/journalist-graph` | Journalist Graph | Identity graph, contact intelligence |
| `/api/v1/journalist-discovery` | Discovery | Automated journalist enrichment |
| `/api/v1/journalist-timeline` | Timeline | Relationship history and narrative |
| `/api/v1/journalists` | Enrichment | Hunter.io enrichment + search |
| `/api/v1/media-lists` | Media Lists | AI-powered media list builder |
| `/api/v1/media-briefings` | Briefings | Executive talking points generator |
| `/api/v1/media-performance` | Performance | Advanced media analytics |

## Integrations

| Prefix | Domain | Description |
|--------|--------|-------------|
| `/api/v1/integrations/gsc` | Google Search Console | OAuth flow, keyword sync |

## Billing & Commerce

| Prefix | Domain | Description |
|--------|--------|-------------|
| `/api/v1/billing` | Billing | Plans, usage, Stripe checkout/webhooks/portal, overages, alerts |

## Beta & Onboarding

| Prefix | Domain | Description |
|--------|--------|-------------|
| `/api/v1/beta` | Beta Access | Public request, admin approve, invite validation |
| `/api/v1/onboarding` | Onboarding | 7-step activation wizard, brand setup, SAGE activation |

## Executive Intelligence

| Prefix | Domain | Description |
|--------|--------|-------------|
| `/api/v1/exec-dashboards` | Executive Command | Cross-system executive insights |
| `/api/v1/exec-digests` | Executive Digests | Weekly strategic briefs |
| `/api/v1/executive-board-reports` | Board Reports | Quarterly executive packs |
| `/api/v1/investor-relations` | Investor Relations | Earnings narrative engine |
| `/api/v1/strategic-intelligence` | Strategic Intel | CEO-level strategic narrative |
| `/api/v1/risk-radar` | Risk Radar | Predictive crisis forecasting |

## Crisis & Reputation

| Prefix | Domain | Description |
|--------|--------|-------------|
| `/api/v1/crisis` | Crisis Engine | Detection, incident management, escalation |
| `/api/v1/reputation` | Brand Reputation | Real-time reputation scoring |
| `/api/v1/reputation-alerts` | Reputation Alerts | Brand alerts and executive reporting |

## Analytics & Intelligence

| Prefix | Domain | Description |
|--------|--------|-------------|
| `/api/v1/competitive-intelligence` | Competitive Intel | Comparative analytics |
| `/api/v1/personas` | Audience Personas | AI persona builder |
| `/api/v1/unified-graph` | Intelligence Graph | Global insight fabric |
| `/api/v1/unified-narratives` | Narrative Generator | Cross-domain synthesis |

## Governance & Operations

| Prefix | Domain | Description |
|--------|--------|-------------|
| `/api/v1/audit` | Audit Logging | Compliance ledger, CSV exports |
| `/api/v1/governance` | Governance | Compliance and audit intelligence |
| `/api/v1/ops` | Operations | System operations endpoints |
| `/api/v1/playbooks` | Playbooks | Automation playbook definitions |
| `/api/v1/playbook-runs` | Playbook Runs | Execution tracking |

## Simulation & Scenarios

| Prefix | Domain | Description |
|--------|--------|-------------|
| `/api/v1/scenario-playbooks` | Scenario Playbooks | Simulation orchestration |
| `/api/v1/ai-scenario-simulations` | AI Simulations | Multi-agent scenario engine |
| `/api/v1/scenario-orchestrations` | Orchestration | Multi-scenario branching |
| `/api/v1/reality-maps` | Reality Maps | Multi-outcome planning |
| `/api/v1/insight-conflicts` | Insight Conflicts | Conflict resolution engine |

---

## Rate Limits

| Scope | Limit |
|-------|-------|
| Global (per org) | 200 requests / minute |
| SAGE generate-proposals | 5 / hour |
| CiteMind score | 20 / hour |
| CiteMind monitor/run | 3 / hour |
| GSC sync | 5 / hour |

Rate-limited responses return `429` with `{ retryAfter: <seconds> }`.

---

## Plan Limits (S-INT-09)

| Resource | Starter | Pro | Growth |
|----------|---------|-----|--------|
| Seats | 3 | 10 | 25 |
| Content docs/mo | 25 | 100 | 500 |
| SAGE proposals/mo | 50 | 200 | 1,000 |
| CiteMind scores/mo | 100 | 500 | 2,000 |
| LLM tokens/mo | 500K | 2M | 10M |

Exceeded limits return `403 PLAN_LIMIT_EXCEEDED`.

---

*Generated: 2026-03-10 | Sprint S-INT-10*
