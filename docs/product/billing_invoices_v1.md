# Billing Invoices v1 (Sprint S34)

**Status:** ✅ Implemented
**Sprint:** S34
**Dependencies:** S28 (Billing Plans), S29 (Usage Tracking), S31 (Overage Pricing), S32 (Usage Alerts), S33 (Self-Service Billing)

## Overview

The Billing Invoices feature provides customers with complete visibility into their billing history, invoice details, and payment information. It integrates with Stripe to sync and cache invoice data locally, enabling fast retrieval and rich breakdowns without repeated API calls to Stripe.

### Key Features

1. **Invoice History Summary** - View last 12 months of invoices with aggregate metrics
2. **Detailed Invoice Breakdown** - Complete line-by-line cost breakdown for any invoice
3. **Overage Cost Identification** - Automatic detection and categorization of overage charges
4. **Usage Snapshots** - Historical usage data linked to billing periods
5. **Alert Integration** - Related billing alerts displayed in context with invoices
6. **Stripe Integration** - Seamless sync with Stripe invoice data
7. **Local Caching** - Fast invoice retrieval via `org_invoice_cache` table

## Architecture

### Data Flow

```
┌─────────────┐
│   Stripe    │
│   Invoices  │
└──────┬──────┘
       │ sync (webhook + manual)
       ▼
┌─────────────────────────┐
│  org_invoice_cache      │
│  (Local Invoice Cache)  │
└──────┬──────────────────┘
       │ query
       ▼
┌─────────────────────────┐
│  BillingService         │
│  - getBillingHistory    │
│  - getInvoiceBreakdown  │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  REST API Endpoints     │
│  - GET /invoices        │
│  - GET /invoices/:id    │
│  - POST /invoices/sync  │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Frontend UI            │
│  - Invoice History Page │
│  - Invoice Details Page │
└─────────────────────────┘
```

### Database Schema

**Table: `org_invoice_cache`**

Stores Stripe invoice metadata locally for fast retrieval and reduced API calls.

```sql
CREATE TABLE org_invoice_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_invoice_id text NOT NULL UNIQUE,
  invoice_number text,
  amount_due integer NOT NULL DEFAULT 0,
  amount_paid integer NOT NULL DEFAULT 0,
  amount_remaining integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL, -- 'draft', 'open', 'paid', 'void', 'uncollectible'
  hosted_invoice_url text,
  invoice_pdf text,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb, -- Stores line items, totals, etc.
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_org_invoice_cache_org_id ON org_invoice_cache(org_id);
CREATE INDEX idx_org_invoice_cache_stripe_id ON org_invoice_cache(stripe_invoice_id);
CREATE INDEX idx_org_invoice_cache_org_period ON org_invoice_cache(org_id, period_start DESC);
```

**Row Level Security (RLS):**
- Org isolation enforced via `user_organizations` join
- Users can only access invoices for their organization

## API Endpoints

### 1. GET /api/v1/billing/org/invoices

Returns invoice history summary with aggregate metrics for the last 12 months.

**Authentication:** Required (JWT)

**Request:**
```bash
GET /api/v1/billing/org/invoices
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "last12Invoices": [
      {
        "id": "inv-cache-123",
        "stripeInvoiceId": "in_1234567890",
        "invoiceNumber": "INV-001",
        "amountDue": 2900,
        "amountPaid": 2900,
        "amountRemaining": 0,
        "status": "paid",
        "periodStart": "2024-01-01T00:00:00Z",
        "periodEnd": "2024-02-01T00:00:00Z",
        "hostedInvoiceUrl": "https://invoice.stripe.com/i/...",
        "invoicePdf": "https://pay.stripe.com/invoice/.../pdf"
      }
    ],
    "totalPaid12Mo": 34800,
    "highestInvoice": 3500,
    "averageMonthlyCost": 2900,
    "overageCostsPerInvoice": {
      "in_1234567890": 600
    }
  }
}
```

**Aggregate Metrics:**
- `totalPaid12Mo` - Sum of `amount_paid` for all paid invoices in last 12 months
- `highestInvoice` - Maximum `amount_due` across all invoices
- `averageMonthlyCost` - Average of `amount_paid` for paid invoices
- `overageCostsPerInvoice` - Map of Stripe invoice ID to overage costs

### 2. GET /api/v1/billing/org/invoices/:id

Returns detailed invoice breakdown with line items, usage snapshot, and related alerts.

**Authentication:** Required (JWT)

