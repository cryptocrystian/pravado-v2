# Pravado Agent Runtime - Architecture

> **Note**: This document describes the planned agent runtime system. Sprint S3 provides the foundational types, utilities, and validation logic. Full agent execution runtime will be implemented in Sprint S4+.

---

## Overview

Pravado's multi-agent system enables automated workflows (playbooks) that orchestrate multiple AI agents to complete complex marketing tasks. Agents are specialized AI workers that perform discrete tasks like researching journalists, generating content briefs, or analyzing SEO opportunities.

### Key Concepts

- **Agent**: A specialized AI worker with defined capabilities, inputs, and outputs
- **Task**: A discrete unit of work with input parameters and expected output schema
- **Playbook**: A workflow template defining a sequence of agent tasks with dependencies
- **Execution**: A runtime instance of a playbook being executed with specific inputs
- **Node**: A single agent task within a playbook graph

---

## Agent Structure

### Agent Definition

Each agent is defined by a structured `AgentDefinition` object:

```typescript
interface AgentDefinition {
  id: string;                    // Unique agent identifier (e.g., 'journalist-researcher')
  name: string;                  // Human-readable name
  description: string;           // What this agent does
  category: 'pr' | 'content' | 'seo' | 'general';  // Which pillar it belongs to
  capabilities: string[];        // List of capabilities (e.g., ['research', 'data-mining'])
  requiredInputs: string[];      // Required input field names
  outputSchema: Record<string, {
    type: string;
    items?: Record<string, string>;
    description?: string;
  }>;                            // Expected output structure
  estimatedDuration?: string;    // Human-readable time estimate (e.g., '3-5 minutes')
  modelConfig?: {
    provider: 'openai' | 'anthropic';
    model: string;
    temperature?: number;
    maxTokens?: number;
  };
}
```

**Example Agent**:

```typescript
{
  id: 'journalist-researcher',
  name: 'Journalist Researcher',
  description: 'Researches and identifies relevant journalists based on topic and tier criteria',
  category: 'pr',
  capabilities: ['research', 'data-mining', 'relevance-scoring'],
  requiredInputs: ['topic'],
  outputSchema: {
    journalists: {
      type: 'array',
      items: {
        name: 'string',
        email: 'string',
        outlet: 'string',
        beat: 'string',
        relevanceScore: 'number'
      },
      description: 'List of journalists ranked by relevance to the topic'
    }
  },
  estimatedDuration: '3-5 minutes',
  modelConfig: {
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.3
  }
}
```

### Agent Categories

Agents are organized into four categories:

1. **PR Agents** (`category: 'pr'`)
   - Journalist research
   - Pitch generation
   - Media outlet analysis
   - Coverage tracking

2. **Content Agents** (`category: 'content'`)
   - Content brief generation
   - Topic clustering
   - Performance analysis
   - Content calendar creation

3. **SEO Agents** (`category: 'seo'`)
   - Keyword research
   - Competitor analysis
   - Opportunity identification
   - SERP analysis

4. **General Agents** (`category: 'general'`)
   - Data validation
   - Report generation
   - Cross-pillar analytics
   - Utility functions

### Agent Registry

In Sprint S3, agents are defined statically in `/api/v1/agents`:

```typescript
// apps/api/src/routes/agents/index.ts
const staticAgents: AgentDefinition[] = [
  {
    id: 'journalist-researcher',
    name: 'Journalist Researcher',
    // ... definition
  },
  {
    id: 'pitch-generator',
    name: 'Pitch Email Generator',
    // ... definition
  },
  // ... more agents
];
```

**S4+ Enhancement**: Agents will be stored in the database with versioning, custom agent creation UI, and marketplace for sharing agents.

---

## Task Lifecycle

### 1. Task Definition

A task is an instance of an agent being invoked with specific inputs:

