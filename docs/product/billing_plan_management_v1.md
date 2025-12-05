# Self-Service Plan Management V1 (Sprint S33)

**Status:** ✅ Implemented
**Sprint:** S33
**Dependencies:** S28 (Billing Kernel), S29 (Hard Limits), S30 (Stripe Integration), S31 (Overage Billing), S32 (Usage Alerts)
**Feature Flags:** `ENABLE_STRIPE_BILLING`, `ENABLE_OVERAGE_BILLING`, `ENABLE_USAGE_ALERTS`

---

## Overview

Sprint S33 implements self-service plan management capabilities, allowing organizations to upgrade, downgrade, and manage their billing plans through a user-friendly interface. The system intelligently blocks downgrades when current usage exceeds target plan limits and provides AI-driven plan recommendations based on usage patterns.

### Key Features

1. **Plan Switching** - Upgrade or downgrade between plans with automatic validation
2. **Usage Guardrails** - Prevent downgrades that would violate new plan limits
3. **Smart Recommendations** - AI-driven plan upsell suggestions
4. **Stripe Integration** - Automated proration and subscription management
5. **Enriched Billing Summary** - Real-time renewal dates, overage projections, and recommendations

---

## Architecture

### Service Layer Enhancements

#### BillingService (apps/api/src/services/billingService.ts)

**New Methods:**

1. **`switchOrgPlan(orgId: string, targetPlanSlug: string): Promise<OrgBillingState | null>`**
   - Validates plan transition (upgrade vs downgrade)
   - Blocks downgrades when current usage exceeds target plan limits
   - Integrates with StripeService for paid plans
   - Generates `plan_upgraded` or `plan_downgraded` alerts
   - **Throws:** `BillingQuotaError` when downgrade would violate new limits

2. **`getPlanRecommendations(orgId: string): Promise<string | null>`**
   - Returns recommended plan slug for upsell nudges
   - **Recommendation Logic:**
     - Usage > 80% of current plan → Recommend next tier
     - Critical alerts present → Recommend upgrade
     - Overage costs > $50/month → Recommend upgrade
   - Returns `null` for enterprise plan or low usage

3. **`buildOrgBillingSummaryEnriched(orgId: string): Promise<OrgBillingSummaryEnriched | null>`**
   - Extends S32 summary with:
     - `daysUntilRenewal`: Days remaining in current billing period
     - `projectedOverageCost`: Estimated overage cost in cents
     - `recommendedPlanSlug`: AI-driven upgrade recommendation

**Private Helper:**

- **`generatePlanChangeAlert(orgId, fromPlanSlug, toPlanSlug, isUpgrade)`**
  - Creates `plan_upgraded` or `plan_downgraded` alert with metadata

#### StripeService (apps/api/src/services/stripeService.ts)

**New Methods:**

1. **`switchSubscriptionPlan(orgId: string, targetPlanSlug: string): Promise<void>`**
   - Retrieves current Stripe subscription
   - Updates subscription with new price ID
   - **Proration:** Uses `proration_behavior: 'always_invoice'`
   - **Trial Handling:** Sets `trial_end: 'now'` when upgrading from trial
   - Updates local `org_billing_state` with new plan and status

2. **`retrieveSubscriptionDetails(orgId: string): Promise<SubscriptionDetails>`**
   - Returns:
     - `currentPeriodEnd`: ISO timestamp of period end
     - `nextBillingDate`: When next charge occurs
     - `cancelAtPeriodEnd`: Whether subscription will cancel
     - `status`: Current StripeSubscriptionStatus
     - `trialEnd`: ISO timestamp or null

---

## API Endpoints

### GET /api/v1/billing/plans/:slug

**Description:** Retrieve plan details by slug
**Auth:** Required (`requireUser` preHandler)
**Params:**
- `slug` (string): Plan slug (starter, growth, enterprise, etc.)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "slug": "growth",
    "name": "Growth",
    "description": "For growing teams",
    "monthlyPriceCents": 5000,
    "includedTokensMonthly": 500000,
    "includedPlaybookRunsMonthly": 50,
    "includedSeats": 5,
    "overageTokenPriceMilliCents": 8,
    "overagePlaybookRunPriceCents": 80,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

