# Pravado Admin Dashboard — Specification
**Version:** 1.0  
**Status:** Approved for build  
**Route:** `/admin` (separate from `/app` — requires `is_admin` flag on user)  
**Last updated:** 2026-03-15

---

## Purpose

The admin dashboard serves two distinct functions:

1. **Platform Operations** — real-time visibility into the health, performance, and usage of Pravado as a SaaS product (infrastructure, billing, user activity)
2. **Intelligence Governance** — continuous monitoring of the quality and accuracy of SAGE, EVI, CiteMind, and the Citation Monitor so degradations are caught and corrected before users feel them

This is an internal tool for Christian and any future ops/support staff. It is never visible to customers.

---

## Access Control

- Route guarded by middleware: user must have `is_admin = true` on their `profiles` row
- Separate layout from the main app — no shared nav, no EVI chrome bar
- Session timeout: 8 hours (stricter than customer 24h)
- All admin actions are logged to an `admin_audit_log` table (who, what, when, result)

---

## Architecture

Single Next.js app section at `/app/admin/` with its own layout.  
All data fetches go directly to Fastify API endpoints under `/api/v1/admin/*` (new route group, admin-auth middleware).  
No client-side demo data anywhere — every panel shows "No data yet" if the underlying query returns empty.

---

## Navigation Structure

```
Admin
├── Overview          ← landing page, key metrics at a glance
├── Platform Health   ← infrastructure, API, queues, errors
├── Intelligence      ← SAGE / EVI / CiteMind / Citation quality
├── Users             ← org list, usage, plan status
├── Billing           ← MRR, churn, Stripe events
├── Beta              ← waitlist, invite management
└── Logs              ← audit trail, API errors, LLM usage
```

---

## Section Specs

---

### 1. Overview

**Purpose:** Single screen that answers "is everything OK right now?"

**Panels:**

| Panel | Data | Source |
|-------|------|--------|
| System Status | API health, DB, Redis — green/yellow/red | GET /health |
| Active Orgs | Total orgs, active last 7d, active last 30d | orgs table |
| MRR | Current MRR, delta vs last month | Stripe API |
| Error Rate | API 5xx rate last 1h | Sentry / API logs |
| LLM Spend | Token usage today / this month vs budget | llm_usage_ledger |
| SAGE Quality | Avg proposal acceptance rate last 7d | sage_proposals |
| Open Beta Requests | Count pending invites | beta_requests |

**Refresh:** auto-refresh every 60 seconds  
**Alerts:** if any metric is in RED state, banner at top of page

---

### 2. Platform Health

**Purpose:** Infrastructure deep-dive for debugging and capacity planning

**Sub-sections:**

#### 2a. API Health
- Response time P50 / P95 / P99 (last 1h, 24h, 7d)
- Error rate by route (top 10 erroring routes)
- Rate limit hits (which orgs are hitting limits)
- Uptime % (30-day rolling)

#### 2b. Queue Status (BullMQ)
- Queue name, depth (waiting jobs), active jobs, failed jobs, completed last 24h
- Queues: evi-recalculate, sage-proposals, citation-monitor, journalist-enrichment, gsc-sync, email
- Failed job details: error message, org ID, retry count, last attempt
- Actions: Retry failed jobs, Clear queue (with confirmation)

#### 2c. Database
- Connection pool usage
- Slow query log (queries > 500ms, last 24h)
- Table row counts for key tables (orgs, sage_proposals, evi_snapshots, citation_monitor_results)
- Migration status: last applied migration number + timestamp

#### 2d. Error Log
- Recent Sentry errors, grouped by issue
- Filter by severity, time range, surface
- Link to full Sentry issue
- Mark as resolved

---

### 3. Intelligence Quality

**Purpose:** The governance layer — detect quality degradation before users feel it

This section implements the S-GOV-01 Intelligence Governance Layer UI.

#### 3a. EVI Quality
| Metric | Description | Green | Yellow | Red |
|--------|-------------|-------|--------|-----|
| EVI/GSC Correlation | Correlation between EVI delta and GSC impression delta | >0.7 | 0.4–0.7 | <0.4 |
| Score Distribution | % of orgs with EVI > 0 (vs stuck at 0) | >80% | 50–80% | <50% |
| Calculation Freshness | % of orgs with EVI calculated in last 24h | >95% | 80–95% | <80% |

