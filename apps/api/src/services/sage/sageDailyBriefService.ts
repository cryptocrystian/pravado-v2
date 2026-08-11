/**
 * SAGE Daily Brief Service (D039 — docs/canon/SAGE_DAILY_BRIEF.md)
 *
 * Generates and persists the org-level, daily, cross-pillar SAGE narrative that
 * populates the Command Center Situation Brief card (and the mobile Today tab)
 * via `daily_brief` on the SAGE action-stream response.
 *
 * HONESTY IS THE PRIME CONSTRAINT (canon §4). The brief is a GROUNDED summary of
 * real signals — it never fabricates:
 *   - Inputs (§2) are all real rows: prioritized `sage_proposals`, the
 *     action-stream top action (the highest-priority active proposal —
 *     pillar-agnostic, sourced from the same `sage_proposals`), the
 *     `evi_snapshots` current-vs-prior delta, and `citation_summaries` movement.
 *   - Honest empty (§4.3): when there are no real signals (no proposals AND no
 *     EVI snapshot) we return null and write NO row — the card renders the
 *     existing empty state. We never back-fill a narrative.
 *   - LLM-primary with deterministic stub fallback (§4.2), mirroring
 *     `sageProposalGenerator`: within budget → LLM renders the real signals into
 *     prose; budget exceeded / LLM unavailable / parse failure → deterministic
 *     grounded stub assembled from the SAME real signals.
 *   - Traceability (§4.5): the persisted row records the proposal ids, EVI
 *     snapshot ids, and citation summary id it summarized.
 *
 * The input-gathering, honest-empty check, and stub assembly are kept as
 * small, testable units.
 */

import { LlmRouter, getAnthropicModel } from '@pravado/utils';
import type { SupabaseClient } from '@supabase/supabase-js';

import { checkLLMBudget } from './llmBudget';
import { reportLlmFallback } from '../../lib/llmErrorReporter';
import { createLogger } from '../../lib/logger';
import {
  buildBriefSystemPrompt,
  buildBriefUserPrompt,
  buildStubBrief,
  parseBriefResponse,
  type BriefInputs,
  type BriefProposalInput,
  type BriefTopAction,
  type BriefEviDelta,
  type BriefCitationMovement,
} from '../../prompts/sage/dailyBrief';

const logger = createLogger('sage:daily-brief');

/** How many top proposals feed the brief summary. */
const MAX_BRIEF_PROPOSALS = 5;

export type BriefProvider = 'anthropic' | 'stub';

export interface GeneratedBrief {
  id: string | null;
  org_id: string;
  brief_text: string;
  top_action: BriefTopAction | null;
  source_signal_ids: BriefSourceTrace;
  provider_used: BriefProvider;
  generated_at: string;
}

