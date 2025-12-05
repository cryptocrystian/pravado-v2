# Billing & Quota Kernel V1 (Sprint S28)

## Overview

The Billing & Quota Kernel provides foundational billing and usage tracking for Pravado. Sprint S28 implements **soft limits only** for observability—no operations are blocked based on quota in this version.

**Key Features:**
- Plan management (internal-dev, starter, growth, enterprise)
- Usage tracking (LLM tokens, playbook runs, team seats)
- Soft limit monitoring (no hard enforcement)
- Billing dashboard for usage visibility
- Auto-seeding of billing state for new orgs

## Architecture

### Database Schema (Migration 35)

#### billing_plans
Defines available billing plans with included limits and overage pricing.

```sql
CREATE TABLE billing_plans (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  monthly_price_cents INTEGER NOT NULL DEFAULT 0,
  included_tokens_monthly BIGINT NOT NULL DEFAULT 0,
  included_playbook_runs_monthly INTEGER NOT NULL DEFAULT 0,
  included_seats INTEGER NOT NULL DEFAULT 0,
  overage_token_price_milli_cents INTEGER NOT NULL DEFAULT 0,
  overage_playbook_run_price_cents INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Seeded Plans:**
- **internal-dev**: Free plan for internal development (1M tokens, 1K runs, 10 seats)
- **starter**: $49/month (500K tokens, 50 runs, 3 seats)
- **growth**: $199/month (2.5M tokens, 250 runs, 10 seats)
- **enterprise**: $599/month (unlimited, 1K runs, unlimited seats)

#### org_billing_state
Per-org billing status and soft limit overrides.

```sql
CREATE TABLE org_billing_state (
  org_id UUID PRIMARY KEY REFERENCES orgs(id),
  plan_id UUID REFERENCES billing_plans(id),
  billing_status TEXT NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  soft_token_limit_monthly BIGINT,
  soft_playbook_run_limit_monthly INTEGER,
  soft_seat_limit INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Billing Status Values:**
- `trial`: 30-day trial period
- `active`: Active paying subscription
- `past_due`: Payment failed
- `canceled`: Subscription canceled

#### org_billing_usage_monthly
Monthly usage aggregates per organization.

```sql
CREATE TABLE org_billing_usage_monthly (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  tokens_used BIGINT NOT NULL DEFAULT 0,
  playbook_runs INTEGER NOT NULL DEFAULT 0,
  seats INTEGER NOT NULL DEFAULT 0,
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, period_start, period_end)
);
```

**Note**: Billing periods are calendar months (first day of month to first day of next month, UTC).

### Row Level Security (RLS)

All billing tables use RLS policies that require users to be members of the organization (via `user_orgs` table). This ensures users can only access billing data for their own organizations.

## API Endpoints

### GET /api/v1/billing/plans
List all active billing plans.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "slug": "starter",
      "name": "Starter",
      "description": "Perfect for small teams",
      "monthlyPriceCents": 4900,
      "includedTokensMonthly": 500000,
      "includedPlaybookRunsMonthly": 50,
      "includedSeats": 3,
      "overageTokenPriceMilliCents": 10,
      "overagePlaybookRunPriceCents": 100,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET /api/v1/billing/org/summary
Get current org's billing summary (plan + usage + limits).

**Response:**
```json
{
  "success": true,
  "data": {
    "plan": {
      "id": "uuid",
      "slug": "starter",
      "name": "Starter",
      "monthlyPriceCents": 4900,
      "includedTokensMonthly": 500000,
      "includedPlaybookRunsMonthly": 50,
      "includedSeats": 3
    },
    "billingStatus": "trial",
    "currentPeriodStart": "2024-12-01T00:00:00Z",
    "currentPeriodEnd": "2025-01-01T00:00:00Z",
    "tokensUsed": 125000,
    "playbookRuns": 12,
    "seats": 2,
    "softLimits": {
      "tokens": 500000,
      "playbookRuns": 50,
      "seats": 3
    }
  }
}
```

### POST /api/v1/billing/org/plan
Set org's billing plan (internal/admin use).

**Request:**
```json
{
  "planSlug": "growth"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Updated billing summary */
  }
}
```

### POST /api/v1/billing/org/check
Check if an operation would exceed quotas (internal use).

**Request:**
```json
{
  "tokensToConsume": 1000,
  "playbookRunsToConsume": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "allowed": true,
    "reason": null,
    "hardLimitExceeded": false,
    "softLimitExceeded": false,
    "usage": {
      "tokensUsed": 125000,
      "playbookRuns": 12,
      "seats": 2
    },
    "limits": {
      "tokens": 500000,
      "playbookRuns": 50,
      "seats": 3
    }
  }
}
```

**Note**: In S28, `allowed` is always `true` (soft limits only).

## Billing Service

### Core Methods

#### `getDefaultPlan()`
Returns the default plan (configured via `BILLING_DEFAULT_PLAN_SLUG` env var).

#### `listPlans()`
Returns all active billing plans.

#### `getPlanBySlug(slug: string)`
Fetch a specific plan by slug.

#### `getOrgBillingState(orgId: string)`
Get org's billing state. **Auto-seeds** if no state exists:
- Assigns default plan
- Sets status to 'trial'
- Sets trial end date to 30 days from creation
- Initializes billing period to current month

#### `getOrgUsageForCurrentPeriod(orgId: string)`
Fetches or creates usage record for current billing period. Also updates seat count from `org_members` table.

#### `updateUsageCounters(orgId: string, opts: UpdateUsageOptions)`
**Best-effort, non-blocking** usage counter updates. Used by LLM Router and Execution Engine V2.

```typescript
updateUsageCounters('org-123', { tokensDelta: 1500 });
updateUsageCounters('org-123', { playbookRunDelta: 1 });
```

#### `buildOrgBillingSummary(orgId: string)`
Combines plan + state + usage into a single summary object. Applies soft limit overrides if present.

#### `checkOrgQuota(orgId: string, opts: CheckQuotaOptions)`
Checks if operation would exceed quotas. In S28, **always returns `allowed: true`** but flags `softLimitExceeded` for observability.

#### `setOrgPlan(orgId: string, planSlug: string)`
Update org's billing plan. Returns null if plan not found.

## Usage Tracking Integration

### LLM Router Integration
Located in `packages/utils/src/llmRouter.ts:193-198`

After successful LLM calls, the router automatically updates token usage:

```typescript
if (request.orgId && response.usage?.totalTokens) {
  this.updateBillingUsage(request.orgId, response.usage.totalTokens).catch(() => {
    // Swallow errors from billing updates
  });
}
```

### Execution Engine V2 Integration
Located in `apps/api/src/services/playbookExecutionEngineV2.ts:205-208`

When a playbook run starts, the engine increments the run counter:

```typescript
this.updateBillingUsage(orgId).catch((error) => {
  console.warn('[ExecutionEngineV2] Failed to update billing usage', { error, orgId });
});
```

**Key Design Principles:**
- **Best-effort**: Billing updates never fail core operations
- **Non-blocking**: Updates are fire-and-forget with error swallowing
- **Graceful degradation**: Missing billing data doesn't break flows

## Dashboard

Location: `apps/dashboard/src/app/app/billing/page.tsx`

**Features:**
- Current plan display
- Monthly usage progress bars (tokens, runs, seats)
- Soft limit visualization
- Billing period dates
- Usage percentage indicators with color coding:
  - Green: < 80%
  - Yellow: 80-99%
  - Red: ≥ 100%

**Access:** `/app/billing` (requires authentication)

## Environment Configuration

Add to `.env`:

```bash
# Billing configuration (S28 - optional, falls back to internal-dev)
BILLING_DEFAULT_PLAN_SLUG=internal-dev
```

## Testing

### Billing Service Tests
Location: `apps/api/__tests__/billingService.test.ts`

**Coverage:**
- Plan retrieval (default plan, by slug)
- Auto-seeding of billing state
- Billing summary generation
- Soft limit checking (always allows)
- Plan changes
- Usage counter updates

### Billing Routes Tests
Location: `apps/api/__tests__/billingRoutes.test.ts`

**Coverage:**
- Authentication requirements
- Plan listing
- Summary retrieval
- Plan updates
- Quota checking
- Error handling

Run tests:
```bash
pnpm test --filter @pravado/api
```

## Limitations & Future Work

### S28 Scope (Current)
- ✅ Soft limits only (no hard enforcement)
- ✅ Usage tracking (tokens, runs, seats)
- ✅ Basic billing dashboard
- ✅ Auto-seeding of billing state
- ✅ Best-effort usage updates

### Out of Scope for S28
- ❌ Hard quota enforcement
- ❌ Payment processing (Stripe integration)
- ❌ Overage billing
- ❌ Invoice generation
- ❌ Usage alerts/notifications
- ❌ Plan upgrades/downgrades via UI

### Planned for Future Sprints
- **S29+**: Hard quota enforcement (gate operations when limits exceeded)
- **S30+**: Stripe integration for payment processing
- **S31+**: Overage tracking and billing
- **S32+**: Usage alerts and notifications
- **S33+**: Self-service plan management in dashboard

## Troubleshooting

### Billing state not found
Billing state is auto-seeded on first access. If missing, call:
```typescript
await billingService.getOrgBillingState(orgId);
```

### Usage not tracking
Check that:
1. `orgId` is being passed to LLM Router and Execution Engine
2. Supabase client is configured in services
3. Database migration 35 has been applied

### Soft limits showing incorrectly
Soft limits come from:
1. Plan's included limits (if no overrides)
2. Org's soft limit overrides (if set in `org_billing_state`)

Priority: Overrides > Plan defaults

## Migration Path

To apply the billing schema:

```bash
# Apply migration 35
pnpm --filter @pravado/api db:migrate
```

This creates:
- `billing_plans` table with 4 seeded plans
- `org_billing_state` table
- `org_billing_usage_monthly` table
- RLS policies for all billing tables

## Key Files

### Database
- `apps/api/supabase/migrations/35_create_billing_schema.sql`

### Types & Validators
- `packages/types/src/billing.ts`
- `packages/validators/src/billing.ts`

### Backend
- `apps/api/src/services/billingService.ts`
- `apps/api/src/routes/billing/index.ts`

### Integration Points
- `packages/utils/src/llmRouter.ts` (lines 193-198, 412-468)
- `apps/api/src/services/playbookExecutionEngineV2.ts` (lines 205-208, 706-750)

### Frontend
- `apps/dashboard/src/app/app/billing/page.tsx`

### Tests
- `apps/api/__tests__/billingService.test.ts`
- `apps/api/__tests__/billingRoutes.test.ts`

## Design Decisions

### Why Soft Limits Only in S28?
- Faster iteration: Observe usage patterns before enforcement
- Safer rollout: No risk of blocking legitimate operations
- Incremental complexity: Add enforcement in S29 after validation

### Why Best-Effort Usage Tracking?
- Core operations must never fail due to billing issues
- Usage tracking is observability, not critical path
- Acceptable to have slight usage undercounting vs. system downtime

### Why Auto-Seeding?
- Simplifies onboarding: No manual billing setup required
- Immediate value: Users can start using the system right away
- Consistent state: Every org always has billing data

### Why Monthly Periods?
- Industry standard for SaaS billing
- Aligns with Stripe billing cycles (future integration)
- Simple date math (first day of month)

## Support

For billing-related issues:
1. Check database migration status
2. Verify environment configuration
3. Review usage tracking logs
4. Consult billing service tests for expected behavior
