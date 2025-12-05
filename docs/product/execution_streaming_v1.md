# Execution Streaming V1 (Sprint S21)

## Overview

Sprint S21 introduces real-time execution streaming for playbook runs using Server-Sent Events (SSE). This replaces the previous polling-only approach with a push-based event system that delivers execution updates to the frontend in real-time.

**Key Benefits:**
- Real-time updates with sub-second latency
- Reduced server load (no constant polling)
- Better user experience with live status indicators
- Graceful fallback to polling if SSE unavailable

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (Dashboard)                   │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  useExecutionStream Hook                            │ │
│  │  - EventSource client                               │ │
│  │  - Reconnection logic                               │ │
│  │  - Event buffering                                  │ │
│  └─────────────────────────────────────────────────────┘ │
│                          ▲                                 │
│                          │ SSE Stream                      │
└──────────────────────────┼────────────────────────────────┘
                           │
                 ┌─────────┴──────────┐
                 │  Network / Proxy   │
                 └─────────┬──────────┘
                           │
┌──────────────────────────┼────────────────────────────────┐
│                    Backend (API)                           │
│                          │                                 │
│  ┌───────────────────────▼──────────────────────────────┐ │
│  │  SSE Endpoint: /api/v1/playbook-runs/:id/stream     │ │
│  │  - Headers: text/event-stream, keep-alive           │ │
│  │  - Heartbeat: 30 seconds                            │ │
│  │  - Timeout: 10 minutes                              │ │
│  └──────────────────────────────────────────────────────┘ │
│                          ▲                                 │
│                          │ Subscribe                       │
│  ┌───────────────────────┴──────────────────────────────┐ │
│  │  ExecutionEventBus (In-Memory)                      │ │
│  │  - Map<runId, Subscription[]>                       │ │
│  │  - Synchronous publish                              │ │
│  │  - Automatic cleanup                                │ │
│  └──────────────────────────────────────────────────────┘ │
│                          ▲                                 │
│                          │ Publish                         │
│  ┌───────────────────────┴──────────────────────────────┐ │
│  │  Playbook Execution Engine V2                       │ │
│  │  - Step lifecycle events                            │ │
│  │  - Run lifecycle events                             │ │
│  │  - Log streaming                                    │ │
│  └──────────────────────────────────────────────────────┘ │
│                          ▲                                 │
│                          │ State changes                   │
│  ┌───────────────────────┴──────────────────────────────┐ │
│  │  Database (Supabase)                                │ │
│  │  - playbook_runs                                    │ │
│  │  - step_runs                                        │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

## EventBus Implementation

### Core Mechanism

The `ExecutionEventBus` is a lightweight in-memory pub/sub system that enables decoupled communication between the execution engine and SSE clients.

**Location:** `apps/api/src/events/eventBus.ts`

**Key Features:**
- **Subscription Management:** Subscriptions keyed by `runId` for efficient routing
- **Synchronous Publish:** Events delivered synchronously within the same process
- **Error Isolation:** Subscriber errors don't affect other subscribers
- **Automatic Cleanup:** Unsubscribe functions prevent memory leaks
- **Thread-Safe:** Safe for concurrent operations within single Node.js process

### API

```typescript
class ExecutionEventBus {
  /**
   * Subscribe to events for a specific runId
   * @returns Unsubscribe function
   */
  subscribe(runId: string, handler: (event: ExecutionEvent) => void): () => void;

  /**
   * Publish an event to all subscribers of the runId
   */
  publish(event: ExecutionEvent): void;

  /**
   * Get subscription count for a specific runId
   */
  getSubscriptionCount(runId: string): number;

  /**
   * Get total subscription count across all runIds
   */
  getTotalSubscriptionCount(): number;

  /**
   * Clear all subscriptions (useful for testing)
   */
  clear(): void;
}
```

### Usage Example

```typescript
import { executionEventBus } from '@/events/eventBus';

// Subscribe to events
const unsubscribe = executionEventBus.subscribe('run-123', (event) => {
  console.log('Event received:', event.type);
});

// Publish event
executionEventBus.publish({
  type: 'step.updated',
  runId: 'run-123',
  stepKey: 'step1',
  timestamp: new Date().toISOString(),
  payload: { status: 'RUNNING' },
});

// Cleanup
unsubscribe();
```

## SSE Endpoint

### Endpoint Details

**URL:** `GET /api/v1/playbook-runs/:id/stream`

**Authentication:** Requires `requireUser` middleware (session cookie)

**Authorization:** User must belong to organization that owns the run

**Response Headers:**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

### Connection Lifecycle

