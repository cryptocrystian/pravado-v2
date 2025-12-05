# Playbook Execution Viewer V1 (Sprint S19)

## Overview

The Playbook Execution Viewer is a live, real-time dashboard for monitoring playbook execution in Pravado. It provides detailed visibility into multi-step AI workflows, including step-by-step progress, logs, outputs, agent personality application, memory traces, and collaboration context.

## Architecture

### Components

**API Layer:**
- `GET /api/v1/playbook-runs/:id` - Aggregated run + all steps with enrichments
- `GET /api/v1/playbook-runs/:id/steps/:stepKey` - Detailed single step view
- `GET /api/v1/playbook-runs/:id/stream` - Stub for future SSE/WebSocket (S21)

**Dashboard UI:**
- `/app/playbooks/runs/[runId]` - Main viewer route
- `RunHeader` - Run overview and progress
- `StepTimeline` - Vertical timeline of all steps
- `StepInspector` - Detailed step information panel

### Polling Model

The viewer uses **polling** (no WebSockets yet) with:
- 2-second poll interval
- Automatic pause when run completes (success/failed/canceled states)
- Manual refresh and pause/resume controls

In Sprint S21, this will be upgraded to Server-Sent Events (SSE) or WebSocket for true real-time updates.

## S21 — Live Streaming Mode

### Overview

Sprint S21 introduces **real-time execution streaming** using Server-Sent Events (SSE), replacing the polling-only approach with a push-based event system that delivers execution updates with sub-second latency.

### SSE-First Approach

The execution viewer now follows a **SSE-first, polling-fallback** strategy:

1. **Initial Load**: Always fetches full run state via REST API (`GET /api/v1/playbook-runs/:id`)
2. **Streaming Mode**: If SSE feature flag enabled and connection successful:
   - Establishes SSE connection to `/api/v1/playbook-runs/:id/stream`
   - Stops polling completely
   - Applies event deltas to UI state (not full re-fetch)
3. **Fallback Mode**: If SSE unavailable, fails, or feature flag disabled:
   - Falls back to 2-second polling
   - Continues using REST API endpoint

### Event-to-UI Mapping

SSE events map directly to UI component updates:

| Event Type | Affected Components | Update Behavior |
|------------|-------------------|-----------------|
| `run.updated` | RunHeader, StepTimeline | Updates run status, progress, current step key |
| `run.completed` | RunHeader | Shows final state, stops polling/streaming |
| `run.failed` | RunHeader | Displays error banner with failure message |
| `step.updated` | StepTimeline, StepInspector | Updates step state badge, timestamps, status |
| `step.completed` | StepTimeline, StepInspector | Shows success state, completion time, result |
| `step.failed` | StepTimeline, StepInspector | Shows error state, error message, retry info |
| `step.log.appended` | StepInspector (Logs section) | Appends new log line to terminal output |

**Delta Updates:** SSE events contain only changed data (e.g., single step update), not the full run state. The UI applies these deltas efficiently without re-rendering unaffected components.

### UI Indicators

The viewer displays the current streaming mode with visual badges:

**1. Header Badge (in RunHeader)**
- **Green "LIVE" badge**: SSE connected and streaming events
- **Yellow "Polling" badge**: Polling active (SSE unavailable or disabled)
- **Gray "Paused" badge**: Updates manually paused by user

**2. Floating Indicator (bottom-right corner)**
- Same color coding as header badge
- Animated pulse dot for LIVE mode
- Always visible during active monitoring

**3. Manual Controls**
- **Refresh button** (bottom-left): Force immediate full state fetch
- **Pause/Resume button**: Toggle automatic updates (works for both SSE and polling)

### Connection Lifecycle

```
Initial Load (REST API)
        ↓
Feature Flag Check
        ↓
    [Enabled?]
    /         \
  Yes          No
   ↓            ↓
Try SSE   Use Polling
   ↓
[Success?]
 /      \
Yes      No
 ↓       ↓
SSE   Fallback
Mode  to Polling
```

**SSE Reconnection:**
- Automatic reconnection on connection loss
- Exponential backoff: 3s, 6s, 12s, 24s, 48s
- Max 5 retry attempts before permanent fallback
- Manual retry available via UI control

### Performance Improvements

**SSE Mode Benefits:**
- **Latency**: < 100ms event delivery (vs 0-2000ms with polling)
- **Server Load**: ~95% fewer requests (1 connection vs 30 requests/minute)
- **Bandwidth**: ~90% reduction (delta events vs full state fetch)
- **User Experience**: Instant updates, no perceived lag

**Example:** A 10-minute playbook run:
- **Polling**: 300 API requests, ~15MB data transferred
- **SSE**: 1 connection + heartbeats, ~1.5MB data transferred

