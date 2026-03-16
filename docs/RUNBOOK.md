# Production Runbook
**Version:** 1.0  
**Date:** 2026-03-10  
**Audience:** Anyone operating Pravado v2 in production — primarily Christian  
**Rule:** Update this document whenever infrastructure or deployment processes change.

---

## Infrastructure Overview

| Service | Platform | URL | Notes |
|---------|----------|-----|-------|
| Dashboard (Next.js) | Vercel | app.pravado.com | Auto-deploys from `main` |
| API (Fastify) | Render (Oregon, Starter) | api.pravado.com | Manual deploy or auto on push |
| Database | Supabase | — | Hosted PostgreSQL, managed backups |
| Redis | Upstash | — | Serverless Redis for BullMQ |
| Email | SendGrid | — | Transactional email for PR outreach + invites |
| Payments | Stripe | — | Subscriptions + webhook events |
| Error monitoring | Sentry | — | Two projects: pravado-dashboard, pravado-api |
| Product analytics | PostHog | — | Event tracking, funnels, session replays |

---

## Health Check

**Endpoint:** `GET https://api.pravado.com/api/v1/health`

Expected response (200 OK):
```json
{
  "status": "ok",
  "version": "1.0.0-rc1",
  "timestamp": "2026-03-10T...",
  "checks": {
    "database": "ok",
    "redis": "ok"
  }
}
```

If `database` or `redis` is not `"ok"`, the API will return 503. Dashboard will show degraded state — check Supabase and Upstash dashboards immediately.

**Set this as Render's health check URL.** Configure an uptime monitor (BetterUptime or UptimeRobot) to ping it every 60 seconds and alert on failure.

---

## Deployment Process

### Dashboard (Vercel)
- Push to `main` → Vercel auto-deploys in ~2 minutes
- Preview deployments on every PR (check before merging)
- Environment variables are in Vercel project settings — do not commit `.env` files
- Source maps are uploaded to Sentry on each production build (requires `SENTRY_AUTH_TOKEN`)

### API (Render)
- Render auto-deploys on push to `main` if configured, or deploy manually via Render dashboard
- Health check: Render will mark the deployment unhealthy if `/api/v1/health` returns non-200
- Render will NOT deploy a new version if the health check fails (zero-downtime protection)
- Zero-downtime: Render runs old and new instance in parallel until new passes health check

### Database Migrations
Migrations are in `supabase/migrations/`. They run manually — they do NOT auto-run on deploy.

**To apply a migration:**
```bash
# From monorepo root
supabase db push --db-url $SUPABASE_DB_URL
# OR via Supabase CLI linked to the project:
supabase migration up
```

**Rule:** Always apply migrations BEFORE deploying API code that depends on them. Never the reverse.

**To check which migrations have been applied:**
```bash
supabase migration list
```

---

## Environment Variables

### Required (API will crash on startup if missing)
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
NODE_ENV
PORT
```

### Highly Recommended (features degrade gracefully if missing)
```
REDIS_URL               — BullMQ queue disabled if missing (no background jobs)
OPENAI_API_KEY          — LLM features use stub mode if missing
ANTHROPIC_API_KEY       — Primary LLM provider for SAGE proposals
SENDGRID_API_KEY        — Email delivery disabled if missing
SENTRY_DSN              — Error monitoring disabled
```

### Optional (specific features)
```
STRIPE_SECRET_KEY       — Billing disabled if missing (ENABLE_STRIPE_BILLING must be true)
STRIPE_WEBHOOK_SECRET   — Webhook validation fails without this
GOOGLE_CLIENT_ID/SECRET — GSC integration disabled
HUNTER_API_KEY          — Journalist enrichment disabled
PERPLEXITY_API_KEY      — Citation monitoring limited to OpenAI + Anthropic
```

**To add/change env vars in production:**
- Dashboard: Vercel project → Settings → Environment Variables → redeploy after change
- API: Render service → Environment → add/edit → manual deploy required

---

## BullMQ Background Jobs

All background jobs run via BullMQ with Upstash Redis. Jobs are defined in `apps/api/src/queue/`.

### Scheduled Jobs (run automatically)

| Job | Schedule | Purpose |
|-----|----------|---------|
| `evi:recalculate` | Nightly (all orgs) | Recalculates EVI for every org with data |
| `sage:signal-scan` | Every 4 hours (per org) | Ingests new signals, scores, generates proposals |
| `citemind:monitor` | Every 6 hours (per org) | Polls LLMs for brand citation monitoring |
| `gsc:sync` | Daily 6am UTC (per connected org) | Syncs GSC keyword data |
| `journalists:enrich-batch` | Sunday 11pm UTC (per org) | Batch enriches journalist emails via Hunter.io |

### Manual Job Triggers (for debugging/backfill)

All triggerable via admin API endpoints:
```bash
# Trigger EVI recalculate for a specific org
POST /api/v1/evi/recalculate
Authorization: Bearer <admin_token>
Body: { "orgId": "..." }

