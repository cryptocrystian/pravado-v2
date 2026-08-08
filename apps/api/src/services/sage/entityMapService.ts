/**
 * Entity Map service — canonical concentric Ring 0–3 contract (Wave-2).
 *
 * Emits the canonical Entity Map payload defined by `ENTITY_MAP_SPEC.md` v2.0 and
 * `ENTITY-MAP-SAGE.md` v3.0. This REPLACES the retired zone model (D012): nodes now
 * carry `ring: 0|1|2|3` (Ring 0 Brand Core, Ring 1 Owned/topic clusters, Ring 2
 * Earned/PR, Ring 3 Perceived/AEO) instead of `zone: 'authority'|'growth'|'signal'`.
 *
 * Ring→pillar mapping (canon §2 + ENTITY-MAP-SAGE Ring Definitions):
 *   Ring 0 — Brand Core        — pillar null
 *   Ring 1 — Owned Authority   — SEO/Content → topic CLUSTERS (D017), pillar 'SEO'
 *   Ring 2 — Earned Authority  — PR → journalists/publications,        pillar 'PR'
 *   Ring 3 — Perceived         — AEO → AI engines,                     pillar 'AEO'
 *
 * Coherence fields (the FE ring contract needs these; honest null where a value is
 * not yet derivable — we NEVER fabricate a number or an id):
 *   affinity_score    — REAL. Drives angular position. Derived from relevance /
 *                       engagement / citation-share signals. Brand Core = 100.
 *   authority_weight  — REAL. Drives node size. Ring 1 = aggregate schema coverage
 *                       across the cluster's content pieces; Ring 2 = engagement;
 *                       Ring 3 = citation rate. Brand Core = 100.
 *   entity_insight    — REAL, templated from the node's own measured signals
 *                       (entity-specific + at least one measurable number, ≤160
 *                       chars per D015). No LLM/SAGE generator exists yet, so this
 *                       is a deterministic derivation from real counts — not
 *                       fabricated prose.
 *   linked_action_id  — REAL where an active SAGE proposal matches the gap node's
 *                       pillar + gap category; honest NULL otherwise. The D016 CRAFT
 *                       write-back (SAGE gap_node_detected → Action Stream record →
 *                       linked_action_id) is not yet wired (SAGE→CRAFT stub), so a
 *                       precise entity→proposal FK does not exist; we best-effort
 *                       link to an existing proposal and leave null when none exists.
 *
 * `session_events` is returned as an honestly-empty array: the Ring 2 → Ring 3
 * citation source→perceiver linkage that a SessionCitationEvent requires is not yet
 * captured in citation_monitor_results, so no event can be emitted without fabricating
 * a source. The array is present so the FE contract shape is stable.
 *
 * Org-scoped: every query filters by org_id (service-role client; RLS also enforces
 * org isolation on these tables). Pure data-shaping — no writes, no migration.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { deriveImpactPillars } from './sageImpactPillars';

// --- Canonical contract types (ENTITY-MAP-SAGE.md §TypeScript Data Contract) ----

export type NodeKind =
  | 'brand'
  | 'topic_cluster'
  | 'journalist'
  | 'publication'
  | 'ai_engine';

export type EdgeState =
  | 'verified_solid'
  | 'verified_pending'
  | 'gap'
  | 'in_progress';

export type EdgeRel =
  | 'topic_to_brand'
  | 'earned_from_topic'
  | 'journalist_covers'
  | 'cites_brand'
  | 'journalist_to_ai'
  | 'topic_to_ai';

export type NodePillar = 'PR' | 'SEO' | 'AEO' | null;

export interface EntityNode {
  id: string;
  kind: NodeKind;
  label: string;
  ring: 0 | 1 | 2 | 3;
  pillar: NodePillar;
  affinity_score: number; // 0–100. Drives angular position within ring.
  authority_weight: number; // 0–100. Drives node size.
  connection_status: EdgeState;
  linked_action_id: string | null; // FK to Action Stream. Null when not derivable.
  entity_insight: string | null; // ≤160 chars, entity-specific + measurable.
  impact_pillars: string[];
  last_updated: string;
  meta: Record<string, string | number | boolean | null>;
}

export interface EntityEdge {
  id: string;
  from: string;
  to: string;
  rel: EdgeRel;
  state: EdgeState;
  strength: number; // 0–100. Drives stroke weight.
  pillar: 'PR' | 'SEO' | 'AEO';
  verified_at: string | null;
}

export interface SessionCitationEvent {
  entity_id_source: string;
  entity_id_perceiver: string;
  detected_at: string;
  citation_type: 'direct' | 'paraphrase';
  confidence: number;
}

export interface EntityMapPayload {
  generated_at: string;
  layout_version: 'v3';
  /** Additive/backward-safe carry-over from the prior emitter (non-canonical). */
  layout_seed: string;
  nodes: EntityNode[];
  edges: EntityEdge[];
  session_events: SessionCitationEvent[];
  /** Additive/backward-safe carry-over from the prior emitter (non-canonical). */
  action_impacts: Record<string, unknown>;
}