```typescript
interface AgentTask {
  taskId: string;           // Unique task identifier
  agentId: string;          // Which agent to execute
  input: Record<string, unknown> | string;  // Task inputs
  context?: {               // Optional context from previous tasks
    [key: string]: unknown;
  };
  retryPolicy?: {
    maxAttempts: number;
    backoffMs: number;
  };
}
```

**Example Task**:

```typescript
{
  taskId: 'task-1a2b3c',
  agentId: 'journalist-researcher',
  input: {
    topic: 'enterprise AI',
    tier: 'tier1',
    minRelevanceScore: 0.7
  },
  retryPolicy: {
    maxAttempts: 3,
    backoffMs: 2000
  }
}
```

### 2. Task Execution (S4+)

When a task is executed, the runtime:

1. **Validates Input**: Checks that all `requiredInputs` are provided
2. **Normalizes Task**: Ensures task has all required fields via `normalizeAgentTask()`
3. **Retrieves Agent**: Loads agent definition from registry
4. **Prepares Context**: Merges task input with context from previous tasks
5. **Invokes LLM**: Calls the configured model (OpenAI/Anthropic) with agent-specific prompt
6. **Validates Output**: Ensures output matches `outputSchema`
7. **Stores Result**: Saves result with status, output, and metrics
8. **Handles Errors**: Implements retry logic if task fails

### 3. Task Result

After execution, a task produces an `AgentResult`:

```typescript
interface AgentResult {
  taskId: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  output?: Record<string, unknown>;  // Agent's output data
  error?: {
    code: string;
    message: string;
  };
  metrics?: {
    startTime: string;
    endTime: string;
    durationMs: number;
    tokensUsed?: number;
    cost?: number;
  };
}
```

**Example Result**:

```typescript
{
  taskId: 'task-1a2b3c',
  agentId: 'journalist-researcher',
  status: 'completed',
  output: {
    journalists: [
      {
        name: 'Jane Doe',
        email: 'jane@techcrunch.com',
        outlet: 'TechCrunch',
        beat: 'Enterprise Software',
        relevanceScore: 0.92
      },
      // ... more journalists
    ]
  },
  metrics: {
    startTime: '2025-01-15T10:00:00Z',
    endTime: '2025-01-15T10:03:42Z',
    durationMs: 222000,
    tokensUsed: 1500,
    cost: 0.045
  }
}
```

---

## Playbook Structure

### Playbook Template

A playbook is a reusable workflow template defined as a Directed Acyclic Graph (DAG) of agent tasks:

```typescript
interface PlaybookTemplate {
  id: string;
  name: string;
  description: string;
  category: 'pr' | 'content' | 'seo' | 'general';
  nodes: PlaybookNode[];         // Array of agent tasks
  expectedOutputs: string[];     // What this playbook produces
  estimatedDuration?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  isPublic: boolean;             // Can other orgs use this template?
}
```

### Playbook Node

Each node in a playbook represents an agent task with dependency information:

```typescript
interface PlaybookNode {
  id: string;                    // Unique node ID within playbook
  agentId: string;               // Which agent to execute
  label?: string;                // Human-readable label
  input: Record<string, unknown> | string;  // Node inputs (can reference previous outputs)
  dependsOn?: string[];          // Array of node IDs this node depends on
  condition?: {                  // Optional conditional execution
    nodeId: string;              // Check result of this node
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value: unknown;
  };
  retryPolicy?: {
    maxAttempts: number;
    backoffMs: number;
  };
}
```

**Example Playbook**:

