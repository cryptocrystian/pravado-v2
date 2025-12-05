# Audit Logging & Compliance Ledger (Sprint S35)

## Overview

Sprint S35 implements a comprehensive audit logging system for the PRAVADO platform. This system provides an immutable compliance ledger that captures all critical events across the platform, enabling security analysis, compliance reporting, and operational insights.

## Key Features

### 1. Comprehensive Event Capture

The audit system captures events across all major platform areas:

- **Authentication & Authorization** - Login, logout, password resets, token refreshes
- **User Management** - Invitations, role changes, user removals
- **Billing Events** - Plan changes, subscriptions, payments, overages
- **LLM Operations** - API calls, successes, failures, rate limits
- **Playbook Execution** - Runs, completions, failures, retries
- **PR Intelligence** - List management, journalist contacts
- **SEO Operations** - Audits, keyword analysis, backlink analysis
- **Content Operations** - Creation, updates, deletions, quality scoring
- **System Events** - Migrations, backups, maintenance
- **Admin Actions** - Impersonation, config changes, data exports

### 2. Immutable Audit Trail

All audit logs are:
- **Insert-only** - No updates or deletes allowed via RLS policies
- **Timestamped** - Automatic creation timestamps
- **Org-isolated** - RLS ensures org-level data isolation
- **Indexed** - Optimized for common query patterns

### 3. Best-Effort Logging

The audit system is designed to:
- Never block core application flows
- Log asynchronously when possible
- Gracefully handle failures without throwing errors
- Provide fire-and-forget logging options

## Architecture

### Database Schema

```sql
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid REFERENCES auth.users(id),
  actor_type text NOT NULL,  -- 'user', 'system', 'agent'
  event_type text NOT NULL,  -- e.g. 'billing.plan_change'
  severity text NOT NULL,    -- 'info', 'warning', 'error', 'critical'
  context jsonb NOT NULL,    -- Event-specific data
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Indexes

- `idx_audit_log_org_id` - Organization isolation
- `idx_audit_log_event_type` - Event filtering
- `idx_audit_log_created_at_desc` - Time-based queries
- `idx_audit_log_severity` - Severity filtering
- `idx_audit_log_org_time` - Composite for common queries
- `idx_audit_log_context_gin` - JSONB context searching

### RLS Policies

- **SELECT**: Users can only view logs for their organization
- **INSERT**: Allowed for authenticated users/systems
- **UPDATE**: Denied for all (immutable)
- **DELETE**: Denied for all (permanent)

## Event Type Taxonomy

Events follow a hierarchical naming convention: `category.action`

| Category | Example Events |
|----------|----------------|
| auth | `auth.login`, `auth.logout`, `auth.login_failed` |
| user | `user.invite_sent`, `user.role_changed` |
| billing | `billing.plan_change`, `billing.payment_failed` |
| llm | `llm.call`, `llm.call_failure`, `llm.timeout` |
| playbook | `playbook.execution_started`, `playbook.execution_failed` |
| pr | `pr.list_created`, `pr.journalist_contacted` |
| seo | `seo.audit_generated`, `seo.keyword_analysis_completed` |
| content | `content.created`, `content.brief_generated` |
| system | `system.migration_executed`, `system.error` |
| admin | `admin.user_impersonation`, `admin.data_export` |

## Severity Levels

| Level | Usage |
|-------|-------|
| `info` | Normal operations, successful events |
| `warning` | Attention needed but not critical |
| `error` | Failures that need investigation |
| `critical` | Security-sensitive or high-impact events |

## API Endpoints

### List Audit Logs

```
GET /api/v1/audit?severity=error&eventType=billing&limit=50
```

Query parameters:
- `eventType` - Filter by event type (comma-separated for multiple)
- `severity` - Filter by severity level
- `actorType` - Filter by actor type
- `userId` - Filter by specific user
- `startDate` - Filter from date
- `endDate` - Filter to date
- `search` - Search in context
- `limit` - Results per page (default 50, max 100)
- `offset` - Pagination offset
- `cursor` - Cursor-based pagination

### Get Single Entry

```
GET /api/v1/audit/:id
```

### List Event Types

```
GET /api/v1/audit/events?category=billing
```

### Get Statistics

```
GET /api/v1/audit/stats?days=30
```

## Usage Examples

### Backend Integration

```typescript
import { AuditService, createScopedAuditLogger } from './services/auditService';