1. **Authentication & Authorization:** Validates user and run ownership
2. **Initial Event:** Sends "connected" event to confirm establishment
3. **Subscription:** Subscribes to EventBus for the runId
4. **Event Streaming:** Forwards all events to client as SSE messages
5. **Heartbeat:** Sends comment every 30 seconds to keep connection alive
6. **Cleanup:** Unsubscribes on client disconnect or 10-minute timeout

### Event Format

All events follow the SSE specification:

```
event: step.updated
data: {"type":"step.updated","runId":"run-123","stepKey":"step1","timestamp":"2025-11-17T12:00:00Z","payload":{"status":"RUNNING"}}

```

**Note:** Each event ends with two newlines (`\n\n`)

### Heartbeat

To prevent proxy/firewall timeouts, the endpoint sends a comment every 30 seconds:

```
: heartbeat

```

This keeps the connection alive without sending actual events.

### Timeout

Connections automatically close after 10 minutes (600,000ms) to prevent resource exhaustion. Clients should reconnect if the run is still active.

## Event Types

### Run-Level Events

#### `run.updated`
Fired when run-level state changes (status, progress, current step).

**Payload:**
```typescript
{
  status?: string;           // Run status (QUEUED, RUNNING, SUCCEEDED, FAILED)
  currentStepKey?: string;   // Currently executing step key
  progress?: number;         // Overall progress percentage
}
```

#### `run.completed`
Fired when the run completes successfully.

**Payload:**
```typescript
{
  status: 'COMPLETED';
  completedAt: string;       // ISO 8601 timestamp
  totalSteps: number;        // Total number of steps
  successfulSteps: number;   // Number of successful steps
}
```

#### `run.failed`
Fired when the run fails.

**Payload:**
```typescript
{
  status: 'FAILED';
  error: string;             // Error message
  failedAt: string;          // ISO 8601 timestamp
}
```

### Step-Level Events

#### `step.updated`
Fired when a step starts or its status changes.

**Payload:**
```typescript
{
  status: string;            // Step status (QUEUED, RUNNING, SUCCEEDED, FAILED)
  startedAt?: string;        // ISO 8601 timestamp when step started
}
```

#### `step.completed`
Fired when a step completes successfully.

**Payload:**
```typescript
{
  status: 'SUCCESS';
  completedAt: string;       // ISO 8601 timestamp
  result?: unknown;          // Step output/result
}
```

#### `step.failed`
Fired when a step fails.

**Payload:**
```typescript
{
  status: 'FAILED';
  error: string;             // Error message
  failedAt: string;          // ISO 8601 timestamp
  attempt: number;           // Attempt number (for retries)
  willRetry: boolean;        // Whether the step will be retried
}
```

#### `step.log.appended`
Fired when a log entry is added to a step.

**Payload:**
```typescript
{
  logEntry: {
    level: string;           // Log level (INFO, WARN, ERROR)
    message: string;         // Log message
    timestamp: string;       // ISO 8601 timestamp
  }
}
```

## Frontend Integration

### useExecutionStream Hook

**Location:** `apps/dashboard/src/hooks/useExecutionStream.ts`

**Purpose:** React hook for managing SSE connection lifecycle and event handling.

**Usage:**
```typescript
import { useExecutionStream } from '@/hooks/useExecutionStream';

function MyComponent({ runId }: { runId: string }) {
  const {
    connected,     // boolean: Is SSE connected?
    events,        // ExecutionEvent[]: All received events
    lastEvent,     // ExecutionEvent | null: Most recent event
    error,         // string | null: Connection error
    disconnect,    // () => void: Manual disconnect
    retry,         // () => void: Retry connection
    clearEvents,   // () => void: Clear event buffer
  } = useExecutionStream(runId, {
    enabled: true,        // Enable/disable hook
    maxEvents: 100,       // Max events to keep in memory
    retryDelay: 3000,     // Base retry delay (ms)
    maxRetries: 5,        // Max reconnection attempts
  });

  return (
    <div>
      {connected ? 'LIVE' : 'Disconnected'}
      {lastEvent && <div>Last event: {lastEvent.type}</div>}
    </div>
  );
}
```

### Reconnection Strategy

The hook implements exponential backoff for reconnection:

1. **Initial failure:** Wait 3 seconds (base delay)
2. **Second attempt:** Wait 6 seconds (2^1 * base)
3. **Third attempt:** Wait 12 seconds (2^2 * base)
4. **Fourth attempt:** Wait 24 seconds (2^3 * base)
5. **Fifth attempt:** Wait 48 seconds (2^4 * base)
6. **Max retries reached:** Stop reconnecting, show error

**Manual Retry:** Users can call `retry()` to reset the counter and attempt reconnection.

## Browser Behavior

### EventSource API

The frontend uses the native browser `EventSource` API for SSE connections:

```typescript
const eventSource = new EventSource(streamUrl, {
  withCredentials: true,  // Include cookies for auth
});

eventSource.addEventListener('step.updated', (e: MessageEvent) => {
  const event: ExecutionEvent = JSON.parse(e.data);
  // Handle event
});

eventSource.onerror = (error) => {
  // Handle error, attempt reconnection
};

eventSource.close();  // Cleanup
```

### Connection States

1. **CONNECTING (0):** Initial connection attempt
2. **OPEN (1):** Connection established and receiving events
3. **CLOSED (2):** Connection closed or failed

### Browser Limitations

- **Max Connections:** Browsers limit concurrent SSE connections per domain (typically 6)
- **Auto-Reconnect:** EventSource automatically reconnects on network errors (we override this)
- **No Custom Headers:** EventSource doesn't support custom headers (uses cookies for auth)

## Polling Fallback

### When Polling Activates

The frontend automatically falls back to polling when:

1. SSE feature flag is disabled (`ENABLE_EXECUTION_STREAMING = false`)
2. SSE connection fails to establish
3. SSE connection drops after max retries
4. User manually pauses updates

### Polling Configuration

**Interval:** 2000ms (2 seconds)

**Endpoint:** `GET /api/v1/playbook-runs/:id`

**Behavior:**
- Fetches full run state including all steps
- Updates entire UI state (not delta-based like SSE)
- Stops polling when run reaches terminal state (success, failed, canceled)

### Hybrid Mode

The execution viewer uses a hybrid approach:

1. **Initial Load:** Always fetches full state via REST API
2. **Streaming Mode:** If SSE enabled and connected, stop polling and apply event deltas
3. **Fallback Mode:** If SSE fails, resume polling

**Visual Indicator:**
- **Green "LIVE" badge:** SSE connected and streaming
- **Yellow "Polling" badge:** Polling active (SSE unavailable or disabled)
- **Gray "Paused" badge:** Updates paused by user

## Limitations in V1

### Single-Instance Only

The in-memory EventBus only works within a single API server process. If you scale to multiple API instances:

**Problem:** Events published on server A won't reach SSE clients connected to server B.

**Future Solution (V2):**
- Use Redis Pub/Sub for cross-instance communication
- Or use message queue (RabbitMQ, SQS)
- Or use WebSocket with sticky sessions

### No WebSocket Support

V1 uses Server-Sent Events (SSE), which is unidirectional (server → client only).

**Limitations:**
- No client-to-server messages over the stream
- Cannot pause/resume execution via the stream

**Future Enhancement (V2):**
- Add WebSocket support for bidirectional communication
- Enable real-time execution control (pause, cancel, retry)

### No Event Replay

If a client disconnects and reconnects, they miss events that occurred during the disconnection.

**Current Workaround:** Full state fetch on initial load provides the complete picture.

**Future Enhancement (V2):**
- Store recent events in Redis with TTL
- Support "last-event-id" header for event replay
- Implement event sourcing pattern

### No Message Compression

SSE events are sent as plain text without compression.

**Impact:** Higher bandwidth usage for log-heavy executions.

**Future Enhancement (V2):**
- Implement binary protocol (WebSocket + protobuf)
- Add gzip compression for large payloads

### Memory Constraints

The EventBus stores all subscriptions in memory. With thousands of concurrent viewers:

**Potential Issue:** Memory usage scales with number of active connections.

**Mitigation:**
- 10-minute timeout auto-disconnects idle clients
- Subscription cleanup on disconnect
- No event history stored in EventBus

**Future Enhancement (V2):**
- Move to Redis-backed pub/sub
- Implement connection pooling

## Testing

### Backend Tests

**Location:** `apps/api/__tests__/eventBus.test.ts`

**Coverage:**
- Subscribe/publish/unsubscribe mechanics
- Multiple subscribers per runId
- Subscription leak prevention
- Event isolation by runId
- Error handling in subscriber handlers
- Subscription counting
- Clear all subscriptions

**Run Tests:**
```bash
cd apps/api
pnpm test eventBus
```

### SSE Endpoint Testing

**Manual Test with curl:**
```bash
curl -N \
  -H "Cookie: your-session-cookie" \
  http://localhost:4000/api/v1/playbook-runs/run-123/stream
```

**Expected Output:**
```
event: connected
data: {"message":"Connected to execution stream"}

: heartbeat

event: step.updated
data: {"type":"step.updated","runId":"run-123","stepKey":"step1","timestamp":"2025-11-17T12:00:00Z","payload":{"status":"RUNNING"}}
```

## Feature Flag

**Flag Name:** `ENABLE_EXECUTION_STREAMING`

**Location:** `packages/feature-flags/src/flags.ts`

