# PR Outreach Email Deliverability & Engagement Analytics V1

**Sprint:** S45
**Status:** Complete
**Dependencies:** S44 (Automated Journalist Outreach Engine)

---

## Overview

The PR Outreach Email Deliverability & Engagement Analytics system adds comprehensive email delivery tracking, engagement monitoring, and journalist analytics to the outreach engine built in S44. It provides real-time visibility into email deliverability, open/click tracking, and calculates engagement scores to help PR teams optimize their journalist outreach strategies.

### Key Features

- **Email Provider Integration**: Pluggable architecture supporting SendGrid, Mailgun, AWS SES, and Stub (testing)
- **Deliverability Tracking**: Track sent, delivered, bounced, complained, and failed emails
- **Engagement Monitoring**: Track opens, clicks, and replies for each sent email
- **Webhook Processing**: Receive and process delivery events from email providers
- **Engagement Scoring**: Weighted scoring algorithm to rank journalist responsiveness
- **Analytics Dashboard**: Comprehensive UI for monitoring deliverability metrics
- **Provider Abstraction**: Switch between email providers via configuration

---

## Architecture

### Database Schema

#### `pr_outreach_email_messages`
Individual email tracking table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `org_id` | UUID | Organization reference |
| `run_id` | UUID | Outreach run reference (S44) |
| `sequence_id` | UUID | Outreach sequence reference (S44) |
| `step_number` | INTEGER | Step number in sequence |
| `journalist_id` | UUID | Journalist reference |
| `subject` | TEXT | Email subject line |
| `body_html` | TEXT | HTML email body |
| `body_text` | TEXT | Plain text email body |
| `provider_message_id` | TEXT | External provider message ID |
| `send_status` | TEXT | pending \| sent \| bounced \| complained \| failed |
| `sent_at` | TIMESTAMPTZ | When email was sent |
| `delivered_at` | TIMESTAMPTZ | When email was delivered |
| `opened_at` | TIMESTAMPTZ | When email was first opened |
| `clicked_at` | TIMESTAMPTZ | When link was first clicked |
| `bounced_at` | TIMESTAMPTZ | When email bounced |
| `complained_at` | TIMESTAMPTZ | When spam complaint received |
| `raw_event` | JSONB | Raw provider event data |
| `metadata` | JSONB | Additional tracking metadata |

**Indexes:**
- `org_id`, `run_id`, `sequence_id`, `journalist_id`, `provider_message_id`, `send_status`, `sent_at DESC`

#### `pr_outreach_engagement_metrics`
Aggregated journalist engagement metrics

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `org_id` | UUID | Organization reference |
| `journalist_id` | UUID | Journalist reference |
| `total_sent` | INTEGER | Total emails sent |
| `total_opened` | INTEGER | Total emails opened |
| `total_clicked` | INTEGER | Total emails with clicks |
| `total_replied` | INTEGER | Total emails replied to |
| `total_bounced` | INTEGER | Total emails bounced |
| `total_complained` | INTEGER | Total spam complaints |
| `engagement_score` | FLOAT | Calculated engagement score (0-1) |

**Unique Constraint:** `(org_id, journalist_id)`

**Engagement Score Formula:**
```
score = (open_rate * 0.2) + (click_rate * 0.4) + (reply_rate * 0.3) - (bounce_rate * 0.3)
```
Clamped between 0.0 and 1.0.

### Database Functions

#### `calculate_engagement_score()`
Calculates engagement score from metrics
```sql
SELECT calculate_engagement_score(
  p_total_sent := 100,
  p_total_opened := 60,
  p_total_clicked := 30,
  p_total_replied := 20,
  p_total_bounced := 5
);
```

#### `update_journalist_engagement_metrics()`
Recalculates metrics for a journalist
```sql
SELECT update_journalist_engagement_metrics(
  p_org_id := '123e4567-e89b-12d3-a456-426614174000',
  p_journalist_id := '223e4567-e89b-12d3-a456-426614174000'
);
```