# Trigger SAGE signal scan
POST /api/v1/sage/scan
Authorization: Bearer <admin_token>

# Trigger citation monitor
POST /api/v1/citemind/monitor/run
Authorization: Bearer <admin_token>

# Trigger GSC sync
POST /api/v1/integrations/gsc/sync
Authorization: Bearer <admin_token>
```

### Monitoring Queue Health
- Check Upstash Redis dashboard for queue depth
- If any queue depth exceeds 1000, something is wrong — jobs are backing up
- BullMQ failed jobs are retained for 24h — check Upstash for failed job details

---

## Database

### Backups
Supabase automatically backs up the database daily. For the Starter plan, backups are retained for 7 days. Upgrade to Pro for longer retention before scaling.

### Running Queries (for debugging)
Use the Supabase SQL editor in the dashboard. All tables have RLS enabled — use the service role for admin queries.

### Common Debug Queries

```sql
-- Check EVI snapshot for an org
SELECT org_id, evi_score, visibility_score, authority_score, momentum_score, calculated_at
FROM evi_snapshots
WHERE org_id = 'ORG_ID'
ORDER BY calculated_at DESC
LIMIT 5;

-- Check SAGE proposals for an org
SELECT title, priority, evi_impact_estimate, status, created_at
FROM sage_proposals
WHERE org_id = 'ORG_ID' AND status = 'active'
ORDER BY evi_impact_estimate DESC;

-- Check citation monitoring results
SELECT engine, brand_mentioned, mention_type, monitored_at
FROM citation_monitor_results
WHERE org_id = 'ORG_ID'
ORDER BY monitored_at DESC
LIMIT 20;

-- Check LLM usage this month
SELECT model, SUM(prompt_tokens + completion_tokens) as total_tokens, SUM(cost_usd) as total_cost
FROM llm_usage_ledger
WHERE org_id = 'ORG_ID'
  AND created_at >= date_trunc('month', now())
GROUP BY model;

-- Check beta requests
SELECT email, company_name, status, created_at
FROM beta_requests
ORDER BY created_at DESC
LIMIT 20;
```

---

## Stripe Operations

### Webhook Events
Stripe sends webhooks to `POST /api/webhooks/stripe`. Signature is validated using `STRIPE_WEBHOOK_SECRET`.

Events handled:
- `customer.subscription.created` → activates plan on org
- `customer.subscription.updated` → updates plan (upgrade/downgrade)
- `customer.subscription.deleted` → downgrades org
- `invoice.payment_failed` → sends alert email to org owner

**To test webhooks locally:** Use `stripe listen --forward-to localhost:3001/api/webhooks/stripe`

**To debug a failed webhook:** Check Stripe dashboard → Developers → Webhooks → event log. Failed webhooks can be manually retried from there.

### Refunds / Plan Changes
Do all plan changes via Stripe Customer Portal (accessible from user settings) or the Stripe dashboard directly. Never manually edit `orgs.plan` in the database — it will be overwritten by the next webhook event.

---

## Monitoring and Alerting

### Sentry
- Dashboard errors: sentry.io → project `pravado-dashboard`
- API errors: sentry.io → project `pravado-api`
- Set up **alert rules** for:
  - Any new error occurring > 5 times in 1 hour → Slack notification
  - Any error in the SAGE proposal generator or EVI calculation → immediate alert
  - Any 5xx error rate > 1% → immediate alert

### PostHog
- Event stream: posthog.com → Live events
- Key funnels to monitor weekly:
  - Onboarding completion rate (step 1 → step 7)
  - First SAGE proposal click rate
  - GSC connection rate in onboarding
- Retention: Weekly active users by surface
- If onboarding completion rate drops below 60%, investigate immediately

---

## Incident Response

### Severity Levels

| Level | Definition | Response Time | Communication |
|-------|-----------|---------------|---------------|
| P0 | Complete outage — app unreachable or all data wrong | Immediate | Update status page within 15 min |
| P1 | Core feature broken — SAGE proposals returning errors, EVI not calculating, billing broken | < 1 hour | Notify affected users via email |
| P2 | Degraded experience — citation monitoring stalled, GSC sync failing | < 4 hours | Internal only |
| P3 | Minor issue — UI bug, single user problem | Next business day | Normal bug triage |

### P0 Response Playbook
1. Check Render dashboard — is the API service running?
2. Check Supabase status page (status.supabase.com)
3. Check health endpoint: `curl https://api.pravado.com/api/v1/health`
4. Check Sentry for error spike — what's failing?
5. If Render deployment is unhealthy: roll back to last known good deployment
6. If database is down: Supabase handles failover automatically; wait and monitor
7. If Redis is down: BullMQ falls back gracefully — jobs queue but don't run. API continues serving requests. Fix Upstash, then jobs will drain.

