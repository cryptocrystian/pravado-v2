/**
 * SEO/AEO Work Surface Types
 *
 * @see /docs/canon/SEO_AEO_PILLAR_CANON.md
 */

export type SEOView = 'overview' | 'aeo' | 'technical' | 'intelligence' | 'exceptions';

export type AutomationMode = 'manual' | 'copilot' | 'autopilot';

// ============================================
// AEO SCORE SYSTEM
// Formula: Entity Clarity 30% + Schema 25% + Semantic Depth 25% + Authority 20%
// Bands: 0-40 red / 41-60 amber / 61-80 green / 81-100 cyan
// ============================================

export interface AEOScoreBreakdown {
  entityClarity: number; // 0-100, weight 30%
  schema: number;        // 0-100, weight 25%
  semanticDepth: number; // 0-100, weight 25%
  authority: number;     // 0-100, weight 20%
}

export function computeAEOScore(breakdown: AEOScoreBreakdown): number {
  return (
    breakdown.entityClarity * 0.3 +
    breakdown.schema * 0.25 +
    breakdown.semanticDepth * 0.25 +
    breakdown.authority * 0.2
  );
}

export function getAEOBandColor(score: number): string {
  if (score <= 40) return 'text-semantic-danger';
  if (score <= 60) return 'text-semantic-warning';
  if (score <= 80) return 'text-semantic-success';
  return 'text-brand-cyan';
}

export function getAEOBandBgColor(score: number): string {
  if (score < 50) return 'bg-brand-cyan/25';
  if (score < 70) return 'bg-brand-cyan/50';
  return 'bg-brand-cyan';
}

export function getAEOBandLabel(score: number): string {
  if (score <= 40) return 'Critical';
  if (score <= 60) return 'Needs Work';
  if (score <= 80) return 'Good';
  return 'Excellent';
}

// ============================================
// MOCK DATA TYPES
// ============================================

export interface SEOAsset {
  id: string;
  url: string;
  title: string;
  aeoScore: number;
  aeoBreakdown: AEOScoreBreakdown;
  schemaStatus: 'complete' | 'partial' | 'missing';
  entityStatus: 'strong' | 'moderate' | 'weak';
  citedBy: string[];
  lastChecked: string;
}

export interface TechnicalFinding {
  id: string;
  category: 'performance' | 'crawlability' | 'indexing' | 'structured-data' | 'mobile' | 'security';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  aeoBridgeImpact: string;
  affectedPages: number;
  fixable: boolean;
}

export interface ActionQueueItem {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  aeoBridgeImpact: string;
  estimatedImpact: number; // AEO points
  layer: 1 | 2 | 3; // SEO layer
  status: 'pending' | 'in_progress' | 'completed';
}

export interface CompetitorData {
  name: string;
  shareOfModel: number;
  trend: number; // delta
}

export interface LayerHealth {
  layer: 1 | 2 | 3;
  label: string;
  score: number;
  status: 'healthy' | 'attention' | 'critical';
  summary: string;
}

export interface SAGEProposal {
  id: string;
  title: string;
  reasoning: string;
  confidence: number; // 0-100
  estimatedAEOImpact: number;
  estimatedEVIImpact: number;
  type: 'schema' | 'entity' | 'technical' | 'content';
  status: 'pending' | 'approved' | 'rejected';
}

export interface AutopilotException {
  id: string;
  title: string;
  attempted: string;
  reason: string;
  requiresDecision: string;
  timestamp: string;
  severity: 'high' | 'medium' | 'low';
}

export interface AutopilotExecution {
  id: string;
  title: string;
  completedAt: string;
  impactDelta: number;
  type: string;
}

// ============================================
// CATEGORY CONFIG
// ============================================

export const FINDING_CATEGORY_CONFIG: Record<TechnicalFinding['category'], { label: string; color: string }> = {
  performance: { label: 'Performance', color: 'bg-brand-amber/10 text-brand-amber border-brand-amber/30' },
  crawlability: { label: 'Crawlability', color: 'bg-brand-magenta/10 text-brand-magenta border-brand-magenta/30' },
  indexing: { label: 'Indexing', color: 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30' },
  'structured-data': { label: 'Schema', color: 'bg-brand-iris/10 text-brand-iris border-brand-iris/30' },
  mobile: { label: 'Mobile', color: 'bg-brand-teal/10 text-brand-teal border-brand-teal/30' },
  security: { label: 'Security', color: 'bg-semantic-danger/10 text-semantic-danger border-semantic-danger/20' },
};

export const SEVERITY_CONFIG: Record<string, { label: string; color: string; order: number }> = {
  critical: { label: 'Critical', color: 'bg-semantic-danger/10 text-semantic-danger border-semantic-danger/20', order: 0 },
  high: { label: 'High', color: 'bg-semantic-warning/10 text-semantic-warning border-semantic-warning/20', order: 1 },
  warning: { label: 'Warning', color: 'bg-semantic-warning/10 text-semantic-warning border-semantic-warning/20', order: 1 },
  medium: { label: 'Medium', color: 'bg-brand-amber/10 text-brand-amber border-brand-amber/30', order: 2 },
  low: { label: 'Low', color: 'bg-white/5 text-white/50 border-white/10', order: 3 },
  info: { label: 'Info', color: 'bg-white/5 text-white/50 border-white/10', order: 3 },
};
