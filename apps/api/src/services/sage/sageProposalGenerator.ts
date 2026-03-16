/**
 * SAGE Proposal Generator (Sprint S-INT-03)
 *
 * Takes scored sage_signals and generates human-readable SAGE proposals
 * using Claude (primary) or OpenAI (fallback) via the LlmRouter.
 *
 * - Uses structured JSON output
 * - Checks LLM usage budget before every call
 * - Logs every call to llm_usage_ledger
 * - Saves proposals to sage_proposals table
 * - Max 10 proposals per org per scan cycle
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from '@pravado/utils';
import { LlmRouter } from '@pravado/utils';

import {
  buildProposalSystemPrompt,
  buildProposalUserPrompt,
  generateStubProposal,
  type ProposalPromptContext,
} from '../../prompts/sage/proposal';

const logger = createLogger('sage:proposal-generator');

const MAX_PROPOSALS_PER_SCAN = 10;
const MONTHLY_TOKEN_BUDGET = 500_000; // Conservative default

export interface GeneratedProposal {
  id: string;
  signal_id: string;
  signal_type: string;
  pillar: string;
  priority: string;
  title: string;
  rationale: string;
  evi_impact_estimate: number;
  confidence: number;
  mode: string;
  deep_link: { href: string; label: string } | null;
  reasoning_trace: Record<string, unknown>;
}

export interface ProposalGenerationResult {
  org_id: string;
  proposals_generated: number;
  signals_processed: number;
  llm_provider_used: string;
  errors: string[];
}

/**
 * Generate proposals from the top scored signals for an org.
 */