#### `get_deliverability_summary()`
Returns aggregate stats for an organization
```sql
SELECT get_deliverability_summary(
  p_org_id := '123e4567-e89b-12d3-a456-426614174000'
);
```

---

## Service Layer

### OutreachDeliverabilityService

**Location:** `apps/api/src/services/outreachDeliverabilityService.ts`

**Key Methods:**

```typescript
// Email Message CRUD
createEmailMessage(orgId: string, input: CreateEmailMessageInput): Promise<EmailMessage>
getEmailMessage(messageId: string, orgId: string): Promise<EmailMessage | null>
listEmailMessages(orgId: string, query: ListEmailMessagesQuery): Promise<EmailMessageListResponse>
updateEmailMessage(messageId: string, orgId: string, input: UpdateEmailMessageInput): Promise<EmailMessage>
deleteEmailMessage(messageId: string, orgId: string): Promise<void>

// Engagement Metrics
getEngagementMetrics(journalistId: string, orgId: string): Promise<EngagementMetrics | null>
listEngagementMetrics(orgId: string, query: ListEngagementMetricsQuery): Promise<EngagementMetricsListResponse>
updateEngagementMetrics(journalistId: string, orgId: string): Promise<UpdateEngagementMetricResult>
calculateEngagementScore(totalSent, totalOpened, totalClicked, totalReplied, totalBounced): EngagementScoreResult

// Email Sending
sendEmail(request: SendEmailRequest): Promise<SendEmailResponse>

// Webhook Processing
processWebhookEvent(orgId: string, providerType: EmailProvider, payload: any, signature?: string): Promise<{success, messageId}>

// Statistics
getDeliverabilitySummary(orgId: string): Promise<DeliverabilitySummary>
getTopEngagedJournalists(orgId: string, limit?: number): Promise<JournalistEngagement[]>
getJournalistEngagement(journalistId: string, orgId: string): Promise<JournalistEngagement | null>
```

### Email Provider Architecture

**Abstract Base Class:**
```typescript
abstract class EmailProviderBase {
  abstract send(request: SendEmailRequest): Promise<SendEmailResponse>;
  abstract validateWebhookSignature(payload: any, signature?: string): Promise<boolean>;
  abstract normalizeWebhookEvent(payload: any): Promise<WebhookPayload | null>;
}
```

**Implementations:**
- `StubEmailProvider` - For testing/development
- `SendGridEmailProvider` - SendGrid integration (API calls stubbed for future implementation)
- `MailgunEmailProvider` - Mailgun integration (API calls stubbed for future implementation)
- `SESEmailProvider` - AWS SES integration (API calls stubbed for future implementation)

### Integration with OutreachService (S44)

The `OutreachService` now accepts an optional `deliverabilityService` parameter:

```typescript
const deliverabilityService = createOutreachDeliverabilityService({
  supabase,
  providerConfig: {
    provider: 'sendgrid',
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: 'outreach@pravado.com',
    fromName: 'Pravado PR Team',
  },
});

const outreachService = new OutreachService({
  supabase,
  deliverabilityService,
});
```

When configured, emails sent via `outreachService.advanceRun()` will:
1. Create an `EmailMessage` record
2. Send the email via the configured provider
3. Update the `EmailMessage` with provider tracking ID
4. Track delivery status automatically via webhooks

---

## API Routes

**Base Path:** `/api/v1/pr-outreach-deliverability`

### Email Messages

```typescript
GET    /messages              // List email messages
GET    /messages/:id          // Get single email message
PATCH  /messages/:id          // Update email message
DELETE /messages/:id          // Delete email message
```

### Engagement Metrics

```typescript
GET    /engagement                        // List all engagement metrics
GET    /engagement/:journalistId          // Get journalist engagement
POST   /engagement/:journalistId/recalculate  // Recalculate metrics
```

### Statistics