**Errors:**
- `404 PLAN_NOT_FOUND`: Plan slug doesn't exist

---

### POST /api/v1/billing/org/switch-plan

**Description:** Switch organization to a different plan
**Auth:** Required (`requireUser` preHandler)
**Body:**
```json
{
  "targetPlanSlug": "growth"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "planId": "plan-growth-uuid",
    "billingStatus": "active",
    "message": "Successfully switched to growth"
  }
}
```

**Errors:**
- `422 UPGRADE_REQUIRED`: Downgrade blocked due to current usage exceeding target limits
  ```json
  {
    "success": false,
    "error": {
      "code": "UPGRADE_REQUIRED",
      "message": "Cannot downgrade: current usage exceeds target plan limits",
      "details": {
        "type": "quota_exceeded",
        "quotaType": "tokens",
        "currentUsage": 200000,
        "limit": 100000,
        "requested": 0,
        "billingStatus": "active",
        "planSlug": "growth",
        "periodStart": "2025-01-01T00:00:00Z",
        "periodEnd": "2025-02-01T00:00:00Z"
      }
    }
  }
  ```

---

### POST /api/v1/billing/org/payment-method

**Description:** Generate Stripe Customer Portal link for payment method management
**Auth:** Required (`requireUser` preHandler)
**Body:** `{}`

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://billing.stripe.com/session/xxx"
  }
}
```

**Errors:**
- `503 FEATURE_DISABLED`: Stripe billing not enabled

**Usage:**
```typescript
const response = await fetch('/api/v1/billing/org/payment-method', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
const { url } = await response.json();
window.location.href = url; // Redirect to Stripe portal
```

---

### POST /api/v1/billing/org/plan/cancel

**Description:** Cancel subscription (at period end or immediately)
**Auth:** Required (`requireUser` preHandler)
**Body:**
```json
{
  "immediate": false  // Optional, defaults to false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Subscription will be canceled at the end of the billing period",
    "canceledAt": "2025-01-15T10:30:00Z"
  }
}
```

**Errors:**
- `503 FEATURE_DISABLED`: Stripe billing not enabled

---

## Type Definitions

### OrgBillingSummaryEnriched (S33)

Located in: `packages/types/src/billing.ts`

```typescript
export interface OrgBillingSummaryEnriched extends OrgBillingSummaryWithAlerts {
  daysUntilRenewal: number | null; // Days remaining in current billing period
  projectedOverageCost: number | null; // Estimated overage cost in cents
  recommendedPlanSlug: string | null; // Recommended plan for upgrade
}
```

**Type Hierarchy:**
```
OrgBillingSummary (S28)
  └─ OrgBillingSummaryWithStripe (S30)
      └─ OrgBillingSummaryWithOverages (S31)
          └─ OrgBillingSummaryWithAlerts (S32)
              └─ OrgBillingSummaryEnriched (S33) ✅
```

---

## Usage Examples

### Backend: Switch Plan

```typescript
import { BillingService } from './services/billingService';

const billingService = new BillingService(supabase);

try {
  // Upgrade to growth plan
  const newState = await billingService.switchOrgPlan('org-123', 'growth');
  console.log('Switched to plan:', newState?.planId);
} catch (err) {
  if (err instanceof BillingQuotaError) {
    // Handle downgrade blocked
    console.error('Downgrade blocked:', err.details);
  }
}
```

### Backend: Get Plan Recommendations

```typescript
const recommendedPlan = await billingService.getPlanRecommendations('org-123');

if (recommendedPlan) {
  console.log(`Consider upgrading to ${recommendedPlan}`);
  // Show upsell nudge in UI
}
```

### Backend: Build Enriched Summary

```typescript
const enrichedSummary = await billingService.buildOrgBillingSummaryEnriched('org-123');

