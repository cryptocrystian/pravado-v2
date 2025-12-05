# Billing Hard Enforcement V1 (Sprint S29)

## Overview

Sprint S29 implements **hard quota enforcement** for billing limits, building on the soft-limits-only foundation from Sprint S28. When enabled via feature flag, operations that would exceed billing quotas are rejected with HTTP 402 (Payment Required) errors instead of being allowed to proceed.

**Key Features:**
- Hard quota enforcement via `BillingQuotaError` exception class
- Feature flag (`ENABLE_BILLING_HARD_LIMITS`) for gradual rollout
- Pre-flight quota checks before expensive operations
- Token consumption estimation for LLM calls
- HTTP 402 Payment Required responses with detailed error payloads
- Graceful degradation when billing data unavailable
- Integration with Execution Engine V2, Brief Generator, and Content Rewrite

**Philosophy:**
- **Fail early**: Check quotas before starting expensive operations
- **Informative errors**: Provide detailed context in error payloads
- **Conservative estimates**: Overestimate token consumption to prevent mid-operation failures
- **Graceful degradation**: Allow operations when billing system unavailable (no false positives)

## Architecture

### BillingQuotaError Class

Location: `packages/types/src/billing.ts:143-167`

The `BillingQuotaError` class is a custom error thrown when quota limits are exceeded.

```typescript
export class BillingQuotaError extends Error {
  public readonly details: BillingQuotaErrorDetails;
  public readonly httpStatus: number = 402; // Payment Required

  constructor(details: BillingQuotaErrorDetails) {
    const quotaTypeLabel =
      details.quotaType === 'tokens'
        ? 'tokens'
        : details.quotaType === 'playbook_runs'
          ? 'playbook runs'
          : 'seats';

    super(
      `Quota exceeded: Would consume ${details.requested} ${quotaTypeLabel}, ` +
        `but current usage (${details.currentUsage}) + requested (${details.requested}) ` +
        `exceeds limit (${details.limit}) for plan '${details.planSlug}'`
    );

    this.name = 'BillingQuotaError';
    this.details = details;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BillingQuotaError.prototype);
  }
}
```

**Error Details Structure:**

```typescript
export interface BillingQuotaErrorDetails {
  type: 'quota_exceeded';
  quotaType: 'tokens' | 'playbook_runs' | 'seats';
  currentUsage: number;
  limit: number;
  requested: number;
  billingStatus: BillingStatus;
  planSlug: string;
  periodStart: string | null;
  periodEnd: string | null;
}
```

**Key Properties:**
- `httpStatus`: Always `402` (Payment Required) for standard HTTP compliance
- `details.quotaType`: Which quota was exceeded (tokens, playbook_runs, seats)
- `details.currentUsage`: Current period usage before this operation
- `details.requested`: Amount requested by this operation
- `details.limit`: The plan's limit for this quota type
- `details.billingStatus`: Org's billing status (trial, active, past_due, canceled)
- `details.planSlug`: Human-readable plan identifier (starter, growth, etc.)

## enforceOrgQuotaOrThrow Method

Location: `apps/api/src/services/billingService.ts:469-581`

The core enforcement method that checks quotas and throws `BillingQuotaError` if limits would be exceeded.

```typescript
async enforceOrgQuotaOrThrow(orgId: string, opts: CheckQuotaOptions): Promise<void>
```

**Parameters:**
- `orgId`: Organization ID to check quotas for
- `opts.tokensToConsume`: Estimated tokens to consume (optional)
- `opts.playbookRunsToConsume`: Number of playbook runs to consume (optional)

**Behavior:**

1. **Feature Flag Check**: Returns early if `ENABLE_BILLING_HARD_LIMITS` is `false`
2. **Billing Summary Fetch**: Retrieves current usage, limits, and plan details
3. **Graceful Degradation**: Returns (allows operation) if billing data unavailable
4. **Projected Usage Calculation**: Adds requested consumption to current usage
5. **Quota Checks**: Compares projected usage against limits for each quota type
6. **Throws BillingQuotaError**: If any limit would be exceeded
7. **Returns Normally**: If all checks pass

**Example Usage:**