export async function generateProposals(
  supabase: SupabaseClient,
  orgId: string
): Promise<ProposalGenerationResult> {
  const errors: string[] = [];

  // Get org context for LLM prompt
  const orgContext = await getOrgContext(supabase, orgId);

  // Get top signals that don't already have proposals
  const signals = await getUnprocessedSignals(supabase, orgId, MAX_PROPOSALS_PER_SCAN);

  if (signals.length === 0) {
    logger.info(`No unprocessed signals for org ${orgId}`);
    return {
      org_id: orgId,
      proposals_generated: 0,
      signals_processed: 0,
      llm_provider_used: 'none',
      errors,
    };
  }

  // Check LLM budget
  const withinBudget = await checkLLMBudget(supabase, orgId);

  // Create LLM router
  const router = new LlmRouter({
    provider: withinBudget ? 'anthropic' : 'stub',
    anthropicApiKey: process.env.LLM_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
    anthropicModel: 'claude-sonnet-4-20250514',
    openaiApiKey: process.env.LLM_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    openaiModel: 'gpt-4o-mini',
    supabase,
    enableLedger: true,
    maxTokens: 500,
    timeoutMs: 15000,
  });

  let providerUsed = 'stub';
  let proposalsGenerated = 0;

  for (const signal of signals) {
    try {
      const promptCtx: ProposalPromptContext = {
        signal_type: signal.signal_type,
        pillar: signal.pillar,
        priority: signal.priority,
        signal_data: signal.signal_data as Record<string, unknown>,
        evi_impact_estimate: signal.evi_impact_estimate ?? 0,
        confidence: signal.confidence ?? 0,
        org_name: orgContext.name,
      };

      let title: string;
      let rationale: string;
      let suggestedAction: string;
      let reasoningTrace: Record<string, unknown> = {};

      if (withinBudget) {
        // Try LLM generation
        try {
          const result = await router.generate({
            provider: 'anthropic',
            systemPrompt: buildProposalSystemPrompt(orgContext.name),
            userPrompt: buildProposalUserPrompt(promptCtx),
            orgId,
            temperature: 0.4,
            maxTokens: 500,
          });

          providerUsed = result.provider;

          // Parse JSON response
          const parsed = parseProposalResponse(result.completion);
          title = parsed.title;
          rationale = parsed.rationale;
          suggestedAction = parsed.suggested_action;
          reasoningTrace = {
            provider: result.provider,
            model: result.model,
            tokens: result.usage,
            raw_completion: result.completion,
          };
        } catch (llmError) {
          // Fall back to stub on LLM error
          logger.warn(`LLM failed for signal ${signal.id}, using stub`, { error: llmError });
          const stub = generateStubProposal(promptCtx);
          title = stub.title;
          rationale = stub.rationale;
          suggestedAction = stub.suggested_action;
          providerUsed = 'stub';
          reasoningTrace = { provider: 'stub', reason: 'llm_error' };
        }
      } else {
        // Budget exceeded, use stub
        const stub = generateStubProposal(promptCtx);
        title = stub.title;
        rationale = stub.rationale;
        suggestedAction = stub.suggested_action;
        reasoningTrace = { provider: 'stub', reason: 'budget_exceeded' };
      }

      // Build deep link based on pillar
      const deepLink = buildDeepLink(signal.pillar, signal.signal_type, signal.signal_data);

      // Save proposal to sage_proposals
      const { error: insertError } = await supabase.from('sage_proposals').insert({
        org_id: orgId,
        signal_id: signal.id,
        signal_type: signal.signal_type,
        pillar: signal.pillar,
        priority: signal.priority,
        title,
        rationale: `${rationale}\n\nRecommended: ${suggestedAction}`,
        evi_impact_estimate: signal.evi_impact_estimate,
        confidence: signal.confidence,
        mode: signal.pillar === 'SEO' ? 'autopilot' : 'copilot',
        deep_link: deepLink,
        status: 'active',
        expires_at: signal.expires_at,
        reasoning_trace: reasoningTrace,
      });

      if (insertError) {
        errors.push(`Insert error for signal ${signal.id}: ${insertError.message}`);
        logger.error(`Failed to insert proposal: ${insertError.message}`);
      } else {
        proposalsGenerated++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Signal ${signal.id}: ${msg}`);
      logger.error(`Proposal generation failed for signal ${signal.id}: ${msg}`);
    }
  }

  logger.info(
    `Generated ${proposalsGenerated} proposals for org ${orgId} ` +
    `(${signals.length} signals processed, provider: ${providerUsed})`
  );

  return {
    org_id: orgId,
    proposals_generated: proposalsGenerated,
    signals_processed: signals.length,
    llm_provider_used: providerUsed,
    errors,
  };
}

// ============================================================================
// Helpers
// ============================================================================

async function getOrgContext(
  supabase: SupabaseClient,
  orgId: string
): Promise<{ name: string }> {
  const { data } = await supabase
    .from('orgs')
    .select('name')
    .eq('id', orgId)
    .single();

  return { name: (data as { name: string } | null)?.name || 'Unknown Organization' };
}

async function getUnprocessedSignals(
  supabase: SupabaseClient,
  orgId: string,
  limit: number
) {
  const now = new Date().toISOString();

  // Get signal IDs that already have proposals
  const { data: existingProposals } = await supabase
    .from('sage_proposals')
    .select('signal_id')
    .eq('org_id', orgId)
    .not('signal_id', 'is', null);

  const processedSignalIds = (existingProposals ?? [])
    .map((p: { signal_id: string | null }) => p.signal_id)
    .filter(Boolean) as string[];

  // Get top signals by evi_impact_estimate that haven't been processed
  let query = supabase
    .from('sage_signals')
    .select('id, signal_type, pillar, priority, signal_data, evi_impact_estimate, confidence, expires_at')
    .eq('org_id', orgId)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('evi_impact_estimate', { ascending: false })
    .limit(limit);

  if (processedSignalIds.length > 0) {
    // Supabase doesn't support NOT IN easily, so we'll filter client-side
    query = query.limit(limit + processedSignalIds.length);
  }

  const { data: signals } = await query;

  if (!signals?.length) return [];

  // Filter out already-processed signals
  const processedSet = new Set(processedSignalIds);
  return signals
    .filter((s: { id: string }) => !processedSet.has(s.id))
    .slice(0, limit);
}

async function checkLLMBudget(
  supabase: SupabaseClient,
  orgId: string
): Promise<boolean> {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

  const { data } = await supabase
    .from('llm_usage_ledger')
    .select('tokens_total')
    .eq('org_id', orgId)
    .gte('created_at', monthStart);

  const totalTokens = (data ?? []).reduce(
    (sum: number, row: { tokens_total: number }) => sum + (row.tokens_total || 0),
    0
  );

  const withinBudget = totalTokens < MONTHLY_TOKEN_BUDGET;
  if (!withinBudget) {
    logger.warn(`Org ${orgId} exceeded monthly LLM budget: ${totalTokens}/${MONTHLY_TOKEN_BUDGET}`);
  }
  return withinBudget;
}

function parseProposalResponse(completion: string): {
  title: string;
  rationale: string;
  suggested_action: string;
} {
  try {
    // Try to extract JSON from the response
    const jsonMatch = completion.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      title: String(parsed.title || 'Untitled Proposal'),
      rationale: String(parsed.rationale || 'No rationale provided.'),
      suggested_action: String(parsed.suggested_action || 'Review this signal.'),
    };
  } catch {
    logger.warn('Failed to parse LLM response as JSON, using raw text');
    return {
      title: 'SAGE Proposal',
      rationale: completion.substring(0, 500),
      suggested_action: 'Review this signal and take action.',
    };
  }
}

function buildDeepLink(
  pillar: string,
  signalType: string,
  _signalData: unknown
): { href: string; label: string } {
  const pillarRoutes: Record<string, { base: string; label: string }> = {
    PR: { base: '/app/pr', label: 'Open in PR Intelligence' },
    Content: { base: '/app/content', label: 'Open in Content Hub' },
    SEO: { base: '/app/seo', label: 'Open in SEO Command' },
  };

  const route = pillarRoutes[pillar] || { base: '/app', label: 'Open' };

  // Add type-specific path hints
  if (signalType.includes('pitch') || signalType.includes('journalist')) {
    return { href: `${route.base}/pitches`, label: route.label };
  }
  if (signalType.includes('keyword') || signalType.includes('position')) {
    return { href: `${route.base}/keywords`, label: route.label };
  }

  return { href: route.base, label: route.label };
}