Display: sparkline per metric, current value, 7-day trend, threshold badge

#### 3b. SAGE Quality
| Metric | Description | Green | Yellow | Red |
|--------|-------------|-------|--------|-----|
| Proposal Acceptance Rate | Approved / (Approved + Dismissed) last 7d | >50% | 30–50% | <30% |
| Proposals Generated | Count last 24h across all orgs | >0 | — | 0 |
| Avg Time to First Proposal | Hours from org activation to first proposal | <4h | 4–24h | >24h |
| LLM Fallback Rate | % of proposals using stub fallback vs real LLM | <5% | 5–20% | >20% |

Actions when RED:
- Trigger manual SAGE signal ingest for all orgs
- View last 10 proposals with org context and acceptance status

#### 3c. CiteMind Quality
- Benchmark suite results (run against the 10 test URLs from docs/evals/CITEMIND_BENCHMARK.md)
- Last run timestamp, pass rate, any regressions vs baseline
- Score distribution across all org content (histogram: <55 / 55–75 / >75)
- Publish gate activity: how many pieces blocked/warned/passed last 7d
- Manual trigger: "Run benchmark now" button

#### 3d. Citation Monitor
- Detection coverage: % of orgs with at least 1 citation check in last 7 days
- False positive spot-check queue: sample of detected citations for human verification
- Citation engine breakdown: Perplexity / ChatGPT / Gemini / Claude detection counts
- Cost tracker: estimated API spend on citation monitoring this month

---

### 4. Users

**Purpose:** Customer visibility and support operations

#### 4a. Org List
Table with columns:
- Org name, domain, industry
- Plan (Starter/Pro/Growth/None)
- Created date
- Last active (most recent API call)
- EVI score
- Content count, Pitch count
- Onboarding complete? (Y/N)
- Actions: View details, Impersonate (creates admin session as that org), Suspend

Filters: Plan, Active/Inactive, Onboarding complete/incomplete  
Search: by org name, domain, user email

#### 4b. Org Detail
Drill into a single org:
- All users (name, email, last login, MFA enrolled)
- Current plan + usage vs limits (SAGE proposals used/limit, CiteMind scores used/limit)
- EVI history chart
- Recent SAGE proposals (with acceptance status)
- Recent CiteMind scores
- Recent API calls (last 20, with route and status)
- Billing: Stripe customer ID, subscription status, next invoice

#### 4c. Impersonation
Admin can view the app as any org (read-only, no mutations) for support debugging.  
All impersonation sessions logged in admin_audit_log.  
Banner shown at top: "Viewing as [Org Name] — Admin Mode"

---

### 5. Billing

**Purpose:** Revenue tracking and Stripe event monitoring

#### 5a. MRR Dashboard
- Current MRR broken down by plan
- New MRR this month (new subscriptions)
- Churned MRR this month (cancellations)
- Net MRR change
- MRR chart (12-month history)

#### 5b. Subscription List
Table: Org name, Plan, Status (active/past_due/canceled), MRR, Started date, Next billing date  
Filter by status, plan  
Link to Stripe customer dashboard for each row

#### 5c. Recent Stripe Events
- Payment succeeded / failed
- Subscription created / canceled / upgraded / downgraded
- Webhook delivery status (success/failed, retry count)

#### 5d. Failed Payments
- List of orgs with past_due status
- Days overdue, amount, retry date
- Action: Manually trigger retry (via Stripe API)

---

### 6. Beta

**Purpose:** Manage the pre-launch waitlist and invite queue

#### 6a. Waitlist
Table: Email, Company, Use case, Submitted date, Status (pending/approved/invited/signed up)  
Sort by date, filter by status  
Bulk actions: Approve selected, Invite selected, Reject selected

#### 6b. Invite Management
- Generate invite codes (single or bulk)
- View all codes: code, created date, assigned to email, used? used date
- Revoke a code (marks as invalid)
- Resend invite email to a specific address

#### 6c. Beta Metrics
- Total on waitlist
- Invites sent vs accepted (conversion rate)
- Signed up and completed onboarding (activation rate)
- Avg time from invite to onboarding complete

---

### 7. Logs

