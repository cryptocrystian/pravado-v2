# Billing Overage Engine V1

**Sprint:** S31
**Status:** ✅ Implemented
**Feature Flag:** `ENABLE_OVERAGE_BILLING`
**Dependencies:** S28 (Billing Kernel), S29 (Hard Limits), S30 (Stripe Integration)

## Overview

The Billing Overage Engine provides overage-based billing calculations and tracking for organizations that exceed their plan limits. When usage (tokens, playbook runs, or seats) exceeds included allowances, overages are calculated, recorded, and can be invoiced through Stripe.

## Architecture

### Core Components

1. **Database Schema** (Migration 37)
   - `org_billing_overages` - Records individual overage charges
   - Extended `org_billing_usage_monthly` with overage counters

2. **Type System**
   - `OverageCalculationResult` - Calculated overage amounts and costs
   - `OverageRecord` - Individual overage charge record
   - `BillingPeriod` - Billing period timeframe
   - `OverageRates` - Pricing configuration

3. **Business Logic** (BillingService)
   - `calculateOveragesForOrg()` - Calculate overage amounts and costs
   - `recordOverages()` - Persist overage records to database
   - `getOverageSummaryForOrg()` - Aggregate overage totals

4. **Stripe Integration** (StripeService - Stub in S31)
   - `createInvoiceItemForOverage()` - Create Stripe invoice item (stub)
   - `attachOveragesToUpcomingInvoice()` - Attach to next invoice (stub)

5. **API Endpoints**
   - `GET /api/v1/billing/org/overages` - Get overage summary
   - `POST /api/v1/billing/org/overages/recalculate` - Recalculate and record

## Overage Calculation Formula

### Token Overages
```
overage_amount = max(0, tokens_used - token_limit)
token_limit = soft_limit ?? plan.included_tokens_monthly
unit_price = plan.overage_token_price_milli_cents
cost_cents = (overage_amount × unit_price) / 1000
```

**Example:**
- Plan: 500,000 tokens/month included
- Used: 750,000 tokens
- Overage: 250,000 tokens
- Unit price: 10 milli-cents ($0.00001/token)
- Cost: 250,000 × 10 / 1000 = 2,500 cents = **$25.00**

### Playbook Run Overages
```
overage_amount = max(0, runs_used - run_limit)
run_limit = soft_limit ?? plan.included_playbook_runs_monthly
unit_price = plan.overage_playbook_run_price_cents
cost_cents = overage_amount × unit_price
```

**Example:**
- Plan: 50 runs/month included
- Used: 75 runs
- Overage: 25 runs
- Unit price: 100 cents ($1.00/run)
- Cost: 25 × 100 = 2,500 cents = **$25.00**

### Seat Overages
```
overage_amount = max(0, seats_used - seat_limit)
seat_limit = soft_limit ?? plan.included_seats
unit_price = 0  // S31: Stub - not priced yet
cost_cents = overage_amount × unit_price
```

**Note:** Seat overage pricing is stubbed in S31 and will be implemented in a future sprint.

### Total Overage Cost
```
total_cost_cents = token_cost + run_cost + seat_cost
```

## Database Schema

### org_billing_overages
Records individual overage charges per metric type.

| Column                 | Type         | Description                                    |
|------------------------|--------------|------------------------------------------------|
| id                     | uuid         | Primary key                                    |
| org_id                 | uuid         | Organization reference (FK to orgs)            |
| metric_type            | text         | 'tokens', 'playbook_runs', or 'seats'          |
| amount                 | numeric      | Quantity consumed beyond limits                |
| unit_price             | numeric      | Price per unit in cents (or milli-cents)       |
| cost                   | numeric      | Total cost = amount × unit_price               |
| billing_period_start   | timestamptz  | Start of billing period                        |
| billing_period_end     | timestamptz  | End of billing period                          |
| created_at             | timestamptz  | Record creation timestamp                      |

**Indexes:**
- `idx_org_billing_overages_org_id` on (org_id)
- `idx_org_billing_overages_period` on (org_id, billing_period_start, billing_period_end)
- `idx_org_billing_overages_metric_type` on (org_id, metric_type)

### org_billing_usage_monthly (Extended)
Added overage tracking columns to existing usage table.

| New Column      | Type    | Description                                  |
|-----------------|---------|----------------------------------------------|
| overage_tokens  | numeric | Tokens consumed beyond limits this period    |
| overage_runs    | numeric | Runs consumed beyond limits this period      |
| overage_seats   | numeric | Seats consumed beyond limits this period     |

## API Endpoints

### GET /api/v1/billing/org/overages

Get overage summary for the organization's current billing period.

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "success": true,
  "data": {
    "orgId": "org-123",
    "period": {
      "start": "2024-02-01T00:00:00Z",
      "end": "2024-03-01T00:00:00Z"
    },
    "overages": {
      "tokens": {
        "amount": 250000,
        "unitPrice": 10,
        "cost": 2500
      },
      "playbookRuns": {
        "amount": 25,
        "unitPrice": 100,
        "cost": 2500
      },
      "seats": {
        "amount": 0,
        "unitPrice": 0,
        "cost": 0
      }
    },
    "totalCost": 5000
  }
}
```

**Error Responses:**
- `503 OVERAGE_BILLING_DISABLED` - Feature flag disabled
- `403 NO_ORG_ACCESS` - User not in org
- `500 OVERAGE_ERROR` - Internal error

### POST /api/v1/billing/org/overages/recalculate

Recalculate and record overages for the current billing period.

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "force": false  // Optional: Force recalculation even if already calculated
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orgId": "org-123",
    "period": {
      "start": "2024-02-01T00:00:00Z",
      "end": "2024-03-01T00:00:00Z"
    },
    "overages": {
      "tokens": { "amount": 250000, "unitPrice": 10, "cost": 2500 },
      "playbookRuns": { "amount": 25, "unitPrice": 100, "cost": 2500 },
      "seats": { "amount": 0, "unitPrice": 0, "cost": 0 }
    },
    "totalCost": 5000
  }
}
```

