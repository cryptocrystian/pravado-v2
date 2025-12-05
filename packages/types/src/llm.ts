/**
 * LLM Router Types (Sprint S16)
 * Type definitions for LLM provider abstraction layer
 */

/**
 * Supported LLM providers
 */
export type LlmProvider = 'openai' | 'anthropic' | 'stub';

/**
 * Request to LLM router
 */
export interface LlmRequest {
  /** Override default provider */
  provider?: LlmProvider;
  /** Override default model */
  model?: string;
  /** System-level instructions */
  systemPrompt?: string;
  /** User prompt/query */
  userPrompt: string;
  /** Temperature for sampling (0-2 for OpenAI, 0-1 for Anthropic) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Stop sequences */
  stopSequences?: string[];
  /** Additional metadata for logging/tracking */
  metadata?: Record<string, unknown>;
  /** Organization ID for usage tracking (Sprint S27) */
  orgId?: string;
  /** Playbook run ID for usage tracking (Sprint S27) */
  runId?: string;
  /** Playbook step run ID for usage tracking (Sprint S27) */
  stepRunId?: string;
}

/**
 * Response from LLM router
 */
export interface LlmResponse {
  /** Provider that generated this response */
  provider: LlmProvider;
  /** Model that was used */
  model: string;
  /** Raw response from provider (for debugging) */
  raw: unknown;
  /** Generated completion text */
  completion: string;
  /** Token usage statistics */
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

/**
 * LLM Usage Ledger Entry (Sprint S27)
 * Tracks all LLM API calls for observability and cost analysis
 */
export interface LlmUsageLedgerEntry {
  id: string;
  orgId: string | null;
  runId: string | null;
  stepRunId: string | null;
  provider: LlmProvider;
  model: string;
  tokensPrompt: number;
  tokensCompletion: number;
  tokensTotal: number;
  costUsd: number | null;
  latencyMs: number;
  status: 'success' | 'error';
  errorCode: string | null;
  createdAt: string;
}

/**
 * DTO for creating ledger entry
 */
export interface CreateLlmUsageLedgerEntry {
  orgId?: string | null;
  runId?: string | null;
  stepRunId?: string | null;
  provider: LlmProvider;
  model: string;
  tokensPrompt: number;
  tokensCompletion: number;
  tokensTotal: number;
  latencyMs: number;
  status: 'success' | 'error';
  errorCode?: string | null;
}