**Purpose:** Audit trail and debugging

#### 7a. Admin Audit Log
Every admin action recorded:
- Timestamp, admin user, action type, target (org ID / user ID), result, IP
- Filter by action type, admin user, date range

#### 7b. LLM Usage Log
- Every LLM call: timestamp, org ID, model, tokens in/out, cost estimate, purpose (SAGE proposal / CiteMind / etc.)
- Daily spend chart
- Top consuming orgs this month
- Budget alert threshold configuration (alert when monthly spend > $X)

#### 7c. API Error Log
- All 4xx/5xx responses: timestamp, route, status, org ID, error message
- Filter by status code, route prefix, org
- Download as CSV for analysis

---

## Data Requirements

### New API endpoints needed (all under `/api/v1/admin/*`, require admin auth):

```
GET  /admin/overview              — aggregated metrics for overview panel
GET  /admin/platform/queues       — BullMQ queue depths and stats
GET  /admin/platform/errors       — recent Sentry errors
GET  /admin/intelligence/evi      — EVI quality metrics
GET  /admin/intelligence/sage     — SAGE quality metrics
GET  /admin/intelligence/citemind — CiteMind benchmark + score distribution
GET  /admin/intelligence/citations — citation monitor stats
GET  /admin/orgs                  — paginated org list with usage
GET  /admin/orgs/:id              — org detail
POST /admin/orgs/:id/impersonate  — create admin session for org
POST /admin/orgs/:id/suspend      — suspend org
GET  /admin/billing/mrr           — MRR breakdown
GET  /admin/billing/events        — recent Stripe events
GET  /admin/beta/waitlist         — beta request list
POST /admin/beta/invite           — generate and send invite
POST /admin/beta/invite/bulk      — bulk invite
GET  /admin/logs/audit            — admin audit log
GET  /admin/logs/llm              — LLM usage log
GET  /admin/logs/errors           — API error log
```

### New DB tables needed:

```sql
-- Admin audit trail
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT, -- 'org', 'user', 'invite', etc.
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Intelligence quality snapshots (daily cron writes here)
CREATE TABLE intelligence_quality_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  metric_type TEXT NOT NULL, -- 'evi', 'sage', 'citemind', 'citations'
  metric_key TEXT NOT NULL,
  value NUMERIC NOT NULL,
  status TEXT NOT NULL, -- 'green', 'yellow', 'red'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Build Phases

### Phase 1 — Foundation + Overview (ship first, highest value)
- Admin auth middleware + route guard
- Admin layout
- Overview page (system status, active orgs, MRR, error rate, LLM spend)
- Platform Health → Queue Status (most operationally urgent)
- Beta → Waitlist + Invite management

### Phase 2 — Intelligence Governance (S-GOV-01 UI)
- Intelligence quality panels (EVI, SAGE, CiteMind, Citations)
- Intelligence quality snapshot daily job
- Threshold alerting (email/Sentry when metric goes RED)

### Phase 3 — User Operations
- Org list + detail
- Impersonation (read-only)
- Billing dashboard

### Phase 4 — Logs + Advanced
- Admin audit log
- LLM usage log with budget alerts
- API error log with CSV export

---

## Design Guidelines

- Dark theme matching Pravado DS v3 (same `--slate-*`, `--electric-purple`, `--cyber-blue` tokens)
- Denser information layout than customer-facing app — this is a power tool
- Status indicators: green (#22c55e), yellow (#f59e0b), red (#ef4444) — never use brand purple for status
- Tables: sortable columns, row hover highlight, sticky headers
- All destructive actions (suspend, revoke, delete) require a confirmation dialog
- No animations or AI presence indicators — this is ops, not marketing

---

## Success Criteria

The admin dashboard is complete when:
1. Any surface health issue is visible within 60 seconds of occurrence
2. A support ticket about "my SAGE proposals aren't working" can be debugged end-to-end without leaving the admin dashboard
3. MRR is visible without logging into Stripe
4. SAGE proposal acceptance rate is trackable week-over-week
5. A beta invite can be generated and sent in under 30 seconds

---

*This document is the authoritative spec for the Pravado admin dashboard.*  
*All admin sprint work should reference it.*  
*Build order: Phase 1 → Phase 2 → Phase 3 → Phase 4*
