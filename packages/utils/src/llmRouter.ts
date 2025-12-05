/**
 * LLM Router (Sprint S16)
 * Provider abstraction layer for LLM API calls
 *
 * Supports:
 * - OpenAI (gpt-4o-mini, gpt-4o, etc.)
 * - Anthropic (claude-3-5-sonnet, etc.)
 * - Stub (deterministic fallback)
 *
 * Features:
 * - Automatic fallback to stub when API keys missing
 * - Timeout handling
 * - Error recovery
 * - Provider-agnostic interface
 * - Usage ledger tracking (Sprint S27)
 */

import type { LlmProvider, LlmRequest, LlmResponse, CreateLlmUsageLedgerEntry } from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

import { createLogger } from './logger';

const logger = createLogger('llm-router');

/**
 * LLM Router configuration
 */
export interface LlmRouterConfig {
  provider?: LlmProvider;
  openaiApiKey?: string;
  openaiModel?: string;
  anthropicApiKey?: string;
  anthropicModel?: string;
  timeoutMs?: number;
  maxTokens?: number;
  supabase?: SupabaseClient<any>;
  enableLedger?: boolean;
  /** Sprint S29: Optional billing quota enforcer callback */
  billingEnforcer?: (orgId: string, tokensToConsume: number) => Promise<void>;
}

/**
 * OpenAI Chat Completion Request
 */
interface OpenAIChatRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  stop?: string[];
}

/**
 * OpenAI Chat Completion Response
 */
interface OpenAIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Anthropic Messages Request
 */
interface AnthropicMessagesRequest {
  model: string;
  max_tokens: number;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  system?: string;
  temperature?: number;
  stop_sequences?: string[];
}

/**
 * Anthropic Messages Response
 */
interface AnthropicMessagesResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * OpenAI-style message for callLLM
 */
interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * OpenAI-style callLLM request
 */
interface CallLlmRequest {
  model?: string;
  messages: LlmMessage[];
  temperature?: number;
  max_tokens?: number;
}

/**
 * OpenAI-style callLLM response
 */
interface CallLlmResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Simple OpenAI-style callLLM function
 * Uses stub fallback if no API key is available
 */
export async function callLLM(request: CallLlmRequest): Promise<CallLlmResponse> {
  const systemMessage = request.messages.find((m) => m.role === 'system');
  const userMessage = request.messages.find((m) => m.role === 'user');

  if (!userMessage) {
    throw new Error('User message is required');
  }

  // Try to use OpenAI if API key is available
  const apiKey = process.env.LLM_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: request.model || 'gpt-4o-mini',
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.max_tokens ?? 2048,
        }),
      });

      if (response.ok) {
        return (await response.json()) as CallLlmResponse;
      }
    } catch {
      // Fall through to stub
    }
  }

  // Stub response
  const promptText = `${systemMessage?.content || ''} ${userMessage.content}`;
  const completionText = JSON.stringify({ traits: [], insights: [] });

  return {
    id: `stub-${Date.now()}`,
    choices: [
      {
        message: {
          role: 'assistant',
          content: completionText,
        },
      },
    ],
    usage: {
      prompt_tokens: Math.ceil(promptText.length / 4),
      completion_tokens: Math.ceil(completionText.length / 4),
      total_tokens: Math.ceil((promptText.length + completionText.length) / 4),
    },
  };
}

/**
 * LLM Router class
 */
export class LlmRouter {
  private readonly config: Required<Omit<LlmRouterConfig, 'supabase' | 'enableLedger' | 'billingEnforcer'>>;
  private readonly supabase?: SupabaseClient<any>;
  private readonly enableLedger: boolean;
  private readonly billingEnforcer?: (orgId: string, tokensToConsume: number) => Promise<void>;

