# AI Playbooks Runtime (Sprint S7)

## Overview

The AI Playbooks Runtime is the execution engine for automated multi-agent workflows in Pravado. Sprint S7 establishes the foundational execution system with database-backed playbooks, step-by-step execution, and comprehensive observability.

**Key Capabilities:**
- Create and manage playbook definitions with versioning
- Execute playbooks step-by-step with status tracking
- Support for AGENT, DATA, BRANCH, and API step types
- Store complete execution history with inputs/outputs
- Multi-tenant org-scoped isolation

---

## Database Schema

### Core Tables

#### 1. `playbooks`

Playbook definitions with metadata and versioning.

```sql
playbooks (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id),
  name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED', 'DEPRECATED')),
  input_schema JSONB,
  output_schema JSONB,
  timeout_seconds INTEGER,
  max_retries INTEGER DEFAULT 0,
  tags TEXT[],
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

**Indexes:**
- `(org_id, name, version)` - Lookup by name and version
- `(org_id, status)` - Filter by status

**Status Lifecycle:**
- `DRAFT` - Under development, not ready for execution
- `ACTIVE` - Ready for execution
- `ARCHIVED` - Kept for historical purposes
- `DEPRECATED` - Replaced by newer version

#### 2. `playbook_steps`

Individual steps within a playbook (DAG nodes).

```sql
playbook_steps (
  id UUID PRIMARY KEY,
  playbook_id UUID NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id),
  key TEXT NOT NULL,              -- Unique within playbook
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('AGENT', 'DATA', 'BRANCH', 'API')),
  config JSONB NOT NULL,          -- Step-specific configuration
  position INTEGER NOT NULL,       -- Ordering for execution
  next_step_key TEXT,             -- Linear flow (or NULL for end/branch)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(playbook_id, key)
)
```

**Key Design:**
- `key` uniquely identifies step within playbook (used for referencing)
- `position` determines execution order (starting from 0)
- `next_step_key` defines simple linear flow; BRANCH steps override this
- `config` is step-type-specific JSON configuration

#### 3. `playbook_runs`

Execution instances of playbooks.

```sql
playbook_runs (
  id UUID PRIMARY KEY,
  playbook_id UUID NOT NULL REFERENCES playbooks(id),
  org_id UUID NOT NULL REFERENCES orgs(id),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED')),
  triggered_by UUID REFERENCES users(id),
  input JSONB,                    -- Playbook input data
  output JSONB,                   -- Final aggregated output
  error JSONB,                    -- Error details if FAILED
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

**Indexes:**
- `(org_id, playbook_id, created_at DESC)` - Runs by playbook
- `(org_id, status)` - Active/failed runs

**Status Lifecycle:**
1. `PENDING` - Created, not yet started
2. `RUNNING` - Currently executing steps
3. `SUCCEEDED` - All steps completed successfully
4. `FAILED` - One or more steps failed
5. `CANCELLED` - User cancelled execution

#### 4. `playbook_step_runs`

Execution instances of individual steps.

```sql
playbook_step_runs (
  id UUID PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES playbook_runs(id) ON DELETE CASCADE,
  playbook_id UUID NOT NULL REFERENCES playbooks(id),
  org_id UUID NOT NULL REFERENCES orgs(id),
  step_id UUID NOT NULL REFERENCES playbook_steps(id),
  step_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED')),
  input JSONB,                    -- Step input
  output JSONB,                   -- Step output
  error JSONB,                    -- Error details if FAILED
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

**Indexes:**
- `(org_id, run_id, created_at)` - Steps by run
- `(org_id, playbook_id, step_key)` - Step execution history

**Status Lifecycle:**
1. `PENDING` - Queued for execution
2. `RUNNING` - Currently executing
3. `SUCCEEDED` - Completed successfully
4. `FAILED` - Execution failed
5. `SKIPPED` - Skipped due to branch logic

---

## Execution Model

### Playbook Execution Flow

```
1. User triggers execution via API
2. Create playbook_runs record with PENDING
3. Transition to RUNNING
4. Execute steps sequentially:
   a. Create step_run with PENDING
   b. Transition step to RUNNING
   c. Execute step handler
   d. Update step to SUCCEEDED/FAILED
   e. Determine next step
5. Collect outputs
6. Update run to SUCCEEDED/FAILED
```

### Step Execution Context

Each step receives an execution context:

```typescript
{
  orgId: string;
  runId: string;
  stepRun: PlaybookStepRun;
  step: PlaybookStep;
  input: unknown;
  previousOutputs: Record<string, unknown>; // stepKey -> output
}
```

### Next Step Determination

**Linear Flow:**
- Use `next_step_key` from step definition
- If `null`, execution ends

**Branch Flow:**
- BRANCH step evaluates conditions
- Returns `{ nextStepKey: string }` in output
- Engine uses this to determine next step

### Error Handling

**Step Failure:**
- Mark step as FAILED
- Store error details in `step_run.error`
- Mark entire run as FAILED
- Stop execution

**Retry Logic (Future):**
- Check `playbook.max_retries`
- Retry failed step with exponential backoff
- Track retry count in step_run metadata

**Timeout (Future):**
- Check `playbook.timeout_seconds`
- Cancel execution if exceeded
- Mark run as FAILED with timeout error

---

## Step Types

### 1. AGENT Step

Executes an AI agent (LLM call).

**Config Schema:**
```typescript
{
  agentId: string;          // Agent identifier
  prompt?: string;          // Optional prompt template
  model?: string;           // LLM model (default: gpt-4)
  temperature?: number;     // 0-2 (default: 0.7)
  maxTokens?: number;       // Max response tokens
  systemMessage?: string;   // System instruction
}
```

**Example:**
```json
{
  "agentId": "content-writer",
  "prompt": "Write a blog post about: {{input.topic}}",
  "model": "gpt-4",
  "temperature": 0.7
}
```

**S7 Implementation:**
- Stubs LLM call with placeholder response
- Returns structured output with prompt and simulated response
- Future: Integrate with actual LLM router

### 2. DATA Step

Transforms data between steps.

**Config Schema:**
```typescript
{
  operation: 'pluck' | 'map' | 'merge' | 'filter' | 'transform';
  sourceKey?: string;       // Source step key
  fields?: string[];        // For 'pluck' operation
  mapping?: Record<string, string>;  // For 'map' operation
}
```

**Operations:**

**`pluck`** - Extract specific fields:
```json
{
  "operation": "pluck",
  "sourceKey": "api-response",
  "fields": ["name", "email", "title"]
}
```

**`map`** - Rename/remap fields:
```json
{
  "operation": "map",
  "sourceKey": "previous-step",
  "mapping": {
    "fullName": "name",
    "emailAddress": "email"
  }
}
```

**`merge`** - Combine with current input:
```json
{
  "operation": "merge",
  "sourceKey": "user-data"
}
```

### 3. BRANCH Step

Conditional logic / routing.

**Config Schema:**
```typescript
{
  sourceKey: string;                    // Step to evaluate
  conditions: Array<{
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'exists';
    value?: unknown;
    nextStepKey: string;
  }>;
  defaultStepKey?: string;              // Fallback
}
```

**Example:**
```json
{
  "sourceKey": "sentiment-analysis",
  "conditions": [
    {
      "operator": "equals",
      "value": "positive",
      "nextStepKey": "send-thank-you"
    },
    {
      "operator": "equals",
      "value": "negative",
      "nextStepKey": "escalate-to-human"
    }
  ],
  "defaultStepKey": "archive"
}
```

**Evaluation:**
- Conditions evaluated in order
- First match determines next step
- If no match and no default, execution fails

### 4. API Step

External API call.

**Config Schema:**
```typescript
{
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}
```

**Example:**
```json
{
  "method": "POST",
  "url": "https://api.example.com/webhook",
  "headers": {
    "Authorization": "Bearer {{env.API_TOKEN}}",
    "Content-Type": "application/json"
  },
  "body": {
    "event": "playbook_completed",
    "data": "{{previous-step.output}}"
  }
}
```

**S7 Implementation:**
- Stubs API call with placeholder response
- Future: Actual HTTP client with retries and error handling

---

## API Endpoints

All endpoints require authentication and org membership.

### `GET /api/v1/playbooks`

List playbooks for current org.

**Query Parameters:**
- `status` (string, optional): Filter by status
- `limit` (integer, optional, default: 20, max: 100)
- `offset` (integer, optional, default: 0)
- `tags` (string, optional): Comma-separated tags

**Response:**
```typescript
{
  success: true,
  data: {
    items: Playbook[]
  }
}
```

### `GET /api/v1/playbooks/:id`

Get playbook definition with steps.

**Response:**
```typescript
{
  success: true,
  data: {
    item: {
      playbook: Playbook,
      steps: PlaybookStep[]
    }
  }
}
```

### `POST /api/v1/playbooks`

Create a new playbook.

**Request Body:**
```typescript
{
  name: string;
  version?: number;
  status?: PlaybookStatus;
  inputSchema?: unknown;
  outputSchema?: unknown;
  timeoutSeconds?: number;
  maxRetries?: number;
  tags?: string[];
  steps: PlaybookStepInput[];  // At least 1 step required
}
```

**Validation:**
- Steps must have unique keys
- All `nextStepKey` references must exist
- Positions must be sequential starting from 0
- No circular dependencies

### `PUT /api/v1/playbooks/:id`

Update playbook definition.

**Request Body:** Same as create, all fields optional.

**Note:** Updating steps replaces all existing steps (delete + insert).

### `POST /api/v1/playbooks/:id/execute`

Execute a playbook.

**Request Body:**
```typescript
{
  input: unknown  // Any JSON input for playbook
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    run: {
      run: PlaybookRun,
      steps: PlaybookStepRun[]
    }
  }
}
```

**Execution:**
- Creates run record
- Executes synchronously (blocks until complete)
- Returns full run with step results

### `GET /api/v1/playbooks/runs/:id`

Get playbook run with step runs.

**Response:**
```typescript
{
  success: true,
  data: {
    run: {
      run: PlaybookRun,
      steps: PlaybookStepRun[]
    }
  }
}
```

---

## Integration Points

### Agent Memory (Future - Sprint S8+)

**Context Hooks:**
- Before step execution: Retrieve relevant memory
- After step execution: Store step output in memory
- Memory key format: `playbook:{playbookId}:run:{runId}:step:{stepKey}`

**Use Cases:**
- AGENT steps can access conversation history
- DATA steps can merge with memory context
- BRANCH steps can evaluate based on historical patterns

### Playbook Orchestration (Future - Sprint S9+)

**Multi-Playbook Chaining:**
- One playbook can trigger another
- Pass output as input to next playbook
- Track lineage across playbook runs

**Parallel Execution:**
- Execute multiple playbooks concurrently
- Join outputs when all complete
- Handle partial failures

---

## Example Execution Flow

### Simple 3-Step Playbook

**Definition:**
```json
{
  "name": "Content Approval Workflow",
  "steps": [
    {
      "key": "generate-content",
      "name": "Generate Blog Post",
      "type": "AGENT",
      "position": 0,
      "config": {
        "agentId": "content-writer",
        "prompt": "Write about: {{input.topic}}"
      },
      "nextStepKey": "check-quality"
    },
    {
      "key": "check-quality",
      "name": "Quality Check",
      "type": "BRANCH",
      "position": 1,
      "config": {
        "sourceKey": "generate-content",
        "conditions": [
          {
            "operator": "contains",
            "value": "error",
            "nextStepKey": "notify-failure"
          }
        ],
        "defaultStepKey": "publish"
      }
    },
    {
      "key": "publish",
      "name": "Publish Content",
      "type": "API",
      "position": 2,
      "config": {
        "method": "POST",
        "url": "https://cms.example.com/posts"
      },
      "nextStepKey": null
    }
  ]
}
```

**Execution:**
1. Create run with `input: { topic: "AI automation" }`
2. Execute `generate-content` AGENT step
3. Execute `check-quality` BRANCH step
4. Determine next step based on condition
5. Execute `publish` API step (if quality ok)
6. Mark run as SUCCEEDED
7. Return run with all step outputs

---

## Limitations & Future Enhancements

### S7 Limitations

- **Synchronous execution**: Runs block API request
- **No retry logic**: Failed steps immediately fail run
- **No timeout enforcement**: Long-running steps can block
- **Stubbed LLM/API calls**: AGENT and API steps return placeholders
- **No parallel steps**: Only linear/branch flow supported

### Planned Enhancements (S8+)

**Sprint S8: Async Execution**
- Background job queue (BullMQ, etc.)
- Webhooks for completion notifications
- Polling endpoint for run status

**Sprint S9: Advanced Features**
- Retry logic with exponential backoff
- Timeout enforcement
- Parallel step execution (fan-out/fan-in)
- Sub-playbook calls

**Sprint S10: Observability**
- Real-time execution logs
- Step duration metrics
- Cost tracking (LLM tokens, API calls)
- Execution analytics dashboard

---

## Security & Multi-Tenancy

**Row-Level Security (RLS):**
- All playbook tables enforce org-scoped access
- User must be member of org via `user_orgs` table
- Playbook runs can only access playbooks from same org

**Execution Isolation:**
- Each run has isolated execution context
- Step outputs stored per-run (no cross-run pollution)
- Error details captured but sanitized before exposure

**API Security:**
- All endpoints require authentication (`requireUser`)
- Org membership validated before any operation
- Input validation via Zod schemas

---

## Summary

Sprint S7 establishes the foundational playbook execution system:

1. **Database Layer**: 4 tables for playbooks, steps, runs, step runs
2. **Service Layer**: PlaybookService (CRUD), PlaybookExecutionEngine (runtime)
3. **API Layer**: 6 REST endpoints for full lifecycle
4. **Step Handlers**: AGENT, DATA, BRANCH, API (with future extensibility)
5. **Observability**: Full execution history with inputs/outputs stored

**Next Steps:**
- Sprint S8: Async execution + webhooks
- Sprint S9: Real LLM integration + retry logic
- Sprint S10: UI for playbook editor and run viewer
