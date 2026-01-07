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

export interface ActionItem {
  id: string;
  pillar: Pillar;
  type: ActionType;
  priority: Priority;
  title: string;
  summary: string;
  confidence: number;
  impact: number;
  mode: Mode;
  gate: ActionGate;
  cta: ActionCTA;
  updated_at: string;
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

// Strategy Panel types
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

export type NarrativeSentiment = 'positive' | 'warning' | 'opportunity';

export interface Narrative {
  id: string;
  title: string;
  body: string;
  sentiment: NarrativeSentiment;
  pillars: Pillar[];
  confidence: number;
}

export interface Recommendation {
  id: string;
  priority: Priority;
  title: string;
  description: string;
  action: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  pillar: Pillar;
}

export interface UpgradeHook {
  id: string;
  pattern: 'blurred_insight' | 'locked_feature';
  min_plan: string;
  feature: string;
  message: string;
  sample_value: string | null;
}

export interface StrategyPanelResponse {
  generated_at: string;
  kpis: KPI[];
  narratives: Narrative[];
  recommendations: Recommendation[];
  upgrade_hooks: UpgradeHook[];
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