### Feature Flag

**Flag Name:** `ENABLE_EXECUTION_STREAMING`

**Default:** `true`

**Behavior:**
- **When `true`**: Frontend attempts SSE, falls back to polling on failure
- **When `false`**: Frontend uses polling only (SSE endpoint not called)

**Toggle at Runtime:**
```typescript
import { FLAGS } from '@pravado/feature-flags';

const streamingEnabled = FLAGS.ENABLE_EXECUTION_STREAMING;
```

### Limitations

**V1 SSE Implementation:**
1. **Single-Instance Only**: Works within one API server process (no multi-instance support yet)
2. **No Event Replay**: Missed events during disconnection are not replayed (initial fetch provides baseline)
3. **No WebSocket**: SSE is unidirectional (server → client only), no client commands over stream
4. **Memory Constraints**: All subscriptions in-memory, scales with concurrent viewers

**Future Enhancements (V2+):**
- Redis Pub/Sub for multi-instance support
- Event replay with `Last-Event-ID` header
- WebSocket for bidirectional communication
- Persistent event log for debugging

### Troubleshooting SSE

**Connection Not Establishing:**
- Check browser console for EventSource errors
- Verify feature flag: `FLAGS.ENABLE_EXECUTION_STREAMING === true`
- Confirm authentication (session cookie present)
- Check network tab for `/stream` endpoint response

**Frequent Disconnections:**
- Proxy/firewall may not support SSE (check infrastructure)
- Network instability (monitor connection quality)
- Server restarts (check API logs)

**Events Not Updating UI:**
- Verify `applyEvent` function is processing events
- Check for event parsing errors in console
- Ensure event `runId` matches viewer `runId`

**Fallback to Polling:**
- Normal behavior when SSE unavailable
- Check yellow "Polling" badge to confirm fallback
- No action required, polling provides same data

### Developer Integration

**Frontend Hook Usage:**
```typescript
import { useExecutionStream } from '@/hooks/useExecutionStream';

const { connected, lastEvent, error } = useExecutionStream(runId, {
  enabled: FLAGS.ENABLE_EXECUTION_STREAMING,
  maxEvents: 100,
  retryDelay: 3000,
  maxRetries: 5,
});

useEffect(() => {
  if (lastEvent) {
    applyEvent(lastEvent);  // Apply event delta to state
  }
}, [lastEvent]);
```

**Backend Event Publishing:**
```typescript
import { executionEventBus } from '@/events/eventBus';

// After updating database state
await updateStepRun(stepKey, { state: 'running' });

// Publish event to subscribers
executionEventBus.publish({
  type: 'step.updated',
  runId,
  stepKey,
  timestamp: new Date().toISOString(),
  payload: { status: 'RUNNING', startedAt: new Date().toISOString() },
});
```

### Related Documentation

- [Execution Streaming V1 (S21)](./execution_streaming_v1.md) - Complete SSE architecture documentation
- [Playbook Execution Engine V2 (S18)](./playbook_execution_engine_v2.md) - Backend execution engine

## UI Layout

```
┌────────────────────────────────────────────────────────────┐
│                    Run Header                              │
│  Playbook Name [STATE BADGE]  Progress: XX% ■■■■□□□       │
│  Run ID • Version • Duration  XX/YY steps                  │
└────────────────────────────────────────────────────────────┘
┌─────────────────────┬──────────────────────────────────────┐
│                     │                                      │
│   Step Timeline     │         Step Inspector               │
│                     │                                      │
│  ●─ Step 1 ✓        │  🤖 Step 1: Research                │
│  │  [success]        │                                      │
│  │                   │  ▼ Status                            │
│  ●─ Step 2 ▶        │  ▼ Logs                              │
│  │  [running]        │  ▼ Output                            │
│  │                   │  ▼ Personality                       │
│  ●─ Step 3 ○        │  ▼ Memory Traces                     │
│     [queued]         │  ▼ Collaboration                     │
│                     │                                      │
└─────────────────────┴──────────────────────────────────────┘
```

## API Response Structure

### GET /api/v1/playbook-runs/:id

Returns aggregated run view with all enrichments:

```typescript
interface PlaybookRunView {
  id: string;
  playbookId: string;
  playbookName: string;
  playbookVersion: number;
  orgId: string;
  state: ExecutionState; // queued|running|success|failed|...
  status: PlaybookRunStatus;
  triggeredBy: string | null;
  input: unknown;
  output: unknown;
  error: unknown;
  webhookUrl: string | null;
  workerInfo: WorkerInfo | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  steps: StepRunView[];
  progress: {
    total: number;
    completed: number;
    failed: number;
    running: number;
    pending: number;
  };
}
```