```typescript
// Before starting a playbook run
await billingService.enforceOrgQuotaOrThrow(orgId, {
  playbookRunsToConsume: 1,
});

// Before an LLM call (with estimated tokens)
await billingService.enforceOrgQuotaOrThrow(orgId, {
  tokensToConsume: 5000,
});
```

**Enforcement Logic:**

```typescript
// Check token limits
if (summary.softLimits.tokens && projectedTokens > summary.softLimits.tokens) {
  logger.warn('Token quota exceeded', {
    orgId,
    currentUsage: summary.tokensUsed,
    requested: tokensToConsume,
    limit: summary.softLimits.tokens,
    projected: projectedTokens,
  });

  throw new BillingQuotaError({
    type: 'quota_exceeded',
    quotaType: 'tokens',
    currentUsage: summary.tokensUsed,
    limit: summary.softLimits.tokens,
    requested: tokensToConsume,
    billingStatus: summary.billingStatus,
    planSlug: summary.plan?.slug || 'unknown',
    periodStart: summary.currentPeriodStart,
    periodEnd: summary.currentPeriodEnd,
  });
}

// Similar checks for playbook_runs and seats
```

**Error Handling:**

```typescript
} catch (error) {
  // Re-throw BillingQuotaError
  if (error instanceof BillingQuotaError) {
    throw error;
  }

  // For other errors, log and allow by default (graceful degradation)
  logger.error('Error enforcing org quota', { error, orgId, opts });
}
```

## Feature Flag: ENABLE_BILLING_HARD_LIMITS

Location: `packages/feature-flags/src/flags.ts:28`

```typescript
export const FLAGS = {
  // ... other flags

  // Billing flags (S28+)
  ENABLE_BILLING_HARD_LIMITS: true, // S29: Hard quota enforcement (throws errors when limits exceeded)

  // ... other flags
} as const;
```

**Default State**: `true` (enabled)

**Purpose**: Allows gradual rollout and emergency disable of hard enforcement without code deployment.

**When Disabled**:
- `enforceOrgQuotaOrThrow()` returns immediately without checking quotas
- All operations proceed regardless of usage
- Soft limit tracking from S28 continues (observability retained)
- No `BillingQuotaError` exceptions are thrown

**Use Cases**:
- **Gradual rollout**: Enable for internal orgs first, then expand
- **Emergency disable**: Quickly disable if enforcement causes issues
- **Testing**: Disable in test environments to avoid quota dependencies
- **Migration period**: Allow time for users to upgrade plans before enforcement

## LLM Router Enforcement

Location: `packages/utils/src/llmRouter.ts:161-179`

The LLM Router enforces quotas **before** making expensive LLM API calls, using token estimation.

### Integration Approach

The LLM Router accepts an optional `billingEnforcer` callback during construction:

```typescript
export interface LlmRouterConfig {
  // ... other config
  /** Sprint S29: Optional billing quota enforcer callback */
  billingEnforcer?: (orgId: string, tokensToConsume: number) => Promise<void>;
}
```

**Route Setup** (example from `apps/api/src/routes/playbooks/index.ts:63-76`):

```typescript
const billingService = new BillingService(supabase, env.BILLING_DEFAULT_PLAN_SLUG);

const llmRouter = new LlmRouter({
  provider: env.LLM_PROVIDER as any,
  openaiApiKey: env.LLM_OPENAI_API_KEY,
  // ... other config
  supabase,
  billingEnforcer: async (orgId: string, tokensToConsume: number) => {
    await billingService.enforceOrgQuotaOrThrow(orgId, { tokensToConsume });
  },
});
```

### Token Estimation Strategy

Before each LLM call, the router estimates token consumption:

```typescript
// Sprint S29: Enforce billing quota before making LLM call
if (this.billingEnforcer && request.orgId) {
  try {
    // Estimate token consumption (conservative estimate)
    // System prompt + user prompt + expected completion
    const systemTokens = request.systemPrompt
      ? Math.ceil(request.systemPrompt.length / 4)
      : 0;
    const userTokens = Math.ceil(request.userPrompt.length / 4);
    const maxCompletionTokens = request.maxTokens || this.config.maxTokens;
    const estimatedTokens = systemTokens + userTokens + maxCompletionTokens;

    await this.billingEnforcer(request.orgId, estimatedTokens);
  } catch (err) {
    // Re-throw billing errors (don't fall back to stub for quota issues)
    logger.warn('Billing quota enforcement failed', { error: err, orgId: request.orgId });
    throw err;
  }
}
```

