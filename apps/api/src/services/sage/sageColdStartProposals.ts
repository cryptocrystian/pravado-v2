/**
 * SAGE Cold-Start Proposal Service (F13 Tier 2 remediation, Fix B)
 *
 * Generates the first 3–5 baseline proposals for a newly-onboarded org
 * that hasn't yet accumulated any signal-scan data. Called from the
 * signal-scan worker's `signals_written === 0` branch after the worker
 * confirms this is a fresh org that has never received proposals.
 *
 * Guarantees + non-guarantees:
 *   - Idempotent: refuses to run if the org already has ANY proposals
 *     (regardless of origin). Callers can invoke this on every empty
 *     scan without risking duplicate output.
 *   - Best-effort: requires brand data + at least one competitor.
 *     Silently returns { generated: 0, reason: 'missing_prereq' } if
 *     preconditions aren't met. The signal-scan worker treats this as
 *     a non-error and moves on.
 *   - Truncated: LLM output is capped at 5 proposals. Extras beyond
 *     5 are dropped by confidence order.
 *   - LLM-router-shared: budget check, provider selection, and ledger
 *     write all reuse the same infrastructure as the signal-driven
 *     proposal generator via `checkLLMBudget` (extracted).
 *
 * Reasoning-trace convention: every row inserted has
 * `reasoning_trace.origin === 'cold_start'` so Stage 3 QA can
 * distinguish cold-start proposals from signal-driven proposals
 * without a schema change.
 */

import { LlmRouter, getAnthropicModel } from '@pravado/utils';
import type { SupabaseClient } from '@supabase/supabase-js';

import { checkLLMBudget } from './llmBudget';
import { mapSignalToAction } from './sageActionMapper';
import { deriveImpactPillars } from './sageImpactPillars';
import { reportLlmFallback } from '../../lib/llmErrorReporter';
import { createLogger } from '../../lib/logger';
import {
  buildColdStartSystemPrompt,
  buildColdStartUserPrompt,
  generateStubColdStartProposals,
  parseColdStartResponse,
  type ColdStartCompetitor,
  type ColdStartProposalDraft,
  type ColdStartPromptContext,
} from '../../prompts/sage/coldStart';
import { resolveOrgProposalMode } from '../mode/modeService';

const logger = createLogger('sage:cold-start');

const MAX_COLD_START_PROPOSALS = 5;

export interface ColdStartResult {
  org_id: string;
  generated: number;
  llm_provider_used: 'anthropic' | 'openai' | 'stub' | 'skipped';
  reason?:
    | 'already_has_proposals'
    | 'missing_brand_data'
    | 'missing_competitors'
    | 'llm_error'
    | 'insert_error'
    | 'ok';
  errors: string[];
}

/**
 * Attempt to generate cold-start proposals for an org.
 * See file header for the caller contract.
 */
