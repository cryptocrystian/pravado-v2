/**
 * Command Center Types
 *
 * Type definitions for Command Center contract payloads.
 * These types mirror the JSON structures in /contracts/examples/
 *
 * @see /contracts/examples/*.json
 */

// Common types
export type Pillar = 'pr' | 'content' | 'seo';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type ActionType = 'proposal' | 'alert' | 'task';
export type Mode = 'manual' | 'copilot' | 'autopilot';
export type Trend = 'up' | 'down' | 'flat';
export type KPIStatus = 'healthy' | 'warning' | 'critical';

// Action Stream types
export interface ActionGate {
  required: boolean;
  reason: string | null;
  min_plan: string | null;
}

export interface ActionCTA {
  primary: string;
  secondary: string;
}

/**
 * Signal for decision-support micro-brief
 * @example { label: "Match", value: "92%", tone: "positive" }
 */
export interface ActionSignal {
  label: string;
  value: string;
  tone: 'positive' | 'neutral' | 'warning' | 'critical';
}

/**
 * Deep link to pillar work surface
 */
export interface ActionDeepLink {
  label: string;
  href: string;
}

/**
 * Evidence for modal investigation
 */
export interface ActionEvidence {
  type: 'citation' | 'url' | 'diff' | 'metric';
  label: string;
  value: string;
  url?: string;
}

/**
 * Modal control types
 * - schedule: Show minimal scheduling UI
 * - edit: Show "Edit in Work Surface" button
 * - assign: Show assignee dropdown (mock)
 */
export type ActionControl = 'schedule' | 'edit' | 'assign';

/**
 * Action Item v3.0 - Decision Support Model
 *
 * Supports:
 * - Hover micro-brief (why, recommended_next_step, signals, guardrails)
 * - Modal investigation (evidence, deep_link, controls)
 * - Execution flow (cta, gate)
 * - EVI attribution (evi_driver for filtering from Strategy Panel)
 */
export interface ActionItem {
  id: string;
  pillar: Pillar;
  type: ActionType;
  priority: Priority;
  title: string;
  /** 1 sentence - shown on card by default */
  summary: string;
  /** 1-3 sentences - shown on hover + modal (decision context) */
  why: string;
  /** 1 sentence - recommended next step */
  recommended_next_step: string;
  /** Up to 3 signals for quick decision support */
  signals: ActionSignal[];
  /** Optional guardrails/warnings */
  guardrails?: string[];
  /** Optional evidence for modal investigation */
  evidence?: ActionEvidence[];
  /** Deep link to pillar work surface */
  deep_link: ActionDeepLink;
  /** Optional controls allowed in modal */
  controls?: ActionControl[];
  confidence: number;
  impact: number;
  mode: Mode;
  gate: ActionGate;
  cta: ActionCTA;
  updated_at: string;
  /** EVI driver this action primarily impacts (for filtering) */
  evi_driver?: EVIDriverType;
}

export interface ActionStreamResponse {
  generated_at: string;
  items: ActionItem[];
  /** SAGE-generated daily brief narrative (optional — empty when no data yet) */
  daily_brief?: string | null;
}

// Intelligence Canvas types (v3 — concentric ring model)
export type NodeKind =
  | 'brand'
  | 'topic_cluster'
  | 'journalist'
  | 'publication'
  | 'ai_engine';

export interface NodeMeta {
  [key: string]: string | number | boolean | null;
}

export interface GraphNode {
  id: string;
  kind: NodeKind;
  label: string;
  meta: NodeMeta;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  rel: string;
  strength: number;
}

export interface Citation {
  id: string;
  platform: string;
  query: string;
  position: number;
  context_quality: number;
  snippet: string;
  source_url: string;
  detected_at: string;
}

export interface IntelligenceCanvasResponse {
  generated_at: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  citation_feed: Citation[];
}

// ============================================
// ENTITY MAP v3 (Concentric Ring Architecture)
// @see /docs/canon/ENTITY_MAP_SPEC.md v2.0
// @see /docs/canon/ENTITY-MAP-SAGE.md v3.0
// ============================================

/**
 * Edge states for Entity Map v3
 * @see ENTITY_MAP_SPEC.md §4 Edge Semantics
 */
export type EdgeState = 'verified_solid' | 'verified_pending' | 'gap' | 'in_progress';

/**
 * Edge relationship types for concentric ring model
 */
export type EdgeRel =
  | 'topic_to_brand'     // Ring 1 → Core
  | 'earned_from_topic'  // Ring 1 → Ring 2
  | 'journalist_covers'  // Ring 2 → Core
  | 'cites_brand'        // Ring 3 → Core
  | 'journalist_to_ai'   // Ring 2 → Ring 3 (cross-ring synergy)
  | 'topic_to_ai';       // Ring 1 → Ring 3 (cross-ring synergy)