/** Traceability payload (§4.5) — persisted verbatim in `source_signal_ids`. */
export interface BriefSourceTrace {
  proposal_ids: string[];
  top_action_proposal_id: string | null;
  evi_snapshot_id: string | null;
  evi_prior_snapshot_id: string | null;
  citation_summary_id: string | null;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Generate (and persist) the daily brief for an org. Returns the generated
 * brief, or `null` when there are no real signals to ground it (honest empty).
 */
export async function generateDailyBrief(
  supabase: SupabaseClient,
  orgId: string
): Promise<GeneratedBrief | null> {
  const inputs = await gatherBriefInputs(supabase, orgId);

  // Honest empty (§4.3): no proposals AND no EVI snapshot → no brief.
  if (!hasRealSignals(inputs)) {
    logger.info(
      `No real signals for org ${orgId} — skipping brief (honest empty)`
    );
    return null;
  }

  // Deterministic grounded baseline. Always assembled from the real inputs so
  // brief_text is grounded even if the LLM path is skipped or fails.
  const stub = buildStubBrief(inputs);
  let briefText = stub.brief_text;
  let providerUsed: BriefProvider = 'stub';
  const topAction = stub.top_action; // grounded — never LLM-invented

  // LLM-primary with deterministic stub fallback (§4.2), mirroring
  // sageProposalGenerator's budget-gated provider selection.
  const withinBudget = await checkLLMBudget(supabase, orgId);

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
      maxTokens: 400,
      timeoutMs: 15000,
      errorReporter: reportLlmFallback,
    });

    try {
      const result = await router.generate({
        provider: 'anthropic',
        systemPrompt: buildBriefSystemPrompt(inputs.org_name),
        userPrompt: buildBriefUserPrompt(inputs),
        orgId,
        temperature: 0.4,
        maxTokens: 400,
      });

      // The router silently falls back to its own generic stub (provider
      // 'stub') on any provider error. That generic stub is NOT grounded, so we
      // only accept the LLM prose when the real provider answered AND it parsed
      // — otherwise we keep our grounded template (§4.2 fallback triggers).
      if (result.provider === 'anthropic') {
        const parsed = parseBriefResponse(result.completion);
        if (parsed) {
          briefText = parsed.brief_text;
          providerUsed = 'anthropic';
        } else {
          logger.warn(
            `Brief LLM parse failure for org ${orgId} — using grounded stub`
          );
        }
      } else {
        logger.warn(
          `Brief LLM unavailable for org ${orgId} — using grounded stub`
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn(`Brief LLM error for org ${orgId}: ${msg} — using stub`);
    }
  }

  const sourceTrace: BriefSourceTrace = {
    proposal_ids: inputs.proposals.map((p) => p.id),
    top_action_proposal_id: topAction?.proposal_id ?? null,
    evi_snapshot_id: inputs.evi_delta?.current_snapshot_id ?? null,
    evi_prior_snapshot_id: inputs.evi_delta?.prior_snapshot_id ?? null,
    citation_summary_id: inputs.citation?.summary_id ?? null,
  };

  const generatedAt = new Date().toISOString();

  // Persist with traceability (§4.5).
  const { data: inserted, error: insertError } = await supabase
    .from('sage_daily_briefs')
    .insert({
      org_id: orgId,
      brief_text: briefText,
      top_action: topAction,
      source_signal_ids: sourceTrace,
      provider_used: providerUsed,
      generated_at: generatedAt,
    })
    .select('id')
    .single();

  if (insertError) {
    logger.error(
      `Failed to persist daily brief for org ${orgId}: ${insertError.message}`
    );
    throw new Error(`Daily brief persist failed: ${insertError.message}`);
  }

  logger.info(
    `Daily brief generated for org ${orgId} (provider: ${providerUsed}, ` +
      `proposals: ${inputs.proposals.length}, evi: ${inputs.evi_delta ? 'yes' : 'no'})`
  );

  return {
    id: (inserted as { id: string } | null)?.id ?? null,
    org_id: orgId,
    brief_text: briefText,
    top_action: topAction,
    source_signal_ids: sourceTrace,
    provider_used: providerUsed,
    generated_at: generatedAt,
  };
}

// ============================================================================
// Input gathering (canon §2) — real rows only
// ============================================================================

/**
 * Gather the canon §2 inputs for an org. Every returned value traces to a real
 * DB row; nothing is synthesized. Exposed for unit testing.
 */
export async function gatherBriefInputs(
  supabase: SupabaseClient,
  orgId: string
): Promise<BriefInputs> {
  const [orgName, proposals, eviDelta, citation] = await Promise.all([
    getOrgName(supabase, orgId),
    getTopProposals(supabase, orgId),
    getEviDelta(supabase, orgId),
    getCitationMovement(supabase, orgId),
  ]);

  // The action-stream top action is pillar-agnostic and sourced from the same
  // prioritized sage_proposals (canon §2). It is the lead item — the highest
  // priority, highest EVI-impact active proposal — which is exactly the head of
  // the ordered proposals list below.
  const topAction: BriefTopAction | null = proposals.top
    ? {
        proposal_id: proposals.top.id,
        title: proposals.top.title,
        pillar: proposals.top.pillar,
        priority: proposals.top.priority,
        deep_link: proposals.top.deep_link,
      }
    : null;

  return {
    org_name: orgName,
    proposals: proposals.summaries,
    top_action: topAction,
    evi_delta: eviDelta,
    citation,
  };
}