**Request:**
```bash
GET /api/v1/billing/org/invoices/inv-cache-123
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "invoice": {
      "id": "inv-cache-123",
      "stripeInvoiceId": "in_1234567890",
      "invoiceNumber": "INV-001",
      "amountDue": 3500,
      "amountPaid": 3500,
      "status": "paid",
      "periodStart": "2024-01-01T00:00:00Z",
      "periodEnd": "2024-02-01T00:00:00Z",
      "hostedInvoiceUrl": "https://invoice.stripe.com/i/...",
      "invoicePdf": "https://pay.stripe.com/invoice/.../pdf"
    },
    "breakdown": {
      "planCost": 2900,
      "tokenOverages": 500,
      "runOverages": 100,
      "discounts": 0,
      "prorations": 0,
      "tax": 0,
      "subtotal": 3500,
      "total": 3500
    },
    "lineItems": [
      {
        "description": "Starter Plan Subscription",
        "amount": 2900,
        "quantity": 1,
        "type": "plan"
      },
      {
        "description": "Token overage charges (50,000 tokens)",
        "amount": 500,
        "quantity": 50000,
        "type": "overage"
      },
      {
        "description": "Playbook run overage charges (1 run)",
        "amount": 100,
        "quantity": 1,
        "type": "overage"
      }
    ],
    "usageSnapshot": {
      "tokens": 550000,
      "playbookRuns": 251,
      "seats": 3
    },
    "relatedAlerts": [
      {
        "id": "alert-123",
        "alertType": "usage_hard_warning",
        "severity": "critical",
        "message": "Token usage exceeded plan limit",
        "createdAt": "2024-01-15T00:00:00Z"
      }
    ]
  }
}
```

**Line Item Types:**
- `plan` - Base subscription charges
- `overage` - Usage overage charges (tokens, playbook runs)
- `discount` - Promotional discounts or credits
- `proration` - Pro-rated charges from plan changes
- `tax` - Sales tax or VAT
- `other` - Miscellaneous charges

**Usage Snapshot:**
Aggregates usage data from `org_usage_tracking` for the invoice billing period:
- `tokens` - Total LLM tokens used during period
- `playbookRuns` - Total playbook runs during period
- `seats` - Maximum concurrent seats used during period

### 3. POST /api/v1/billing/org/invoices/sync

Manually sync invoices from Stripe to local cache (admin feature).

**Authentication:** Required (JWT)
**Feature Flag:** `ENABLE_ADMIN_INVOICE_SYNC` must be `true`

**Request:**
```bash
POST /api/v1/billing/org/invoices/sync
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Successfully synced 12 invoices",
    "syncedCount": 12
  }
}
```

**Error Response (Feature Disabled):**
```json
{
  "success": false,
  "error": {
    "code": "FEATURE_DISABLED",
    "message": "Manual invoice sync is not enabled"
  }
}
```

## Backend Services

### StripeService

**New Methods for S34:**

#### `listInvoicesForOrg(orgId: string, limit: number = 12): Promise<Stripe.Invoice[]>`

Lists invoices from Stripe for the organization's customer.

```typescript
const invoices = await stripeService.listInvoicesForOrg('org-123', 12);
```

#### `syncInvoiceToCache(stripeInvoice: Stripe.Invoice, orgId?: string): Promise<void>`

Syncs a single Stripe invoice to `org_invoice_cache` using upsert.

```typescript
await stripeService.syncInvoiceToCache(stripeInvoice, 'org-123');
```

#### `getInvoiceDetails(stripeInvoiceId: string): Promise<Stripe.Invoice>`

Retrieves full invoice details from Stripe with expanded line items.

```typescript
const fullInvoice = await stripeService.getInvoiceDetails('in_1234567890');
```

#### `syncAllInvoicesForOrg(orgId: string, limit: number = 12): Promise<number>`

Batch syncs all invoices for an organization.

```typescript
const syncedCount = await stripeService.syncAllInvoicesForOrg('org-123', 12);
console.log(`Synced ${syncedCount} invoices`);
```

### BillingService

**New Methods for S34:**

#### `getBillingHistorySummary(orgId: string): Promise<BillingHistorySummary>`

Returns invoice history with aggregate metrics and overage identification.

**Implementation:**
1. Query `org_invoice_cache` for last 12 invoices, sorted by `period_start DESC`
2. Calculate aggregate metrics:
   - `totalPaid12Mo` = sum of `amount_paid` where `status = 'paid'`
   - `highestInvoice` = max(`amount_due`)
   - `averageMonthlyCost` = `totalPaid12Mo` / count of paid invoices