// --- Helpers -------------------------------------------------------------------

const clamp100 = (n: number): number =>
  Math.max(0, Math.min(100, Math.round(n)));

const truncateInsight = (s: string): string =>
  s.length <= 160 ? s : `${s.slice(0, 157)}...`;

/**
 * Some numeric columns (relevance_score, engagement_score) are stored either on a
 * 0–1 or a 0–100 scale across the codebase. Normalise defensively to 0–100 so
 * affinity/authority never silently collapse to 0.
 */
function toScore100(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return clamp100(n <= 1 ? n * 100 : n);
}

/**
 * Gap-category → candidate SAGE proposal signal_types. Used for the best-effort
 * D016 linkage while the CRAFT entity→proposal write-back remains unwired.
 */
const GAP_SIGNAL_TYPES: Record<'ring1' | 'ring2' | 'ring3', readonly string[]> =
  {
    ring1: ['content_coverage_gap', 'seo_content_gap', 'content_low_citemind'],
    ring2: ['pr_high_value_unpitched', 'pr_stale_followup', 'pr_pitch_window'],
    ring3: ['competitor_citation_gap', 'content_low_citation_rate'],
  };

interface ProposalRow {
  id: string;
  pillar: string;
  signal_type: string;
}

/** Ring 3 canonical AI-engine perceivers (canon §2.4 — all five surfaces). */
const AI_ENGINES: ReadonlyArray<{ id: string; label: string; color: string }> =
  [
    { id: 'perplexity', label: 'Perplexity', color: '#20B2AA' },
    { id: 'chatgpt', label: 'ChatGPT', color: '#10A37F' },
    { id: 'gemini', label: 'Gemini', color: '#4285F4' },
    { id: 'claude', label: 'Claude', color: '#D97706' },
    { id: 'bing_copilot', label: 'Bing Copilot', color: '#0078D4' },
  ];

// --- Core builder --------------------------------------------------------------

/**
 * Build the canonical Ring 0–3 Entity Map payload for an org. Pure data-shaping over
 * the supplied (org-scoped) Supabase client; no writes.
 */