### Step Run View

Each step includes:

```typescript
interface StepRunView {
  id: string;
  key: string;
  name: string;
  type: PlaybookStepType; // AGENT|DATA|BRANCH|API
  state: ExecutionState;
  status: PlaybookStepRunStatus;
  attempt: number;
  maxAttempts: number;
  input: unknown;
  output: unknown;
  error: unknown;
  logs: string[];
  workerInfo: WorkerInfo | null;
  collaborationContext: unknown | null;
  episodicTraces: EpisodicTrace[];
  personality: AgentPersonality | null; // Only for AGENT steps
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}
```

## Execution State Colors

Visual color coding for execution states:

| State                        | Color    | Badge Color  |
|------------------------------|----------|--------------|
| `queued`                     | Gray     | `#A0AEC0`    |
| `running`                    | Blue     | `#3182CE`    |
| `success`                    | Green    | `#38A169`    |
| `failed`                     | Red      | `#E53E3E`    |
| `waiting_for_dependencies`   | Yellow   | `#D69E2E`    |
| `blocked`                    | Purple   | `#805AD5`    |
| `canceled`                   | Gray     | `#718096`    |

## Features

### 1. Live Progress Tracking

- **Run-level progress bar**: Shows XX% completion
- **Step counts**: Displays completed/failed/running/pending steps
- **Duration tracking**: Shows elapsed time from start
- **Auto-updates**: Polls every 2 seconds until completion

### 2. Step Timeline

Vertical timeline showing:
- Step icon (🤖 for AGENT, ⚙️ for DATA, ◆ for BRANCH, 🌐 for API)
- Step name and key
- State badge with color coding
- Attempt counter (e.g., "Attempt 2/3" for retries)
- Start/end timestamps
- Duration
- Personality badge for AGENT steps
- Error preview for failed steps

**Parallel branches**: Steps that execute concurrently appear at the same timeline level with visual grouping.

### 3. Step Inspector

Collapsible sections for deep inspection:

- **Status**: State, attempt, timestamps
- **Worker Info**: Worker ID, start/finish times
- **Logs**: Terminal-style log output
- **Input**: JSON view of step input
- **Output**: JSON view of step result
- **Error**: Error details (if failed)
- **Personality** (AGENT steps only): Name, slug, description, configuration
- **Collaboration Context**: Inter-agent messages and shared state
- **Episodic Memory**: Memory traces recorded during execution

### 4. Controls

- **Manual Refresh**: Force immediate data reload
- **Pause/Resume Polling**: Toggle auto-updates
- **Step Selection**: Click any step to view details

## Reading Parallel Branches

Parallel steps are identified by:
1. Same dependency parent
2. No dependency on each other
3. Execute concurrently (multiple running at once)

**Example:**
```
Step 1 (completed)
  ├─ Step 2A (running) ─── Parallel branch
  └─ Step 2B (running) ─── Parallel branch
       └─ Step 3 (waiting) ─── Depends on both
```

The timeline groups parallel steps visually and shows their concurrent execution.

## Personality Application

For AGENT steps, the inspector shows:
- **Personality Name**: Human-readable name (e.g., "Analytical Researcher")
- **Slug**: Machine identifier (e.g., "analytical-researcher")
- **Description**: What this personality does
- **Configuration**: Full personality profile including:
  - Tone
  - Style
  - Risk tolerance
  - Domain specialty
  - Collaboration style
  - Constraints

## Memory & Collaboration

### Episodic Traces

Memory traces captured during step execution:
- Automatically recorded semantic memories
- Timestamped with creation date
- Linked to specific steps
- Content stored as JSON
- Useful for debugging and understanding agent reasoning

### Collaboration Context

For multi-agent workflows:
- Inter-agent messages (request/response/escalation/delegation)
- Shared state across steps
- Escalation level (none/agent/supervisor/human)
- Message timestamps and payloads

## Known Limitations

### Sprint S19 (Current)

1. **No WebSockets**: Uses polling instead of real-time updates
2. **No Step Filtering**: Shows all steps (no search/filter)
3. **No Timeline Zoom**: Fixed timeline scale
4. **No Comparison**: Can't compare runs side-by-side
5. **No Export**: No CSV/JSON export of logs or data

### Future Enhancements (S21+)

- **Real-time Updates**: SSE or WebSocket for instant updates
- **Interactive Timeline**: Zoom, pan, filter by state/type
- **Step Search**: Find steps by name, key, or content
- **Log Streaming**: Tail logs in real-time
- **Run Comparison**: Compare two runs side-by-side
- **Export**: Download logs, outputs, full run data
- **Notifications**: Browser notifications for run completion

## Usage Examples

### Basic Monitoring