3. Extract overage costs from invoice metadata line items
4. Return formatted summary

```typescript
const summary = await billingService.getBillingHistorySummary('org-123');
```

#### `getInvoiceWithBreakdown(orgId: string, invoiceId: string): Promise<InvoiceDetails>`

Returns detailed invoice breakdown with categorized line items, usage snapshot, and alerts.

**Implementation:**
1. Query `org_invoice_cache` for specific invoice
2. Parse and categorize line items from metadata:
   - Plan charges: description contains "subscription" or "plan"
   - Token overages: description contains "token" and "overage"
   - Run overages: description contains "run" and "overage"
3. Calculate breakdown totals
4. Query `org_usage_tracking` for usage snapshot during invoice period
5. Query `billing_usage_alerts` for alerts during invoice period
6. Return complete invoice details

```typescript
const details = await billingService.getInvoiceWithBreakdown('org-123', 'inv-cache-456');
```

## Frontend Implementation

### Invoice History Page

**Route:** `/app/billing/history`

**Features:**
- Summary cards: Total Paid (12 Mo), Average Monthly Cost, Highest Invoice
- Sortable invoice table (by date, amount, status)
- Status badges with color coding
- Download PDF links
- Navigate to invoice details
- Manual sync button (if feature flag enabled)

**Key Components:**
```typescript
// apps/dashboard/src/app/app/billing/history/page.tsx

export default function BillingHistoryPage() {
  const [summary, setSummary] = useState<BillingHistorySummary | null>(null);
  const [sortField, setSortField] = useState<'date' | 'amount' | 'status'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Load billing history
  useEffect(() => {
    loadBillingHistory();
  }, []);

  // Render summary cards + sortable table
}
```

### Invoice Details Page

**Route:** `/app/billing/invoice/[id]`

**Features:**
- Invoice summary card (status, period, total, PDF/Stripe links)
- Cost breakdown (plan charges, overages, discounts, tax)
- Line items table with type badges
- Usage snapshot for billing period
- Related alerts from same period

**Key Components:**
```typescript
// apps/dashboard/src/app/app/billing/invoice/[id]/page.tsx

export default function InvoiceDetailsPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);

  // Load invoice details
  useEffect(() => {
    if (invoiceId) {
      loadInvoiceDetails();
    }
  }, [invoiceId]);

  // Render invoice details sections
}
```

### Frontend API Layer

**File:** `apps/dashboard/src/lib/billingApi.ts`

**New Methods:**
```typescript
export async function getBillingHistory(): Promise<BillingHistorySummary | null>;
export async function getInvoiceDetails(invoiceId: string): Promise<InvoiceDetails | null>;
export async function syncInvoices(): Promise<ApiResponse<{message: string, syncedCount: number}>>;

// Helper functions
export function getInvoiceStatusColor(status: string): 'green' | 'yellow' | 'red' | 'gray';
export function formatInvoicePeriod(periodStart: string, periodEnd: string): string;
```

## Invoice Sync Strategy

### Automatic Sync (Recommended)

Use Stripe webhooks to automatically sync invoices when created or updated:

**Webhook Events to Listen For:**
- `invoice.created`
- `invoice.updated`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Webhook Handler:**
```typescript
// In Stripe webhook handler
if (event.type === 'invoice.created' || event.type === 'invoice.updated') {
  const invoice = event.data.object as Stripe.Invoice;
  await stripeService.syncInvoiceToCache(invoice);
}
```

### Manual Sync (Admin Feature)

For one-time bulk sync or troubleshooting:

1. Set `ENABLE_ADMIN_INVOICE_SYNC=true` in feature flags
2. Call POST `/api/v1/billing/org/invoices/sync`
3. Syncs last 12 invoices from Stripe

**Use Cases:**
- Initial setup/migration
- Recovering from webhook failures
- Admin troubleshooting

## Line Item Categorization Logic

The system automatically categorizes invoice line items based on description patterns:

```typescript
function categorizeLineItem(lineItem: Stripe.InvoiceLineItem): LineItemType {
  const desc = lineItem.description.toLowerCase();

  if (desc.includes('subscription') || desc.includes('plan')) {
    return 'plan';
  }

  if (desc.includes('token') && desc.includes('overage')) {
    return 'overage'; // Token overage
  }

  if (desc.includes('run') && desc.includes('overage')) {
    return 'overage'; // Playbook run overage
  }

  if (desc.includes('discount') || desc.includes('credit')) {
    return 'discount';
  }

  if (desc.includes('proration')) {
    return 'proration';
  }

  if (desc.includes('tax')) {
    return 'tax';
  }

  return 'other';
}
```