  constructor(config: LlmRouterConfig = {}) {
    this.config = {
      provider: config.provider || 'stub',
      openaiApiKey: config.openaiApiKey || '',
      openaiModel: config.openaiModel || 'gpt-4o-mini',
      anthropicApiKey: config.anthropicApiKey || '',
      anthropicModel: config.anthropicModel || 'claude-3-5-sonnet-20241022',
      timeoutMs: config.timeoutMs || 20000,
      maxTokens: config.maxTokens || 2048,
    };
    this.supabase = config.supabase;
    this.enableLedger = config.enableLedger !== false; // Default to true
    this.billingEnforcer = config.billingEnforcer;
  }

  /**
   * Create LLM router from environment config
   */
  static fromEnv(env: Record<string, unknown>): LlmRouter {
    return new LlmRouter({
      provider: (env.LLM_PROVIDER as LlmProvider) || 'stub',
      openaiApiKey: (env.LLM_OPENAI_API_KEY as string) || undefined,
      openaiModel: (env.LLM_OPENAI_MODEL as string) || undefined,
      anthropicApiKey: (env.LLM_ANTHROPIC_API_KEY as string) || undefined,
      anthropicModel: (env.LLM_ANTHROPIC_MODEL as string) || undefined,
      timeoutMs: (env.LLM_TIMEOUT_MS as number) || undefined,
      maxTokens: (env.LLM_MAX_TOKENS as number) || undefined,
    });
  }

  /**
   * Generate completion using configured provider
   */
  async generate(request: LlmRequest): Promise<LlmResponse> {
    const provider = request.provider || this.config.provider;
    const startTime = Date.now();
    let response: LlmResponse;
    let error: any = null;

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

    try {
      if (provider === 'stub') {
        response = this.generateStub(request);
      } else if (provider === 'openai') {
        response = await this.generateWithOpenAI(request);
      } else if (provider === 'anthropic') {
        response = await this.generateWithAnthropic(request);
      } else {
        // Unknown provider, fallback to stub
        logger.warn(`Unknown provider: ${provider}, falling back to stub`);
        response = this.generateStub(request);
      }
    } catch (err) {
      error = err;
      logger.error('LLM generation failed, falling back to stub', { error: err, provider });
      response = this.generateStub(request);
    }

    // Write to ledger (best effort, don't await)
    const latencyMs = Date.now() - startTime;
    this.writeLedgerEntry({
      orgId: request.orgId,
      runId: request.runId,
      stepRunId: request.stepRunId,
      provider: response.provider,
      model: response.model,
      tokensPrompt: response.usage?.promptTokens || 0,
      tokensCompletion: response.usage?.completionTokens || 0,
      tokensTotal: response.usage?.totalTokens || 0,
      latencyMs,
      status: error ? 'error' : 'success',
      errorCode: error instanceof Error ? error.message : undefined,
    }).catch(() => {
      // Swallow errors from ledger writes
    });

    // Update billing usage counters (S28 - best effort, non-blocking)
    if (request.orgId && response.usage?.totalTokens) {
      this.updateBillingUsage(request.orgId, response.usage.totalTokens).catch(() => {
        // Swallow errors from billing updates
      });
    }

    return response;
  }

