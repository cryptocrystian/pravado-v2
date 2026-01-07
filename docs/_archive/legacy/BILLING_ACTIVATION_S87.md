# Sprint S87 - Billing & Subscription Activation Guide

> **Sprint**: S87 - Production-grade Billing & Subscription Enforcement
> **Completed**: December 8, 2025
> **Purpose**: Document the comprehensive billing system and provide activation steps for production deployment

---

## Executive Summary

Sprint S87 was scoped to implement production-grade billing with Stripe. Upon discovery, **the billing infrastructure was already fully implemented** in Sprints S28-S34. This document serves as the activation guide and architecture reference for the existing comprehensive billing system.

---

## Architecture Overview

### Billing Infrastructure Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **Database Schema** | `migrations/35-39_*.sql` | Billing plans, org states, usage, overages, alerts, invoices |
| **Types** | `packages/types/src/billing.ts` | TypeScript interfaces for all billing entities |
| **Validators** | `packages/validators/src/billing.ts` | Zod schemas for API request/response validation |
| **StripeService** | `apps/api/src/services/stripeService.ts` | Stripe API integration (1039 lines) |
| **BillingService** | `apps/api/src/services/billingService.ts` | Business logic (2100 lines) |
| **Billing Routes** | `apps/api/src/routes/billing/index.ts` | REST API endpoints (1288 lines) |
| **Frontend API** | `apps/dashboard/src/lib/billingApi.ts` | Dashboard API client (524 lines) |
| **Billing Page** | `apps/dashboard/src/app/app/billing/page.tsx` | Self-service portal (445 lines) |

---

## Environment Variables

### Required for Production

Add to your deployment environment (Render, Vercel, etc.):

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs (create in Stripe Dashboard)
STRIPE_PRICE_STARTER=price_starter_id
STRIPE_PRICE_GROWTH=price_growth_id
STRIPE_PRICE_ENTERPRISE=price_enterprise_id

# Dashboard URL (for redirect after checkout)
DASHBOARD_URL=https://your-dashboard.vercel.app

# Default plan for new orgs (optional)
BILLING_DEFAULT_PLAN_SLUG=starter
```

### Vercel Dashboard Environment

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
```

---

## Feature Flags

All billing feature flags are defined in `packages/feature-flags/src/flags.ts`:

| Flag | Default | Description |
|------|---------|-------------|
| `ENABLE_STRIPE_BILLING` | `true` | Enable Stripe integration |
| `ENABLE_BILLING_HARD_LIMITS` | `true` | Throw errors when quotas exceeded |
| `ENABLE_OVERAGE_BILLING` | `true` | Track and bill for overages |
| `ENABLE_USAGE_ALERTS` | `true` | Generate usage threshold alerts |
| `ENABLE_ADMIN_INVOICE_SYNC` | `true` | Manual invoice sync from Stripe |

---

## Billing Plans

### Default Plans

The system expects three billing plans seeded in the database:

| Plan | Slug | Monthly Price | Included Tokens | Playbook Runs | Seats |
|------|------|---------------|-----------------|---------------|-------|
| Starter | `starter` | $10 | 100,000 | 10 | 1 |
| Growth | `growth` | $50 | 500,000 | 50 | 5 |
| Enterprise | `enterprise` | $500 | 5,000,000 | 500 | 50 |

### Seeding Plans

Run the following SQL to seed plans (if not already seeded):

```sql
INSERT INTO billing_plans (slug, name, description, monthly_price_cents, included_tokens_monthly, included_playbook_runs_monthly, included_seats, overage_token_price_milli_cents, overage_playbook_run_price_cents, is_active)
VALUES
  ('starter', 'Starter', 'For individuals and small teams', 1000, 100000, 10, 1, 10, 100, true),
  ('growth', 'Growth', 'For growing teams', 5000, 500000, 50, 5, 8, 80, true),
  ('enterprise', 'Enterprise', 'For large organizations', 50000, 5000000, 500, 50, 5, 50, true)
ON CONFLICT (slug) DO NOTHING;
```

---

## Stripe Setup

### 1. Create Products and Prices