// Direct logging
await auditService.logEvent({
  orgId: 'org-uuid',
  eventType: 'billing.plan_upgraded',
  userId: 'user-uuid',
  context: {
    oldPlan: 'starter',
    newPlan: 'professional',
    changeType: 'upgrade',
  },
});

// Async logging (fire-and-forget)
auditService.logEventAsync({
  orgId: 'org-uuid',
  eventType: 'llm.call_success',
  actorType: 'system',
  context: {
    provider: 'openai',
    model: 'gpt-4',
    tokensUsed: 1500,
  },
});

// Scoped logger for service
const scopedLogger = createScopedAuditLogger(auditService, {
  orgId: 'org-uuid',
  userId: 'user-uuid',
  actorType: 'user',
});

scopedLogger.info('content.created', { contentId: 'doc-123' });
scopedLogger.error('playbook.execution_failed', { runId: 'run-456' });
```

### Frontend Usage

```typescript
import { getAuditLogs, getAuditStats } from '@/lib/auditApi';

// Fetch logs with filters
const result = await getAuditLogs({
  severity: 'error',
  eventType: 'billing',
  limit: 25,
});

// Get statistics
const stats = await getAuditStats(30);
console.log(`${stats.totalEvents} events in last 30 days`);
console.log(`${stats.bySeverity.error} errors`);
```

## Dashboard Features

The audit log viewer provides:

1. **Statistics Overview** - Total events, errors, warnings, critical events
2. **Filterable Table** - Filter by severity, actor, category, date range
3. **Search** - Full-text search within event context
4. **Detail Modal** - View complete event details including full context
5. **Pagination** - Navigate through large result sets
6. **Real-time Updates** - Live refresh of audit data

## Security Considerations

1. **Data Access** - RLS ensures users only see their organization's logs
2. **Immutability** - UPDATE/DELETE operations are blocked at database level
3. **IP Tracking** - Client IP addresses captured for security analysis
4. **Critical Events** - Admin actions and security events flagged as critical
5. **Retention** - Audit logs are permanent (consider archival strategy)

## Performance Considerations

1. **Best-Effort Logging** - Never blocks main application flow
2. **Async Options** - Fire-and-forget for non-critical events
3. **Cursor Pagination** - Efficient for large datasets
4. **GIN Index** - Fast JSONB context queries
5. **Connection Pooling** - Uses existing Supabase connection pool

## Feature Flag

The audit logging system is controlled by the `ENABLE_AUDIT_LOGGING` feature flag. When disabled, the API returns a 503 Service Unavailable response.

## Files Created

### Backend
- `apps/api/supabase/migrations/40_create_audit_log.sql` - Database schema
- `packages/types/src/audit.ts` - TypeScript types
- `packages/validators/src/audit.ts` - Zod validation schemas
- `apps/api/src/services/auditService.ts` - Core service logic
- `apps/api/src/routes/audit/index.ts` - API endpoints
- `apps/api/tests/auditService.test.ts` - Unit tests

### Frontend
- `apps/dashboard/src/lib/auditApi.ts` - API client
- `apps/dashboard/src/app/app/audit/page.tsx` - Audit viewer page

### Configuration
- `packages/feature-flags/src/flags.ts` - Added ENABLE_AUDIT_LOGGING flag

## Future Enhancements

1. **Export Functionality** - CSV/JSON export of audit logs
2. **Alerting** - Real-time alerts for critical events
3. **Retention Policies** - Automated archival/deletion
4. **Advanced Analytics** - Trend analysis, anomaly detection
5. **Integration** - SIEM system integration
6. **Audit Trail for Audit** - Meta-logging of audit queries
