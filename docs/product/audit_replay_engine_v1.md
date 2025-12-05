# Audit Replay Engine v1

**Sprint**: S37
**Status**: Implemented
**Feature Flag**: `ENABLE_AUDIT_REPLAY`

## Overview

The Audit Replay Engine reconstructs past system state using audit logs. It processes event streams chronologically to build snapshots of entity states, computes diffs between states, and provides a visual timeline for analysis.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Dashboard (Next.js)                             │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────┐  ┌────────────────┐  │
│  │ReplayConfigurator│  │ReplayTimeline│  │DiffInspector│  │ReplayStatusModal│ │
│  └────────┬────────┘  └──────┬───────┘  └──────┬─────┘  └───────┬────────┘  │
│           │                  │                 │                 │           │
│           └──────────────────┴─────────────────┴─────────────────┘           │
│                                       │                                       │
│                             auditReplayApi.ts                                │
│                          (REST + SSE subscriptions)                          │
└──────────────────────────────────┬───────────────────────────────────────────┘
                                   │ HTTP/SSE
┌──────────────────────────────────┴───────────────────────────────────────────┐
│                              API (Fastify)                                    │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │                      /api/v1/audit/replay routes                          ││
│  │  POST /replay       - Create replay job                                   ││
│  │  GET /replay/:id    - Get replay status + timeline                        ││
│  │  GET /replay/:id/stream - SSE for live progress                          ││
│  │  GET /replay/:id/snapshots/:index - Get specific snapshot                ││
│  │  GET /replays       - List all replay runs                                ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                       │                                       │
│  ┌────────────────────────────────────┴──────────────────────────────────┐   │
│  │                      AuditReplayService                                │   │
│  │  ┌─────────────┐  ┌──────────────────┐  ┌─────────────────────────┐   │   │
│  │  │ Log Fetcher │  │State Reconstructor│  │   Diff Computer        │   │   │
│  │  │             │  │                   │  │                         │   │   │
│  │  │ fetchLogs() │  │ reconstructContent│  │ computeDiffs()         │   │   │
│  │  │             │  │ reconstructPlaybook│  │                         │   │   │
│  │  │             │  │ reconstructBilling│  │                         │   │   │
│  │  │             │  │ reconstructExecution│ │                         │   │   │
│  │  └─────────────┘  └──────────────────┘  └─────────────────────────┘   │   │
│  │                                                                        │   │
│  │  ┌───────────────────────────────────────────────────────────────────┐ │   │
│  │  │                    Replay Runner                                   │ │   │
│  │  │  processReplayJob() -> emits SSE events -> stores snapshots       │ │   │
│  │  └───────────────────────────────────────────────────────────────────┘ │   │
│  └────────────────────────────────────────────────────────────────────────┘   │
│                              │                                                │
└──────────────────────────────┴────────────────────────────────────────────────┘
                               │
              ┌────────────────┴────────────────┐
              │          Supabase DB            │
              │  ┌─────────────────────────────┐│
              │  │ audit_log (read-only)       ││
              │  │ audit_replay_runs           ││
              │  │ audit_replay_snapshots      ││
              │  └─────────────────────────────┘│
              └─────────────────────────────────┘
```

## Replay Algorithm

### Phase 1: Log Fetching

```typescript
// Fetch logs sorted chronologically (ASC)
const logs = await fetchLogs(orgId, {
  startDate,
  endDate,
  eventType,
  severity,
});
// Result: AuditLogEntry[] ordered by created_at ASC
```

### Phase 2: State Reconstruction

For each event in chronological order:

```
┌─────────────────────────────────────────────────────────────────┐
│                     State Reconstruction Loop                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  for each event in logs:                                         │
│    1. Identify entity type from event.eventType                  │
│    2. Look up current state from stateMap                        │
│    3. Apply event to produce new state                           │
│    4. Compute diff between old and new state                     │
│    5. Create snapshot with before/after/diff                     │
│    6. Store snapshot in database                                 │
│    7. Emit SSE progress event                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 3: Diff Computation

```typescript
function computeDiffs(before, after) {
  const diffs = [];
  for (key in union(keys(before), keys(after))) {
    if (before[key] === undefined)
      diffs.push({ field: key, operation: 'added' });
    else if (after[key] === undefined)
      diffs.push({ field: key, operation: 'removed' });
    else if (before[key] !== after[key])
      diffs.push({ field: key, operation: 'modified' });
  }
  return diffs;
}
```

## Event Ordering Strategy

1. **Primary Sort**: `created_at ASC` - Chronological order
2. **Tie-breaking**: Database UUID order (deterministic)
3. **No Reordering**: Events processed exactly as stored
4. **No Merging**: Each event creates one snapshot

```sql
SELECT * FROM audit_log
WHERE org_id = $1
  AND created_at >= $2
  AND created_at <= $3
ORDER BY created_at ASC
```

## Snapshot Schema

### Database Record

```typescript
interface ReplaySnapshotRecord {
  id: uuid;
  replay_run_id: uuid;
  snapshot_index: integer;    // 0-based index
  event_id: uuid | null;      // Reference to source event
  event_type: string;
  timestamp: timestamptz;
  state_before: jsonb;        // Entity state before event
  state_after: jsonb;         // Entity state after event
  diff_json: jsonb;           // Array of StateDiff
  entity_type: string;        // content, playbook, billing, etc.
  entity_id: string;          // Entity identifier
  created_at: timestamptz;
}
```