In [Stripe Dashboard](https://dashboard.stripe.com):

1. **Products > Add Product**
   - Create products: "Pravado Starter", "Pravado Growth", "Pravado Enterprise"

2. **For each product, add a price**:
   - Recurring monthly pricing
   - Copy the `price_xxxxx` ID for each

3. **Set environment variables** with the price IDs

### 2. Configure Webhook

1. **Developers > Webhooks > Add Endpoint**
2. **Endpoint URL**: `https://your-api.render.com/api/v1/billing/stripe/webhook`
3. **Events to send**:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 3. Configure Customer Portal

1. **Settings > Billing > Customer Portal**
2. Enable:
   - Payment method management
   - Subscription cancellation
   - Invoice history

---

## API Endpoints

### Plans

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/billing/plans` | List all active plans |
| GET | `/api/v1/billing/plans/:slug` | Get plan by slug |

### Organization Billing

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/billing/org/summary` | Get current org billing summary |
| POST | `/api/v1/billing/org/plan` | Set org plan (admin) |
| POST | `/api/v1/billing/org/check` | Check quota availability |
| POST | `/api/v1/billing/org/switch-plan` | Switch to different plan |
| POST | `/api/v1/billing/org/create-checkout` | Create Stripe checkout session |
| POST | `/api/v1/billing/org/cancel` | Cancel subscription |
| POST | `/api/v1/billing/org/resume` | Resume canceled subscription |
| POST | `/api/v1/billing/org/payment-method` | Open Stripe Customer Portal |

### Overages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/billing/org/overages` | Get overage summary |
| POST | `/api/v1/billing/org/overages/recalculate` | Recalculate overages |

### Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/billing/alerts` | List billing alerts |
| POST | `/api/v1/billing/alerts/generate` | Generate usage alerts |
| POST | `/api/v1/billing/alerts/:alertId/acknowledge` | Acknowledge alert |

### Invoices

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/billing/org/invoices` | Get invoice history |
| GET | `/api/v1/billing/org/invoices/:id` | Get invoice details |
| POST | `/api/v1/billing/org/invoices/sync` | Sync invoices from Stripe |

### Webhook

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/billing/stripe/webhook` | Stripe webhook handler |

---

## Subscription Enforcement

### How Quota Enforcement Works

The system uses `enforceOrgQuotaOrThrow()` to block operations when quotas are exceeded:

```typescript
// From billingService.ts
async enforceOrgQuotaOrThrow(
  orgId: string,
  requested: { tokensToConsume?: number; playbookRunsToConsume?: number }
): Promise<void> {
  if (!FLAGS.ENABLE_BILLING_HARD_LIMITS) return;

  const check = await this.checkOrgQuota(orgId, requested);
  if (!check.allowed) {
    throw new BillingQuotaError(check.reason || 'Quota exceeded', check);
  }
}
```

### Services Using Enforcement

| Service | File | Enforced Resources |
|---------|------|-------------------|
| Playbook Execution | `playbookExecutionEngineV2.ts` | Tokens, Runs |
| Narrative Generator | `narrativeGeneratorService.ts` | Tokens |
| Brief Generator | `briefGeneratorService.ts` | Tokens |
| Content Rewrite | `contentRewriteService.ts` | Tokens |
| Playbook Routes | `routes/playbooks/index.ts` | Runs |

### Graceful Degradation

When `ENABLE_BILLING_HARD_LIMITS` is `false`, the system:
- Logs quota warnings but doesn't block
- Continues to track usage
- Generates alerts but allows operations

---

## Dashboard Integration

### Billing Page Components

Located in `apps/dashboard/src/app/app/billing/`:

| Component | Purpose |
|-----------|---------|
| `page.tsx` | Main billing portal |
| `UsageBar` | Visual usage progress bars |
| `PlanRecommendationBadge` | Upgrade recommendations |
| `TrialBanner` | Trial countdown display |
| `OverageBreakdown` | Overage cost breakdown |
| `StripePortalButton` | Link to Stripe portal |
| `BillingPlanCard` | Plan comparison cards |
| `CancelSubscriptionModal` | Cancellation confirmation |
| `DowngradeBlockedDialog` | Usage-blocked downgrade warning |

### User Flow

1. **View Current Plan**: `/app/billing` shows plan, usage, alerts
2. **Upgrade**: Click upgrade → Stripe Checkout → Return to `/app/billing?success=true`
3. **Downgrade**: Direct plan switch (blocked if usage exceeds target limits)
4. **Cancel**: Modal confirmation → Cancel at period end or immediate
5. **Manage Payment**: Opens Stripe Customer Portal

---

## Testing

### Existing Test Coverage

`apps/api/tests/billingPlanManagement.test.ts` covers:

- Plan switching (upgrade/downgrade)
- Downgrade blocking when usage exceeds limits
- Plan change alerts
- Plan recommendations based on usage
- Enriched billing summary with projections

### Running Tests

```bash
pnpm --filter @pravado/api test billingPlanManagement
```

### Stripe Test Mode

For development, use Stripe test mode:
- `STRIPE_SECRET_KEY=sk_test_...`
- Test cards: `4242 4242 4242 4242`

---

## Deployment Checklist

### Pre-Deployment

- [ ] Create Stripe products and prices
- [ ] Configure Stripe webhook endpoint
- [ ] Set all `STRIPE_*` environment variables
- [ ] Seed billing plans in database
- [ ] Configure Customer Portal settings

### Post-Deployment Verification

- [ ] Verify `/api/v1/billing/plans` returns plans
- [ ] Test checkout flow with test card
- [ ] Verify webhook receives events
- [ ] Test quota enforcement on playbook run
- [ ] Verify billing page loads with correct data

---

## Monitoring & Observability

### Key Logs

- `[Billing]` prefix for all billing-related logs
- `[StripeService]` for Stripe API interactions
- `[Webhook]` for webhook processing

### Alerts to Monitor

1. **Webhook failures**: Stripe dashboard shows failed deliveries
2. **Quota enforcement errors**: `BillingQuotaError` in logs
3. **Payment failures**: `invoice.payment_failed` events

---

## Sprint History

| Sprint | Feature |
|--------|---------|
| S28 | Billing schema, quota kernel, BillingService core |
| S29 | Hard limit enforcement (`enforceOrgQuotaOrThrow`) |
| S30 | Stripe integration, checkout, webhooks |
| S31 | Overage billing calculations |
| S32 | Usage alerts and notifications |
| S33 | Self-service plan management UI |
| S34 | Invoice history and sync |
| S87 | Activation documentation (this sprint) |

---

## Support & Troubleshooting

### Common Issues

1. **"Stripe billing is not enabled"**
   - Check `STRIPE_SECRET_KEY` is set
   - Verify `ENABLE_STRIPE_BILLING` flag is `true`

2. **"No Stripe price ID configured"**
   - Set `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_ENTERPRISE`

3. **Webhook signature validation failed**
   - Verify `STRIPE_WEBHOOK_SECRET` matches webhook signing secret

4. **Quota errors blocking operations**
   - User needs to upgrade plan or wait for period reset
   - Admin can adjust soft limits in `org_billing_states`

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Dashboard                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │ Billing Page│    │ billingApi  │    │ Stripe Checkout     │  │
│  └──────┬──────┘    └──────┬──────┘    └──────────┬──────────┘  │
└─────────┼──────────────────┼─────────────────────┼──────────────┘
          │                  │                     │
          ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                          API                                     │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │ Billing Routes  │───▶│ BillingService  │                     │
│  └────────┬────────┘    └────────┬────────┘                     │
│           │                      │                               │
│           │              ┌───────┴───────┐                       │
│           │              ▼               ▼                       │
│           │      ┌──────────────┐  ┌──────────────┐             │
│           │      │StripeService │  │ Quota Check  │             │
│           │      └──────┬───────┘  └──────┬───────┘             │
│           │             │                 │                      │
│  ┌────────┼─────────────┼─────────────────┼────────────────┐    │
│  │        ▼             ▼                 ▼                │    │
│  │   Webhook      ┌──────────┐    ┌──────────────┐         │    │
│  │   Handler      │  Stripe  │    │  Supabase    │         │    │
│  │                │   API    │    │  (Postgres)  │         │    │
│  └────────────────┴──────────┴────┴──────────────┴─────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Notes

1. **Existing Infrastructure**: Sprint S87 discovered the billing system was already fully implemented in S28-S34. This documentation formalizes the activation process.

2. **No Migration Required**: Migrations 35-39 contain the complete billing schema. No new migrations needed.

3. **DS v2 Compliant**: The billing page was updated in Sprint S86 to use DS v2 tokens.

4. **Feature Flag Safe**: All billing features are behind feature flags for gradual rollout.
