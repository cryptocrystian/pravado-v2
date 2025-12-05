# LLM Router V1 (Sprint S16)

**Status**: ✅ Implemented
**Version**: 1.0.0
**Last Updated**: 2025-11-16

## Overview

The LLM Router is a provider abstraction layer that enables Pravado to use multiple LLM providers (OpenAI, Anthropic, or deterministic stubs) through a unified interface. It provides automatic fallback, timeout handling, and error recovery to ensure reliable AI-powered features.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│  (Brief Generator, Content Rewriter, Playbook Engine)       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       LLM Router                             │
│  - Provider selection                                        │
│  - Request/response mapping                                  │
│  - Timeout handling                                          │
│  - Error recovery & fallback                                 │
└───────┬──────────────┬──────────────┬───────────────────────┘
        │              │              │
        ▼              ▼              ▼
    ┌───────┐     ┌─────────┐    ┌──────┐
    │OpenAI │     │Anthropic│    │ Stub │
    │  API  │     │   API   │    │Logic │
    └───────┘     └─────────┘    └──────┘
```

## Features

### 1. Provider Abstraction
- **OpenAI**: GPT-4, GPT-4-mini, GPT-3.5-turbo
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Opus
- **Stub**: Deterministic fallback for testing and development

### 2. Automatic Fallback
- Falls back to stub when API keys are missing
- Falls back to stub when API calls timeout
- Falls back to stub when API calls fail
- Configurable through environment variables

### 3. Timeout Protection
- Configurable timeout (default: 20 seconds)
- Uses AbortController for proper request cancellation
- Prevents hanging requests

### 4. Error Recovery
- Comprehensive error logging
- Graceful degradation
- Maintains service availability even when LLM providers are down

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```bash
# LLM Provider Selection
LLM_PROVIDER=stub  # 'openai' | 'anthropic' | 'stub'

# OpenAI Configuration
LLM_OPENAI_API_KEY=sk-...  # Your OpenAI API key
LLM_OPENAI_MODEL=gpt-4o-mini  # Default model

# Anthropic Configuration
LLM_ANTHROPIC_API_KEY=sk-ant-...  # Your Anthropic API key
LLM_ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # Default model

# Performance Tuning
LLM_TIMEOUT_MS=20000  # Request timeout in milliseconds
LLM_MAX_TOKENS=2048  # Maximum tokens to generate
```

### Feature Flag

The LLM Router can be toggled using the `ENABLE_LLM` feature flag:

```typescript
// In @pravado/feature-flags
ENABLE_LLM: true  // Enable/disable LLM features globally
```

## Usage

### 1. Instantiate the Router

```typescript
import { LlmRouter } from '@pravado/utils';
import { validateEnv, apiEnvSchema } from '@pravado/validators';

// From environment
const env = validateEnv(apiEnvSchema);
const llmRouter = LlmRouter.fromEnv(env);

// Or with explicit config
const llmRouter = new LlmRouter({
  provider: 'openai',
  openaiApiKey: 'sk-...',
  openaiModel: 'gpt-4o-mini',
  timeoutMs: 30000,
  maxTokens: 4096,
});
```

### 2. Generate Completions

```typescript
const response = await llmRouter.generate({
  systemPrompt: 'You are an expert content strategist.',
  userPrompt: 'Create an outline for an article about SEO best practices.',
  temperature: 0.7,
  maxTokens: 1000,
});

console.log(response.completion);
console.log(response.provider);  // 'openai', 'anthropic', or 'stub'
console.log(response.usage);     // Token usage statistics
```

### 3. Per-Request Overrides

```typescript
// Override provider for a specific request
const response = await llmRouter.generate({
  provider: 'anthropic',  // Override default provider
  model: 'claude-3-opus-20240229',  // Override default model
  systemPrompt: 'You are a helpful assistant.',
  userPrompt: 'Explain quantum computing.',
  temperature: 0.5,
});
```

## Integration Points

### 1. Brief Generator Service (S13)

The Brief Generator uses the LLM Router to generate content outlines and briefs:

```typescript
// packages/api/src/services/briefGeneratorService.ts
const llmRouter = LlmRouter.fromEnv(env);
const service = new BriefGeneratorService(supabase, llmRouter);

// Generates outline using LLM if available, falls back to stub
const result = await service.generateBrief(orgId, userId, {
  targetKeyword: 'content marketing',
  targetIntent: 'informational',
});
```

**How it works:**
1. Builds system prompt from personality (tone, style)
2. Builds user prompt with keyword, intent, SEO context
3. Requests JSON-structured outline
4. Parses response, falls back to stub on error
5. Repeats for detailed brief generation

### 2. Content Rewrite Service (S15)

The Rewrite Service uses the LLM Router to improve content quality:

```typescript
// packages/api/src/services/contentRewriteService.ts
const llmRouter = LlmRouter.fromEnv(env);
const service = new ContentRewriteService(supabase, llmRouter);