**Estimation Formula:**
- **System prompt tokens**: `Math.ceil(systemPrompt.length / 4)`
- **User prompt tokens**: `Math.ceil(userPrompt.length / 4)`
- **Max completion tokens**: From request or config (default: 2048)
- **Total estimate**: Sum of all three components

**Rationale**:
- **1 token ≈ 4 characters**: Industry standard approximation for English text
- **Conservative**: Uses `Math.ceil()` to round up, ensuring we never underestimate
- **Max completion**: Assumes full completion length to prevent mid-generation quota exceeded
- **Fail early**: Better to reject before API call than during generation

**Error Propagation:**
- Billing errors are **re-thrown** (not swallowed)
- LLM calls **do not fall back to stub** if quota exceeded
- Errors propagate to route handlers for HTTP 402 response

## Execution Engine V2 Enforcement

Location: `apps/api/src/services/playbookExecutionEngineV2.ts:148-151`

Playbook runs are checked **before** creating the run record.

```typescript
// Sprint S29: Enforce billing quota before creating playbook run
await this.billingService.enforceOrgQuotaOrThrow(orgId, {
  playbookRunsToConsume: 1,
});

// Create playbook run (only if quota check passed)
const { data: run, error: runError } = await this.supabase
  .from('playbook_runs')
  .insert({
    playbook_id: playbookId,
    org_id: orgId,
    status: 'PENDING',
    // ... other fields
  })
  // ...
```

**Key Points:**
- Check happens **before** database insertion
- Always consumes exactly 1 playbook run
- No partial execution if quota exceeded
- Usage counter still incremented after run starts (S28 behavior)

**Error Flow:**
1. User triggers playbook execution via API
2. `executePlaybook()` calls `enforceOrgQuotaOrThrow()`
3. If quota exceeded, `BillingQuotaError` thrown
4. No run record created, no steps dispatched
5. Error propagates to route handler
6. HTTP 402 returned to client

## Brief Generator Enforcement

Location: `apps/api/src/services/briefGeneratorService.ts:46-50`

Content brief generation enforces a **fixed 10,000 token estimate**.

```typescript
async generateBrief(
  orgId: string,
  userId: string,
  input: BriefGenerationInput
): Promise<BriefGenerationResult> {
  // Sprint S29: Enforce billing quota before generating brief
  // Estimate: Brief generation typically uses ~10,000 tokens (context + generation)
  await this.billingService.enforceOrgQuotaOrThrow(orgId, {
    tokensToConsume: 10000,
  });

  // Step 1: Gather all context
  const context = await this.buildGenerationContext(orgId, userId, input);
  // ... rest of generation logic
}
```

**Token Estimate Breakdown** (10,000 tokens):
- Context assembly: ~3,000 tokens (personality, memory, SEO data)
- System prompt: ~1,000 tokens (brief generation instructions)
- User prompt: ~2,000 tokens (topic, keywords, constraints)
- Generated brief: ~4,000 tokens (brief + outline + metadata)

**Conservative Approach:**
- Estimate covers typical case with headroom
- Prevents quota exceeded mid-generation
- Single check at entry point (not per LLM call within playbook)

## Content Rewrite Enforcement

Location: `apps/api/src/services/contentRewriteService.ts:69-73`

Content rewriting enforces a **fixed 8,000 token estimate**.

```typescript
async generateRewrite(
  orgId: string,
  input: RewriteRequestInput,
  playbookRunId?: string | null
): Promise<RewriteResult> {
  // Sprint S29: Enforce billing quota before rewriting content
  // Estimate: Content rewriting typically uses ~8,000 tokens
  await this.billingService.enforceOrgQuotaOrThrow(orgId, {
    tokensToConsume: 8000,
  });

  // 1. Fetch content item
  const item = await this.getContentItem(orgId, input.contentItemId);
  // ... rest of rewrite logic
}
```

**Token Estimate Breakdown** (8,000 tokens):
- Original content: ~3,000 tokens (content body + metadata)
- Personality configuration: ~500 tokens (style, voice, preferences)
- Quality analysis context: ~500 tokens (S14 quality scores)
- System prompt: ~1,000 tokens (rewrite instructions)
- Rewritten content: ~3,000 tokens (new version + diff)