## Integration with S31 Overage Tracking

Invoice breakdown automatically identifies and aggregates overage costs:

**Overage Detection:**
1. Parse line items from invoice metadata
2. Identify items with "overage" or "usage" in description
3. Categorize by type (token overage vs. run overage)
4. Sum overage costs per invoice

**Example:**
```json
{
  "overageCostsPerInvoice": {
    "in_1234567890": 600  // $6.00 in overages for this invoice
  },
  "breakdown": {
    "tokenOverages": 500,   // $5.00 token overages
    "runOverages": 100      // $1.00 run overages
  }
}
```

## Integration with S32 Usage Alerts

Invoice details page displays related billing alerts from the same period:

**Alert Linking:**
1. Query `billing_usage_alerts` for alerts where `created_at` is between invoice `period_start` and `period_end`
2. Display alerts in context with invoice
3. Show severity (info, warning, critical)
4. Provide acknowledgement capability

**Example:**
If a user exceeded token limits during a billing period, the related "usage_hard_warning" alert will appear on the invoice details page, providing context for why overages occurred.

## Performance Considerations

### Invoice Caching Benefits

**Without Caching:**
- Every invoice list/details request → Stripe API call
- Stripe rate limits: 100 requests/second (burst)
- Latency: ~200-500ms per API call
- Cost: Increased Stripe API usage

**With Caching (`org_invoice_cache`):**
- Invoice list: Single DB query, sorted by index
- Invoice details: Single DB query by primary key
- Latency: ~10-50ms per request
- No Stripe API rate limit concerns
- Metadata stored as JSONB for efficient querying

### Database Indexing

```sql
-- Fast org-scoped queries
CREATE INDEX idx_org_invoice_cache_org_id ON org_invoice_cache(org_id);

-- Fast lookup by Stripe ID
CREATE INDEX idx_org_invoice_cache_stripe_id ON org_invoice_cache(stripe_invoice_id);

-- Optimized for "last 12 invoices" queries
CREATE INDEX idx_org_invoice_cache_org_period ON org_invoice_cache(org_id, period_start DESC);
```

### Query Optimization

```typescript
// Efficient: Single query with sort + limit
const { data: invoices } = await supabase
  .from('org_invoice_cache')
  .select('*')
  .eq('org_id', orgId)
  .order('period_start', { ascending: false })
  .limit(12);
```

## Testing

### API Tests

**File:** `apps/api/__tests__/billingInvoices.test.ts`

**Coverage:**
- ✅ Invoice history summary retrieval
- ✅ Aggregate metrics calculation
- ✅ Overage cost identification
- ✅ Invoice breakdown with line items
- ✅ Line item categorization
- ✅ Usage snapshot aggregation
- ✅ Alert integration
- ✅ Error handling (non-existent invoices)

**Run Tests:**
```bash
cd apps/api
pnpm test billingInvoices.test.ts
```

### E2E Tests

**Files:**
- `apps/dashboard/tests/billing/invoice-history.spec.ts`
- `apps/dashboard/tests/billing/invoice-details.spec.ts`

**Coverage:**
- ✅ Invoice history page display
- ✅ Summary cards rendering
- ✅ Invoice table with sorting
- ✅ Status badges
- ✅ Invoice details page display
- ✅ Cost breakdown rendering
- ✅ Line items table
- ✅ Usage snapshot display

**Run Tests:**
```bash
cd apps/dashboard
pnpm test:e2e invoice-history
pnpm test:e2e invoice-details
```

## Feature Flags

### ENABLE_ADMIN_INVOICE_SYNC

**File:** `packages/feature-flags/src/flags.ts`

```typescript
export const FLAGS = {
  // ... other flags
  ENABLE_ADMIN_INVOICE_SYNC: true, // S34: Manual invoice sync from Stripe
};
```

**Purpose:** Controls access to POST `/api/v1/billing/org/invoices/sync` endpoint

**Recommendation:**
- Set `true` for development/staging
- Set `false` for production (rely on webhooks)
- Enable temporarily for one-time migrations

## Security Considerations

### Row Level Security (RLS)

All invoice queries are protected by RLS:

```sql
CREATE POLICY org_invoice_cache_org_isolation ON org_invoice_cache
  FOR ALL USING (
    org_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );
```