export async function buildEntityMap(
  supabase: SupabaseClient,
  orgId: string,
  orgName: string
): Promise<EntityMapPayload> {
  const now = new Date().toISOString();
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  // Fetch the raw signals for each ring in parallel. All org-scoped.
  const [
    topicsRes,
    clustersRes,
    scoresRes,
    journalistProfilesRes,
    citationsRes,
    proposalsRes,
  ] = await Promise.all([
    supabase
      .from('content_topics')
      .select('id, topic_name, cluster_id, relevance_score, content_item_id')
      .eq('org_id', orgId)
      .limit(500),
    supabase
      .from('content_topic_clusters')
      .select('id, name')
      .eq('org_id', orgId)
      .limit(100),
    supabase
      .from('citemind_scores')
      .select('content_item_id, schema_markup_score, overall_score')
      .eq('org_id', orgId)
      .limit(1000),
    supabase
      .from('journalist_profiles')
      .select('id, journalist_id, engagement_score, relevance_score')
      .eq('org_id', orgId)
      .limit(20),
    supabase
      .from('citation_monitor_results')
      .select('engine, brand_mentioned')
      .eq('org_id', orgId)
      .gte('monitored_at', thirtyDaysAgo),
    supabase
      .from('sage_proposals')
      .select('id, pillar, signal_type')
      .eq('org_id', orgId)
      .eq('status', 'active'),
  ]);

  const topics = (topicsRes.data ?? []) as Array<{
    id: string;
    topic_name: string | null;
    cluster_id: string | null;
    relevance_score: number | null;
    content_item_id: string | null;
  }>;
  const clusterNames = new Map(
    ((clustersRes.data ?? []) as Array<{ id: string; name: string }>).map(
      (c) => [c.id, c.name]
    )
  );
  const schemaByItem = new Map<string, number>();
  for (const s of (scoresRes.data ?? []) as Array<{
    content_item_id: string;
    schema_markup_score: number | null;
    overall_score: number | null;
  }>) {
    const cov = s.schema_markup_score ?? s.overall_score ?? 0;
    schemaByItem.set(s.content_item_id, Number(cov) || 0);
  }
  const proposals = (proposalsRes.data ?? []) as ProposalRow[];

  // Best-effort D016 linkage: first active proposal matching a gap category.
  const findLinkedAction = (
    ring: 'ring1' | 'ring2' | 'ring3'
  ): string | null => {
    const types = GAP_SIGNAL_TYPES[ring];
    const match = proposals.find((p) => types.includes(p.signal_type));
    return match ? match.id : null;
  };

  const nodes: EntityNode[] = [];
  const edges: EntityEdge[] = [];

  const brandId = `n_brand_${orgId}`;

  // -- Ring 0: Brand Core -------------------------------------------------------
  nodes.push({
    id: brandId,
    kind: 'brand',
    label: orgName,
    ring: 0,
    pillar: null,
    affinity_score: 100,
    authority_weight: 100,
    connection_status: 'verified_solid',
    linked_action_id: null,
    entity_insight: null,
    impact_pillars: ['PR', 'Content', 'SEO', 'AEO'],
    last_updated: now,
    meta: {},
  });

  // -- Ring 1: Owned Authority — topic CLUSTERS (D017) --------------------------
  // Aggregate content_topics into clusters. A cluster key is the content
  // topic's cluster_id when set, otherwise the topic_name itself (each distinct
  // topic name is its own single-topic cluster). Nodes are clusters, NOT the
  // individual content pieces — the pieces are aggregated into authority_weight
  // and surfaced (as a count) for progressive disclosure.
  interface ClusterAgg {
    label: string;
    pieceItemIds: Set<string>;
    relevanceSum: number;
    relevanceCount: number;
  }
  const clusters = new Map<string, ClusterAgg>();
  for (const t of topics) {
    const key = t.cluster_id ?? `topic:${t.topic_name ?? t.id}`;
    const label =
      (t.cluster_id ? clusterNames.get(t.cluster_id) : null) ??
      t.topic_name ??
      'Untitled Topic';
    let agg = clusters.get(key);
    if (!agg) {
      agg = {
        label,
        pieceItemIds: new Set(),
        relevanceSum: 0,
        relevanceCount: 0,
      };
      clusters.set(key, agg);
    }
    if (t.content_item_id) agg.pieceItemIds.add(t.content_item_id);
    const rel = toScore100(t.relevance_score);
    if (rel > 0) {
      agg.relevanceSum += rel;
      agg.relevanceCount += 1;
    }
  }

  let clusterIdx = 0;
  for (const [key, agg] of clusters) {
    const nodeId = `n_topic_cluster_${clusterIdx++}`;
    const pieceCount = agg.pieceItemIds.size;
    // authority_weight = aggregate schema coverage across the cluster's pieces.
    let coverageSum = 0;
    let coverageCount = 0;
    for (const itemId of agg.pieceItemIds) {
      if (schemaByItem.has(itemId)) {
        coverageSum += schemaByItem.get(itemId)!;
        coverageCount += 1;
      }
    }
    const authority_weight =
      coverageCount > 0 ? clamp100(coverageSum / coverageCount) : 0;
    const affinity_score =
      agg.relevanceCount > 0
        ? clamp100(agg.relevanceSum / agg.relevanceCount)
        : 0;

    // Insufficient schema coverage → content gap (canon §4 dashed meaning).
    const connection_status: EdgeState =
      authority_weight >= 60
        ? 'verified_solid'
        : authority_weight > 0
          ? 'verified_pending'
          : 'gap';
    const isGap = connection_status === 'gap';

    const insight =
      pieceCount > 0
        ? isGap
          ? `${agg.label} spans ${pieceCount} content ${
              pieceCount === 1 ? 'piece' : 'pieces'
            } with 0% aggregate schema coverage — no structured data for AI ingestion.`
          : `${agg.label} spans ${pieceCount} content ${
              pieceCount === 1 ? 'piece' : 'pieces'
            } at ${authority_weight}% aggregate schema coverage.`
        : `${agg.label} has no published content pieces yet.`;

    nodes.push({
      id: nodeId,
      kind: 'topic_cluster',
      label: agg.label,
      ring: 1,
      pillar: 'SEO',
      affinity_score,
      authority_weight,
      connection_status,
      linked_action_id: isGap ? findLinkedAction('ring1') : null,
      entity_insight: truncateInsight(insight),
      impact_pillars: deriveImpactPillars('SEO', 'schema_coverage'),
      last_updated: now,
      meta: {
        cluster_key: key,
        content_piece_count: pieceCount,
        aggregate_schema_coverage: authority_weight,
      },
    });

    edges.push({
      id: `e_topic_${nodeId}_brand`,
      from: nodeId,
      to: brandId,
      rel: 'topic_to_brand',
      state: connection_status,
      strength: authority_weight,
      pillar: 'SEO',
      verified_at: connection_status === 'verified_solid' ? now : null,
    });
  }

  // -- Ring 2: Earned Authority — journalists (PR) ------------------------------
  const journalistProfiles = (journalistProfilesRes.data ?? []) as Array<{
    id: string;
    journalist_id: string | null;
    engagement_score: number | null;
    relevance_score: number | null;
  }>;
  const journalistIds = journalistProfiles
    .map((j) => j.journalist_id)
    .filter((x): x is string => Boolean(x));
  const nameMap = new Map<string, string>();
  if (journalistIds.length > 0) {
    const { data: names } = await supabase
      .from('journalists')
      .select('id, name')
      .in('id', journalistIds);
    for (const n of (names ?? []) as Array<{ id: string; name: string }>) {
      nameMap.set(n.id, n.name);
    }
  }

  for (const jp of journalistProfiles) {
    const nodeId = `n_journalist_${jp.id}`;
    const name =
      (jp.journalist_id ? nameMap.get(jp.journalist_id) : null) ??
      `Journalist ${jp.id.substring(0, 6)}`;
    const authority_weight = toScore100(jp.engagement_score);
    const affinity_score = toScore100(jp.relevance_score);
    const connection_status: EdgeState =
      authority_weight > 0 ? 'verified_solid' : 'verified_pending';
    const isGap = connection_status !== 'verified_solid';

    nodes.push({
      id: nodeId,
      kind: 'journalist',
      label: name,
      ring: 2,
      pillar: 'PR',
      affinity_score,
      authority_weight,
      connection_status,
      linked_action_id: isGap ? findLinkedAction('ring2') : null,
      entity_insight: truncateInsight(
        `${name} shows a ${authority_weight} engagement score and ${affinity_score} topical relevance to your coverage areas.`
      ),
      impact_pillars: deriveImpactPillars('PR', 'coverage_detected'),
      last_updated: now,
      meta: {
        engagement_score: jp.engagement_score,
        relevance_score: jp.relevance_score,
      },
    });

    edges.push({
      id: `e_journalist_${jp.id}_brand`,
      from: nodeId,
      to: brandId,
      rel: 'journalist_covers',
      state: connection_status,
      strength: authority_weight,
      pillar: 'PR',
      verified_at: connection_status === 'verified_solid' ? now : null,
    });
  }

  // -- Ring 3: Perceived Authority — AI engines (AEO) ---------------------------
  const engineStats: Record<string, { total: number; mentions: number }> = {};
  for (const c of (citationsRes.data ?? []) as Array<{
    engine: string;
    brand_mentioned: boolean;
  }>) {
    if (!engineStats[c.engine])
      engineStats[c.engine] = { total: 0, mentions: 0 };
    engineStats[c.engine].total += 1;
    if (c.brand_mentioned) engineStats[c.engine].mentions += 1;
  }

  for (const engine of AI_ENGINES) {
    const stats = engineStats[engine.id] || { total: 0, mentions: 0 };
    const hasCited = stats.mentions > 0;
    const citationRate =
      stats.total > 0 ? clamp100((stats.mentions / stats.total) * 100) : 0;
    const connection_status: EdgeState = hasCited ? 'verified_solid' : 'gap';

    const insight = hasCited
      ? `${engine.label} cited ${orgName} in ${stats.mentions} of ${stats.total} monitored answers over 30 days.`
      : stats.total > 0
        ? `${engine.label} returned ${stats.total} monitored answers over 30 days with 0 citing ${orgName}.`
        : `${engine.label} has no monitored answers for ${orgName} in the last 30 days.`;

    nodes.push({
      id: `n_ai_${engine.id}`,
      kind: 'ai_engine',
      label: engine.label,
      ring: 3,
      pillar: 'AEO',
      affinity_score: citationRate,
      authority_weight: citationRate,
      connection_status,
      linked_action_id: !hasCited ? findLinkedAction('ring3') : null,
      entity_insight: truncateInsight(insight),
      impact_pillars: deriveImpactPillars('SEO', 'citation'),
      last_updated: now,
      meta: {
        color: engine.color,
        citation_count_30d: stats.mentions,
        total_queries_30d: stats.total,
        has_cited: hasCited,
      },
    });

    edges.push({
      id: `e_ai_${engine.id}_brand`,
      from: `n_ai_${engine.id}`,
      to: brandId,
      rel: 'cites_brand',
      state: connection_status,
      strength: citationRate,
      pillar: 'AEO',
      verified_at: hasCited ? now : null,
    });
  }

  return {
    generated_at: now,
    layout_version: 'v3',
    layout_seed: `${orgId}-${now.split('T')[0]}`,
    nodes,
    edges,
    // Honest empty: SessionCitationEvent needs a Ring 2 source→Ring 3 perceiver
    // linkage that citation_monitor_results does not yet capture. Emitting a
    // fabricated source would violate D013. Present so the FE shape is stable.
    session_events: [],
    action_impacts: {},
  };
}
