/**
 * Analytics Surface — Types & Mock Data
 *
 * New cross-pillar analytics surface data.
 */

// ============================================
// EVI TREND (shared with overview + growth chart)
// ============================================

export interface EVITrendPoint {
  date: string;
  evi: number;
  competitor?: number;
  annotation?: string;
}

export const mockEVITrend: EVITrendPoint[] = [
  { date: 'Feb 1', evi: 70.0 },
  { date: 'Feb 4', evi: 70.8 },
  { date: 'Feb 7', evi: 71.2 },
  { date: 'Feb 10', evi: 72.4, annotation: 'AEO Guide published' },
  { date: 'Feb 14', evi: 73.1, annotation: 'Forbes placement' },
  { date: 'Feb 18', evi: 74.2 },
];

export const mockCompetitorTrend: EVITrendPoint[] = [
  { date: 'Feb 1', evi: 78.0 },
  { date: 'Feb 4', evi: 78.5 },
  { date: 'Feb 7', evi: 79.1 },
  { date: 'Feb 10', evi: 79.8 },
  { date: 'Feb 14', evi: 80.2 },
  { date: 'Feb 18', evi: 81.0 },
];

// ============================================
// HEADLINE METRICS
// ============================================

export const mockHeadlineMetrics = {
  eviChange: { value: '+4.2 pts', from: 74, to: 78.2, period: 'last 30 days' },
  contentPublished: { value: 8, goal: 10 },
  earnedPlacements: { value: 3, goal: 5 },
  totalCitations: { value: 247, deltaPercent: 23 },
};

// ============================================
// ATTRIBUTION
// ============================================

export const mockAttribution = [
  { label: 'Content', percent: 58, color: 'bg-violet-400' },
  { label: 'PR/Earned', percent: 31, color: 'bg-blue-400' },
  { label: 'Technical', percent: 11, color: 'bg-cc-cyan' },
];

// ============================================
// TOP WINS
// ============================================

export const mockTopWins = [
  'TechCrunch placement drove +4.1 EVI points \u2014 highest single-action lift this period',
  "'AI Visibility Guide' now appears in 34% of ChatGPT responses for your target cluster",
  'Gemini score improved from 56 \u2192 67 through combined schema fix + new content',
];

// ============================================
// CONTENT PERFORMANCE
// ============================================

export interface ContentRow {
  title: string;
  type: string;
  citeMind: number;
  citations: number | null;
  eviLift: string;
  earned?: boolean;
  trend: 'up' | 'down' | 'stable' | 'hot';
}

export const mockContentRows: ContentRow[] = [
  { title: 'Complete Guide to AI Visibility 2026', type: 'Guide', citeMind: 88, citations: 247, eviLift: '+3.1 pts', trend: 'up' },
  { title: 'AI Marketing Tools Comparison', type: 'Article', citeMind: 79, citations: 134, eviLift: '+2.2 pts', trend: 'up' },
  { title: 'PR Technology Overview', type: 'Article', citeMind: 71, citations: 67, eviLift: '+1.4 pts', trend: 'stable' },
  { title: 'Executive Byline: Forbes', type: 'Byline', citeMind: 83, citations: null, eviLift: '+4.1 pts (earned)', earned: true, trend: 'hot' },
  { title: 'How to Track AI Citations', type: 'Guide', citeMind: 74, citations: 89, eviLift: '+1.8 pts', trend: 'up' },
  { title: "Enterprise AEO: What's Missing", type: 'Draft', citeMind: 64, citations: 12, eviLift: '+0.4 pts', trend: 'down' },
];

// Citation velocity (top 3 content pieces, 6 time points)
export const mockCitationVelocity = [
  { date: 'Feb 1', piece1: 18, piece2: 10, piece3: 4 },
  { date: 'Feb 5', piece1: 22, piece2: 14, piece3: 7 },
  { date: 'Feb 9', piece1: 28, piece2: 18, piece3: 9 },
  { date: 'Feb 13', piece1: 34, piece2: 21, piece3: 11 },
  { date: 'Feb 17', piece1: 38, piece2: 26, piece3: 14 },
  { date: 'Feb 21', piece1: 42, piece2: 31, piece3: 16 },
];

export const mockContentGaps = [
  { label: 'Enterprise AEO: 0 pieces owned \u00B7 \u221248 pts gap vs CompetitorX', cta: 'Create content' },
  { label: 'AI Visibility ROI: 0 pieces \u00B7 High search intent detected', cta: 'Create content' },
];