/**
 * Entity Node v3 — Concentric ring model
 *
 * ring: 0 = Brand Core (center), 1 = Owned (topic clusters),
 *        2 = Earned (journalists/publications), 3 = Perceived (AI engines)
 *
 * @see ENTITY_MAP_SPEC.md §11 Data Model
 */
export interface EntityNode {
  id: string;
  kind: NodeKind;
  label: string;
  /** Ring placement: 0 (core), 1 (owned), 2 (earned), 3 (perceived) */
  ring: 0 | 1 | 2 | 3;
  /** Pillar for styling — null for brand core */
  pillar: string | null;
  /** Drives angular position within ring (0-100, top = highest) */
  affinity_score: number;
  /** Drives node size (0-100) */
  authority_weight: number;
  /** Current radial edge state */
  connection_status: EdgeState;
  /** FK to Action Stream — null = system error for gap nodes */
  linked_action_id: string | null;
  /** SAGE-generated insight. Max 160 chars. Required for gap nodes. */
  entity_insight: string;
  /** All pillars this node's actions affect */
  impact_pillars: string[];
  last_updated: string;
  meta: Record<string, string | number | boolean | null>;
}

/**
 * Entity Edge v3 — state-driven edge with pillar styling
 * @see ENTITY_MAP_SPEC.md §4 Edge Semantics
 */
export interface EntityEdge {
  id: string;
  from: string;
  to: string;
  rel: EdgeRel;
  /** Visual state of the edge */
  state: EdgeState;
  /** Edge strength 0-100 (drives stroke weight) */
  strength: number;
  /** Pillar for color */
  pillar: string;
  /** ISO timestamp or null if not yet verified */
  verified_at: string | null;
}

/**
 * CiteMind daily scan output — fires on session load (D013)
 * @see ENTITY_MAP_SPEC.md §7 Animation Rules
 */
export interface SessionCitationEvent {
  entity_id_source: string;
  entity_id_perceiver: string;
  detected_at: string;
  citation_type: 'direct' | 'paraphrase';
  confidence: number;
}

/**
 * Entity Map Payload v3 — concentric ring graph data
 */
export interface EntityMapPayload {
  generated_at: string;
  layout_version: 'v3';
  nodes: EntityNode[];
  edges: EntityEdge[];
  session_events: SessionCitationEvent[];
}

/**
 * Action Impact Map - Maps action IDs to affected entities
 * Used for hover highlight and execute pulse animations
 */
export interface ActionImpactMap {
  /** Primary driver node (animation origin) */
  driver_node: string;
  /** All impacted nodes (receive highlight/pulse) */
  impacted_nodes: string[];
  /** All impacted edges (receive highlight/pulse) */
  impacted_edges: string[];
}

// ============================================
// EARNED VISIBILITY INDEX (EVI) - North Star KPI
// @see /docs/canon/EARNED_VISIBILITY_INDEX.md
// ============================================

/**
 * EVI Status Bands
 * - at_risk: 0-40 (Red, urgent)
 * - emerging: 41-60 (Amber, growth focus)
 * - competitive: 61-80 (Cyan, maintenance)
 * - dominant: 81-100 (Green, expansion)
 */
export type EVIStatus = 'at_risk' | 'emerging' | 'competitive' | 'dominant';

/**
 * EVI Driver - One of the three components of EVI
 */
export type EVIDriverType = 'visibility' | 'authority' | 'momentum';

/**
 * Individual metric that contributes to an EVI driver
 */
export interface EVIMetric {
  id: string;
  label: string;
  value: number;
  max_value: number;
  delta_7d: number;
  trend: Trend;
  /** Which EVI driver this metric feeds */
  driver: EVIDriverType;
  /** Brief explanation of what this metric measures */
  description: string;
}

/**
 * EVI Driver breakdown (Visibility, Authority, or Momentum)
 */
export interface EVIDriver {
  type: EVIDriverType;
  label: string;
  score: number;
  weight: number; // 0.40, 0.35, or 0.25
  delta_7d: number;
  trend: Trend;
  /** Metrics that compose this driver */
  metrics: EVIMetric[];
}

/**
 * Earned Visibility Index - The single North Star KPI
 * @see /docs/canon/EARNED_VISIBILITY_INDEX.md
 */
export interface EarnedVisibilityIndex {
  /** Current EVI score (0-100) */
  score: number;
  /** Previous period score for delta calculation */
  previous_score: number;
  /** Change from previous period */
  delta_7d: number;
  delta_30d: number;
  /** Status band based on score */
  status: EVIStatus;
  /** Trend direction */
  trend: Trend;
  /** Sparkline data for mini chart */
  sparkline: number[];
  /** The three drivers that compose EVI */
  drivers: EVIDriver[];
}

