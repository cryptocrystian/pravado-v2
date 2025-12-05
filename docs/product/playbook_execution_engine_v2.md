# Playbook Execution Engine V2 (Sprint S18)

## Overview

The Playbook Execution Engine V2 is an asynchronous, queue-based execution system for running multi-step AI workflows (playbooks) in Pravado. It replaces the synchronous execution model with a robust, scalable architecture that supports parallel step execution, retry logic, and real-time status monitoring.

## Architecture

### Core Components

1. **Job Queue (`queue.ts`)**: In-memory job queue with priority handling and retry logic
2. **Worker Pool (`worker.ts`)**: Manages concurrent job execution with configurable worker count
3. **Execution Dispatcher (`executionDispatcher.ts`)**: Orchestrates playbook execution by dispatching steps to the queue
4. **Execution Engine V2 (`playbookExecutionEngineV2.ts`)**: Main coordinator that integrates all components
5. **Step Handlers (`stepHandlers/index.ts`)**: Type-specific handlers for AGENT, DATA, BRANCH, and API steps

### Execution Flow

```
1. User → POST /api/v1/playbooks/:id/execute-async
2. Engine creates playbook run and step runs in database
3. Dispatcher analyzes dependencies and enqueues initial steps
4. Worker pool picks up queued jobs based on priority
5. Workers execute steps using type-specific handlers
6. On step completion, dispatcher enqueues dependent steps
7. Engine tracks overall run status and sends webhooks
8. User polls GET /api/v1/playbooks/runs/:id/state for updates
```

## Database Schema

### New Columns (Migration 30)

#### `playbook_runs` table:
- `state` (text): Current execution state (queued|running|success|failed|waiting_for_dependencies|blocked|canceled)
- `worker_info` (jsonb): Worker metadata (workerId, timestamps)
- `webhook_url` (text): Optional webhook URL for completion notifications
- `started_at` (timestamptz): Actual execution start time
- `completed_at` (timestamptz): Actual execution completion time

#### `playbook_step_runs` table:
- `state` (text): Step execution state (same values as run state)
- `attempt` (integer): Current retry attempt number (0-indexed)
- `max_attempts` (integer): Maximum retry attempts allowed (default: 3)
- `logs` (text[]): Array of log messages from step execution
- `worker_info` (jsonb): Worker metadata for this step

## API Endpoints

### Execute Playbook Asynchronously

```http
POST /api/v1/playbooks/:id/execute-async
```

**Request Body:**
```json
{
  "input": { ... },
  "webhookUrl": "https://example.com/webhook",
  "priority": "medium" // low|medium|high|urgent
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "runId": "uuid",
    "message": "Playbook execution started"
  }
}
```

### Get Execution State

```http
GET /api/v1/playbooks/runs/:id/state
```

**Response:**
```json
{
  "success": true,
  "data": {
    "run": {
      "id": "uuid",
      "playbookId": "uuid",
      "orgId": "uuid",
      "status": "RUNNING",
      "state": "running",
      ...
    },
    "stepRuns": [...],
    "state": "running",
    "progress": {
      "total": 5,
      "completed": 2,
      "failed": 0,
      "pending": 3
    }
  }
}
```

### Cancel Execution

```http
POST /api/v1/playbooks/runs/:id/cancel
```

Cancels all queued and running steps for the playbook run.

### Resume Execution

```http
POST /api/v1/playbooks/runs/:id/resume
```

Retries failed steps and resumes execution.

### Queue Statistics

```http
GET /api/v1/playbooks/queue/stats
```

Returns queue and worker pool statistics for monitoring.

**Response:**
```json
{
  "success": true,
  "data": {
    "queue": {
      "queued": 5,
      "running": 2,
      "completed": 10,
      "failed": 1,
      "retrying": 0
    },
    "workers": {
      "totalWorkers": 5,
      "idleWorkers": 3,
      "busyWorkers": 2,
      "totalJobsProcessed": 100
    }
  }
}
```

## Execution States

### Run States

- **queued**: Run created, waiting to start
- **running**: At least one step is executing
- **success**: All steps completed successfully
- **failed**: One or more steps failed with no retries remaining
- **waiting_for_dependencies**: All pending steps are blocked by dependencies
- **blocked**: External blocker (e.g., rate limit, resource unavailable)
- **canceled**: User-initiated cancellation

### Step States

Same as run states, plus:
- **skipped**: Step was skipped due to conditional logic

## Configuration

### Environment Variables

```bash
# Queue configuration
QUEUE_MAX_CONCURRENCY=5          # Number of concurrent workers
QUEUE_DEFAULT_MAX_ATTEMPTS=3     # Default retry attempts
QUEUE_RETRY_DELAY_MS=1000        # Initial retry delay
QUEUE_RETRY_BACKOFF_MULTIPLIER=2 # Exponential backoff multiplier
QUEUE_MAX_RETRY_DELAY_MS=30000   # Maximum retry delay
QUEUE_POLL_INTERVAL_MS=1000      # Queue polling interval
QUEUE_STALE_JOB_TIMEOUT_MS=300000 # 5 minutes
```

### Engine Initialization

```typescript
import { PlaybookExecutionEngineV2 } from './services/playbookExecutionEngineV2';

const engine = new PlaybookExecutionEngineV2(supabase, {
  maxConcurrency: 5,
  enableWebhooks: true,
  enableLogging: true,
});

engine.start();
```

## Dependency Resolution

The dispatcher automatically builds a dependency graph from playbook steps and ensures steps only execute when their dependencies are satisfied.

### Dependency Sources

1. **Explicit dependencies**: Configured in step config: `{ dependencies: ['step-key-1', 'step-key-2'] }`
2. **Input references**: Template references like `{{steps.previous-step.output.field}}`

