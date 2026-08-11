/**
 * SAGE Action Stream Service (Sprint S-INT-03 + Wave-2 loop visibility)
 *
 * Converts sage_proposals into ActionItem-shaped payloads
 * matching the contract at /contracts/examples/action-stream.json.
 *
 * This is the bridge between the SAGE intelligence layer
 * and the Command Center UI.
 *
 * WAVE-2 (loop visibility): each ActionItem now carries its CRAFT execution
 * lifecycle when one exists — `execution_state` (from `sage_executions.state`) and
 * `outcome` (from `sage_outcomes`: success / governed_complete + reason / failure).
 * Both are org-scoped and honestly `null` when the proposal has never been executed.
 * The stream also surfaces recently-`executed` proposals (not only `active` ones) so
 * the full proposal → execution → outcome loop is visible in the Command Center's
 * Active/History buckets. Existing fields are unchanged (additive, backward-compatible).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { createLogger } from '../../lib/logger';

const logger = createLogger('sage:action-stream');

/**
 * CRAFT execution state machine (migration 107 §2 CHECK). Mirrors
 * `sage_executions.state`. Surfaced verbatim so the Command Center can render the
 * exact governed-lifecycle position of an executed proposal.
 */
export type ExecutionLifecycleState =
  | 'proposed'
  | 'queued'
  | 'approved'
  | 'executing'
  | 'completed'
  | 'declined'
  | 'expired'
  | 'rejected'
  | 'failed';

/**
 * Verified/neutral outcome fed back to the proposal (migration 107 §4
 * `sage_outcomes`). `governed_complete` is NEUTRAL (lifecycle finished without a
 * business effect — e.g. a governor refused the send), distinct from a verified
 * business `success`/`failure`. `reason` is a short human-readable summary derived
 * from the outcome detail; `kind` is the raw executor detail kind for the UI.
 */
export interface ActionOutcome {
  result: 'governed_complete' | 'success' | 'failure';
  reason: string | null;
  kind: string | null;
}

// Matches the ActionItem type from CC types.ts
interface ActionStreamItem {
  id: string;
  pillar: 'pr' | 'content' | 'seo';
  type: 'proposal' | 'alert' | 'task';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  summary: string;
  why: string;
  recommended_next_step: string;
  signals: Array<{
    label: string;
    value: string;
    tone: 'positive' | 'neutral' | 'warning' | 'critical';
  }>;
  guardrails: string[];
  evidence: Array<{
    type: 'citation' | 'url' | 'diff' | 'metric';
    label: string;
    value: string;
    url?: string;
  }>;
  deep_link: { label: string; href: string };
  controls: string[];
  confidence: number;
  impact: number;
  mode: 'manual' | 'copilot' | 'autopilot';
  gate: { required: boolean; reason: string | null; min_plan: string | null };
  cta: { primary: string; secondary: string };
  updated_at: string;
  evi_driver: 'visibility' | 'authority' | 'momentum';
  /**
   * Wave-2 loop visibility. `null` when the proposal has no CRAFT execution yet
   * (honest empty). Set to the latest execution's state once `execute` has run.
   */
  execution_state: ExecutionLifecycleState | null;
  /**
   * Wave-2 loop visibility. `null` until the execution reaches a terminal outcome.
   * Carries the governed/verified result + a human-readable reason.
   */
  outcome: ActionOutcome | null;
}

interface ActionStreamResponse {
  generated_at: string;
  items: ActionStreamItem[];
  /**
   * SAGE Daily Brief (D039). The latest persisted grounded narrative for the org,
   * or `null` when none has been generated yet (honest empty — the Situation
   * Brief card renders its empty state). Org-scoped. See sageDailyBriefService.
   */
  daily_brief: string | null;
}

const PILLAR_MAP: Record<string, 'pr' | 'content' | 'seo'> = {
  PR: 'pr',
  Content: 'content',
  SEO: 'seo',
};

/**
 * Canonical DB pillar values keyed by lowercased input. Mirrors the values the
 * signal ingestor writes to `sage_proposals.pillar` (sageSignalIngestor.ts):
 * 'PR' | 'Content' | 'SEO'. Used to normalize the action-stream pillar filter.
 */
const PILLAR_DB_VALUE: Record<string, string> = {
  pr: 'PR',
  content: 'Content',
  seo: 'SEO',
};

const SIGNAL_TYPE_TO_ACTION_TYPE: Record<
  string,
  'proposal' | 'alert' | 'task'