/**
 * Honest-empty gate (§4.3). Real signals exist when the org has at least one
 * active proposal OR at least one EVI snapshot. Citation movement alone (no
 * proposals, no snapshot) is not enough to ground a daily brief.
 */
export function hasRealSignals(inputs: BriefInputs): boolean {
  return inputs.proposals.length > 0 || inputs.evi_delta !== null;
}

// ============================================================================
// Helpers
// ============================================================================

async function getOrgName(
  supabase: SupabaseClient,
  orgId: string
): Promise<string> {
  const { data } = await supabase
    .from('orgs')
    .select('name')
    .eq('id', orgId)
    .single();
  return (data as { name: string } | null)?.name || 'Your organization';
}

interface TopProposalRow {
  id: string;
  title: string;
  pillar: string;
  priority: string;
  evi_impact_estimate: number | null;
  deep_link: { href: string; label: string } | null;
}

async function getTopProposals(
  supabase: SupabaseClient,
  orgId: string
): Promise<{
  summaries: BriefProposalInput[];
  top: TopProposalRow | null;
}> {
  // Active proposals, highest priority then highest EVI impact — the same
  // ordering the action-stream uses for its lead item.
  const { data } = await supabase
    .from('sage_proposals')
    .select('id, title, pillar, priority, evi_impact_estimate, deep_link')
    .eq('org_id', orgId)
    .eq('status', 'active')
    .order('priority', { ascending: true })
    .order('evi_impact_estimate', { ascending: false })
    .limit(MAX_BRIEF_PROPOSALS);

  const rows = (data ?? []) as TopProposalRow[];

  // Canonical priority ordering (critical first) — DB string order is not
  // semantic, so sort client-side to guarantee the true top action.
  const priorityRank: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  const sorted = [...rows].sort((a, b) => {
    const pDiff =
      (priorityRank[a.priority] ?? 4) - (priorityRank[b.priority] ?? 4);
    if (pDiff !== 0) return pDiff;
    return (b.evi_impact_estimate ?? 0) - (a.evi_impact_estimate ?? 0);
  });

  const summaries: BriefProposalInput[] = sorted.map((r) => ({
    id: r.id,
    title: r.title,
    pillar: r.pillar,
    priority: r.priority,
    evi_impact_estimate: r.evi_impact_estimate,
  }));

  return { summaries, top: sorted[0] ?? null };
}

async function getEviDelta(
  supabase: SupabaseClient,
  orgId: string
): Promise<BriefEviDelta | null> {
  const { data } = await supabase
    .from('evi_snapshots')
    .select('id, evi_score, calculated_at')
    .eq('org_id', orgId)
    .order('calculated_at', { ascending: false })
    .limit(2);

  const rows = (data ?? []) as Array<{
    id: string;
    evi_score: number;
    calculated_at: string;
  }>;

  if (rows.length === 0) return null;

  const current = rows[0];
  const prior = rows[1] ?? null;
  const currentScore = Number(current.evi_score);
  const priorScore = prior ? Number(prior.evi_score) : null;

  return {
    current_snapshot_id: current.id,
    prior_snapshot_id: prior?.id ?? null,
    current_score: currentScore,
    prior_score: priorScore,
    delta:
      priorScore !== null
        ? Number((currentScore - priorScore).toFixed(2))
        : null,
  };
}

async function getCitationMovement(
  supabase: SupabaseClient,
  orgId: string
): Promise<BriefCitationMovement | null> {
  const { data } = await supabase
    .from('citation_summaries')
    .select('id, mention_rate, total_mentions, total_queries, updated_at')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false })
    .limit(1);

  const rows = (data ?? []) as Array<{
    id: string;
    mention_rate: number | null;
    total_mentions: number;
    total_queries: number;
  }>;

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    summary_id: row.id,
    mention_rate: row.mention_rate !== null ? Number(row.mention_rate) : null,
    total_mentions: Number(row.total_mentions) || 0,
    total_queries: Number(row.total_queries) || 0,
  };
}