```typescript
{
  id: 'playbook-pr-campaign',
  name: 'PR Campaign Launch',
  description: 'Automated workflow for launching a comprehensive PR campaign',
  category: 'pr',
  nodes: [
    {
      id: 'research-journalists',
      agentId: 'journalist-researcher',
      label: 'Research target journalists',
      input: {
        topic: '{{topic}}',      // Template variable
        tier: 'tier1'
      }
    },
    {
      id: 'generate-pitches',
      agentId: 'pitch-generator',
      label: 'Generate personalized pitches',
      input: {
        journalists: '{{research-journalists.output.journalists}}',  // Reference previous output
        topic: '{{topic}}',
        contentUrl: '{{contentUrl}}'
      },
      dependsOn: ['research-journalists']  // Must wait for journalist research
    },
    {
      id: 'send-emails',
      agentId: 'email-sender',
      label: 'Send pitch emails',
      input: {
        pitches: '{{generate-pitches.output.pitches}}'
      },
      dependsOn: ['generate-pitches'],
      condition: {                         // Only send if we have enough pitches
        nodeId: 'generate-pitches',
        operator: 'greaterThan',
        value: 3,
        field: 'output.pitches.length'
      }
    }
  ],
  expectedOutputs: ['journalist_list', 'pitch_emails', 'send_status'],
  estimatedDuration: '15-25 minutes',
  difficulty: 'intermediate',
  tags: ['pr', 'outreach', 'automation'],
  isPublic: true
}
```

### Dependency Graph

Playbook nodes form a DAG where:

- **No Cycles**: Circular dependencies are invalid (detected by `validatePlaybookShape()`)
- **Topological Order**: Nodes execute in dependency order (calculated by `calculateExecutionOrder()`)
- **Parallel Execution**: Independent nodes can run concurrently
- **Data Flow**: Output from one node becomes input to downstream nodes

**Example Execution Order**:

```
research-journalists (no dependencies, runs first)
         ↓
generate-pitches (depends on research-journalists)
         ↓
send-emails (depends on generate-pitches, conditional)
```

---

## Playbook Validation

Before execution, playbooks must be validated using `validatePlaybookShape()` from `@pravado/utils`:

```typescript
import { validatePlaybookShape } from '@pravado/utils';

const validation = validatePlaybookShape(playbook);

if (!validation.valid) {
  // validation.errors contains array of issues:
  // [
  //   { field: 'name', message: 'Playbook name is required' },
  //   { nodeId: 'node-2', field: 'agentId', message: 'Agent ID is required' },
  //   { message: 'Circular dependency detected: node-1 → node-2 → node-1' }
  // ]
}
```

### Validation Rules

1. **Required Fields**:
   - Playbook must have `name`
   - Each node must have `id`, `agentId`, and `input`

2. **No Circular Dependencies**:
   - Uses Depth-First Search to detect cycles
   - Example invalid: `node-A` depends on `node-B`, `node-B` depends on `node-A`

3. **Valid Dependency References**:
   - All node IDs in `dependsOn` must exist in the playbook
   - Cannot depend on self

4. **Unique Node IDs**:
   - No duplicate node IDs within a playbook

5. **Valid Agent References**:
   - All `agentId` values must exist in agent registry (S4+)

6. **Valid Input Templates**:
   - Template variables like `{{topic}}` must be provided at execution time
   - Output references like `{{node-1.output.field}}` must point to valid nodes (S4+)

### Validation API

Sprint S3 includes a validation endpoint:

```bash
POST /api/v1/playbooks/validate
Content-Type: application/json

{
  "playbook": {
    "id": "...",
    "name": "...",
    "nodes": [...]
  }
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "valid": true,
    "errors": [],
    "executionOrder": ["node-1", "node-2", "node-3"],
    "estimatedDuration": "15-25 minutes"
  }
}
```

---

## Execution Model (S4+)

### Playbook Execution

When a playbook is executed, it creates a `PlaybookExecution` record:

```typescript
interface PlaybookExecution {
  id: string;
  playbookId: string;
  orgId: string;
  userId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  input: Record<string, unknown>;      // Runtime variables (e.g., {topic: 'AI', contentUrl: '...'})
  results: Record<string, AgentResult>; // Map of nodeId → AgentResult
  startTime?: string;
  endTime?: string;
  error?: {
    code: string;
    message: string;
    nodeId?: string;  // Which node failed
  };
}
```