  /**
   * Generate completion using OpenAI
   */
  private async generateWithOpenAI(request: LlmRequest): Promise<LlmResponse> {
    // Check for API key
    if (!this.config.openaiApiKey) {
      logger.warn('OpenAI API key not configured, falling back to stub');
      return this.generateStub(request);
    }

    const model = request.model || this.config.openaiModel;
    const maxTokens = request.maxTokens || this.config.maxTokens;
    const temperature = request.temperature !== undefined ? request.temperature : 0.7;

    // Build messages array
    const messages: OpenAIChatRequest['messages'] = [];

    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt,
      });
    }

    messages.push({
      role: 'user',
      content: request.userPrompt,
    });

    const requestBody: OpenAIChatRequest = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    if (request.stopSequences && request.stopSequences.length > 0) {
      requestBody.stop = request.stopSequences;
    }

    // Make API call with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.openaiApiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
      }

      const data = (await response.json()) as OpenAIChatResponse;

      const completion = data.choices[0]?.message?.content || '';

      return {
        provider: 'openai',
        model: data.model,
        raw: data,
        completion,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        logger.warn('OpenAI request timed out, falling back to stub');
      } else {
        logger.error('OpenAI request failed', { error });
      }

      // Fallback to stub
      return this.generateStub(request);
    }
  }

  /**
   * Generate completion using Anthropic
   */
  private async generateWithAnthropic(request: LlmRequest): Promise<LlmResponse> {
    // Check for API key
    if (!this.config.anthropicApiKey) {
      logger.warn('Anthropic API key not configured, falling back to stub');
      return this.generateStub(request);
    }

    const model = request.model || this.config.anthropicModel;
    const maxTokens = request.maxTokens || this.config.maxTokens;
    const temperature = request.temperature !== undefined ? request.temperature : 0.7;

    const requestBody: AnthropicMessagesRequest = {
      model,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: request.userPrompt,
        },
      ],
      temperature,
    };

    if (request.systemPrompt) {
      requestBody.system = request.systemPrompt;
    }

    if (request.stopSequences && request.stopSequences.length > 0) {
      requestBody.stop_sequences = request.stopSequences;
    }

    // Make API call with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.anthropicApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${response.status} ${errorText}`);
      }

      const data = (await response.json()) as AnthropicMessagesResponse;

      const completion = data.content[0]?.text || '';

      return {
        provider: 'anthropic',
        model: data.model,
        raw: data,
        completion,
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        },
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        logger.warn('Anthropic request timed out, falling back to stub');
      } else {
        logger.error('Anthropic request failed', { error });
      }

      // Fallback to stub
      return this.generateStub(request);
    }
  }

  /**
   * Write LLM usage to ledger (best effort)
   */
  private async writeLedgerEntry(entry: CreateLlmUsageLedgerEntry): Promise<void> {
    if (!this.enableLedger || !this.supabase) {
      return;
    }

    try {
      const { error } = await this.supabase.from('llm_usage_ledger').insert({
        org_id: entry.orgId || null,
        run_id: entry.runId || null,
        step_run_id: entry.stepRunId || null,
        provider: entry.provider,
        model: entry.model,
        tokens_prompt: entry.tokensPrompt,
        tokens_completion: entry.tokensCompletion,
        tokens_total: entry.tokensTotal,
        latency_ms: entry.latencyMs,
        status: entry.status,
        error_code: entry.errorCode || null,
      });

      if (error) {
        logger.warn('Failed to write LLM usage to ledger', { error });
      }
    } catch (error) {
      // Best effort - don't fail the LLM request if ledger write fails
      logger.warn('Failed to write LLM usage to ledger', { error });
    }
  }

  /**
   * Update billing usage counters (S28 - best effort)
   */
  private async updateBillingUsage(orgId: string, tokensDelta: number): Promise<void> {
    if (!this.supabase) {
      return;
    }

    try {
      // Calculate current billing period (first day of month to first day of next month)
      const now = new Date();
      const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

      // Fetch existing usage record for current period
      const { data: existingUsage } = await this.supabase
        .from('org_billing_usage_monthly')
        .select('*')
        .eq('org_id', orgId)
        .eq('period_start', periodStart.toISOString())
        .eq('period_end', periodEnd.toISOString())
        .single();

      if (existingUsage) {
        // Update existing record
        const { error } = await this.supabase
          .from('org_billing_usage_monthly')
          .update({
            tokens_used: existingUsage.tokens_used + tokensDelta,
            last_calculated_at: new Date().toISOString(),
          })
          .eq('id', existingUsage.id);

        if (error) {
          logger.warn('Failed to update billing usage', { error, orgId });
        }
      } else {
        // Create new usage record
        const { error } = await this.supabase.from('org_billing_usage_monthly').insert({
          org_id: orgId,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          tokens_used: tokensDelta,
          playbook_runs: 0,
          seats: 0,
          last_calculated_at: new Date().toISOString(),
        });

        if (error) {
          logger.warn('Failed to create billing usage record', { error, orgId });
        }
      }
    } catch (error) {
      // Best effort - don't fail the LLM request if billing update fails
      logger.warn('Failed to update billing usage', { error, orgId });
    }
  }

  /**
   * Generate deterministic stub response
   */
  generateStub(request: LlmRequest): LlmResponse {
    // Simple deterministic transformation
    const userPrompt = request.userPrompt.toLowerCase();

    let completion = '';

    // If asking for JSON structure (brief generation)
    if (userPrompt.includes('brief') || userPrompt.includes('outline')) {
      completion = JSON.stringify(
        {
          title: 'Generated Content Brief',
          sections: [
            {
              heading: 'Introduction',
              description: 'Overview of the topic',
              wordCount: 150,
            },
            {
              heading: 'Main Content',
              description: 'Detailed exploration',
              wordCount: 500,
            },
            {
              heading: 'Conclusion',
              description: 'Summary and call to action',
              wordCount: 100,
            },
          ],
          estimatedWordCount: 750,
        },
        null,
        2
      );
    }
    // If rewriting content
    else if (userPrompt.includes('rewrite') || userPrompt.includes('improve')) {
      // Extract content to rewrite (simple heuristic)
      const lines = request.userPrompt.split('\n').filter((l) => l.trim().length > 0);
      const contentLines = lines.slice(1); // Skip first line (usually instructions)

      if (contentLines.length > 0) {
        // Apply simple transformations
        completion = contentLines
          .map((line) => {
            // Capitalize first letter
            const trimmed = line.trim();
            return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
          })
          .join('. ');

        // Add transition
        completion += '. Furthermore, this content provides additional value and clarity.';
      } else {
        completion = 'This is improved content with better clarity and structure.';
      }
    }
    // Default completion
    else {
      completion = `This is a stub response to the query. In production, this would be generated by an LLM. Query summary: ${request.userPrompt.substring(0, 100)}...`;
    }

    return {
      provider: 'stub',
      model: 'stub-v1',
      raw: { stubResponse: true },
      completion,
      usage: {
        promptTokens: request.userPrompt.length,
        completionTokens: completion.length,
        totalTokens: request.userPrompt.length + completion.length,
      },
    };
  }
}