**Protection:**
- Users can only access invoices for their organization
- Enforced at database level
- Prevents cross-org data leaks

### API Authentication

All endpoints require valid JWT:
- Authenticated via `requireUser` pre-handler
- User → Org mapping via `getUserOrgId()`
- Stripe operations scoped to org's customer ID

### Sensitive Data Handling

**Stored in Cache:**
- Invoice metadata (line items, totals)
- Hosted invoice URLs (Stripe-authenticated)
- PDF URLs (Stripe-authenticated)

**NOT Stored:**
- Payment method details
- Credit card numbers
- Stripe customer secrets

**Access Control:**
- Invoice PDFs require Stripe authentication
- Hosted invoice URLs are time-limited
- No PCI compliance concerns (no card data)

## Monitoring and Observability

### Key Metrics to Track

1. **Invoice Sync Performance**
   - Webhook processing time
   - Sync success/failure rate
   - Cache hit ratio

2. **API Response Times**
   - `/invoices` endpoint latency
   - `/invoices/:id` endpoint latency
   - Database query performance

3. **Usage Patterns**
   - Invoice views per org
   - PDF download frequency
   - Manual sync usage

### Logging

**Important Events to Log:**
```typescript
// Invoice sync events
logger.info('Invoice synced to cache', {
  stripeInvoiceId,
  orgId,
  amount: invoice.amount_due
});

// Manual sync events
logger.info('Manual invoice sync requested', {
  orgId,
  syncedCount
});

// Error events
logger.error('Failed to sync invoice', {
  stripeInvoiceId,
  error: err.message
});
```

## Troubleshooting

### Issue: Invoices Not Appearing

**Possible Causes:**
1. Stripe webhooks not configured
2. Invoice not synced to cache yet
3. RLS policy blocking access

**Solution:**
```bash
# Check if webhooks are configured
stripe webhooks list

# Manually sync invoices
curl -X POST /api/v1/billing/org/invoices/sync \
  -H "Authorization: Bearer <token>"

# Check RLS policies
psql> SELECT * FROM org_invoice_cache WHERE org_id = '<org-id>';
```

### Issue: Overage Costs Not Detected

**Possible Causes:**
1. Line item descriptions don't match patterns
2. Metadata not properly synced from Stripe

**Solution:**
```typescript
// Check invoice metadata structure
const invoice = await supabase
  .from('org_invoice_cache')
  .select('metadata')
  .eq('id', invoiceId)
  .single();

console.log('Line items:', invoice.data.metadata.lines);

// Verify line item descriptions
// Update categorization logic if needed
```

### Issue: Usage Snapshot Missing

**Possible Causes:**
1. No usage data for invoice period
2. Period dates don't align

**Solution:**
```sql
-- Check usage data for period
SELECT * FROM org_usage_tracking
WHERE org_id = '<org-id>'
AND period_start >= '<invoice-period-start>'
AND period_end <= '<invoice-period-end>';
```

## Future Enhancements

### Potential Improvements for Future Sprints

1. **Invoice Search & Filtering**
   - Search by invoice number
   - Filter by status, date range, amount
   - Export to CSV/Excel

2. **Payment Method Management**
   - View payment methods on invoice page
   - Update payment method for failed invoices
   - Retry failed payments

3. **Dispute/Refund Handling**
   - Request invoice adjustments
   - Track dispute status
   - Refund visibility

4. **Multi-Currency Support**
   - Display amounts in org's currency
   - Currency conversion for multi-region orgs

5. **Invoice Notifications**
   - Email notifications for new invoices
   - Payment failure alerts
   - Upcoming invoice previews

6. **Advanced Analytics**
   - Cost trends over time
   - Overage pattern analysis
   - Forecasting & budgeting tools

## Related Documentation

- [S28: Billing Plans & Tiers](./billing_plans_v1.md)
- [S29: Usage Tracking System](./usage_tracking_v1.md)
- [S31: Overage Pricing](./overage_pricing_v1.md)
- [S32: Usage Alerts](./usage_alerts_v1.md)
- [S33: Self-Service Billing Portal](./self_service_billing_v1.md)

## Changelog

### v1.0.0 (Sprint S34) - 2024-03-15
- ✅ Initial implementation
- ✅ Invoice caching system
- ✅ Billing history summary
- ✅ Invoice breakdown with line items
- ✅ Overage cost identification
- ✅ Usage snapshot integration
- ✅ Alert integration
- ✅ Frontend UI (history + details pages)
- ✅ API endpoints
- ✅ Tests (API + E2E)