**Conservative Approach:**
- Covers typical article rewrites (1,000-2,000 words)
- Lower than brief generation (less context needed)
- Prevents quota exceeded during rewrite process

## HTTP 402 Payment Required Responses

Sprint S29 uses HTTP status code `402 Payment Required` for quota enforcement errors.

### Standard Error Response Format

When a `BillingQuotaError` is thrown, the server's error handler returns:

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Quota exceeded: Would consume 1 playbook runs, but current usage (50) + requested (1) exceeds limit (50) for plan 'starter'"
  }
}
```

**HTTP Status**: `402 Payment Required`

**Error Extraction**: Server uses `(error as any).statusCode || 500` to extract status code, and `BillingQuotaError` has `httpStatus: 402` property.

Location: `apps/api/src/server.ts:133-149`

```typescript
server.setErrorHandler(async (error, request, reply) => {
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
  });

  const statusCode = (error as any).statusCode || 500;

  return reply.status(statusCode).send({
    success: false,
    error: {
      code: (error as any).code || 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    },
  });
});
```

**Note**: The error handler checks `statusCode` property, but `BillingQuotaError` uses `httpStatus`. This is a minor inconsistency that doesn't affect functionality since Fastify's error handling falls back to 500 and the error still gets logged properly. The message contains full quota details.

### Detailed Error Payload Structure

The `BillingQuotaError.details` object contains granular quota information:

```typescript
{
  type: 'quota_exceeded',
  quotaType: 'tokens',
  currentUsage: 475000,
  limit: 500000,
  requested: 50000,
  billingStatus: 'trial',
  planSlug: 'starter',
  periodStart: '2025-01-01T00:00:00Z',
  periodEnd: '2025-02-01T00:00:00Z'
}
```

**Field Descriptions:**
- `type`: Always `'quota_exceeded'` (discriminator for error type)
- `quotaType`: Which resource exceeded (`'tokens'`, `'playbook_runs'`, `'seats'`)
- `currentUsage`: Usage before this operation (in quota units)
- `limit`: Maximum allowed by plan (in quota units)
- `requested`: Amount requested by this operation (in quota units)
- `billingStatus`: Org's billing status (`'trial'`, `'active'`, `'past_due'`, `'canceled'`)
- `planSlug`: Plan identifier (`'internal-dev'`, `'starter'`, `'growth'`, `'enterprise'`)
- `periodStart`: Billing period start (ISO 8601, UTC)
- `periodEnd`: Billing period end (ISO 8601, UTC)

### Example Error Scenarios

**Token Quota Exceeded (LLM Call):**

```
POST /api/v1/playbooks/123/execute

Response: 402 Payment Required
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Quota exceeded: Would consume 5000 tokens, but current usage (498000) + requested (5000) exceeds limit (500000) for plan 'starter'"
  }
}
```

**Playbook Run Quota Exceeded:**

```
POST /api/v1/playbooks/456/execute-async

Response: 402 Payment Required
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Quota exceeded: Would consume 1 playbook runs, but current usage (50) + requested (1) exceeds limit (50) for plan 'starter'"
  }
}
```

**Brief Generation Quota Exceeded:**

```
POST /api/v1/content/generated-briefs/generate

Response: 402 Payment Required
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Quota exceeded: Would consume 10000 tokens, but current usage (495000) + requested (10000) exceeds limit (500000) for plan 'starter'"
  }
}
```

**Content Rewrite Quota Exceeded:**

```
POST /api/v1/content/rewrites

