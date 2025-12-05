# Memory System V2 — Contextual & Episodic Memory Layer

**Sprint S10**

## Overview

The Memory System V2 provides a comprehensive memory layer for AI agents within the Pravado playbook runtime. It enables agents to:

- Store and retrieve **semantic memories** (general knowledge and learned patterns)
- Record **episodic traces** of execution steps
- Assemble **contextual information** for agent decisions
- Link memories to cross-pillar entities (journalists, keywords, content items, etc.)
- Manage **token budgets** for efficient context assembly

This system is the foundation for contextual awareness and learning in multi-agent workflows.

---

## Architecture

### Components

1. **Memory Store** (`memoryStore.ts`)
   - Persists semantic memories to database
   - Records episodic traces for each playbook step execution
   - Links memories to external entities
   - Prunes expired or low-importance memories

2. **Memory Retrieval** (`memoryRetrieval.ts`)
   - Vector similarity search using pgvector (cosine similarity)
   - Semantic memory ranking by importance × similarity
   - Episodic trace retrieval for playbook runs
   - Full-text search fallback

3. **Context Assembler** (`contextAssembler.ts`)
   - Assembles complete context for agent step execution
   - Combines semantic memories, episodic traces, shared state, and collaboration context
   - Manages token budget to fit LLM context windows
   - Trims context intelligently when over budget

4. **Execution Engine Integration**
   - Automatically generates embeddings for step inputs/outputs
   - Saves episodic traces after each step execution
   - Conditionally saves semantic memories based on importance
   - Passes assembled context to agent step handlers

---

## Memory Types

### Semantic Memory

General knowledge and learned patterns that persist across playbook runs.

**Properties:**
- `type`: `"semantic"`
- `content`: Flexible JSON structure
- `embedding`: 1536-dimensional vector for similarity search
- `source`: `"step"` | `"user"` | `"agent"` | `"system"`
- `importance`: Score 0-1 for retrieval ranking
- `ttlSeconds`: Optional expiry time (null = permanent)

**Storage Trigger:**
- Step output includes `memoryWorthy: true`
- Step config includes `captureMemory: true`
- Importance score above threshold

**Example:**
```json
{
  "type": "semantic",
  "content": {
    "topic": "SEO best practices",
    "insights": ["Use semantic HTML", "Optimize meta descriptions"],
    "source": "keyword_research_step"
  },
  "importance": 0.85,
  "source": "step"
}
```

### Episodic Memory

Step-by-step execution traces recording what happened during a playbook run.

**Properties:**
- `runId`: Reference to playbook run
- `stepKey`: Key of the step that generated this trace
- `content`: Input, output, step type, timestamp
- `embedding`: Vector for similarity search
- `createdAt`: Timestamp

**Storage Trigger:**
- Automatically saved after every step execution

**Example:**
```json
{
  "stepKey": "research_keywords",
  "content": {
    "input": { "topic": "AI automation" },
    "output": { "keywords": ["ai", "automation", "machine learning"] },
    "stepType": "AGENT",
    "timestamp": "2025-01-16T10:30:00Z"
  }
}
```

---

## Retrieval Process

### Vector Similarity Search

1. **Generate embedding** for query (step input/output)
2. **Query database** using pgvector cosine distance operator (`<=>`)
3. **Calculate combined score**: `cosine_similarity × importance`
4. **Filter by minimum relevance** (default: 0.5)
5. **Sort by score** and return top N results

### Importance Scoring

Importance score (0-1) influences retrieval ranking:
- **0.0-0.3**: Low importance (transient data, logging)
- **0.4-0.6**: Medium importance (standard step outputs)
- **0.7-0.9**: High importance (key insights, decisions)
- **0.9-1.0**: Critical importance (major discoveries, errors)

### Recency Bias

When importance scores are equal, more recent memories rank higher.

---

## Context Assembly

The `ContextAssembler` builds comprehensive context for each agent step:

```typescript
{
  memories: AgentMemory[],           // Relevant semantic memories
  episodicTraces: EpisodicTrace[],   // Traces from current run
  sharedState: Record<string, any>,  // Accumulated state
  collaborationContext?: {           // S9 collaboration data
    messages: [...],
    escalationLevel: 'none' | ...
  },
  linkedEntities: {                  // Cross-pillar entities
    'journalist': [...],
    'keyword': [...],
    'content_item': [...]
  },
  tokenBudget: {
    total: 8000,
    used: 2400,
    remaining: 5600
  }
}
```

### Token Budget Management

- **Default budget**: 8000 tokens (~32000 characters)
- **Estimation**: 4 characters ≈ 1 token
- **Trimming strategy**:
  1. Remove least important semantic memories first
  2. Remove oldest episodic traces if still over budget
  3. Never trim shared state or collaboration context

---

## Memory Links

Memories can be linked to entities across Pravado pillars:

**Supported Entity Types:**
- `keyword` → SEO keywords
- `journalist` → PR journalists
- `content_item` → SEO content pieces
- `pr_list` → PR distribution lists

**Link Properties:**
- `memoryId`: UUID of memory
- `entityType`: Type of entity
- `entityId`: UUID of entity
- `weight`: Link strength (0+, default 1.0)

**Use Cases:**
- Link keyword research insights to specific keywords
- Link journalist outreach patterns to journalist profiles
- Link content performance data to content items

---

## Pruning Strategy