1. Navigate to `/app/playbooks/runs/:runId`
2. View live progress in RunHeader
3. Watch timeline update every 2 seconds
4. Click any step to see details

### Debugging Failed Runs

1. Check RunHeader for error summary
2. Identify failed steps (red badges) in timeline
3. Click failed step
4. Review:
   - Error section for stack trace
   - Logs for execution history
   - Input/Output for data flow issues
   - Attempt counter for retry status

### Understanding Agent Behavior

1. Select an AGENT step
2. Expand Personality section
3. Review configuration (tone, style, constraints)
4. Check Episodic Memory for reasoning traces
5. View Collaboration Context for inter-agent messages

### Monitoring Parallel Execution

1. Look for steps with same start time
2. Identify common parent step
3. Watch multiple "running" badges simultaneously
4. See when dependent steps become unblocked

## API Integration

### Fetching Run Data

```typescript
const response = await fetch(`/api/v1/playbook-runs/${runId}`, {
  credentials: 'include',
});

const { success, data } = await response.json();

if (success) {
  const run: PlaybookRunView = data;
  // Access run.steps, run.progress, etc.
}
```

### Polling Pattern

```typescript
const POLL_INTERVAL = 2000;
const finalStates = ['success', 'failed', 'canceled'];

const poll = setInterval(async () => {
  const run = await fetchRun(runId);

  if (finalStates.includes(run.state)) {
    clearInterval(poll);
  }
}, POLL_INTERVAL);
```

### Fetching Single Step

```typescript
const response = await fetch(
  `/api/v1/playbook-runs/${runId}/steps/${stepKey}`,
  { credentials: 'include' }
);

const { success, data } = await response.json();

if (success) {
  const step: StepRunView = data;
  // Access step.logs, step.output, step.personality, etc.
}
```

## Troubleshooting

### Run Not Loading

**Symptoms:** Blank screen or loading spinner indefinitely

**Causes:**
- Invalid run ID
- User not authenticated
- User not member of run's org
- Network issues

**Solutions:**
1. Check browser console for errors
2. Verify authentication (try refreshing)
3. Check run ID format (must be UUID)
4. Verify network connectivity

### Polling Not Updating

**Symptoms:** Run state not changing despite activity

**Causes:**
- Polling paused manually
- Run in final state (auto-pause)
- API endpoint down

**Solutions:**
1. Check "Live updating" indicator in bottom-right
2. Click "Resume polling" if paused
3. Use manual "Refresh" button
4. Check browser network tab for API errors

### Missing Step Data

**Symptoms:** Step shows minimal information

**Causes:**
- Step not yet started (no logs/output yet)
- Worker info not populated
- Memory/collaboration not recorded

**Solutions:**
1. Wait for step to start execution
2. Check step state (queued steps have no logs)
3. Verify memory system is enabled (S10)
4. Check personality assignment (S11)

### Timeline Not Showing Parallel Branches

**Symptoms:** Parallel steps appear sequential

**Causes:**
- Steps have different start times
- Dependencies not properly configured
- Execution serialized due to resource limits

**Solutions:**
1. Check step dependencies in playbook definition
2. Verify concurrent execution in worker pool stats
3. Review step start timestamps (should be close)

## Performance Considerations

### Polling Overhead

- **Network**: ~1 request per 2 seconds
- **Bandwidth**: ~10-50KB per request (depends on step count)
- **Impact**: Minimal for most networks
- **Mitigation**: Polling auto-stops when run completes

### Large Runs

For playbooks with many steps (>50):
- Timeline may become long (scrollable)
- Initial load may be slower
- Consider pagination in future versions

### Memory Traces

Large episodic trace collections:
- Can increase response size significantly
- Displayed collapsed by default
- Expand only when needed

## Related Documentation

- [Playbook Execution Engine V2 (S18)](./playbook_execution_engine_v2.md) - Backend execution architecture
- [Memory System V2 (S10)](./memory_system_v2.md) - Episodic traces and semantic memory
- [Agent Personality Engine (S11)](./agent_personality_engine.md) - Personality configuration
- [Agent Collaboration & Escalation (S9)](./ai_playbooks_collaboration.md) - Inter-agent communication
- [Visual Playbook Editor (S17)](./visual_playbook_editor.md) - UI design consistency

## Acceptance Criteria

Sprint S19 is complete when:

✅ Viewer route exists at `/app/playbooks/runs/[runId]`
✅ API endpoints return run + step data with enrichments
✅ Timeline shows all steps with state colors
✅ Inspector displays logs, output, personality, memory, collaboration
✅ Parallel paths grouped correctly
✅ Polling updates run every 2 seconds
✅ Auto-pause when run completes
✅ Documentation complete
✅ Tests added
✅ Build passes