### Execution Steps

1. **Initialization**:
   - Create execution record with `status: 'pending'`
   - Validate playbook structure
   - Calculate execution order via topological sort
   - Substitute input variables in node templates

2. **Sequential/Parallel Execution**:
   - Execute nodes in topological order
   - Run independent nodes in parallel
   - Wait for all dependencies before starting a node
   - Pass outputs from completed nodes to dependent nodes

3. **Node Execution**:
   - Create `AgentTask` from `PlaybookNode`
   - Invoke agent with task inputs
   - Store `AgentResult` in execution record
   - Check for errors and apply retry policy

4. **Conditional Logic**:
   - Evaluate `condition` on each node
   - Skip node if condition is false
   - Mark node as `status: 'skipped'`

5. **Error Handling**:
   - On task failure:
     - Retry up to `maxAttempts` with exponential backoff
     - If all retries fail, mark execution as `failed`
     - Stop dependent nodes from executing
   - On execution failure:
     - Record which node failed
     - Preserve partial results
     - Allow manual retry or modification

6. **Completion**:
   - All nodes completed or skipped
   - Aggregate outputs from all nodes
   - Calculate total cost and duration
   - Mark execution as `completed`

### Execution Monitoring

Real-time execution status available via:

```bash
GET /api/v1/executions/:id
```

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "exec-123",
    "playbookId": "playbook-pr-campaign",
    "status": "running",
    "progress": {
      "total": 5,
      "completed": 2,
      "running": 1,
      "pending": 2,
      "failed": 0
    },
    "currentNode": {
      "id": "generate-pitches",
      "label": "Generate personalized pitches",
      "status": "running",
      "startTime": "2025-01-15T10:05:00Z"
    },
    "results": {
      "research-journalists": {
        "status": "completed",
        "output": { /* ... */ },
        "metrics": { /* ... */ }
      },
      "generate-pitches": {
        "status": "running"
      }
    }
  }
}
```

---

## Utility Functions

Sprint S3 provides utility functions in `@pravado/utils`:

### validatePlaybookShape()

Validates playbook structure and detects circular dependencies.

```typescript
function validatePlaybookShape(playbook: PlaybookTemplate): {
  valid: boolean;
  errors: Array<{
    nodeId?: string;
    field?: string;
    message: string;
  }>;
}
```

### calculateExecutionOrder()

Performs topological sort to determine node execution order.

```typescript
function calculateExecutionOrder(nodes: PlaybookNode[]): string[]
```

**Returns**: Array of node IDs in execution order

**Throws**: Error if circular dependency detected

**Example**:

```typescript
const nodes = [
  { id: 'A', dependsOn: [] },
  { id: 'B', dependsOn: ['A'] },
  { id: 'C', dependsOn: ['A'] },
  { id: 'D', dependsOn: ['B', 'C'] }
];