if (enrichedSummary) {
  console.log(`Days until renewal: ${enrichedSummary.daysUntilRenewal}`);
  console.log(`Projected overage: $${(enrichedSummary.projectedOverageCost / 100).toFixed(2)}`);

  if (enrichedSummary.recommendedPlanSlug) {
    console.log(`Recommended plan: ${enrichedSummary.recommendedPlanSlug}`);
  }
}
```

### Frontend: Switch Plan with Error Handling

```tsx
async function handlePlanSwitch(targetPlan: string) {
  try {
    const response = await fetch('/api/v1/billing/org/switch-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ targetPlanSlug: targetPlan })
    });

    const result = await response.json();

    if (!result.success && result.error?.code === 'UPGRADE_REQUIRED') {
      // Show downgrade blocked dialog
      showDialog({
        title: 'Cannot Downgrade',
        message: `Your current usage (${result.error.details.currentUsage} tokens) ` +
                `exceeds the ${targetPlan} plan limit (${result.error.details.limit} tokens). ` +
                `Please reduce your usage before downgrading.`
      });
      return;
    }

    if (result.success) {
      showToast('Plan switched successfully!');
      refreshBillingSummary();
    }
  } catch (err) {
    console.error('Plan switch failed:', err);
  }
}
```

---

## Business Logic

### Downgrade Validation

When switching plans, the system validates whether a downgrade is safe:

1. **Retrieve current usage:**
   ```typescript
   const summary = await billingService.buildOrgBillingSummary(orgId);
   ```

2. **Check if downgrade:**
   ```typescript
   const isDowngrade = targetPlan.monthlyPriceCents < currentPlan.monthlyPriceCents;
   ```

3. **Validate usage against target plan limits:**
   ```typescript
   if (isDowngrade) {
     const wouldExceedTokens = targetPlan.includedTokensMonthly < summary.tokensUsed;
     const wouldExceedRuns = targetPlan.includedPlaybookRunsMonthly < summary.playbookRuns;
     const wouldExceedSeats = targetPlan.includedSeats < summary.seats;

     if (wouldExceedTokens || wouldExceedRuns || wouldExceedSeats) {
       throw new BillingQuotaError({
         type: 'quota_exceeded',
         quotaType: 'tokens', // Or 'playbook_runs' or 'seats'
         currentUsage: summary.tokensUsed,
         limit: targetPlan.includedTokensMonthly,
         requested: 0,
         billingStatus: summary.billingStatus,
         planSlug: currentPlan.slug,
         periodStart: summary.currentPeriodStart,
         periodEnd: summary.currentPeriodEnd
       });
     }
   }
   ```

### Plan Recommendation Algorithm

```typescript
async getPlanRecommendations(orgId: string): Promise<string | null> {
  const summary = await this.buildOrgBillingSummary(orgId);
  if (!summary || !summary.plan) return null;

  const currentPlan = summary.plan;
  if (currentPlan.slug === 'enterprise') return null; // No higher tier

  // Get next higher plan
  const allPlans = await this.listPlans(); // Sorted by price
  const currentIndex = allPlans.findIndex(p => p.slug === currentPlan.slug);
  const nextPlan = allPlans[currentIndex + 1];
  if (!nextPlan) return null;

  // Recommendation Criteria:

  // 1. Usage > 80% of limit
  const tokenLimit = summary.softLimits.tokens ?? currentPlan.includedTokensMonthly;
  const runLimit = summary.softLimits.playbookRuns ?? currentPlan.includedPlaybookRunsMonthly;

  const tokenUsagePercent = tokenLimit > 0 ? (summary.tokensUsed / tokenLimit) * 100 : 0;
  const runUsagePercent = runLimit > 0 ? (summary.playbookRuns / runLimit) * 100 : 0;

  if (tokenUsagePercent > 80 || runUsagePercent > 80) {
    return nextPlan.slug;
  }

  // 2. Active critical alerts
  if (FLAGS.ENABLE_USAGE_ALERTS) {
    const alertSummary = await this.getAlertSummaryForOrg(orgId);
    if (alertSummary.bySeverity.critical > 0) {
      return nextPlan.slug;
    }
  }

  // 3. Overage costs > $50/month
  if (FLAGS.ENABLE_OVERAGE_BILLING) {
    const overageSummary = await this.getOverageSummaryForOrg(orgId);
    if (overageSummary && overageSummary.totalCost > 5000) { // 5000 cents = $50
      return nextPlan.slug;
    }
  }

  return null;
}
```

---

## Testing

### Comprehensive Test Suite

Located in: `apps/api/tests/billingPlanManagement.test.ts`

**Test Coverage:**

1. **Plan Switching:**
   - ✅ Successful upgrade (starter → growth)
   - ✅ Downgrade blocked when usage exceeds limits
   - ✅ Downgrade allowed when usage within limits
   - ✅ Alert generation on successful switch

2. **Plan Recommendations:**
   - ✅ Recommend upgrade when token usage > 80%
   - ✅ Recommend upgrade when playbook run usage > 80%
   - ✅ Return null for enterprise plan (no higher tier)
   - ✅ Return null when usage < 80%

3. **Enriched Summary:**
   - ✅ Include `daysUntilRenewal` calculation
   - ✅ Include `projectedOverageCost` from S31
   - ✅ Include `recommendedPlanSlug` from recommendations
   - ✅ Handle null base summary gracefully

4. **Stripe Integration (outlined):**
   - Upgrade with trial termination
   - Downgrade with proration
   - Subscription renewal details retrieval

---

## Security Considerations

### Authorization

- All API endpoints require authenticated user (`requireUser` preHandler)
- Org-level authorization enforced via `getUserOrgId()` helper
- Only org members can switch plans for their organization

### Validation

- Plan slugs validated against `billing_plans` table (must exist and be active)
- Target plan must be different from current plan
- Zod schemas validate all request bodies:
  - `switchPlanRequestSchema`
  - `cancelPlanRequestSchema`
  - `getPlanBySlugParamsSchema`

### Stripe Integration

- Subscription updates use authenticated Stripe API client
- Webhook signature verification for Stripe events
- Customer Portal sessions expire after 1 hour

---

## Monitoring & Observability

### Logging

All plan management operations are logged:

```typescript
logger.info('Switching org plan', { orgId, fromPlan, toPlan, isUpgrade });
logger.error('Failed to switch plan', { error, orgId, targetPlanSlug });
```

### Alerts

Plan changes trigger billing alerts (S32):
- `plan_upgraded`: Severity `info`, includes old/new plan metadata
- `plan_downgraded`: Severity `warning`, includes old/new plan metadata

### Metrics

Track:
- Plan switch success/failure rates
- Downgrade block frequency
- Recommendation acceptance rates
- Average overage costs per plan tier

---

## Future Enhancements

### Planned for Future Sprints

- **Dashboard UI (S33 Part 2):**
  - Plan Selector component with feature comparison
  - Usage Limits Visualizer with progress bars
  - Stripe Checkout Integration for initial subscription
  - AlertsPanel integration for billing notifications

- **Additional Features:**
  - Proration preview before switching
  - Plan switch scheduling (switch at period end)
  - Custom plan tiers for enterprise
  - Multi-currency support
  - Annual billing discounts

---

## Migration Notes

### Backwards Compatibility

- Extends S28-S32 functionality without breaking changes
- All existing billing APIs remain functional
- New endpoints are additive only
- Feature-flagged with existing flags

### Database Schema

- **No new migrations required**
- Uses existing tables: `billing_plans`, `org_billing_state`, `org_billing_usage_monthly`, `billing_alerts`
- Stripe integration uses existing `stripe_customer_id`, `stripe_subscription_id` fields

---

## Troubleshooting

### Common Issues

**Issue:** Downgrade blocked unexpectedly
**Solution:** Check current usage vs target plan limits. User must reduce usage before downgrading.

**Issue:** Stripe subscription switch fails
**Solution:** Verify Stripe API key, check subscription status in Stripe dashboard, ensure plan has `stripe_price_id` configured.

**Issue:** Enriched summary missing fields
**Solution:** Ensure feature flags are enabled (`ENABLE_OVERAGE_BILLING`, `ENABLE_USAGE_ALERTS`). Check S31/S32 functionality.

**Issue:** Plan recommendations not showing
**Solution:** Verify usage is > 80% or overages > $50/month. Check alert severity levels.

---

## References

- [Sprint S28: Billing Kernel](./billing_kernel_v1.md)
- [Sprint S29: Hard Limits](./hard_quota_limits_v1.md)
- [Sprint S30: Stripe Integration](./stripe_integration_v1.md)
- [Sprint S31: Overage Billing](./overage_billing_v1.md)
- [Sprint S32: Usage Alerts](./billing_usage_alerts_v1.md)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)

---

**Last Updated:** 2025-11-20
**Sprint:** S33
**Version:** 1.0