### StateDiff Structure

```typescript
interface StateDiff {
  field: string;              // Field name that changed
  before: unknown;            // Value before (undefined if added)
  after: unknown;             // Value after (undefined if removed)
  operation: 'added' | 'removed' | 'modified';
}
```

### Example Snapshot

```json
{
  "id": "snapshot-abc",
  "replayRunId": "run-123",
  "snapshotIndex": 5,
  "eventId": "evt-456",
  "eventType": "content.updated",
  "timestamp": "2024-01-15T10:30:00Z",
  "stateBefore": {
    "id": "content-789",
    "title": "Draft Article",
    "status": "draft",
    "wordCount": 500
  },
  "stateAfter": {
    "id": "content-789",
    "title": "Published Article",
    "status": "published",
    "wordCount": 1200
  },
  "diff": [
    { "field": "title", "before": "Draft Article", "after": "Published Article", "operation": "modified" },
    { "field": "status", "before": "draft", "after": "published", "operation": "modified" },
    { "field": "wordCount", "before": 500, "after": 1200, "operation": "modified" }
  ],
  "entityType": "content",
  "entityId": "content-789"
}
```

## Diffing Strategy

### Supported Entity Types

| Entity Type | Tracked Fields | Source Events |
|-------------|----------------|---------------|
| content | id, title, status, wordCount, qualityScore | content.* |
| playbook | id, name, status, version, runCount | playbook.* |
| billing | plan, status, tokensUsed, lastPayment | billing.* |
| agent | id, name, status, executionCount | llm.* |
| execution | runId, status, currentStep, totalSteps | playbook.execution_* |

### Diff Operations

| Operation | Condition | UI Color |
|-----------|-----------|----------|
| added | Field exists in `after` but not in `before` | Green |
| removed | Field exists in `before` but not in `after` | Red |
| modified | Field exists in both but values differ | Yellow |

### Comparison Rules

1. **Primitives**: Direct equality comparison
2. **Objects**: JSON.stringify comparison (deep equality)
3. **Arrays**: JSON.stringify comparison
4. **Null/Undefined**: Treated as distinct values

## SSE Streaming Protocol

### Event Types

```typescript
type ReplaySSEEventType =
  | 'replay.started'    // Job started processing
  | 'replay.progress'   // Progress update
  | 'replay.snapshot'   // New snapshot created
  | 'replay.completed'  // Job finished successfully
  | 'replay.failed';    // Job failed
```

### Event Payloads

```typescript
// Started
{ type: 'replay.started', data: { runId: string } }

// Progress
{ type: 'replay.progress', data: {
  runId: string,
  progress: number,      // 0-100
  currentEvent: number,  // Current event index
  totalEvents: number    // Total events to process
}}

// Snapshot
{ type: 'replay.snapshot', data: {
  runId: string,
  snapshot: ReplaySnapshot
}}

// Completed
{ type: 'replay.completed', data: {
  runId: string,
  result: ReplayResultSummary
}}

// Failed
{ type: 'replay.failed', data: {
  runId: string,
  error: string
}}
```

## API Endpoints

### POST /api/v1/audit/replay

Create a new replay job.

**Request:**
```json
{
  "filters": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z",
    "eventType": ["content.created", "content.updated"],
    "severity": "info"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "run-abc-123",
    "status": "queued"
  }
}
```

### GET /api/v1/audit/replay/:id

Get replay job status and timeline.

**Response:**
```json
{
  "success": true,
  "data": {
    "run": {
      "id": "run-abc-123",
      "status": "success",
      "eventCount": 150,
      "snapshotCount": 150,
      "result": { ... }
    },
    "timeline": [
      { "index": 0, "eventType": "content.created", ... },
      { "index": 1, "eventType": "content.updated", ... }
    ]
  }
}
```

### GET /api/v1/audit/replay/:id/snapshots/:index

Get a specific snapshot.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "snapshot-xyz",
    "snapshotIndex": 5,
    "eventType": "content.updated",
    "stateBefore": { ... },
    "stateAfter": { ... },
    "diff": [ ... ]
  }
}
```

## RBAC Rules

| Action | Owner | Admin | Member | Viewer |
|--------|-------|-------|--------|--------|
| Create replay job | Yes | Yes | No | No |
| View replay status | Yes | Yes | Yes | Yes |
| View timeline | Yes | Yes | Yes | Yes |
| View snapshots | Yes | Yes | Yes | Yes |
| List replay jobs | Yes | Yes | Yes | Yes |

## Configuration

### Feature Flag

```typescript
// packages/feature-flags/src/flags.ts
ENABLE_AUDIT_REPLAY: true
```

## Limitations

1. **Read-Only**: Replay does not modify actual system state
2. **Interpretive**: State reconstruction is based on event semantics, not actual database queries
3. **Bounded**: Large date ranges may result in slow processing
4. **Sequential**: Events processed one at a time (no parallelization)

## Future Enhancements

1. **Parallel Processing**: Process independent entity streams concurrently
2. **Incremental Replay**: Resume from last snapshot
3. **Export**: Download replay results as JSON/CSV
4. **Compare**: Diff two replay runs
5. **Annotations**: Add comments to snapshots
6. **Bookmarks**: Save specific points in timeline