> = {
  pr_stale_followup: 'task',
  pr_high_value_unpitched: 'proposal',
  pr_pitch_window: 'alert',
  content_stale_draft: 'task',
  content_low_quality: 'alert',
  content_coverage_gap: 'proposal',
  seo_position_drop: 'alert',
  seo_opportunity_keyword: 'proposal',
  seo_content_gap: 'proposal',
  content_low_citemind: 'alert',
  content_low_citation_rate: 'alert',
  competitor_citation_gap: 'proposal',
};

const SIGNAL_TYPE_TO_EVI_DRIVER: Record<
  string,
  'visibility' | 'authority' | 'momentum'
> = {
  pr_stale_followup: 'visibility',
  pr_high_value_unpitched: 'visibility',
  pr_pitch_window: 'visibility',
  content_stale_draft: 'momentum',
  content_low_quality: 'authority',
  content_coverage_gap: 'authority',
  seo_position_drop: 'authority',
  seo_opportunity_keyword: 'momentum',
  seo_content_gap: 'authority',
  content_low_citemind: 'authority',
  content_low_citation_rate: 'visibility',
  competitor_citation_gap: 'visibility',
};

const SIGNAL_TYPE_TO_CTA: Record<
  string,
  { primary: string; secondary: string }
> = {
  pr_stale_followup: { primary: 'Send Follow-up', secondary: 'Review' },
  pr_high_value_unpitched: { primary: 'Draft Pitch', secondary: 'Review' },
  pr_pitch_window: { primary: 'Send Pitch', secondary: 'Review' },
  content_stale_draft: { primary: 'Edit Draft', secondary: 'Review' },
  content_low_quality: { primary: 'Improve', secondary: 'Review' },
  content_coverage_gap: { primary: 'Create Content', secondary: 'Review' },
  seo_position_drop: { primary: 'Analyze', secondary: 'Review' },
  seo_opportunity_keyword: { primary: 'Optimize', secondary: 'Review' },
  seo_content_gap: { primary: 'Create Page', secondary: 'Review' },
  content_low_citemind: { primary: 'Improve Content', secondary: 'View Score' },
  content_low_citation_rate: {
    primary: 'Improve AEO',
    secondary: 'View Citations',
  },
  competitor_citation_gap: {
    primary: 'Analyze Gap',
    secondary: 'View Details',
  },
};

// ---------------------------------------------------------------------------
// Wave-2: execution + outcome hydration (loop visibility).
// ---------------------------------------------------------------------------

interface ExecutionRow {
  proposal_id: string;
  state: ExecutionLifecycleState;
  outcome: ActionOutcome['result'] | null;
  outcome_detail: Record<string, unknown> | null;
  created_at: string;
}

interface OutcomeRow {
  proposal_id: string;
  result: ActionOutcome['result'];
  detail: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Derive a short, human-readable reason from an outcome detail. Prefers the
 * executor-supplied `reason`/`note`/`error`, then a per-`kind` phrasing, then a
 * neutral fallback. Never fabricates — only summarises real recorded detail.
 */
function summarizeOutcome(
  result: ActionOutcome['result'],
  detail: Record<string, unknown> | null
): string | null {
  const d = detail ?? {};
  const reason = d.reason;
  const note = d.note;
  const error = d.error;
  if (typeof reason === 'string' && reason.trim()) return reason.trim();
  if (typeof note === 'string' && note.trim()) return note.trim();
  if (typeof error === 'string' && error.trim()) return error.trim();

  const kind = typeof d.kind === 'string' ? d.kind : null;
  const title = typeof d.title === 'string' ? d.title : null;
  const schemaType = typeof d.schema_type === 'string' ? d.schema_type : null;
  const provider = typeof d.provider === 'string' ? d.provider : null;
  const governor = typeof d.governor === 'string' ? d.governor : null;

  switch (kind) {
    case 'content_brief_created':
      return title
        ? `Content brief created: ${title}`
        : 'Content brief created';
    case 'seo_schema_generated':
      return schemaType
        ? `Schema generated: ${schemaType}`
        : 'Structured schema generated';
    case 'pr_pitch_sent':
      return provider ? `Pitch sent via ${provider}` : 'Pitch sent';
    case 'pr_pitch_governed_refusal':
      return governor
        ? `Refused by ${governor} governor`
        : 'Governed refusal — nothing sent';
    default:
      break;
  }

  if (result === 'success') return 'Completed successfully';
  if (result === 'failure') return 'Execution failed';
  return 'Governed completion — no external effect';
}

/**
 * Build the outcome payload for a proposal, preferring the canonical
 * `sage_outcomes` row and falling back to the execution's own recorded outcome
 * (they mirror each other). Returns `null` when the execution has not yet reached
 * a terminal outcome.
 */
function buildOutcome(
  outcomeRow: OutcomeRow | undefined,
  execRow: ExecutionRow | undefined
): ActionOutcome | null {
  if (outcomeRow) {
    return {
      result: outcomeRow.result,
      reason: summarizeOutcome(outcomeRow.result, outcomeRow.detail),
      kind:
        typeof outcomeRow.detail?.kind === 'string'
          ? (outcomeRow.detail.kind as string)
          : null,
    };
  }
  if (execRow?.outcome) {
    return {
      result: execRow.outcome,
      reason: summarizeOutcome(execRow.outcome, execRow.outcome_detail),
      kind:
        typeof execRow.outcome_detail?.kind === 'string'
          ? (execRow.outcome_detail.kind as string)
          : null,
    };
  }
  return null;
}

/**
 * Get the action stream for an org — active + recently-executed proposals mapped to
 * ActionItem format, each hydrated with its CRAFT execution lifecycle + outcome.
 */
export async function getActionStreamForOrg(
  supabase: SupabaseClient,
  orgId: string,
  filters?: { pillar?: string; priority?: string }
): Promise<ActionStreamResponse> {
  let query = supabase
    .from('sage_proposals')
    .select('*')
    .eq('org_id', orgId)
    // Wave-2: surface executed proposals too so the loop (execution + outcome) is
    // visible in the History bucket. Dismissed/expired stay hidden.
    .in('status', ['active', 'executed'])
    .order('priority', { ascending: true })
    .order('evi_impact_estimate', { ascending: false })
    .limit(50);

  if (filters?.pillar) {
    // Canonical DB pillar values as written by the signal ingestor
    // (sageSignalIngestor.ts): 'PR' | 'Content' | 'SEO'. Map explicitly so the
    // filter is robust to input casing. Previously the char-casing produced 'Seo'
    // for 'seo' (S + "eo"), which matched ZERO rows and made SEO surfaces show a
    // false-empty state. Unknown values fall through to the raw input.
    const dbPillar =
      PILLAR_DB_VALUE[filters.pillar.toLowerCase()] ?? filters.pillar;
    query = query.eq('pillar', dbPillar);
  }

  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }

  const { data: proposals, error } = await query;

  if (error) {
    logger.error(
      `Failed to fetch proposals for org ${orgId}: ${error.message}`
    );
    return {
      generated_at: new Date().toISOString(),
      items: [],
      daily_brief: await getLatestDailyBrief(supabase, orgId),
    };
  }

  const proposalRows = (proposals ?? []) as Array<Record<string, unknown>>;
  const proposalIds = proposalRows.map((p) => p.id as string).filter(Boolean);

  // Hydrate the CRAFT execution lifecycle + outcome for these proposals. Both
  // queries are org-scoped (RLS also enforces it) and batched by proposal id.
  const execByProposal = new Map<string, ExecutionRow>();
  const outcomeByProposal = new Map<string, OutcomeRow>();

  if (proposalIds.length > 0) {
    const [execResult, outcomeResult] = await Promise.all([
      supabase
        .from('sage_executions')
        .select('proposal_id, state, outcome, outcome_detail, created_at')
        .eq('org_id', orgId)
        .in('proposal_id', proposalIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('sage_outcomes')
        .select('proposal_id, result, detail, created_at')
        .eq('org_id', orgId)
        .in('proposal_id', proposalIds)
        .order('created_at', { ascending: false }),
    ]);

    // Keep the LATEST execution/outcome per proposal (rows are DESC by created_at).
    for (const row of (execResult.data ?? []) as ExecutionRow[]) {
      if (!execByProposal.has(row.proposal_id)) {
        execByProposal.set(row.proposal_id, row);
      }
    }
    for (const row of (outcomeResult.data ?? []) as OutcomeRow[]) {
      if (!outcomeByProposal.has(row.proposal_id)) {
        outcomeByProposal.set(row.proposal_id, row);
      }
    }
  }

  const items: ActionStreamItem[] = proposalRows.map((p) => {
    const pid = p.id as string;
    const execRow = execByProposal.get(pid);
    const outcomeRow = outcomeByProposal.get(pid);
    return mapProposalToActionItem(p, {
      execution_state: execRow?.state ?? null,
      outcome: buildOutcome(outcomeRow, execRow),
    });
  });

  // Sort: critical first, then high, medium, low
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  items.sort((a, b) => {
    const pDiff =
      (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4);
    if (pDiff !== 0) return pDiff;
    return b.impact - a.impact;
  });

  return {
    generated_at: new Date().toISOString(),
    items,
    // D039: serve the latest persisted daily brief (org-scoped, honest null).
    daily_brief: await getLatestDailyBrief(supabase, orgId),
  };
}

/**
 * Read the latest persisted SAGE Daily Brief text for an org (D039). Org-scoped
 * (and RLS-enforced). Returns `null` when none exists — the Situation Brief card
 * renders its empty state. Never fabricates: a null here is an honest empty.
 */
async function getLatestDailyBrief(
  supabase: SupabaseClient,
  orgId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('sage_daily_briefs')
    .select('brief_text')
    .eq('org_id', orgId)
    .order('generated_at', { ascending: false })
    .limit(1);

  if (error) {
    logger.warn(
      `Failed to read daily brief for org ${orgId}: ${error.message}`
    );
    return null;
  }

  const rows = (data ?? []) as Array<{ brief_text: string | null }>;
  return rows[0]?.brief_text ?? null;
}

function mapProposalToActionItem(
  proposal: Record<string, unknown>,
  lifecycle: {
    execution_state: ExecutionLifecycleState | null;
    outcome: ActionOutcome | null;
  }
): ActionStreamItem {
  const pillar = PILLAR_MAP[proposal.pillar as string] || 'content';
  const signalType = proposal.signal_type as string;
  const signalData =
    (proposal.reasoning_trace as Record<string, unknown>) || {};
  const deepLink = proposal.deep_link as { href: string; label: string } | null;

  // Split rationale into summary + why
  const fullRationale = (proposal.rationale as string) || '';
  const parts = fullRationale.split('\n\nRecommended: ');
  const why = parts[0] || fullRationale;
  const recommendedStep = parts[1] || 'Review this proposal and take action.';

  // Build signals array from signal data
  const signals = buildSignalsFromProposal(proposal);

  return {
    id: proposal.id as string,
    pillar,
    type: SIGNAL_TYPE_TO_ACTION_TYPE[signalType] || 'proposal',
    priority: proposal.priority as 'critical' | 'high' | 'medium' | 'low',
    title: proposal.title as string,
    summary: why.substring(0, 120) + (why.length > 120 ? '...' : ''),
    why,
    recommended_next_step: recommendedStep,
    signals,
    guardrails: [],
    evidence: buildEvidenceFromSignalData(signalData),
    deep_link: deepLink || {
      label: `Open in ${pillar.toUpperCase()}`,
      href: `/app/${pillar}`,
    },
    controls: ['edit'],
    confidence: Number(proposal.confidence) || 0.5,
    impact: Number(proposal.evi_impact_estimate) / 10 || 0.5,
    mode: (proposal.mode as 'manual' | 'copilot' | 'autopilot') || 'copilot',
    gate: { required: false, reason: null, min_plan: null },
    cta: SIGNAL_TYPE_TO_CTA[signalType] || {
      primary: 'Review',
      secondary: 'Dismiss',
    },
    updated_at: (proposal.updated_at as string) || new Date().toISOString(),
    evi_driver: SIGNAL_TYPE_TO_EVI_DRIVER[signalType] || 'momentum',
    execution_state: lifecycle.execution_state,
    outcome: lifecycle.outcome,
  };
}

function buildSignalsFromProposal(proposal: Record<string, unknown>): Array<{
  label: string;
  value: string;
  tone: 'positive' | 'neutral' | 'warning' | 'critical';
}> {
  const signals: Array<{
    label: string;
    value: string;
    tone: 'positive' | 'neutral' | 'warning' | 'critical';
  }> = [];

  const impact = Number(proposal.evi_impact_estimate) || 0;
  signals.push({
    label: 'EVI Impact',
    value: `+${impact.toFixed(1)}`,
    tone: impact >= 3 ? 'positive' : 'neutral',
  });

  const confidence = Number(proposal.confidence) || 0;
  signals.push({
    label: 'Confidence',
    value: `${Math.round(confidence * 100)}%`,
    tone:
      confidence >= 0.7
        ? 'positive'
        : confidence >= 0.5
          ? 'neutral'
          : 'warning',
  });

  const priority = proposal.priority as string;
  signals.push({
    label: 'Priority',
    value: priority.charAt(0).toUpperCase() + priority.slice(1),
    tone:
      priority === 'critical'
        ? 'critical'
        : priority === 'high'
          ? 'warning'
          : 'neutral',
  });

  return signals;
}

function buildEvidenceFromSignalData(
  trace: Record<string, unknown>
): Array<{ type: 'metric'; label: string; value: string }> {
  // Extract key metrics from reasoning trace for display
  const evidence: Array<{ type: 'metric'; label: string; value: string }> = [];

  if (trace.provider) {
    evidence.push({
      type: 'metric',
      label: 'Generated by',
      value: String(trace.provider),
    });
  }
  if (trace.model) {
    evidence.push({
      type: 'metric',
      label: 'Model',
      value: String(trace.model),
    });
  }

  return evidence;
}
