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
}

// Intelligence Canvas types
export type NodeKind =
  | 'brand'
  | 'journalist'
  | 'outlet'
  | 'ai_model'
  | 'topic'
  | 'competitor';

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
// ENTITY MAP (SAGE-Native)
// @see /docs/canon/ENTITY-MAP-SAGE.md
// ============================================

/**
 * Zone-based positioning for SAGE-native layout
 */
export type EntityZone = 'authority' | 'signal' | 'growth' | 'exposure';

/**
 * Entity Node - SAGE-native node with zone positioning
 */
export interface EntityNode {
  id: string;
  kind: NodeKind;
  label: string;
  /** SAGE zone for layout positioning */
  zone: EntityZone;
  /** Pillar for styling */
  pillar: Pillar;
  meta: NodeMeta;
}

/**
 * Edge relationship types for Entity Map
 */
export type EdgeRel =
  | 'covers'       // journalist → topic/brand
  | 'writes_for'   // journalist → outlet
  | 'competes'     // competitor → brand
  | 'competes_on'  // competitor → topic
  | 'cited_by'     // brand → ai_model
  | 'mentioned_in' // brand → outlet
  | 'authority_on' // brand → topic
  | 'relates_to';  // topic → topic

/**
 * Entity Edge - SAGE-native edge with pillar styling
 */
export interface EntityEdge {
  id: string;
  from: string;
  to: string;
  rel: EdgeRel;
  /** Edge strength 0-1 */
  strength: number;
  /** Pillar for styling */
  pillar: Pillar;
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

/**
 * Entity Map Response - SAGE-native graph payload
 */
export interface EntityMapResponse {
  generated_at: string;
  /** Deterministic layout seed for stable positioning */
  layout_seed: string;
  nodes: EntityNode[];
  edges: EntityEdge[];
  /** Maps action IDs to their entity impacts */
  action_impacts: Record<string, ActionImpactMap>;
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
