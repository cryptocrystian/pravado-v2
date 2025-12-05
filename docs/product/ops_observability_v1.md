# Ops Observability V1 (Sprint S27)

## Purpose

Provides internal visibility into LLM usage, playbook execution, and queue health to enable safe operation and tuning of Pravado in later sprints (billing, pricing, performance optimization).

## Components

### 1. LLM Usage Ledger (Database)

**Table**: `llm_usage_ledger`

Append-only ledger tracking all LLM API calls.

**Schema**:
```sql
- id: UUID (Primary Key)
- org_id: UUID (nullable, references orgs)
- run_id: UUID (nullable, references playbook_runs)
- step_run_id: UUID (nullable, references playbook_step_runs)
- provider: TEXT (openai | anthropic | stub)
- model: TEXT
- tokens_prompt: INTEGER
- tokens_completion: INTEGER
- tokens_total: INTEGER
- cost_usd: NUMERIC(12,6) (nullable, for future pricing)
- latency_ms: INTEGER
- status: TEXT (success | error)
- error_code: TEXT (nullable)
- created_at: TIMESTAMPTZ
```

**Indexes**:
- `(org_id, created_at)` - Most common query pattern
- `(provider, created_at)` - Provider analytics
- `(run_id)` - Run association
- `(step_run_id)` - Step association
- `(status, created_at) WHERE status = 'error'` - Error tracking

**RLS**: Users can view entries for their org + system-wide entries (org_id IS NULL).

### 2. LLM Router Integration

**File**: `packages/utils/src/llmRouter.ts`

The LLM router now writes to the ledger after each call:
- Tracks all provider calls (OpenAI, Anthropic, stub)
- Captures tokens, latency, status, errors
- Associates with playbook runs/steps when available
- Best-effort writes (doesn't fail LLM requests if ledger write fails)

**Usage**:
```typescript
const router = new LlmRouter({
  provider: 'openai',
  openaiApiKey: env.LLM_OPENAI_API_KEY,
  supabase: supabaseClient,
  enableLedger: true, // default
});

await router.generate({
  userPrompt: 'Write a blog post about...',
  orgId: 'org-uuid',
  runId: 'run-uuid',
  stepRunId: 'step-run-uuid',
});
```

### 3. Ops Metrics Service

**File**: `apps/api/src/services/opsMetricsService.ts`

Provides aggregated metrics:

**`getOrgExecutionStats(orgId, period)`**:
- Run counts by state (queued, running, success, failed, canceled)
- Average runtime for successful runs
- Step failure counts by type (AGENT, DATA, BRANCH, API)

**`getQueueStats()`**:
- Pending job counts by type
- Average wait time for queued jobs
- Retry statistics (min, max, avg attempts)

**`getLlmUsageSummary(orgId, period)`**:
- Total tokens and calls
- Error rate per provider
- Token usage by provider/model
- Average latency statistics

**`getRecentFailures(orgId, limit)`**:
- Last N failed runs with playbook names
- Error messages and timestamps

### 4. Ops API Endpoints

**Base Path**: `/api/v1/ops`

**`GET /api/v1/ops/overview?period=24h|7d`**
- Requires authentication
- Returns org-scoped execution + LLM usage stats
- Includes recent failures

**`GET /api/v1/ops/queue`**
- Requires authentication
- Returns global queue stats (non-sensitive)

### 5. Ops Dashboard

**URL**: `/app/ops`

**Sections**:
1. **System Health Cards**:
   - Total Runs (24h) with success rate
   - Queue Pending with avg wait time
   - LLM Calls (24h) with error rate
   - Total Tokens (24h)

2. **LLM Usage by Provider**:
   - Table showing provider/model breakdown
   - Token counts, call counts, average latency

3. **Recent Failures**:
   - Last 10 failed runs
   - Playbook names and timestamps

## Key Metrics Exposed

### Execution Metrics
- Run counts by state over 24h / 7d
- Success rate percentage
- Average runtime for successful runs
- Step-level failure distribution by type

### LLM Metrics
- Total API calls and tokens used
- Error rate per provider
- Token distribution by provider/model
- Latency statistics (average, p50, p95 in future)

### Queue Metrics
- Pending job counts by type
- Average wait time for queued jobs
- Retry attempt distribution

## Usage (Internal Teams)

### For Product/Engineering:
- Monitor LLM provider performance and errors
- Identify step types with high failure rates
- Track queue health and processing times

### For Operations:
- Detect anomalies in error rates
- Monitor queue backlogs
- Ensure execution engine health

### For Finance (Future):
- Token usage for cost estimation
- Cost breakdown by provider/model
- Usage trends for budget planning

## Limitations

### Current Limitations:
1. **No Cost Calculation**: `cost_usd` field is NULL (pricing to be added in S28)
2. **No Sampling**: All LLM calls are logged (may need sampling at scale)
3. **In-Memory Queue**: Queue stats only available when API server is running
4. **No Alerting**: Metrics are on-demand only (no proactive alerts)
5. **No Historical Trends**: UI shows current period only (24h/7d)

### Provider-Specific Notes:
- **Stub Provider**: Logs fake token counts based on prompt/completion length
- **Real Providers**: Token counts come directly from provider responses
- **Latency**: End-to-end including network, not provider-reported values

## Future Enhancements (S28+)

### Sprint S28 - Billing & Pricing:
- Add cost calculation using provider pricing tables
- Populate `cost_usd` field in ledger
- Add cost breakdowns to dashboard
- Implement budget alerts

### Future Sprints:
- Sampling for high-volume scenarios
- Retention policies for ledger data
- Historical trend charts (weekly/monthly)
- Proactive alerting on error spikes
- Performance optimization (p50/p95 latencies)
- Export capabilities (CSV, JSON)
- Customer-facing usage dashboards (separate from ops)

## Technical Notes

### Performance Considerations:
- Indexes optimized for common query patterns (org + time)
- Ledger writes are best-effort (don't block LLM responses)
- Queue stats computed in-memory (fast)

### Security:
- All endpoints require authentication
- RLS enforces org-level data isolation
- System-wide metrics (queue) contain no sensitive data

### Deployment:
- Migration 34 must be run on database
- Supabase dependency added to `@pravado/utils`
- No environment variables required (uses existing Supabase config)

## Testing

Basic tests cover:
- Ops API endpoint authentication
- Metrics aggregation logic
- LLM ledger writes (unit tests with mocks)

Comprehensive end-to-end testing deferred to S28 when real usage patterns emerge.
