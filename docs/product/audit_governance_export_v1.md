# Audit Governance & Export System v1

**Sprint**: S36
**Status**: Implemented
**Feature Flag**: `ENABLE_AUDIT_EXPORTS`

## Overview

The Audit Governance & Export system provides enterprise-grade audit logging visibility with CSV export capabilities. This system enables administrators to review all organizational activity, filter by various criteria, and export audit logs for compliance and governance purposes.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Dashboard (Next.js)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ AuditFilters│  │ AuditTable  │  │ExportButton │  │ExportModal │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘ │
│         │                │                │                │        │
│         └────────────────┴────────────────┴────────────────┘        │
│                                   │                                  │
│                          auditApi.ts                                │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │ HTTP
┌──────────────────────────────────┴──────────────────────────────────┐
│                           API (Fastify)                             │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    /api/v1/audit routes                        │ │
│  │  GET /           - Query audit logs with filters               │ │
│  │  GET /:id        - Get single audit entry                      │ │
│  │  GET /stats      - Get severity statistics                     │ │
│  │  POST /export    - Create export job (admin only)              │ │
│  │  GET /export/:id - Get export job status                       │ │
│  │  GET /export/:id/download - Download CSV file                  │ │
│  │  GET /exports    - List export jobs                            │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                   │                                  │
│  ┌────────────────┐  ┌────────────────────────────────────────────┐ │
│  │  AuditService  │  │         AuditExportService                 │ │
│  │  (Existing)    │  │  - createExportJob()                       │ │
│  │                │  │  - processExportJob()                      │ │
│  │                │  │  - generateCSV()                           │ │
│  │                │  │  - cleanupExpiredExports()                 │ │
│  └───────┬────────┘  └────────────────────┬───────────────────────┘ │
│          │                                │                          │
└──────────┴────────────────────────────────┴──────────────────────────┘
                          │                 │
           ┌──────────────┴─────┐    ┌──────┴──────┐
           │    Supabase DB     │    │  File System │
           │  - audit_log       │    │  (CSV files) │
           │  - audit_exports   │    └─────────────┘
           └────────────────────┘
```

## Data Model

### audit_exports Table

```sql
CREATE TYPE audit_export_status AS ENUM ('queued', 'processing', 'success', 'failed');

CREATE TABLE audit_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status audit_export_status NOT NULL DEFAULT 'queued',
  filters_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  file_path text,
  file_size_bytes bigint,
  row_count integer,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Export Job Lifecycle

```
┌─────────┐     ┌────────────┐     ┌─────────┐
│ queued  │────>│ processing │────>│ success │
└─────────┘     └────────────┘     └─────────┘
     │                │
     │                │
     v                v
┌─────────────────────────┐
│        failed           │
└─────────────────────────┘
```

| Status | Description |
|--------|-------------|
| `queued` | Job created, waiting to be processed |
| `processing` | Job is actively generating CSV |
| `success` | Export complete, file available for download |
| `failed` | Export failed, error message available |

### TypeScript Types

```typescript
interface AuditExportJob {
  id: string;
  orgId: string;
  userId: string;
  status: 'queued' | 'processing' | 'success' | 'failed';
  filters: Partial<AuditQueryFilters>;
  filePath: string | null;
  fileSizeBytes: number | null;
  rowCount: number | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}
```

## RBAC Rules

### Role-Based Access Control

| Action | Owner | Admin | Member | Viewer |
|--------|-------|-------|--------|--------|
| View audit logs | Yes | Yes | Yes | Yes |
| Filter audit logs | Yes | Yes | Yes | Yes |
| View entry details | Yes | Yes | Yes | Yes |
| Create export job | Yes | Yes | No | No |
| View export status | Yes | Yes | No | No |
| Download export file | Yes | Yes | No | No |
| List export jobs | Yes | Yes | No | No |

### Implementation

```typescript
function isUserAdmin(role: string): boolean {
  return role === 'admin' || role === 'owner';
}

// Route protection
if (!isUserAdmin(membership.role)) {
  return reply.status(403).send({
    success: false,
    error: { code: 'FORBIDDEN', message: 'Admin role required' }
  });
}
```

## Filtering DSL

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `severity` | string | Filter by severity level |
| `actorType` | string | Filter by actor type |
| `eventType` | string | Filter by event type |
| `startDate` | string (ISO 8601) | Filter events after this date |
| `endDate` | string (ISO 8601) | Filter events before this date |
| `search` | string | Full-text search in context |
| `limit` | number | Results per page (default: 50) |
| `offset` | number | Pagination offset |

### Severity Levels

```typescript
type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';
```

### Actor Types

```typescript
type ActorType = 'user' | 'system' | 'api' | 'webhook';
```

### Event Types