// Rewrites content using LLM if available, falls back to stub
const result = await service.generateRewrite(orgId, {
  contentItemId: '123',
  targetKeyword: 'SEO optimization',
  personalityId: 'professional-writer',
});
```

**How it works:**
1. Analyzes original content quality
2. Builds system prompt from personality
3. Builds user prompt with content + improvement goals
4. Requests rewritten text
5. Computes semantic diff
6. Tracks quality improvements

### 3. Playbook Execution Engine (S7-S9)

The Playbook Engine uses the LLM Router for AGENT steps:

```typescript
// packages/api/src/services/playbookExecutionEngine.ts
const llmRouter = LlmRouter.fromEnv(env);
const engine = new PlaybookExecutionEngine(supabase, llmRouter);

// Execute playbook with LLM-powered agent steps
const run = await engine.startPlaybookRun(
  orgId,
  'CONTENT_BRIEF_GENERATION_V1',
  input,
  userId
);
```

**How it works:**
1. Loads personality for agent
2. Builds system prompt with personality traits
3. Builds user prompt from step config + context
4. Calls LLM router
5. Stores response in step output

## Stub Behavior

When the LLM Router falls back to stub mode (no API keys, timeout, or error), it provides deterministic responses:

### Brief Generation Stub
```json
{
  "title": "Generated Content Brief",
  "sections": [
    {
      "heading": "Introduction",
      "description": "Overview of the topic",
      "wordCount": 150
    },
    {
      "heading": "Main Content",
      "description": "Detailed exploration",
      "wordCount": 500
    },
    {
      "heading": "Conclusion",
      "description": "Summary and call to action",
      "wordCount": 100
    }
  ],
  "estimatedWordCount": 750
}
```

### Content Rewrite Stub
The stub applies deterministic transformations:
- Capitalizes first letter of sentences
- Splits long sentences (>20 words)
- Adds transitions between sections
- Injects target keywords
- Removes duplicate sentences

### Playbook Agent Stub
```json
{
  "agent": "content-strategist",
  "model": "gpt-4",
  "response": "[Stub] This is a simulated response from content-strategist. Input was: {...}",
  "metadata": {
    "executedAt": "2025-11-16T...",
    "stubbed": true,
    "personality": {
      "id": "...",
      "tone": "professional",
      "style": "clear and informative"
    }
  }
}
```

## Error Handling

The LLM Router handles errors gracefully:

### 1. Missing API Keys
```typescript
// No API key configured
const router = LlmRouter.fromEnv({ LLM_PROVIDER: 'openai' });
const response = await router.generate({ userPrompt: 'Hello' });
// → Falls back to stub, logs warning
```

### 2. Timeout
```typescript
// Request times out after 20 seconds
const router = new LlmRouter({ timeoutMs: 20000 });
const response = await router.generate({ userPrompt: 'Long task...' });
// → Aborts request, falls back to stub
```

### 3. API Errors
```typescript
// API returns error (rate limit, invalid key, etc.)
const response = await router.generate({ userPrompt: 'Test' });
// → Catches error, logs details, falls back to stub
```

### 4. Invalid JSON Response
```typescript
// LLM returns malformed JSON
const response = await router.generate({
  userPrompt: 'Generate JSON: {...}',
});
// → Parsing fails in service layer, falls back to stub structure
```

## Monitoring & Logging

The LLM Router provides comprehensive logging:

```typescript
// Success logs
logger.info('Generated outline using LLM', { provider: 'openai' });
logger.info('Generated agent response using LLM', {
  agentId: 'content-strategist',
  provider: 'anthropic'
});

// Warning logs
logger.warn('OpenAI API key not configured, falling back to stub');
logger.warn('Failed to generate outline with LLM, will use stub', { error });

// Debug logs
logger.debug('Using deterministic stub rewrite as fallback');
logger.debug('Using stub agent response as fallback', { agentId: '...' });
```

Monitor these logs to track:
- LLM usage vs stub fallback rates
- API errors and timeouts
- Configuration issues
- Performance metrics

## Cost Management

### Token Usage Tracking

Every LLM response includes usage statistics:

```typescript
const response = await llmRouter.generate({ ... });
console.log(response.usage);
// {
//   promptTokens: 150,
//   completionTokens: 500,
//   totalTokens: 650
// }
```

### Cost Estimation

Approximate costs per provider (as of 2024):

**OpenAI GPT-4o-mini:**
- Input: $0.15 / 1M tokens
- Output: $0.60 / 1M tokens

**Anthropic Claude 3.5 Sonnet:**
- Input: $3.00 / 1M tokens
- Output: $15.00 / 1M tokens

Example calculation:
```
Brief generation:
- Prompt: ~500 tokens
- Completion: ~1000 tokens
- Cost (GPT-4o-mini): $0.000675
- Cost (Claude 3.5): $0.0165
```

### Cost Optimization

1. **Use stub mode in development**
   ```bash
   LLM_PROVIDER=stub  # No API costs
   ```

2. **Choose appropriate models**
   ```bash
   LLM_OPENAI_MODEL=gpt-4o-mini  # Cheaper than gpt-4
   ```

3. **Set token limits**
   ```bash
   LLM_MAX_TOKENS=1024  # Limit completion length
   ```

4. **Monitor usage**
   - Track token usage in logs
   - Set up alerts for unusual usage patterns
   - Review monthly API costs

## Testing

### Unit Tests

```typescript
import { LlmRouter } from '@pravado/utils';