/**
 * Convenience interface for routeLLM function
 */
export interface RouteLLMRequest {
  systemPrompt?: string;
  userPrompt: string;
  responseFormat?: 'text' | 'json';
  schema?: Record<string, unknown>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Response from routeLLM convenience function
 */
export interface RouteLLMResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Convenience function for simple LLM routing without instantiating a full router
 * Uses environment variables for configuration and falls back to stub for development
 */
export async function routeLLM(request: RouteLLMRequest): Promise<RouteLLMResponse> {
  const router = new LlmRouter({
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: request.model || 'gpt-4o-mini',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    anthropicModel: 'claude-3-5-sonnet-20241022',
    timeoutMs: 30000,
    maxTokens: request.maxTokens || 2000,
  });

  const llmRequest: LlmRequest = {
    systemPrompt: request.systemPrompt || '',
    userPrompt: request.userPrompt,
    temperature: request.temperature,
    maxTokens: request.maxTokens,
    model: request.model,
  };

  // If JSON format requested, wrap the prompt
  if (request.responseFormat === 'json' && request.schema) {
    llmRequest.userPrompt = `${request.userPrompt}\n\nRespond with valid JSON matching this schema:\n${JSON.stringify(request.schema, null, 2)}`;
  }

  const response = await router.generate(llmRequest);

  return {
    content: response.completion,
    model: response.model,
    usage: {
      promptTokens: response.usage?.promptTokens || 0,
      completionTokens: response.usage?.completionTokens || 0,
      totalTokens: response.usage?.totalTokens || 0,
    },
  };
}