```typescript
type AuditEventType =
  | 'auth.login' | 'auth.logout' | 'auth.failed'
  | 'user.created' | 'user.updated' | 'user.deleted'
  | 'org.created' | 'org.updated' | 'org.deleted'
  | 'billing.subscription_created' | 'billing.subscription_updated'
  | 'playbook.created' | 'playbook.executed' | 'playbook.deleted'
  | 'content.created' | 'content.updated' | 'content.published'
  | 'system.error' | 'system.maintenance';
```

### Example Query

```
GET /api/v1/audit?severity=error&actorType=system&startDate=2024-01-01&limit=100
```

## Export Flow

### Sequence Diagram

```
User          Dashboard         API              ExportService      Database
  │               │               │                    │                │
  │ Click Export  │               │                    │                │
  │──────────────>│               │                    │                │
  │               │ POST /export  │                    │                │
  │               │──────────────>│                    │                │
  │               │               │ createExportJob()  │                │
  │               │               │───────────────────>│                │
  │               │               │                    │ INSERT job     │
  │               │               │                    │───────────────>│
  │               │               │<───────────────────│                │
  │               │<──────────────│ { jobId }          │                │
  │               │               │                    │                │
  │               │ Open Modal    │                    │                │
  │<──────────────│               │                    │                │
  │               │               │                    │                │
  │               │ Poll status   │                    │                │
  │               │──────────────>│ GET /export/:id    │                │
  │               │               │───────────────────>│                │
  │               │               │                    │ SELECT job     │
  │               │               │                    │───────────────>│
  │               │<──────────────│<───────────────────│                │
  │               │               │                    │                │
  │               │  [Background] │ processExportJob() │                │
  │               │               │───────────────────>│                │
  │               │               │                    │ Query logs     │
  │               │               │                    │───────────────>│
  │               │               │                    │<───────────────│
  │               │               │                    │ Generate CSV   │
  │               │               │                    │ Write file     │
  │               │               │                    │ UPDATE job     │
  │               │               │                    │───────────────>│
  │               │               │                    │                │
  │               │ Poll status   │                    │                │
  │               │──────────────>│ GET /export/:id    │                │
  │               │<──────────────│ { status: success }│                │
  │               │               │                    │                │
  │ Click Download│               │                    │                │
  │──────────────>│               │                    │                │
  │               │ GET download  │                    │                │
  │               │──────────────>│ Stream file        │                │
  │<──────────────│<──────────────│                    │                │
  │ Save CSV      │               │                    │                │
```

### CSV Format

```csv
ID,Timestamp,Event Type,Severity,Actor Type,User ID,IP Address,User Agent,Context
entry-123,2024-01-15T10:00:00Z,auth.login,info,user,user-456,192.168.1.1,Mozilla/5.0,"{""method"":""password""}"
entry-124,2024-01-15T11:00:00Z,system.error,error,system,,,,"{""message"":""Connection timeout""}"
```

### File Lifecycle

1. **Creation**: File created in `AUDIT_EXPORT_STORAGE_DIR`
2. **Naming**: `{orgId}_{timestamp}_{jobId}.csv`
3. **Expiration**: Files expire after 24 hours (configurable)
4. **Cleanup**: `cleanupExpiredExports()` removes expired files

## UI Components

### AuditFilters

Filter panel with dropdowns and date pickers:
- Severity selector
- Actor type selector
- Date range picker
- Search input with debounce

### AuditTable

Paginated table displaying:
- Timestamp
- Event type badge
- Severity badge
- Actor type
- Context preview
- Row click to view details

### AuditExportButton

Admin-only button that:
- Triggers export creation
- Opens status modal
- Shows loading state

### AuditExportStatusModal

Modal displaying:
- Job status with progress indicator
- Row count (when available)
- File size (when complete)
- Download button (on success)
- Error message (on failure)

## Configuration

### Environment Variables

```env
AUDIT_EXPORT_STORAGE_DIR=/tmp/audit_exports
```

### Feature Flag

```typescript
// packages/feature-flags/src/flags.ts
ENABLE_AUDIT_EXPORTS: true
```

## Security Considerations

1. **RBAC Enforcement**: Export endpoints require admin role
2. **Org Isolation**: RLS ensures users only see their org's data
3. **File Access**: Download endpoint validates job ownership
4. **Expiration**: Exports auto-expire after 24 hours
5. **Rate Limiting**: Consider adding rate limits for export creation

## Testing

### Backend Tests (`auditExports.test.ts`)

- Job creation and retrieval
- CSV generation with proper escaping
- File storage and reading
- RBAC validation
- Status transitions

### E2E Tests (`audit-page.spec.ts`)

- Page layout and stats display
- Filtering functionality
- Pagination controls
- Entry details modal
- Export workflow
- Error handling
- Empty state

## Future Enhancements

1. **Email Delivery**: Send download link via email for large exports
2. **Scheduled Exports**: Recurring export jobs
3. **Multiple Formats**: Support JSON, Excel formats
4. **Compression**: Gzip large exports
5. **S3 Storage**: Cloud storage for exports
6. **Streaming**: Stream CSV generation for very large datasets