### Rolling Back a Bad Deployment

**Dashboard (Vercel):**
Go to Vercel → Deployments → find the last working deployment → "Promote to Production"

**API (Render):**
Render → Service → Deploys → find the last working deploy → "Rollback to this deploy"

### Hotfix Process
1. Create a branch from `main`
2. Fix, test locally
3. Create PR, get a quick review
4. Merge to `main` → auto-deploys
5. Verify in Sentry that the error stops occurring
6. Write a postmortem for P0/P1 incidents

---

## Beta Operations

### Approving Beta Requests
```bash
# List pending requests
GET /api/v1/admin/beta/requests?status=pending
Authorization: Bearer <admin_token>

# Approve a request (sends invite email automatically)
POST /api/v1/admin/beta/approve
Authorization: Bearer <admin_token>
Body: { "betaRequestId": "..." }
```

Invite tokens expire in 7 days. If a user needs a new invite, manually update `beta_requests.invite_expires_at` via SQL and re-run the approve endpoint.

### Seeding Demo Data for a New Beta Org
```bash
# From apps/api directory
npx ts-node src/scripts/seedDemoOrg.ts --orgId=ORG_ID
```

This script seeds journalist profiles, content items, and sample pitches so SAGE has enough signal to generate proposals immediately. Run it immediately after a beta user signs up if they don't have their own data yet.

### LLM Cost Monitoring
Check `llm_usage_ledger` weekly during beta:
```sql
SELECT org_id, SUM(cost_usd) as monthly_cost
FROM llm_usage_ledger
WHERE created_at >= date_trunc('month', now())
GROUP BY org_id
ORDER BY monthly_cost DESC;
```

If any single org exceeds $20/month in beta (indicating runaway usage), investigate and consider manually tightening their limits.

---

## Feature Flags Reference

All flags are in `packages/feature-flags/src/flags.ts`. To override a flag for a specific org in production, a per-org override mechanism does not yet exist — flags are global. To disable a feature for all users:

1. Set the flag to `false` in `flags.ts`
2. Commit and deploy
3. The feature will degrade gracefully (every flag-gated feature has a safe fallback)

| Flag | Default | Purpose |
|------|---------|---------|
| `ENABLE_EVI` | true | EVI calculation pipeline |
| `ENABLE_SAGE_SIGNALS` | true | Signal ingestion |
| `SAGE_PROPOSALS_ENABLED` | true | LLM proposal generation |
| `ENABLE_CITEMIND` | true | CiteMind scoring + publish gate |
| `ENABLE_GSC_INTEGRATION` | true | Google Search Console OAuth |
| `ENABLE_JOURNALIST_ENRICHMENT` | true | Hunter.io enrichment |
| `ENABLE_ONBOARDING_V3` | true | New 7-step onboarding |
| `ENABLE_STRIPE_BILLING` | true | Stripe checkout + plan limits |
| `BETA_INVITE_REQUIRED` | true | Invite gate on signup |

---

*Keep this document current. An outdated runbook is worse than no runbook.*  
*Last updated: 2026-03-10*