**Error Responses:**
- `503 OVERAGE_BILLING_DISABLED` - Feature flag disabled
- `403 NO_ORG_ACCESS` - User not in org
- `400 CALCULATION_FAILED` - No plan or billing summary
- `500 RECALCULATION_FAILED` - Internal error

## Lifecycle

### 1. Usage Accumulation (S28)
As users consume resources:
- Tokens tracked via `BillingService.updateUsageCounters()`
- Playbook runs tracked via execution engine
- Seats tracked via org membership

### 2. Overage Calculation
Periodically (e.g., end of billing period):
```typescript
const calculation = await billingService.calculateOveragesForOrg(orgId);
// Returns: OverageCalculationResult with amounts, prices, costs
```

### 3. Overage Recording
Persist calculated overages:
```typescript
await billingService.recordOverages(orgId, calculation);
// Inserts into org_billing_overages
// Updates org_billing_usage_monthly overage columns
```

### 4. Overage Retrieval
Get current period overage summary:
```typescript
const summary = await billingService.getOverageSummaryForOrg(orgId);
// Aggregates all overage records for current period
```

### 5. Invoice Generation (S31 Stub)
Future implementation will:
```typescript
await stripeService.attachOveragesToUpcomingInvoice(orgId, calculation);
// Creates Stripe invoice items
// Attaches to upcoming subscription invoice
```

## Integration Points

### S28 (Billing Kernel)
- Reads from `billing_plans` for overage rates
- Reads from `org_billing_usage_monthly` for current usage
- Writes overage totals back to `org_billing_usage_monthly`

### S29 (Hard Limits)
- Overage billing runs *after* hard limits are checked
- Hard limits prevent usage beyond hard caps
- Overages apply to usage within allowed limits

### S30 (Stripe Integration)
- Stub methods in S31: `createInvoiceItemForOverage()`, `attachOveragesToUpcomingInvoice()`
- Future implementation will create Stripe invoice items
- Overages will appear as line items on subscription invoices

## Feature Flag

```typescript
FLAGS.ENABLE_OVERAGE_BILLING = true  // S31
```

When disabled:
- Overage calculation returns `null`
- Overage recording is skipped
- Overage API endpoints return `503 OVERAGE_BILLING_DISABLED`

## Testing

Comprehensive test suite in `__tests__/overageBilling.test.ts`:

1. **Calculation Tests**
   - ✅ Calculate overages when usage exceeds limits
   - ✅ Return zero overages when within limits
   - ✅ Handle missing plans gracefully

2. **Recording Tests**
   - ✅ Insert overage records for non-zero overages
   - ✅ Update usage table with overage totals
   - ✅ Skip insertion for zero overages

3. **Retrieval Tests**
   - ✅ Return null when no billing period
   - ✅ Aggregate overage records for current period

4. **Integration Tests**
   - ✅ Full lifecycle: Calculate → Record → Retrieve

## Performance Considerations

1. **Indexing**
   - Composite indexes on (org_id, period) for fast queries
   - Separate index on metric_type for aggregation

2. **Calculation Frequency**
   - Run overage calculation at end of billing period
   - Can be triggered manually via API for real-time estimates

3. **Data Volume**
   - One record per (org, metric_type, period)
   - Typical org: ~3 records/month (tokens, runs, seats)
   - 1000 orgs: ~3000 records/month = ~36k/year

## Future Enhancements

### S32+ Roadmap

1. **Seat Overage Pricing**
   - Implement pricing for seat overages
   - Add to invoice generation

2. **Automatic Invoice Generation**
   - Replace stub methods with real Stripe integration
   - Create invoice items automatically at period end
   - Attach to subscription invoices

3. **Overage Notifications**
   - Email alerts when approaching overage thresholds
   - Dashboard warnings at 80%, 90%, 100% of limits

4. **Overage Analytics**
   - Historical overage trends
   - Cost projection dashboard
   - Optimization recommendations

5. **Overage Budget Caps**
   - Set maximum overage spend per period
   - Block usage when cap reached
   - Upgrade prompts

## Security & RLS

Row Level Security policies on `org_billing_overages`:

- **SELECT:** Users can view overages for their orgs
- **INSERT/UPDATE/DELETE:** Service role only

This ensures users can read their billing data but cannot manipulate overage records.

## Observability

Logging via `@pravado/utils` logger:

- `INFO` - Overage calculations, recordings, retrievals
- `WARN` - Missing plans, no billing summary
- `ERROR` - Database errors, calculation failures

All operations include `orgId` for traceability.

## Rollout Strategy

1. **S31 (Current):** Core overage engine, stub Stripe integration
2. **S32:** Implement Stripe invoice generation
3. **S33:** Add overage notifications and dashboards
4. **S34:** Enable for beta customers
5. **S35:** General availability

---

**Document Version:** 1.0
**Last Updated:** 2025-11-19
**Author:** Claude (AI Agent)
**Sprint:** S31 - Overage Billing Engine V1