calculateExecutionOrder(nodes);
// Returns: ['A', 'B', 'C', 'D'] or ['A', 'C', 'B', 'D']
// (B and C can run in parallel after A)
```

### normalizeAgentTask()

Ensures task has all required fields with defaults.

```typescript
function normalizeAgentTask(task: Partial<AgentTask>): AgentTask
```

**Example**:

```typescript
const task = normalizeAgentTask({
  agentId: 'journalist-researcher',
  input: { topic: 'AI' }
});
// Returns: { taskId: '<uuid>', agentId: '...', input: {...}, context: {} }
```

### estimatePlaybookDuration()

Calculates estimated execution time based on agent durations and dependencies.

```typescript
function estimatePlaybookDuration(
  playbook: PlaybookTemplate,
  agents: AgentDefinition[]
): string
```

**Returns**: Human-readable estimate (e.g., "15-25 minutes")

**Example**:

```typescript
const estimate = estimatePlaybookDuration(playbook, agentRegistry);
// Returns: "15-25 minutes"
```

---

## Data Flow and Context Passing

### Template Variables

Playbook inputs use template variables:

```typescript
{
  input: {
    topic: '{{topic}}',           // Replaced at execution time
    tier: 'tier1'                  // Static value
  }
}
```

At execution, runtime variables are provided:

```typescript
const execution = executePlaybook(playbook, {
  topic: 'enterprise AI',
  contentUrl: 'https://example.com/blog/post'
});
```

### Output References

Nodes can reference outputs from previous nodes:

```typescript
{
  id: 'generate-pitches',
  input: {
    journalists: '{{research-journalists.output.journalists}}',
    topic: '{{topic}}'
  },
  dependsOn: ['research-journalists']
}
```

The runtime:
1. Waits for `research-journalists` to complete
2. Extracts `output.journalists` from its result
3. Injects it into `generate-pitches` input

### Context Object

Each task receives a `context` object with all previous outputs:

```typescript
{
  taskId: 'task-xyz',
  agentId: 'generate-pitches',
  input: { /* ... */ },
  context: {
    'research-journalists': {
      journalists: [/* ... */]
    }
  }
}
```

Agents can access context to make decisions or reference data.

---

## Agent Implementation (S4+)

### Agent Executor

Each agent will have an executor function:

```typescript
type AgentExecutor = (
  task: AgentTask,
  definition: AgentDefinition
) => Promise<AgentResult>;
```

**Example Implementation**:

```typescript
async function executeJournalistResearcher(
  task: AgentTask,
  definition: AgentDefinition
): Promise<AgentResult> {
  const { topic, tier } = task.input;

  // 1. Query database for journalists
  const journalists = await db
    .select()
    .from('journalists')
    .where('beat', 'ilike', `%${topic}%`);

  // 2. Use LLM to score relevance
  const prompt = `Given topic "${topic}", score these journalists by relevance...`;
  const llmResponse = await openai.chat.completions.create({
    model: definition.modelConfig.model,
    messages: [{ role: 'system', content: prompt }],
    temperature: definition.modelConfig.temperature
  });

  // 3. Parse and validate output
  const output = JSON.parse(llmResponse.choices[0].message.content);

  // 4. Return result
  return {
    taskId: task.taskId,
    agentId: definition.id,
    status: 'completed',
    output: output,
    metrics: {
      startTime: startTime.toISOString(),
      endTime: new Date().toISOString(),
      durationMs: Date.now() - startTime.getTime(),
      tokensUsed: llmResponse.usage.total_tokens,
      cost: calculateCost(llmResponse.usage)
    }
  };
}
```

### Agent Registry

Agents will be registered with their executors:

```typescript
const agentRegistry = new Map<string, AgentExecutor>();

agentRegistry.set('journalist-researcher', executeJournalistResearcher);
agentRegistry.set('pitch-generator', executePitchGenerator);
agentRegistry.set('keyword-researcher', executeKeywordResearcher);
// ... more agents
```

---

## Error Handling

### Retry Policies

Nodes can specify retry behavior:

```typescript
{
  id: 'send-emails',
  agentId: 'email-sender',
  retryPolicy: {
    maxAttempts: 3,
    backoffMs: 2000  // 2s, 4s, 8s exponential backoff
  }
}
```

### Error Types

1. **Validation Errors**: Invalid input, missing required fields
2. **Execution Errors**: LLM API failures, network errors
3. **Timeout Errors**: Agent exceeds expected duration
4. **Output Validation Errors**: Output doesn't match schema

### Fallback Strategies (S4+)

- **Retry with Backoff**: Exponential backoff for transient failures
- **Alternative Agent**: Try different agent for same task
- **Manual Intervention**: Pause execution, allow user to fix and resume
- **Graceful Degradation**: Mark task as partial success with warnings

---

## Performance Optimization (S4+)

### Parallel Execution

Independent nodes run concurrently:

```
         ┌──→ Node B ──┐