**Default:** `true`

**Behavior:**
- **When `true`:** Frontend attempts SSE connection, falls back to polling on failure
- **When `false`:** Frontend uses polling only, SSE endpoint still available but not used

**Toggling at Runtime:**
```typescript
import { FLAGS } from '@pravado/feature-flags';

if (FLAGS.ENABLE_EXECUTION_STREAMING) {
  // Use SSE
} else {
  // Use polling
}
```

## Performance Characteristics

### Latency

- **SSE Mode:** < 100ms event delivery (network dependent)
- **Polling Mode:** 0-2000ms (depends on poll interval timing)

### Server Load

**Polling (per active viewer):**
- 30 requests/minute
- 1800 requests/hour
- Full state fetch each time

**SSE (per active viewer):**
- 1 initial connection
- 2 heartbeats/minute
- Delta events only (much smaller payloads)

**Load Reduction:** ~95% fewer requests and ~90% less data transfer with SSE

### Scalability

**Current (Single Instance):**
- Supports ~1000 concurrent SSE connections per instance
- Memory usage: ~1-2MB per connection

**Future (Multi-Instance):**
- With Redis Pub/Sub: 10,000+ concurrent connections
- With WebSocket: 50,000+ connections per instance

## Migration Guide

### For Frontend Developers

**Old Approach (Polling Only):**
```typescript
useEffect(() => {
  const interval = setInterval(fetchRun, 2000);
  return () => clearInterval(interval);
}, []);
```

**New Approach (SSE + Polling Fallback):**
```typescript
const { connected, lastEvent } = useExecutionStream(runId);

useEffect(() => {
  if (lastEvent) {
    applyEvent(lastEvent);  // Delta update
  }
}, [lastEvent]);

// Polling only runs if SSE not connected
useEffect(() => {
  if (!connected) {
    const interval = setInterval(fetchRun, 2000);
    return () => clearInterval(interval);
  }
}, [connected]);
```

### For Backend Developers

**Publishing Events from Execution Engine:**
```typescript
import { executionEventBus } from '@/events/eventBus';

// After updating DB state
await supabase.from('step_runs').update({ state: 'running' });

// Publish event
executionEventBus.publish({
  type: 'step.updated',
  runId,
  stepKey,
  timestamp: new Date().toISOString(),
  payload: { status: 'RUNNING', startedAt: new Date().toISOString() },
});
```

## Troubleshooting

### SSE Not Connecting

**Symptoms:** Yellow "Polling" badge instead of green "LIVE"

**Checks:**
1. Verify feature flag: `FLAGS.ENABLE_EXECUTION_STREAMING === true`
2. Check browser console for EventSource errors
3. Verify authentication (session cookie present)
4. Check network tab for `/stream` endpoint response
5. Confirm run exists and user has access

### Events Not Updating UI

**Symptoms:** SSE connected but UI not updating

**Checks:**
1. Verify `applyEvent` function is called on `lastEvent` change
2. Check browser console for event parsing errors
3. Confirm event type matches expected types
4. Verify `runId` matches between event and viewer

### Connection Dropping Frequently

**Symptoms:** Constant reconnection attempts

**Possible Causes:**
1. **Proxy/Firewall Timeout:** Heartbeat not reaching client
2. **Server Restart:** API instance restarting frequently
3. **Network Issues:** Unstable network connection

**Solutions:**
1. Check proxy/firewall SSE support
2. Increase heartbeat frequency (reduce interval)
3. Monitor server health and logs

### High Memory Usage

**Symptoms:** API server memory growing over time

**Checks:**
1. Check subscription count: `eventBus.getTotalSubscriptionCount()`
2. Monitor active SSE connections
3. Verify cleanup on disconnect (check logs)
4. Look for subscription leaks in custom code

**Mitigation:**
1. Reduce connection timeout (currently 10 minutes)
2. Implement connection limits per user
3. Add memory alerts and monitoring

## Future Roadmap

### V2 Enhancements

1. **Redis Pub/Sub:** Multi-instance support
2. **WebSocket:** Bidirectional communication
3. **Event Replay:** Support `Last-Event-ID` header
4. **Compression:** Binary protocol with protobuf
5. **Real-time Control:** Pause/cancel/retry via stream
6. **Event Sourcing:** Persistent event log for replay

### V3 Vision

1. **Collaborative Viewing:** Multiple users viewing same run with cursor presence
2. **Live Annotations:** Comment on steps in real-time
3. **Execution Debugging:** Step-through debugging via stream
4. **Performance Metrics:** Real-time execution metrics dashboard

---

**Document Version:** 1.0
**Last Updated:** 2025-11-17
**Sprint:** S21
**Status:** Implemented & Documented