describe('LlmRouter', () => {
  it('should fall back to stub when no API key', async () => {
    const router = new LlmRouter({ provider: 'openai' });
    const response = await router.generate({ userPrompt: 'Test' });

    expect(response.provider).toBe('stub');
    expect(response.completion).toContain('stub response');
  });

  it('should use OpenAI when API key provided', async () => {
    const router = new LlmRouter({
      provider: 'openai',
      openaiApiKey: process.env.LLM_OPENAI_API_KEY,
    });
    const response = await router.generate({ userPrompt: 'Say hello' });

    expect(response.provider).toBe('openai');
    expect(response.usage).toBeDefined();
  });
});
```

### Integration Tests

```typescript
import { BriefGeneratorService } from './briefGeneratorService';
import { LlmRouter } from '@pravado/utils';

describe('BriefGeneratorService with LLM', () => {
  it('should generate brief using LLM', async () => {
    const llmRouter = LlmRouter.fromEnv(process.env);
    const service = new BriefGeneratorService(supabase, llmRouter);

    const result = await service.generateBrief(orgId, userId, {
      targetKeyword: 'content strategy',
      targetIntent: 'informational',
    });

    expect(result.brief).toBeDefined();
    expect(result.outline).toBeDefined();
  });
});
```

## Migration Guide

### Existing Services

Services already integrated with the LLM Router:
- ✅ Brief Generator Service (S13)
- ✅ Content Rewrite Service (S15)
- ✅ Playbook Execution Engine (S7-S9)

### Adding LLM to New Services

1. **Import the LLM Router**
   ```typescript
   import { LlmRouter } from '@pravado/utils';
   ```

2. **Add to service constructor**
   ```typescript
   constructor(
     private supabase: SupabaseClient,
     private llmRouter?: LlmRouter
   ) {}
   ```

3. **Use in methods**
   ```typescript
   async generateContent(input: string): Promise<string> {
     if (!this.llmRouter) {
       return this.stubGenerate(input);
     }

     try {
       const response = await this.llmRouter.generate({
         systemPrompt: 'You are...',
         userPrompt: input,
       });
       return response.completion;
     } catch (error) {
       logger.warn('LLM failed, using stub', { error });
       return this.stubGenerate(input);
     }
   }
   ```

4. **Initialize in routes**
   ```typescript
   const llmRouter = LlmRouter.fromEnv(env);
   const service = new YourService(supabase, llmRouter);
   ```

## Troubleshooting

### Issue: Always falling back to stub

**Cause**: Missing or invalid API keys

**Solution**:
1. Check `.env` file has correct API keys
2. Verify LLM_PROVIDER is set to 'openai' or 'anthropic'
3. Check logs for specific error messages

### Issue: Timeouts

**Cause**: Requests taking longer than configured timeout

**Solution**:
1. Increase `LLM_TIMEOUT_MS` (default 20000)
2. Reduce `LLM_MAX_TOKENS` to generate shorter responses
3. Use faster models (gpt-4o-mini instead of gpt-4)

### Issue: Rate limiting errors

**Cause**: Exceeding provider rate limits

**Solution**:
1. Implement request queuing/throttling
2. Upgrade API tier with provider
3. Switch to stub mode during high load

### Issue: High costs

**Cause**: Excessive token usage

**Solution**:
1. Review prompt engineering to reduce tokens
2. Set lower `LLM_MAX_TOKENS`
3. Use cheaper models (gpt-4o-mini, claude-haiku)
4. Cache common responses

## Future Enhancements

### Planned for Future Sprints

1. **Request Caching**
   - Cache common prompts/responses
   - Reduce API costs
   - Improve response time

2. **Additional Providers**
   - Google PaLM
   - Cohere
   - Local models (Ollama)

3. **Streaming Responses**
   - Real-time token streaming
   - Better UX for long generations

4. **Advanced Retry Logic**
   - Exponential backoff
   - Circuit breaker pattern
   - Provider failover

5. **Usage Analytics**
   - Token usage dashboard
   - Cost tracking
   - Performance metrics

6. **Prompt Templates**
   - Reusable prompt library
   - Version-controlled prompts
   - A/B testing capabilities

## References

- Sprint S16 Implementation: `packages/utils/src/llmRouter.ts`
- Type Definitions: `packages/types/src/llm.ts`
- Environment Validation: `packages/validators/src/env.ts`
- Feature Flag: `packages/feature-flags/src/flags.ts`

## Support

For issues or questions:
1. Check logs for specific error messages
2. Review this documentation
3. Open an issue in the project repository
4. Contact the development team

---

**Last Updated**: 2025-11-16
**Version**: 1.0.0
**Status**: Production Ready