export async function generateColdStartProposals(
  supabase: SupabaseClient,
  orgId: string
): Promise<ColdStartResult> {
  const errors: string[] = [];

  // 1) Idempotency guard — bail if this org already has any proposals.
  //    Uses `head: true` + count-exact so we don't load rows we won't use.
  const { count: existingProposalCount, error: countErr } = await supabase
    .from('sage_proposals')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId);

  if (countErr) {
    errors.push(`Proposal count read failed: ${countErr.message}`);
    logger.error(
      `Failed to read existing proposal count for org ${orgId}: ${countErr.message}`
    );
    return {
      org_id: orgId,
      generated: 0,
      llm_provider_used: 'skipped',
      reason: 'insert_error',
      errors,
    };
  }

  if ((existingProposalCount ?? 0) > 0) {
    logger.info(
      `Cold-start skip: org ${orgId} already has ${existingProposalCount} proposals`
    );
    return {
      org_id: orgId,
      generated: 0,
      llm_provider_used: 'skipped',
      reason: 'already_has_proposals',
      errors,
    };
  }

  // 2) Load brand data from orgs table.
  const { data: orgRow, error: orgErr } = await supabase
    .from('orgs')
    .select('name, industry, company_size')
    .eq('id', orgId)
    .single();

  if (orgErr || !orgRow) {
    errors.push(`Org fetch failed: ${orgErr?.message ?? 'not found'}`);
    return {
      org_id: orgId,
      generated: 0,
      llm_provider_used: 'skipped',
      reason: 'missing_brand_data',
      errors,
    };
  }

  const orgName = (orgRow as { name?: string }).name?.trim();
  const industry = (orgRow as { industry?: string | null }).industry;
  const companySize = (orgRow as { company_size?: string | null }).company_size;

  if (!orgName || !industry) {
    logger.info(
      `Cold-start skip: org ${orgId} missing brand data (name=${!!orgName}, industry=${!!industry})`
    );
    return {
      org_id: orgId,
      generated: 0,
      llm_provider_used: 'skipped',
      reason: 'missing_brand_data',
      errors,
    };
  }

  // 3) Load competitors. The prompt tolerates zero competitors and its
  //    stub fallback still produces industry-only output — but the spec
  //    is explicit: cold-start requires ≥1 competitor before we spend
  //    LLM tokens. Refuse if none.
  const { data: competitorRows } = await supabase
    .from('org_competitors')
    .select('domain, name')
    .eq('org_id', orgId)
    .limit(5);

  const competitors: ColdStartCompetitor[] = (competitorRows ?? []).map(
    (r) => ({
      domain: (r as { domain: string }).domain,
      name: (r as { name: string | null }).name,
    })
  );

  if (competitors.length === 0) {
    logger.info(`Cold-start skip: org ${orgId} has no competitors on file`);
    return {
      org_id: orgId,
      generated: 0,
      llm_provider_used: 'skipped',
      reason: 'missing_competitors',
      errors,
    };
  }

  // 4) LLM budget check — if over, we still generate stubs. Cold-start
  //    is the moment we most want to show something, so falling back to
  //    stubs beats returning nothing.
  const withinBudget = await checkLLMBudget(supabase, orgId);

  const promptCtx: ColdStartPromptContext = {
    org_name: orgName,
    industry,
    company_size: companySize ?? null,
    competitors,
  };

  let drafts: ColdStartProposalDraft[] | null = null;
  let providerUsed: ColdStartResult['llm_provider_used'] = 'stub';

  if (withinBudget) {
    const router = new LlmRouter({
      provider: 'anthropic',
      anthropicApiKey:
        process.env.LLM_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
      anthropicModel: getAnthropicModel(),
      openaiApiKey:
        process.env.LLM_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
      openaiModel: 'gpt-4o-mini',
      supabase,
      enableLedger: true,
      maxTokens: 1600, // Cold-start prompt returns 3–5 proposals in one call
      // Cold-start prompt targets 3-5 proposals @ max_tokens 1600 —
      // measured 35.8s direct against Sonnet 4.5 on 2026-07-03;
      // 60s gives 24s headroom. Do NOT lower without re-measuring.
      timeoutMs: 60000,
      errorReporter: reportLlmFallback,
    });

    try {
      const result = await router.generate({
        provider: 'anthropic',
        systemPrompt: buildColdStartSystemPrompt(orgName),
        userPrompt: buildColdStartUserPrompt(promptCtx),
        orgId,
        // Low temperature per spec — same inputs should yield broadly
        // similar output across runs. Not zero so we get some variance
        // for A/B judgment later.
        temperature: 0.4,
        maxTokens: 1600,
      });

      providerUsed = result.provider as ColdStartResult['llm_provider_used'];
      drafts = parseColdStartResponse(result.completion);

      if (!drafts) {
        errors.push('LLM returned unparseable cold-start response');
        logger.warn(
          `Cold-start LLM output for org ${orgId} failed to parse; falling back to stubs`
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`LLM error: ${msg}`);
      logger.warn(
        `Cold-start LLM call failed for org ${orgId}: ${msg}; falling back to stubs`
      );
    }
  }

  // Fall back to deterministic stubs if the LLM was over-budget, threw,
  // or produced unparseable output.
  if (!drafts) {
    drafts = generateStubColdStartProposals(promptCtx);
    providerUsed = 'stub';
  }

  // 5) Truncate to MAX_COLD_START_PROPOSALS by confidence (highest first).
  const topDrafts = drafts
    .slice()
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, MAX_COLD_START_PROPOSALS);

  // 6) Insert into sage_proposals. Any per-row error is logged and
  //    counted but doesn't abort the batch — a partial cold-start is
  //    still better than no cold-start.
  let inserted = 0;
  const insertedAt = new Date().toISOString();

  // Org-scoped proposal mode LABEL (#101): plan-default (D026) clamped to the
  // plan ceiling — same resolution as the signal-driven generator. Resolved once
  // for the batch; replaces the old hardcoded per-pillar ternary.
  const proposalMode = await resolveOrgProposalMode(supabase, orgId);

  for (const draft of topDrafts) {
    // Structured, machine-executable action (Wave-2). Cold-start drafts carry no
    // signal_data, so seed the mapper with the draft title as the topic hint.
    const structuredAction = mapSignalToAction(
      draft.pillar,
      `cold_start_${draft.pillar.toLowerCase()}`,
      { title: draft.title }
    );

    const { error: insertErr } = await supabase.from('sage_proposals').insert({
      org_id: orgId,
      signal_id: null, // No signal drove this — schema allows null
      // Use a synthetic signal_type prefix so downstream analytics can
      // segment cold-start proposals cleanly. Pillar is stored on its
      // own column already.
      signal_type: `cold_start_${draft.pillar.toLowerCase()}`,
      pillar: draft.pillar,
      impact_pillars: deriveImpactPillars(
        draft.pillar,
        `cold_start_${draft.pillar.toLowerCase()}`
      ),
      priority: draft.priority,
      title: draft.title,
      rationale: `${draft.rationale}\n\nRecommended: ${draft.suggested_action}`,
      evi_impact_estimate: draft.evi_impact_estimate,
      confidence: draft.confidence,
      mode: proposalMode,
      deep_link: null,
      action_type: structuredAction.action_type,
      action_params: structuredAction.action_params,
      status: 'active',
      expires_at: null,
      // reasoning_trace is the origin channel — see file header.
      reasoning_trace: {
        origin: 'cold_start',
        provider: providerUsed,
        grounded_in: draft.grounded_in,
        generated_at: insertedAt,
      },
    });

    if (insertErr) {
      errors.push(`Insert error for "${draft.title}": ${insertErr.message}`);
      logger.error(
        `Failed to insert cold-start proposal for org ${orgId}: ${insertErr.message}`
      );
    } else {
      inserted++;
    }
  }

  logger.info(
    `Cold-start complete for org ${orgId}: inserted ${inserted}/${topDrafts.length} proposals (provider: ${providerUsed})`
  );

  return {
    org_id: orgId,
    generated: inserted,
    llm_provider_used: providerUsed,
    reason: inserted > 0 ? 'ok' : 'insert_error',
    errors,
  };
}