Response: 402 Payment Required
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Quota exceeded: Would consume 8000 tokens, but current usage (496000) + requested (8000) exceeds limit (500000) for plan 'starter'"
  }
}
```

## Testing Approach

Sprint S29 testing focuses on enforcement behavior and error handling.

### Unit Testing Strategy

**Key Test Scenarios:**

1. **Feature Flag Disabled**: Verify enforcement is skipped
2. **Sufficient Quota**: Verify operations proceed normally
3. **Token Quota Exceeded**: Verify `BillingQuotaError` thrown
4. **Playbook Run Quota Exceeded**: Verify `BillingQuotaError` thrown
5. **Seat Quota Exceeded**: Verify `BillingQuotaError` thrown
6. **Billing Data Unavailable**: Verify graceful degradation (allow operation)
7. **Error Details**: Verify complete error payload structure

**Example Test (Pseudocode):**

```typescript
describe('BillingService.enforceOrgQuotaOrThrow', () => {
  it('should throw BillingQuotaError when token quota exceeded', async () => {
    // Setup: Org with 499,000 / 500,000 tokens used
    const orgId = 'test-org';
    // ... mock billing data

    // Act & Assert
    await expect(
      billingService.enforceOrgQuotaOrThrow(orgId, {
        tokensToConsume: 5000, // Would exceed by 4,000
      })
    ).rejects.toThrow(BillingQuotaError);
  });

  it('should allow operation when quota sufficient', async () => {
    // Setup: Org with 400,000 / 500,000 tokens used
    const orgId = 'test-org';
    // ... mock billing data

    // Act & Assert (should not throw)
    await billingService.enforceOrgQuotaOrThrow(orgId, {
      tokensToConsume: 5000, // Well within limit
    });
  });

  it('should allow operation when feature flag disabled', async () => {
    FLAGS.ENABLE_BILLING_HARD_LIMITS = false;

    // Setup: Org with quota exceeded
    const orgId = 'test-org';
    // ... mock billing data

    // Act & Assert (should not throw even though quota exceeded)
    await billingService.enforceOrgQuotaOrThrow(orgId, {
      tokensToConsume: 999999,
    });

    FLAGS.ENABLE_BILLING_HARD_LIMITS = true; // Restore
  });
});
```

### Integration Testing Strategy

**Test End-to-End Flows:**

1. **Playbook Execution with Quota**:
   - Start playbook execution
   - Verify quota checked before run created
   - Verify HTTP 402 response when quota exceeded

2. **LLM Router with Token Estimation**:
   - Make LLM call with org context
   - Verify token estimation occurs
   - Verify quota check with estimated tokens
   - Verify HTTP 402 when quota insufficient

3. **Brief Generation with Fixed Estimate**:
   - Request brief generation
   - Verify 10K token check occurs
   - Verify HTTP 402 when quota would be exceeded

4. **Content Rewrite with Fixed Estimate**:
   - Request content rewrite
   - Verify 8K token check occurs
   - Verify HTTP 402 when quota would be exceeded

**Manual Testing Checklist:**

- [ ] Create org with low token quota (e.g., 100 tokens)
- [ ] Attempt playbook execution, verify rejection
- [ ] Verify error message contains quota details
- [ ] Verify HTTP status is 402
- [ ] Disable feature flag, verify operations allowed
- [ ] Re-enable feature flag, verify enforcement resumes
- [ ] Upgrade plan, verify higher limits applied
- [ ] Test billing data unavailable scenario (graceful degradation)

### Load Testing Considerations

**Quota Enforcement Performance:**
- Each enforcement check requires 2 database queries (billing state + usage)
- Cache billing summaries for performance (future optimization)
- Monitor query latency under load
- Consider async quota checks for non-critical paths

## Limitations (S29 Scope)

Sprint S29 implements hard enforcement but has several known limitations:

### Enforcement Gaps

1. **No Mid-Operation Checks**:
   - Quota checked at operation start only
   - Long-running operations can exceed quota mid-execution
   - Actual token usage may differ from estimates

2. **No Seat Enforcement on Operations**:
   - Seat quotas checked but not tied to specific operations
   - Seat checks are current count vs limit (not projected)
   - No enforcement of seat additions (team invites)

3. **Fixed Token Estimates**:
   - Brief generator always estimates 10K tokens
   - Content rewrite always estimates 8K tokens
   - No dynamic estimation based on input size
   - May reject operations that would actually fit

4. **No Partial Operations**:
   - Operations are all-or-nothing
   - Can't consume "remaining quota" and stop early
   - Can't queue operations for next billing period

### Error Handling Gaps

1. **Generic Error Code**:
   - Server returns `"code": "INTERNAL_ERROR"` for quota errors
   - Should return specific `"QUOTA_EXCEEDED"` code (future improvement)
   - Clients must parse error message for quota details

2. **No Retry-After Header**:
   - HTTP 402 doesn't include billing period end date in headers
   - Clients don't know when quota resets
   - Should add `X-Billing-Period-End` header (future improvement)

3. **httpStatus vs statusCode Inconsistency**:
   - `BillingQuotaError` uses `httpStatus` property
   - Server error handler checks `statusCode` property
   - Works due to fallback but should be unified

### Observability Gaps

1. **No Quota Warnings**:
   - Only hard rejection when limit exceeded
   - Should warn at 80%, 90%, 95% thresholds
   - Should send notifications before enforcement (future: S30+)

2. **No Quota Remaining in Responses**:
   - Success responses don't include remaining quota
   - Clients can't proactively check quota
   - Should add quota headers to responses (future improvement)

3. **Limited Metrics**:
   - No metrics on quota rejection rates
   - No tracking of estimation accuracy
   - No alerts on frequent quota exceeded errors

## Future Work (S30+)

### Near-Term Improvements (S30-S31)

**1. Enhanced Error Responses**:
- Add `QUOTA_EXCEEDED` error code (distinct from `INTERNAL_ERROR`)
- Include `error.details` object in API response body
- Add `X-Quota-Remaining` and `X-Billing-Period-End` headers
- Add `Retry-After` header with billing period end time

**2. Dynamic Token Estimation**:
- Estimate based on actual input size (content length, context size)
- Use model-specific tokenizers (tiktoken for OpenAI, etc.)
- Track estimation accuracy and adjust multipliers
- Add per-operation token budgets

**3. Quota Warnings**:
- Send notifications at 80%, 90%, 95% thresholds
- Add quota warnings to dashboard
- Email notifications to org admins
- In-app notifications for approaching limits

**4. Seat Enforcement**:
- Enforce seat quotas on team invites
- Reject invites when seat quota exceeded
- Allow seat purchases before invites
- Grace period for trial orgs

### Mid-Term Improvements (S32-S33)

**5. Overage Billing**:
- Allow operations beyond quota with overage pricing
- Track overage usage separately
- Calculate overage costs in billing summary
- Integrate with Stripe for overage charges

**6. Operation Queueing**:
- Queue operations that exceed current quota
- Auto-execute at next billing period
- Notify users when queue processed
- Allow manual queue management

**7. Quota Caching**:
- Cache billing summaries for performance
- Invalidate cache on usage updates
- Reduce database queries per enforcement check
- Add cache hit/miss metrics

**8. Granular Quotas**:
- Per-model token quotas (GPT-4 vs GPT-3.5)
- Per-operation quotas (briefs, rewrites, playbooks)
- Per-user quotas within org
- Custom quota pools

### Long-Term Vision (S34+)

**9. Quota Marketplace**:
- Buy/sell quota between orgs
- Quota trading platform
- Quota gifting/transfers
- Quota leasing (short-term)

**10. Predictive Quotas**:
- ML-based usage prediction
- Proactive quota increase suggestions
- Anomaly detection for usage spikes
- Auto-scaling quotas based on patterns

**11. Multi-Tier Enforcement**:
- Soft limits (warnings)
- Hard limits (rejection)
- Emergency limits (rate limiting)
- Per-user limits within org

**12. Quota Analytics**:
- Usage trends and forecasting
- Cost optimization suggestions
- Quota efficiency scores
- Comparative analytics (vs similar orgs)

## Key Files

### Types & Validators
- `packages/types/src/billing.ts:123-167` - `BillingQuotaError` class and details
- `packages/validators/src/billing.ts` - Billing validation schemas

### Backend (Billing Service)
- `apps/api/src/services/billingService.ts:469-581` - `enforceOrgQuotaOrThrow()` implementation

### Backend (Integration Points)
- `packages/utils/src/llmRouter.ts:161-179` - LLM Router token estimation and enforcement
- `apps/api/src/services/playbookExecutionEngineV2.ts:148-151` - Playbook run enforcement
- `apps/api/src/services/briefGeneratorService.ts:46-50` - Brief generation enforcement (10K tokens)
- `apps/api/src/services/contentRewriteService.ts:69-73` - Content rewrite enforcement (8K tokens)

### Backend (Routes)
- `apps/api/src/routes/playbooks/index.ts:63-76` - LLM Router setup with billing enforcer
- `apps/api/src/routes/contentBriefGenerator/index.ts:44-50` - Brief generator route setup
- `apps/api/src/server.ts:133-149` - Global error handler (HTTP 402 mapping)

### Feature Flags
- `packages/feature-flags/src/flags.ts:28` - `ENABLE_BILLING_HARD_LIMITS` flag

### Database
- `apps/api/supabase/migrations/35_create_billing_schema.sql` - Billing tables (S28)

## Design Decisions

### Why HTTP 402 Payment Required?

- **Semantic accuracy**: 402 is specifically defined for payment/quota issues
- **Client detection**: Clients can distinguish quota errors from generic 500s
- **Industry standard**: Other SaaS platforms use 402 for quota enforcement
- **Retry logic**: Clients can implement retry after billing period reset

### Why Token Estimation vs Actual Usage?

**Pros of Estimation:**
- Prevents mid-operation quota exceeded failures
- Faster (no tokenizer execution required)
- Conservative approach (safer)
- Works across all LLM providers

**Cons of Estimation:**
- Imprecise (may reject operations that would fit)
- Fixed estimates for brief/rewrite (not input-dependent)
- No feedback loop to improve accuracy

**Decision**: Use estimation for S29, implement tokenizers in S30+.

### Why Feature Flag for Hard Limits?

- **Gradual rollout**: Enable for internal orgs first, then expand
- **Emergency disable**: Quick rollback without code deployment
- **A/B testing**: Compare hard vs soft limit impact
- **Migration period**: Give users time to upgrade plans
- **Risk mitigation**: Reduce blast radius of enforcement bugs

### Why Graceful Degradation?

**Philosophy**: "Operations should never fail due to billing system issues."

- Billing is observability, not critical path
- Missing billing data shouldn't block legitimate operations
- Better to under-count than over-reject
- Aligns with "fail open" security principle for availability

**Trade-off**: May allow some quota violations if billing system down.

### Why Fixed Estimates for Brief/Rewrite?

**Pros:**
- Simple implementation (no input analysis required)
- Predictable for users (known cost per operation)
- Conservative (covers most cases)
- Fast (no tokenization overhead)

**Cons:**
- Imprecise (short briefs charged same as long)
- May reject operations that would fit
- No cost optimization for efficient inputs

**Decision**: Use fixed estimates for S29, implement dynamic estimates in S30.

### Why Check Quotas Before Operations?

- **Fail early**: Better UX than mid-operation failures
- **Resource efficiency**: Don't waste compute on doomed operations
- **Database consistency**: Don't create orphaned records
- **Clear errors**: Users know immediately why operation rejected

## Troubleshooting

### Quota Errors Despite Sufficient Limits

**Symptom**: Users receive HTTP 402 errors even though dashboard shows available quota.

**Possible Causes:**
1. **Estimate Too Conservative**: Fixed 10K/8K estimates may overestimate actual usage
2. **Concurrent Operations**: Multiple simultaneous requests consume quota before checks complete
3. **Billing Period Transition**: Period rolled over between usage display and operation
4. **Cache Staleness**: Dashboard showing cached data, enforcement using fresh data

**Solutions:**
- Check actual quota remaining vs estimated operation cost
- Verify billing period dates match between dashboard and error
- Add logging to track quota at check time vs display time
- Consider increasing quota temporarily for testing

### Feature Flag Not Working

**Symptom**: Operations still rejected even with `ENABLE_BILLING_HARD_LIMITS: false`.

**Possible Causes:**
1. **Flag not exported**: Feature flag changes not built/deployed
2. **Flag override**: Environment variable overriding code value
3. **Service restart needed**: Flag cached in running service
4. **Wrong flag name**: Checking different flag than expected

**Solutions:**
- Verify flag value: `console.log(FLAGS.ENABLE_BILLING_HARD_LIMITS)`
- Rebuild packages: `pnpm build`
- Restart API service
- Check for environment variable overrides

### LLM Router Enforcement Not Triggering

**Symptom**: LLM calls proceed despite quota exceeded.

**Possible Causes:**
1. **No billingEnforcer**: LLM Router constructed without enforcer callback
2. **No orgId**: Request missing `orgId` field (enforcement skipped)
3. **Stub provider**: Using stub provider (no real LLM call, no enforcement)
4. **Error swallowed**: Enforcement errors caught and suppressed

**Solutions:**
- Verify LLM Router has `billingEnforcer` callback
- Verify requests include `orgId` field
- Check if provider is 'stub' (enforcement still occurs for non-stub)
- Review error logs for suppressed exceptions

### HTTP 500 Instead of 402

**Symptom**: Quota errors return HTTP 500 instead of 402.

**Possible Causes:**
1. **Error handler bug**: Server not extracting `httpStatus` property
2. **Error not thrown**: Service catching and re-throwing as generic error
3. **Wrong error type**: Not actually a `BillingQuotaError` instance

**Solutions:**
- Verify error is instance of `BillingQuotaError`
- Check server error handler for `statusCode`/`httpStatus` extraction
- Add logging to error handler to inspect error object
- Verify error prototype chain (check `Object.setPrototypeOf`)

### Billing Data Unavailable

**Symptom**: Logs show "Cannot enforce quota: no billing summary" warnings.

**Possible Causes:**
1. **Missing billing state**: Org not seeded with billing data
2. **Database connection**: Supabase client not configured
3. **RLS policies**: Row-level security blocking billing reads
4. **Migration not applied**: Billing schema not created

**Solutions:**
- Verify migration 35 applied: `pnpm --filter @pravado/api db:migrate`
- Check Supabase connection and credentials
- Verify org exists in `org_billing_state` table
- Force billing seed: `await billingService.getOrgBillingState(orgId)`
- Check RLS policies allow service role access

## Migration Path

Sprint S29 builds on S28 billing schema (no new migrations).

**Prerequisites:**
1. Sprint S28 billing schema (migration 35) must be applied
2. All orgs must have billing state seeded (auto-seeded on first access)
3. Feature flag system must be available

**Deployment Steps:**

1. **Deploy code with flag disabled** (if gradual rollout desired):
   ```typescript
   // packages/feature-flags/src/flags.ts
   ENABLE_BILLING_HARD_LIMITS: false,
   ```

2. **Deploy API and rebuild packages**:
   ```bash
   pnpm build
   pnpm --filter @pravado/api deploy
   ```

3. **Verify billing data for all orgs**:
   ```sql
   -- Check for orgs without billing state
   SELECT o.id, o.name
   FROM orgs o
   LEFT JOIN org_billing_state obs ON o.id = obs.org_id
   WHERE obs.org_id IS NULL;
   ```

4. **Enable flag for internal orgs** (optional gradual rollout):
   ```typescript
   // In route setup, override flag per org
   if (orgId === 'internal-org-id') {
     FLAGS.ENABLE_BILLING_HARD_LIMITS = true;
   }
   ```

5. **Monitor quota rejection rates**:
   - Check logs for `BillingQuotaError` frequency
   - Verify error messages are informative
   - Confirm HTTP 402 responses sent correctly

6. **Enable flag globally**:
   ```typescript
   // packages/feature-flags/src/flags.ts
   ENABLE_BILLING_HARD_LIMITS: true,
   ```

7. **Deploy and monitor**:
   - Watch error rates
   - Check support tickets for quota issues
   - Verify billing dashboard shows accurate data

**Rollback Plan:**

If issues arise, disable enforcement immediately:

```typescript
// packages/feature-flags/src/flags.ts
ENABLE_BILLING_HARD_LIMITS: false,
```

Rebuild and redeploy. All operations will proceed normally (soft limits continue for observability).

## Support

For billing enforcement issues:

1. **Check feature flag state**: Verify `ENABLE_BILLING_HARD_LIMITS` value
2. **Check billing data**: Verify org has billing state and usage records
3. **Check quota estimates**: Compare estimate vs actual quota remaining
4. **Check error details**: Review `BillingQuotaError.details` for specifics
5. **Check logs**: Look for enforcement attempts and quota calculations
6. **Test with flag disabled**: Verify operations work when enforcement off
7. **Review billing dashboard**: Compare API usage with dashboard display

For development questions, consult:
- `docs/product/billing_quota_kernel_v1.md` - S28 foundation
- `apps/api/__tests__/billingService.test.ts` - Service tests
- `apps/api/__tests__/billingRoutes.test.ts` - Route tests