```typescript
GET    /stats/deliverability   // Get deliverability summary
GET    /stats/top-engaged       // Get top engaged journalists
```

### Webhooks

```typescript
POST   /webhooks/:provider      // Process provider webhook events
```

### Testing

```typescript
POST   /test-send               // Test email sending (development)
```

---

## Configuration

### Environment Variables

```bash
# Email Provider Configuration
EMAIL_PROVIDER=sendgrid              # sendgrid | mailgun | ses | stub
EMAIL_PROVIDER_API_KEY=SG.xxx        # Provider API key
EMAIL_PROVIDER_API_SECRET=xxx        # Provider API secret (for SES)
EMAIL_PROVIDER_DOMAIN=pravado.com    # Domain (for Mailgun)
EMAIL_FROM_ADDRESS=outreach@pravado.com
EMAIL_FROM_NAME=Pravado PR Team
```

### Feature Flag

```typescript
ENABLE_PR_OUTREACH_DELIVERABILITY: true
```

---

## Frontend UI

### Deliverability Dashboard

**Location:** `apps/dashboard/src/app/app/pr/deliverability/page.tsx`

**Features:**
- **Overview Tab**: Deliverability stats, detailed metrics, top engaged journalists
- **Email Messages Tab**: List of sent emails with status, timestamps, and engagement
- **Engagement Metrics Tab**: Journalist-level engagement analytics with scores

**Auto-Refresh:** Dashboard refreshes every 30 seconds

**Frontend API Client:**
- **Location:** `apps/dashboard/src/lib/prOutreachDeliverabilityApi.ts`
- **Functions:** 14 API helper functions for all endpoints

---

## Usage Examples

### Send Email with Deliverability Tracking

```typescript
// Configure deliverability service
const deliverabilityService = createOutreachDeliverabilityService({
  supabase,
  providerConfig: {
    provider: 'sendgrid',
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: 'outreach@pravado.com',
    fromName: 'Pravado',
  },
});

// Create email message record
const emailMessage = await deliverabilityService.createEmailMessage(orgId, {
  runId,
  sequenceId,
  stepNumber: 1,
  journalistId,
  subject: 'Exciting Product Launch',
  bodyHtml: '<p>Hi {{journalist_name}}...</p>',
  bodyText: 'Hi {{journalist_name}}...',
});

// Send the email
const result = await deliverabilityService.sendEmail({
  to: 'journalist@techcrunch.com',
  subject: 'Exciting Product Launch',
  bodyHtml: '<p>Hi John...</p>',
  bodyText: 'Hi John...',
});

// Update with provider message ID
if (result.success) {
  await deliverabilityService.updateEmailMessage(emailMessage.id, orgId, {
    providerMessageId: result.messageId,
    sendStatus: 'sent',
    sentAt: new Date(),
  });
}
```

### Process Webhook Event

```typescript
// Webhook endpoint receives event from SendGrid
app.post('/webhooks/sendgrid', async (req, res) => {
  const signature = req.headers['x-twilio-email-event-webhook-signature'];

  const result = await deliverabilityService.processWebhookEvent(
    orgId,
    'sendgrid',
    req.body,
    signature
  );

  res.json({ success: result.success });
});
```

### Get Deliverability Statistics

```typescript
// Get org-wide deliverability summary
const summary = await deliverabilityService.getDeliverabilitySummary(orgId);

console.log(`Delivery Rate: ${summary.deliveryRate * 100}%`);
console.log(`Open Rate: ${summary.openRate * 100}%`);
console.log(`Click Rate: ${summary.clickRate * 100}%`);
console.log(`Bounce Rate: ${summary.bounceRate * 100}%`);

// Get top engaged journalists
const topEngaged = await deliverabilityService.getTopEngagedJournalists(orgId, 10);

topEngaged.forEach(engagement => {
  console.log(`${engagement.journalist.name}: ${engagement.engagementScore * 100}%`);
});
```

---

## Security & Permissions

