/**
 * LLM Router Types (Sprint S16)
 * Type definitions for LLM provider abstraction layer
 */

/**
 * Supported LLM providers
 */
export type LlmProvider = 'openai' | 'anthropic' | 'stub';

/**
 * Cost-routing tier (canon: LLM_COST_ROUTER). The router maps a task to the
 * least-cost model tier that meets its quality bar.
 * - `economy`  — Haiku-class: high-volume, low-complexity work
 * - `standard` — Sonnet-class: generation + reasoning (default)
 * - `premium`  — Opus-class: rare, opt-in complex synthesis
 */
export type LlmTaskTier = 'economy' | 'standard' | 'premium';

/**
 * Known LLM task types, each mapped to a cost tier by the router's
 * TASK_TIER_MAP (canon: LLM_COST_ROUTER). Callers declare intent via `taskType`
 * rather than hardcoding a model id.
 */
export type LlmTaskType =
  // economy
  | 'citation_scan'
  | 'brand_mention'
  | 'classification'
  | 'extraction'
  | 'summarization'
  | 'auto_responder_detection'
  | 'entity_tagging'
  // standard
  | 'content_generation'
  | 'content_rewrite'
  | 'brief_generation'
  | 'pitch_composition'
  | 'strategy_reasoning'
  // premium
  | 'complex_synthesis';

/**
 * Request to LLM router
 */
export interface LlmRequest {
  /** Override default provider */
  provider?: LlmProvider;
  /**
   * Explicit model id override. Wins over `taskType` routing (backward-compat).
   * Prefer `taskType` — hardcoded model ids in feature code are canon drift.
   */
  model?: string;
  /**
   * Cost-routing hint (canon: LLM_COST_ROUTER). Resolved to the least-cost model
   * tier via the router's TASK_TIER_MAP. Ignored if `model` is set. Defaults to
   * the `standard` tier when unset.
   */
  taskType?: LlmTaskType;
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
 * Failure attribution attached to a stub response when a real provider call
 * failed and we fell back to the deterministic stub. Lets the ledger record
 * WHY the stub fired instead of masking it as a healthy success.
 */
export interface LlmFallbackInfo {
  /** Anthropic/OpenAI error type, e.g. 'not_found_error', or synthetic 'timeout' | 'missing_key' | 'malformed_response' */
  errorCode: string;
  /** Human-readable error message, truncated + secret-stripped */
  errorMessage: string;
  /** The model that was requested when the call failed */
  attemptedModel: string;
  /** The provider that was attempted before falling back */
  attemptedProvider: LlmProvider;
  /** HTTP status code from the provider, when the failure was an HTTP error */
  httpStatus?: number;
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
  /** Present only when a real provider call failed and this is a stub fallback */
  fallback?: LlmFallbackInfo;
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
  /** 'fallback' = a real provider call failed and we served a stub instead */
  status: 'success' | 'error' | 'fallback';
  errorCode: string | null;
  /** Truncated, secret-stripped provider error message (fallback rows only) */
  errorMessage: string | null;
  /** Model requested when a fallback fired */
  attemptedModel: string | null;
  /** Provider attempted before a fallback fired */
  attemptedProvider: LlmProvider | null;
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
  status: 'success' | 'error' | 'fallback';
  errorCode?: string | null;
  errorMessage?: string | null;
  attemptedModel?: string | null;
  attemptedProvider?: LlmProvider | null;
}