Memory pruning prevents database bloat and maintains quality:

### TTL-Based Pruning

Memories with `ttlSeconds` set are automatically pruned after expiry.

**Recommended TTLs:**
- Transient logging: 3600 (1 hour)
- Session data: 86400 (1 day)
- Weekly insights: 604800 (7 days)
- No TTL: Permanent memories

### Importance-Based Pruning

Memories below importance threshold can be pruned during cleanup:

```typescript
await memoryStore.pruneMemory(orgId, {
  expiredOnly: false,
  minImportance: 0.3,
  limit: 100
});
```

---

## API Endpoints

### Search Semantic Memory

```http
GET /api/v1/memory/search?q=keyword+research&limit=10
```

**Query Parameters:**
- `q`: Text search query
- `embedding`: JSON array of 1536 floats
- `limit`: Max results (default: 10, max: 100)
- `minRelevance`: Minimum relevance score (default: 0.5)
- `memoryType`: Filter by `semantic` or `episodic`

**Response:**
```json
{
  "success": true,
  "data": {
    "memories": [...],
    "relevance": [0.92, 0.87, 0.81, ...]
  }
}
```

### Get Run Memory Data

```http
GET /api/v1/playbook-runs/:id/memory
```

**Response:**
```json
{
  "success": true,
  "data": {
    "episodicTraces": [...]
  }
}
```

---

## Integration with Execution Runtime

### Automatic Memory Recording

The `PlaybookExecutionEngine` automatically:

1. **Before step execution:**
   - Assemble context using `ContextAssembler`
   - Pass context to step handler (for AGENT steps)

2. **After successful execution:**
   - Generate embedding for step output
   - Save episodic trace to `agent_episode_runs` table
   - Conditionally save semantic memory if:
     - Output includes `memoryWorthy: true`
     - Step config includes `captureMemory: true`

### Step Handler Integration

Agent step handlers receive assembled context:

```typescript
async function executeAgentStep(
  step: PlaybookStep,
  input: unknown,
  context: AssembledContext,
  coordinator?: CollaborationCoordinator
) {
  // Access relevant memories
  const relevantMemories = context.memories;

  // Access episodic traces from current run
  const previousSteps = context.episodicTraces;

  // Access linked entities
  const relatedJournalists = context.linkedEntities['journalist'] || [];

  // Execute agent logic with full context
  // ...
}
```

---

## UI — Memory Debug Tab

The playbook detail page includes a "Memory Debug" tab showing:

- **Episodic Traces Timeline**
  - Step key, creation timestamp
  - Trace content (input, output, step type)
  - Embedding dimensions

- **Run Statistics**
  - Total traces recorded
  - Memory count by type

**Access:**
1. Navigate to playbook detail page
2. Click "Debug Memory" button to run with memory tracking
3. Switch to "Memory Debug" tab

---

## Performance Notes

### Vector Indexing

- Uses pgvector HNSW index for fast approximate nearest neighbor search
- Index build time increases with dataset size
- Recommended: Periodic index maintenance for production databases

### Embedding Generation

- **Stub implementation** in S10: Returns random vectors
- **Production**: Integrate OpenAI `text-embedding-ada-002` or Anthropic embeddings
- **Cost**: ~$0.0001 per 1K tokens (OpenAI)

### Database Queries

- Memory retrieval queries include vector operations (potentially slow on large datasets)
- Combine with filters (`org_id`, `type`, `created_at`) for optimal performance
- Consider read replicas for high-traffic memory searches

---

## Future Enhancements

### Planned for Later Sprints

1. **Memory Consolidation**
   - Merge similar memories to reduce redundancy
   - Promote frequently-accessed memories to higher importance

2. **Long-Term Memory**
   - Archive old episodic traces to cold storage
   - Summary generation for long-running playbooks

3. **Cross-Run Learning**
   - Identify patterns across multiple playbook runs
   - Suggest optimizations based on historical data

4. **External Vector DB Integration**
   - Pinecone, Weaviate, or Qdrant for scale
   - Hybrid search (vector + metadata)

5. **Real Embedding API Integration**
   - Replace stub with OpenAI/Anthropic embeddings
   - Batch embedding generation for efficiency

---

## Troubleshooting

### Memory Not Being Retrieved

**Possible causes:**
- Embedding similarity too low (adjust `minRelevance`)
- No memories stored yet (check database)
- Importance score too low (increase importance when saving)

**Solution:**
```typescript
// Lower relevance threshold
const result = await memoryRetrieval.retrieveSemanticMemory(orgId, embedding, {
  minRelevance: 0.3
});
```

### Token Budget Exceeded

**Possible causes:**
- Too many episodic traces in current run
- Large shared state objects

**Solution:**
```typescript
// Trim context to fit budget
const trimmedContext = contextAssembler.trimContextToFit(context, 6000);
```

### Pruning Removes Important Memories

**Possible causes:**
- Importance threshold too high
- TTL set too short

**Solution:**
```typescript
// Increase importance for critical memories
await memoryStore.saveSemanticMemory(orgId, content, embedding, 0.9, 'system');
```

---

## References

- **Vector Search**: [pgvector documentation](https://github.com/pgvector/pgvector)
- **Embedding Models**: [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- **Context Assembly**: See `agent_memory_contextual_awareness.md`
- **Playbook Runtime**: See `ai_playbooks_runtime.md`