- **RLS Policies**: Both tables have org-scoped RLS policies
- **Feature Flag**: `ENABLE_PR_OUTREACH_DELIVERABILITY` gates all routes
- **Authentication**: Required for all endpoints (except webhooks)
- **Authorization**: Org membership verified via `user_orgs` table
- **Webhook Validation**: Provider-specific signature validation (to be implemented)

---

## Performance Considerations

- **Indexes**: Optimized indexes on `org_id`, `journalist_id`, `send_status`, `sent_at`
- **Pagination**: All list queries support `limit` and `offset`
- **Aggregate Functions**: Database RPC functions for efficient statistics
- **Auto-Refresh**: Frontend throttled to 30-second intervals

---

## Future Enhancements

### Short-Term (Next Sprint)
1. Implement actual SendGrid/Mailgun/SES API integrations
2. Add proper webhook signature validation
3. Add email template preview functionality
4. Implement email reply detection

### Medium-Term (2-3 Sprints)
1. A/B testing for subject lines
2. Send-time optimization based on journalist timezone
3. Automated response classification (positive/negative/neutral)
4. Domain reputation tracking

### Long-Term (4+ Sprints)
1. ML-based optimal send-time prediction
2. Sentiment analysis on replies
3. Advanced charts and visualizations
4. Email warmup campaigns

---

## Integration Points

### S44 (Automated Journalist Outreach)
- Automatically tracks emails sent via outreach sequences
- Creates `EmailMessage` records for each sent email
- Updates delivery and engagement status via webhooks

### S40-S43 (Media Monitoring)
- Uses journalist data from media monitoring
- Engagement scores inform journalist targeting

### S42 (Scheduler)
- Metrics can be recalculated on schedule
- Webhooks processed asynchronously

---

## Metrics & KPIs

**Deliverability Metrics:**
- Total messages sent
- Delivery rate (delivered / sent)
- Open rate (opened / sent)
- Click rate (clicked / sent)
- Bounce rate (bounced / sent)

**Engagement Metrics:**
- Engagement score (weighted formula)
- Per-journalist open/click/reply rates
- Top engaged journalists ranking

---

## Testing

**Backend Tests:**
- **Location:** `apps/api/tests/outreachDeliverabilityService.test.ts`
- **Coverage:** 20+ test cases covering CRUD, webhooks, statistics

**E2E Tests:**
- **Location:** `apps/dashboard/tests/pr-outreach-deliverability/deliverability.spec.ts`
- **Coverage:** 30+ test scenarios covering UI interactions, tabs, accessibility

---

## Files Created

**Backend:**
- `apps/api/supabase/migrations/50_pr_outreach_deliverability.sql` (323 lines)
- `apps/api/src/services/outreachDeliverabilityService.ts` (900 lines)
- `apps/api/src/routes/prOutreachDeliverability/index.ts` (480 lines)
- `apps/api/tests/outreachDeliverabilityService.test.ts` (550 lines)

**Frontend:**
- `apps/dashboard/src/lib/prOutreachDeliverabilityApi.ts` (250 lines)
- `apps/dashboard/src/app/app/pr/deliverability/page.tsx` (400 lines)
- `apps/dashboard/tests/pr-outreach-deliverability/deliverability.spec.ts` (350 lines)

**Shared:**
- `packages/types/src/prOutreachDeliverability.ts` (300 lines)
- `packages/validators/src/prOutreachDeliverability.ts` (340 lines)

**Modified:**
- `apps/api/src/services/outreachService.ts` (integration with deliverability)
- `apps/api/src/server.ts` (route registration)
- `packages/feature-flags/src/flags.ts` (feature flag)
- `packages/types/src/index.ts` (type exports)
- `packages/validators/src/index.ts` (validator exports)

**Total:** ~3,900 lines of new code

---

**Sprint S45 - PR Outreach Email Deliverability & Engagement Analytics V1**
**Delivered:** 2025-11-24
**Status:** Core Implementation Complete