Node A ──┤             ├──→ Node D
         └──→ Node C ──┘
```

Nodes B and C execute in parallel after A completes.

### Caching

Cache agent results for:
- Identical inputs within same execution
- Frequently requested data (journalist lists, keyword research)
- Time-based TTL (e.g., SERP data valid for 24 hours)

### Streaming Outputs

For long-running agents:
- Stream partial results as they become available
- Update UI in real-time
- Allow cancellation mid-execution

---

## Security and Isolation

### Organization-Level Isolation

- All executions scoped to `org_id`
- Agents cannot access data from other orgs
- RLS policies enforced at database level

### Rate Limiting

- Per-org execution limits (e.g., 100 playbook runs/day)
- Per-agent rate limits to prevent abuse
- Cost tracking and budget alerts

### API Key Management

- Agents use org-specific API keys for external services
- Encrypted storage of credentials
- Audit log of all API calls

---

## Monitoring and Observability (S4+)

### Execution Metrics

Track for each execution:
- Total duration
- Per-node duration
- Token usage
- API costs
- Success/failure rates

### Analytics Dashboard

- Playbook performance over time
- Most-used agents
- Cost breakdown by pillar
- Failure rates and error patterns

### Alerting

- Execution failures
- Budget thresholds exceeded
- Unusual execution times
- API rate limit warnings

---

## Migration Path: S3 → S4+

### Sprint S3 (Current)

- ✅ Agent types defined (`AgentDefinition`, `AgentTask`, `AgentResult`)
- ✅ Playbook types defined (`PlaybookTemplate`, `PlaybookNode`)
- ✅ Validation utilities (`validatePlaybookShape`, `calculateExecutionOrder`)
- ✅ Static agent definitions (10 agents across categories)
- ✅ Static playbook templates (3 example playbooks)
- ✅ Validation API (`POST /api/v1/playbooks/validate`)
- ✅ UI pages for Agents and Playbooks with "Coming Soon" banners

### Sprint S4 Additions

- 🔄 Agent executor implementations
- 🔄 Playbook execution engine
- 🔄 Database tables: `playbook_executions`, `agent_tasks`
- 🔄 Execution API: `POST /api/v1/playbooks/:id/execute`, `GET /api/v1/executions/:id`
- 🔄 Real-time execution monitoring UI
- 🔄 Visual playbook editor (drag-and-drop)
- 🔄 Template variable substitution
- 🔄 Output reference resolution
- 🔄 Conditional logic evaluation
- 🔄 Retry policy implementation

### Sprint S5+ Enhancements

- 🔄 Agent marketplace (community-contributed agents)
- 🔄 Custom agent builder UI
- 🔄 Playbook versioning and rollback
- 🔄 A/B testing for playbooks
- 🔄 Scheduled playbook execution (cron-like)
- 🔄 Webhooks for execution events
- 🔄 Advanced analytics and cost optimization
- 🔄 Multi-org playbook sharing
- 🔄 Agent performance benchmarking

---

## Summary

Pravado's agent runtime system enables sophisticated multi-agent workflows:

- **Agents**: Specialized AI workers with defined capabilities and outputs
- **Tasks**: Discrete units of work with inputs, outputs, and metrics
- **Playbooks**: DAG-based workflows orchestrating multiple agents
- **Validation**: Comprehensive playbook validation before execution
- **Dependencies**: Topological execution order with parallel processing
- **Context Passing**: Output from one agent becomes input to the next
- **Error Handling**: Retry policies and graceful degradation

Sprint S3 provides the **foundation** (types, utilities, static data, validation). Sprint S4+ will implement the **execution runtime** (agent executors, playbook engine, monitoring, visual editor).

This architecture enables powerful automation across PR, Content, and SEO pillars while maintaining flexibility, observability, and organization-level security.
