/**
 * SAGE Action Stream Service (Sprint S-INT-03)
 *
 * Converts sage_proposals into ActionItem-shaped payloads
 * matching the contract at /contracts/examples/action-stream.json.
 *
 * This is the bridge between the SAGE intelligence layer
 * and the Command Center UI.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from '@pravado/utils';

const logger = createLogger('sage:action-stream');

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
  signals: Array<{ label: string; value: string; tone: 'positive' | 'neutral' | 'warning' | 'critical' }>;
  guardrails: string[];
  evidence: Array<{ type: 'citation' | 'url' | 'diff' | 'metric'; label: string; value: string; url?: string }>;
  deep_link: { label: string; href: string };
  controls: string[];
  confidence: number;
  impact: number;
  mode: 'manual' | 'copilot' | 'autopilot';
  gate: { required: boolean; reason: string | null; min_plan: string | null };
  cta: { primary: string; secondary: string };
  updated_at: string;
  evi_driver: 'visibility' | 'authority' | 'momentum';
}

interface ActionStreamResponse {
  generated_at: string;
  items: ActionStreamItem[];
}

const PILLAR_MAP: Record<string, 'pr' | 'content' | 'seo'> = {
  PR: 'pr',
  Content: 'content',
  SEO: 'seo',
};

const SIGNAL_TYPE_TO_ACTION_TYPE: Record<string, 'proposal' | 'alert' | 'task'> = {
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

const SIGNAL_TYPE_TO_EVI_DRIVER: Record<string, 'visibility' | 'authority' | 'momentum'> = {
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

const SIGNAL_TYPE_TO_CTA: Record<string, { primary: string; secondary: string }> = {
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
  content_low_citation_rate: { primary: 'Improve AEO', secondary: 'View Citations' },
  competitor_citation_gap: { primary: 'Analyze Gap', secondary: 'View Details' },
};

/**
 * Get the action stream for an org — active proposals mapped to ActionItem format.
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
    .eq('status', 'active')
    .order('priority', { ascending: true })
    .order('evi_impact_estimate', { ascending: false })
    .limit(50);

  if (filters?.pillar) {
    const dbPillar = filters.pillar.toUpperCase() === 'PR' ? 'PR'
      : filters.pillar.charAt(0).toUpperCase() + filters.pillar.slice(1).toLowerCase();
    query = query.eq('pillar', dbPillar);
  }

  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }

  const { data: proposals, error } = await query;

  if (error) {
    logger.error(`Failed to fetch proposals for org ${orgId}: ${error.message}`);
    return { generated_at: new Date().toISOString(), items: [] };
  }

  const items: ActionStreamItem[] = (proposals ?? []).map((p) => mapProposalToActionItem(p));

  // Sort: critical first, then high, medium, low
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  items.sort((a, b) => {
    const pDiff = (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4);
    if (pDiff !== 0) return pDiff;
    return b.impact - a.impact;
  });

  return {
    generated_at: new Date().toISOString(),
    items,
  };
}

function mapProposalToActionItem(proposal: Record<string, unknown>): ActionStreamItem {
  const pillar = PILLAR_MAP[proposal.pillar as string] || 'content';
  const signalType = proposal.signal_type as string;
  const signalData = (proposal.reasoning_trace as Record<string, unknown>) || {};
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
    deep_link: deepLink || { label: `Open in ${pillar.toUpperCase()}`, href: `/app/${pillar}` },
    controls: ['edit'],
    confidence: Number(proposal.confidence) || 0.5,
    impact: Number(proposal.evi_impact_estimate) / 10 || 0.5,
    mode: (proposal.mode as 'manual' | 'copilot' | 'autopilot') || 'copilot',
    gate: { required: false, reason: null, min_plan: null },
    cta: SIGNAL_TYPE_TO_CTA[signalType] || { primary: 'Review', secondary: 'Dismiss' },
    updated_at: (proposal.updated_at as string) || new Date().toISOString(),
    evi_driver: SIGNAL_TYPE_TO_EVI_DRIVER[signalType] || 'momentum',
  };
}

function buildSignalsFromProposal(
  proposal: Record<string, unknown>
): Array<{ label: string; value: string; tone: 'positive' | 'neutral' | 'warning' | 'critical' }> {
  const signals: Array<{ label: string; value: string; tone: 'positive' | 'neutral' | 'warning' | 'critical' }> = [];

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
    tone: confidence >= 0.7 ? 'positive' : confidence >= 0.5 ? 'neutral' : 'warning',
  });

  const priority = proposal.priority as string;
  signals.push({
    label: 'Priority',
    value: priority.charAt(0).toUpperCase() + priority.slice(1),
    tone: priority === 'critical' ? 'critical' : priority === 'high' ? 'warning' : 'neutral',
  });

  return signals;
}

function buildEvidenceFromSignalData(
  trace: Record<string, unknown>
): Array<{ type: 'metric'; label: string; value: string }> {
  // Extract key metrics from reasoning trace for display
  const evidence: Array<{ type: 'metric'; label: string; value: string }> = [];

  if (trace.provider) {
    evidence.push({ type: 'metric', label: 'Generated by', value: String(trace.provider) });
  }
  if (trace.model) {
    evidence.push({ type: 'metric', label: 'Model', value: String(trace.model) });
  }

  return evidence;
}