// ============================================
// PR PLACEMENTS
// ============================================

export interface PlacementRow {
  publication: string;
  headline: string;
  date: string;
  reach: string;
  eviLift: string;
  pending?: boolean;
}

export const mockPlacements: PlacementRow[] = [
  { publication: 'TechCrunch', headline: 'Why AI Is Reshaping PR', date: 'Feb 14', reach: '2.4M', eviLift: '+4.1 pts' },
  { publication: 'Forbes', headline: 'The AEO Opportunity', date: 'Feb 10', reach: '3.1M', eviLift: '+0.8 pts' },
  { publication: 'VentureBeat', headline: 'AI Tools for PR', date: 'Feb 6', reach: '0.9M', eviLift: '+0.3 pts' },
  { publication: 'Wired', headline: 'AI Visibility Platforms', date: 'Jan 30', reach: '4.2M', eviLift: 'Pending', pending: true },
  { publication: 'MIT Tech Review', headline: 'PR Tech 2026', date: 'Jan 22', reach: '1.1M', eviLift: '+1.4 pts' },
];

export const mockPitchFunnel = { sent: 12, replies: 3, placements: 3 };

export const mockPRSummary = {
  placements: 3,
  reach: '8.4M est.',
  eviFromPR: '+5.2 pts',
};

// ============================================
// SEO ANALYTICS
// ============================================

export const mockSEOSummary = {
  evi: { value: 74.2, delta: '+4.2 pts' },
  shareOfVoice: { value: '28%', delta: '+3.1%' },
  totalCitations: { value: 247, delta: '+23%' },
  topicsWinning: { value: '5/8' },
};

export interface TopicPerformanceRow {
  topic: string;
  startScore: number;
  endScore: number;
  delta: number;
  leader: string;
  gapToLeader: number | null;
  isYou?: boolean;
}

export const mockTopicPerformance: TopicPerformanceRow[] = [
  { topic: 'AI Marketing Tools', startScore: 80, endScore: 88, delta: 8, leader: 'You', gapToLeader: null, isYou: true },
  { topic: 'PR Technology', startScore: 68, endScore: 74, delta: 6, leader: 'CompetitorX', gapToLeader: -9 },
  { topic: 'AI Visibility Strategy', startScore: 65, endScore: 71, delta: 6, leader: 'CompetitorX', gapToLeader: -6 },
  { topic: 'Enterprise AEO', startScore: 21, endScore: 23, delta: 2, leader: 'CompetitorX', gapToLeader: -48 },
  { topic: 'Brand Monitoring', startScore: 58, endScore: 54, delta: -4, leader: 'CompetitorY', gapToLeader: -7 },
];

// Engine trend lines (5 engines, 6 time points)
export const mockEngineTrend = [
  { date: 'Feb 1', ChatGPT: 78, Perplexity: 64, GoogleAI: 71, Gemini: 62, Claude: 56 },
  { date: 'Feb 5', ChatGPT: 79, Perplexity: 65, GoogleAI: 71, Gemini: 62, Claude: 56 },
  { date: 'Feb 9', ChatGPT: 80, Perplexity: 67, GoogleAI: 72, Gemini: 61, Claude: 57 },
  { date: 'Feb 13', ChatGPT: 80, Perplexity: 68, GoogleAI: 72, Gemini: 61, Claude: 57 },
  { date: 'Feb 17', ChatGPT: 81, Perplexity: 69, GoogleAI: 72, Gemini: 61, Claude: 58 },
  { date: 'Feb 21', ChatGPT: 81, Perplexity: 69, GoogleAI: 72, Gemini: 61, Claude: 58 },
];

// ============================================
// REPORTS TEMPLATES
// ============================================

export const mockReportTemplates = [
  { title: 'Monthly Executive Summary', desc: '2-page overview: headline metrics, top wins, next actions' },
  { title: 'PR Campaign Report', desc: 'Coverage placements, reach, and EVI attribution' },
  { title: 'Board / Investor Update', desc: 'High-level AI visibility trend and competitive position' },
  { title: 'Client Report', desc: 'Full detail with custom branding (Agency plan)' },
];

// ============================================
// HELPERS
// ============================================

export function getCiteMindColor(score: number): string {
  if (score >= 85) return 'text-cc-cyan';
  if (score >= 70) return 'text-semantic-success';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}