### Parallel Execution

Steps with no dependencies or whose dependencies are all satisfied execute in parallel up to the worker pool's concurrency limit.

## Retry Logic

### Automatic Retries

Steps that fail are automatically retried up to `max_attempts` times with exponential backoff.

**Backoff Formula:**
```
delay = min(retryDelayMs * (backoffMultiplier ^ attempt), maxRetryDelayMs)
```

**Example:**
- Attempt 1: 1000ms delay
- Attempt 2: 2000ms delay
- Attempt 3: 4000ms delay

### Manual Resume

Users can manually resume failed executions via the `/resume` endpoint, which resets failed steps to queued state.

## Webhooks

### Webhook Events

The engine sends webhook notifications for:

1. **step.completed**: Individual step completes successfully
2. **step.failed**: Individual step fails
3. **run.completed**: Entire playbook run completes successfully
4. **run.failed**: Entire playbook run fails

### Webhook Payload

```json
{
  "type": "step.completed",
  "runId": "uuid",
  "stepKey": "step-name",
  "output": { ... }
}
```

### Configuration

Webhooks are configured per execution:

```typescript
await engine.executePlaybook(playbookId, orgId, userId, {
  webhookUrl: 'https://example.com/webhook',
});
```

## Step Handlers

### AGENT Handler

Executes AI agent tasks (placeholder for full implementation in future sprints).

```typescript
const result = await agentHandler.execute(context);
```

### DATA Handler

Performs data transformations:

- **merge**: Combines all previous step outputs
- **extract**: Extracts specific fields from input or previous outputs
- **default**: Pass-through

### BRANCH Handler

Evaluates conditional logic for branching:

- Operators: `equals`, `notEquals`, `contains`, `greaterThan`, `lessThan`
- Returns: `{ conditionMet: boolean, ... }`

### API Handler

Makes external API calls with template variable substitution:

```json
{
  "type": "API",
  "config": {
    "url": "https://api.example.com/data",
    "method": "POST",
    "headers": { "Authorization": "Bearer token" },
    "body": {
      "field": "{{steps.previous-step.output.value}}"
    }
  }
}
```

## Logging

### Step Execution Logs

Each step run maintains an array of log entries:

```typescript
interface StepLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}
```

Logs are stored in the `logs` column of `playbook_step_runs` and returned in execution status queries.

### Access Logs

```typescript
const status = await engine.getExecutionStatus(runId);
console.log(status.stepRuns[0].logs);
```

## Testing

### Unit Tests

Run queue and worker pool tests:

```bash
cd apps/api
pnpm test queue
pnpm test workerPool
```

### Integration Tests

Test full playbook execution:

```bash
pnpm test playbookExecutionEngineV2
```

## Performance Considerations

### Concurrency

- Default: 5 concurrent workers
- Recommended: 10-20 for production
- Monitor CPU and memory usage when increasing

### Queue Size

- In-memory queue has no hard limit
- Monitor memory usage for long-running queues
- Implement cleanup for old completed/failed jobs

### Database Load

- Each step execution performs 2-3 database updates
- Use connection pooling
- Consider read replicas for status queries

## Future Enhancements

### Sprint S19+

1. **Redis Queue**: Pluggable Redis backend for distributed execution
2. **Priority Lanes**: Separate queues for different priority levels
3. **Dead Letter Queue**: Failed jobs move to DLQ after max retries
4. **Scheduled Execution**: Cron-like scheduling for playbook runs
5. **Execution History**: Detailed execution history with replay capability
6. **Performance Metrics**: Detailed metrics collection and visualization

## Troubleshooting

### Jobs Stuck in Queue

**Symptoms:** Jobs remain in `queued` state indefinitely

**Causes:**
- Worker pool not started
- All workers busy
- Dependency deadlock

**Solutions:**
1. Check `GET /queue/stats` for worker status
2. Verify worker pool is started
3. Check for circular dependencies in playbook

### Failed Steps Not Retrying

**Symptoms:** Steps marked as `failed` without retries

**Causes:**
- Max attempts reached
- Retry logic disabled
- Job cancelled

**Solutions:**
1. Check step run `attempt` and `max_attempts` values
2. Manually resume via `/resume` endpoint
3. Check run state for `canceled`

### Webhook Not Firing

**Symptoms:** No webhook calls received

**Causes:**
- Webhook URL not set
- Webhooks disabled in config
- Network issues

**Solutions:**
1. Verify `webhook_url` in playbook run
2. Check engine config `enableWebhooks: true`
3. Check network connectivity and firewall rules

## Examples

### Basic Execution

```typescript
// Start execution
const runId = await engine.executePlaybook(
  'playbook-uuid',
  'org-uuid',
  'user-uuid',
  {
    input: { url: 'https://example.com' },
    priority: 'high',
  }
);

// Poll for status
const status = await engine.getExecutionStatus(runId);
console.log(`Progress: ${status.progress.completed}/${status.progress.total}`);
```

### With Webhooks

```typescript
const runId = await engine.executePlaybook(
  'playbook-uuid',
  'org-uuid',
  'user-uuid',
  {
    input: { url: 'https://example.com' },
    webhookUrl: 'https://my-app.com/playbook-complete',
  }
);

// Webhook will receive:
// POST https://my-app.com/playbook-complete
// { "type": "run.completed", "runId": "...", "output": {...} }
```

### Cancel and Resume

```typescript
// Cancel execution
await engine.cancelExecution(runId);

// Later, resume from failed steps
await engine.resumeExecution(runId);
```

## Related Documentation

- [Playbook System V1 (Sprint S8)](./playbook_system_v1.md)
- [Memory System V2 (Sprint S10)](./memory_system_v2.md)
- [Agent Personality Engine (Sprint S11)](./agent_personality_engine.md)