// Strategy Panel types (EVI-aligned)
export type NarrativeSentiment = 'positive' | 'warning' | 'opportunity';

/**
 * AI-generated narrative explaining EVI state
 */
export interface Narrative {
  id: string;
  title: string;
  body: string;
  sentiment: NarrativeSentiment;
  /** Which EVI drivers this narrative relates to */
  drivers: EVIDriverType[];
  confidence: number;
}

/**
 * Upgrade hook for gated features
 */
export interface UpgradeHook {
  id: string;
  pattern: 'blurred_insight' | 'locked_feature';
  min_plan: string;
  feature: string;
  message: string;
  sample_value: string | null;
}

/**
 * Top Mover - EVI attribution item for Strategy Panel
 */
export interface TopMover {
  id: string;
  /** Which EVI driver this impacted */
  driver: EVIDriverType;
  /** Points change */
  delta_points: number;
  /** Short reason (1 sentence) */
  reason: string;
  /** Evidence type for icon display */
  evidence_type: 'citation' | 'url' | 'diff' | 'metric';
  /** Deep link to work surface or action */
  deep_link: {
    label: string;
    href: string;
  };
  /** Related action ID for filtering */
  action_id?: string;
  /** Related pillar for filtering */
  pillar: Pillar;
  /** Trend direction */
  trend: Trend;
}

/**
 * EVI Forecast - 30 day projection
 */
export interface EVIForecast {
  current_score: number;
  horizon_days: number;
  baseline: {
    low: number;
    expected: number;
    high: number;
  };
  with_scenarios: {
    low: number;
    expected: number;
    high: number;
  };
  scenarios: ForecastScenario[];
  updated_at: string;
}

export interface ForecastScenario {
  id: string;
  label: string;
  description: string;
  drivers: EVIDriverType[];
  delta_evi: number;
  is_active: boolean;
}

/**
 * Filter state for Action Stream from Strategy Panel
 */
export interface EVIFilterState {
  /** Filter by EVI driver */
  driver?: EVIDriverType;
  /** Filter by pillar */
  pillar?: Pillar;
  /** Source of filter (for UI display) */
  source: 'driver_click' | 'top_mover_click' | 'narrative_click' | 'manual';
  /** Label for filter chip */
  label: string;
}

/**
 * Strategy Panel Response - EVI-centric model
 *
 * The Strategy Panel is DIAGNOSTIC only.
 * It explains EVI state but contains no action buttons.
 * Actions belong in the Action Stream.
 */
export interface StrategyPanelResponse {
  generated_at: string;
  /** The single North Star KPI */
  evi: EarnedVisibilityIndex;
  /** AI-generated narratives explaining EVI movement */
  narratives: Narrative[];
  /** Upgrade hooks for gated insights */
  upgrade_hooks: UpgradeHook[];
  /** Top movers explaining EVI change (7d) */
  top_movers?: TopMover[];
  /** 30-day EVI forecast */
  forecast?: EVIForecast;
}

// Legacy type alias (deprecated - for migration only)
/** @deprecated Use EarnedVisibilityIndex instead */
export interface KPI {
  id: string;
  label: string;
  description: string;
  value: number;
  max_value: number | null;
  delta_7d: number;
  delta_30d: number;
  trend: Trend;
  status: KPIStatus;
  sparkline: number[];
}

// Orchestration Calendar types
export type CalendarStatus =
  | 'planned'
  | 'drafting'
  | 'awaiting_approval'
  | 'scheduled'
  | 'published'
  | 'failed';

export interface CalendarItemLinked {
  action_id: string | null;
  campaign_id: string | null;
}

export interface CalendarItemDetails {
  summary: string;
  owner: 'AI' | 'User';
  risk: 'low' | 'med' | 'high';
  estimated_duration: string | null;
  dependencies: string[];
}

export interface CalendarItem {
  id: string;
  date: string;
  time: string;
  pillar: Pillar;
  title: string;
  status: CalendarStatus;
  mode: Mode;
  linked: CalendarItemLinked;
  details: CalendarItemDetails;
}

export interface CalendarFilters {
  pillars: Pillar[];
  statuses: CalendarStatus[];
  modes: Mode[];
  owners: ('AI' | 'User')[];
}

export interface CalendarSummary {
  total_items: number;
  by_status: Record<CalendarStatus, number>;
  by_pillar: Record<Pillar, number>;
  by_mode: Record<Mode, number>;
}

export interface OrchestrationCalendarResponse {
  range: {
    start: string;
    end: string;
  };
  views: string[];
  default_view: string;
  items: CalendarItem[];
  filters: CalendarFilters;
  summary: CalendarSummary;
}
