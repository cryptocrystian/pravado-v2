/**
 * SEO/AEO Surface — Types & Mock Data
 *
 * New CiteMind-first surface data. Separate from legacy mock-data.ts.
 */

// ============================================
// TYPES
// ============================================

export interface EVITrendPoint {
  date: string;
  evi: number;
  competitor?: number;
  annotation?: string;
}

export interface EngineScore {
  engine: string;
  score: number;
  delta: number;
  badge?: string;
}

// NOTE: Topic-cluster mock types/data (TopicCluster, SuggestedCluster,
// mockClusters, mockSuggestedClusters) were REMOVED when the Topics surface was
// lit from real SERP-overlap clustering. Clusters now come from /api/seo/topics
// via the useSeoTopics hook (see hooks/useSeoTopics.ts → SeoTopicCluster). The
// rich per-engine / per-competitor / citation-grid fields had no real per-cluster
// source and were deleted rather than faked; "SAGE suggested clusters" had no
// honest source and is omitted entirely. See TopicClusterList.tsx / ClusterDetail.tsx.

// NOTE: Competitor mock types/data (CompetitorProfile, TopicComparison,
// CompetitorContent, mockShareOfVoice, mock*Profile, mockTopicComparisons,
// mockCompetitorContent) were REMOVED when the Competitors surface was lit from
// real DataForSEO SERP data. Share-of-Voice + competitor positions now come from
// /api/seo/competitors; per-competitor EVI/cited-content has no real source and is
// deliberately not faked. See CompetitorComparison.tsx.

export interface CitationRow {
  id: string;
  sourceUrl: string;
  sourceLabel: string;
  type: 'owned' | 'earned';
  engine: string;
  topic: string;
  citationCount: number;
  trend: 'daily' | 'growing' | 'stable' | 'new';
  lastSeen: string;
  detail: {
    startDate: string;
    engineBreakdown: { engine: string; count: number }[];
    triggerPrompts: string[];
    recommendation: string;
    recommendationCta: string;
  };
}

export type RecommendationUrgency = 'critical' | 'high' | 'medium';

export interface Recommendation {
  id: string;
  urgency: RecommendationUrgency;
  icon: 'danger' | 'warning';
  title: string;
  badge: string;
  meta: string;
  why: string;
  primaryCta: string;
  primaryCtaHref?: string;
  secondaryCta?: string;
}

// ============================================
// STATUS HELPERS
// ============================================

export function getClusterStatusLabel(score: number): string {
  if (score >= 85) return 'Strong';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Building';
  return 'Critical';
}

export function getClusterStatusColor(score: number): string {
  if (score >= 85) return 'bg-brand-cyan/10 text-brand-cyan';
  if (score >= 70) return 'bg-emerald-500/10 text-semantic-success';
  if (score >= 50) return 'bg-amber-500/10 text-amber-500';
  return 'bg-semantic-danger/10 text-semantic-danger';
}

export function getEVIStatusColor(score: number): string {
  if (score >= 70) return 'text-semantic-success';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}

export function getEVIStatusLabel(score: number): string {
  if (score >= 70) return 'Good Standing';
  if (score >= 50) return 'Needs Improvement';
  return 'Critical';
}

// ============================================
// EVI OVERVIEW
// ============================================

export const mockEVIScore = 74;
export const mockEVIDelta = 4.2;

export const mockEVITrend: EVITrendPoint[] = [
  { date: 'Feb 1', evi: 70.0 },
  { date: 'Feb 4', evi: 70.8 },
  { date: 'Feb 7', evi: 71.2 },
  { date: 'Feb 10', evi: 72.4, annotation: 'AEO Guide published: +2.3 pts' },
  { date: 'Feb 14', evi: 73.1, annotation: 'Forbes placement: +4.1 pts' },
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

export const mockEngineScores: EngineScore[] = [
  { engine: 'ChatGPT', score: 81, delta: 3.1 },
  { engine: 'Perplexity', score: 69, delta: 5.4, badge: 'Improving fastest' },
  { engine: 'Google AI', score: 72, delta: 1.2 },
  { engine: 'Gemini', score: 61, delta: -0.8, badge: 'Needs attention' },
  { engine: 'Claude', score: 58, delta: 2.0 },
];

export const mockTopTopics = [
  { name: 'AI Marketing Tools', score: 88, trend: 'hot' as const },
  { name: 'PR Technology', score: 74, trend: 'growing' as const },
  { name: 'AI Visibility Strategy', score: 71, trend: 'stable' as const },
  { name: 'Brand Monitoring', score: 54, trend: 'declining' as const },
];

// ============================================
// COMPETITORS — REMOVED (now real DataForSEO SERP data)
// Share-of-Voice + competitor positions come from /api/seo/competitors via the
// useSeoCompetitors hook. Per-competitor EVI head-to-head and "cited-content"
// mock had no real source and were deleted rather than faked.
// ============================================

// ============================================
// CITATIONS
// ============================================

export const mockCitations: CitationRow[] = [
  {
    id: 'cit-1',
    sourceUrl: '/guide/ai-marketing-tools',
    sourceLabel: '/guide/ai-marketing-tools',
    type: 'owned',
    engine: 'ChatGPT',
    topic: 'AI Marketing',
    citationCount: 34,
    trend: 'daily',
    lastSeen: 'Today',
    detail: {
      startDate: 'Feb 1, 2026',
      engineBreakdown: [
        { engine: 'ChatGPT', count: 34 },
        { engine: 'Perplexity', count: 28 },
        { engine: 'Gemini', count: 12 },
      ],
      triggerPrompts: [
        'What are the best AI marketing tools?',
        'AI marketing platform comparison',
        'How to choose AI marketing software',
      ],
      recommendation:
        'Adding FAQ schema would increase citation frequency by ~40%',
      recommendationCta: 'Apply',
    },
  },
  {
    id: 'cit-2',
    sourceUrl: '/guide/ai-marketing-tools',
    sourceLabel: '/guide/ai-marketing-tools',
    type: 'owned',
    engine: 'Perplexity',
    topic: 'AI Marketing',
    citationCount: 28,
    trend: 'daily',
    lastSeen: 'Today',
    detail: {
      startDate: 'Feb 3, 2026',
      engineBreakdown: [{ engine: 'Perplexity', count: 28 }],
      triggerPrompts: [
        'Best AI tools for marketers',
        'AI marketing platform reviews',
      ],
      recommendation:
        'Update with 2026 data to maintain Perplexity recency preference',
      recommendationCta: 'Open in Editor',
    },
  },
  {
    id: 'cit-3',
    sourceUrl: 'https://techcrunch.com/ai-tools-landscape',
    sourceLabel: "TechCrunch: 'AI Tools...'",
    type: 'earned',
    engine: 'ChatGPT',
    topic: 'AI Marketing',
    citationCount: 18,
    trend: 'stable',
    lastSeen: 'Feb 14',
    detail: {
      startDate: 'Jan 20, 2026',
      engineBreakdown: [
        { engine: 'ChatGPT', count: 18 },
        { engine: 'Perplexity', count: 5 },
      ],
      triggerPrompts: [
        'AI marketing landscape overview',
        'Latest trends in marketing AI',
      ],
      recommendation:
        'Pitch author for an updated mention with Pravado product data',
      recommendationCta: 'Create Pitch',
    },
  },
  {
    id: 'cit-4',
    sourceUrl: '/blog/aeo-guide-2026',
    sourceLabel: '/blog/aeo-guide-2026',
    type: 'owned',
    engine: 'Gemini',
    topic: 'AEO',
    citationCount: 12,
    trend: 'daily',
    lastSeen: 'Today',
    detail: {
      startDate: 'Feb 10, 2026',
      engineBreakdown: [
        { engine: 'Gemini', count: 12 },
        { engine: 'ChatGPT', count: 6 },
      ],
      triggerPrompts: [
        'What is AEO?',
        'How to optimize for AI engines',
        'AEO guide 2026',
      ],
      recommendation:
        'Strong performance — add cross-links from PR Technology cluster',
      recommendationCta: 'View Cluster',
    },
  },
  {
    id: 'cit-5',
    sourceUrl: 'https://forbes.com/ai-in-pr',
    sourceLabel: "Forbes: 'AI in PR...'",
    type: 'earned',
    engine: 'Perplexity',
    topic: 'PR Technology',
    citationCount: 9,
    trend: 'growing',
    lastSeen: 'Feb 10',
    detail: {
      startDate: 'Feb 5, 2026',
      engineBreakdown: [
        { engine: 'Perplexity', count: 9 },
        { engine: 'ChatGPT', count: 3 },
      ],
      triggerPrompts: [
        'AI PR technology trends',
        'How AI is changing public relations',
      ],
      recommendation:
        'Leverage this earned placement — create derivative content',
      recommendationCta: 'Create Content',
    },
  },
  {
    id: 'cit-6',
    sourceUrl: '/product/citemind',
    sourceLabel: '/product/citemind',
    type: 'owned',
    engine: 'ChatGPT',
    topic: 'Brand Monitoring',
    citationCount: 4,
    trend: 'stable',
    lastSeen: 'Feb 12',
    detail: {
      startDate: 'Jan 28, 2026',
      engineBreakdown: [{ engine: 'ChatGPT', count: 4 }],
      triggerPrompts: ['AI brand monitoring tools', 'CiteMind AI'],
      recommendation:
        'Low citation count — add detailed feature comparison table',
      recommendationCta: 'Open in Editor',
    },
  },
  {
    id: 'cit-7',
    sourceUrl: 'https://wired.com/ai-visibility',
    sourceLabel: "Wired: 'AI Visibility...'",
    type: 'earned',
    engine: 'Gemini',
    topic: 'AI Visibility',
    citationCount: 7,
    trend: 'new',
    lastSeen: 'Feb 16',
    detail: {
      startDate: 'Feb 16, 2026',
      engineBreakdown: [{ engine: 'Gemini', count: 7 }],
      triggerPrompts: ['AI visibility strategies', 'How to be visible to AI'],
      recommendation: 'New citation source — amplify with social distribution',
      recommendationCta: 'Create Content',
    },
  },
  {
    id: 'cit-8',
    sourceUrl: '/blog/sage-protocol',
    sourceLabel: '/blog/sage-protocol',
    type: 'owned',
    engine: 'Claude',
    topic: 'AEO',
    citationCount: 3,
    trend: 'stable',
    lastSeen: 'Feb 11',
    detail: {
      startDate: 'Feb 8, 2026',
      engineBreakdown: [{ engine: 'Claude', count: 3 }],
      triggerPrompts: ['SAGE protocol AI', 'AI strategy frameworks'],
      recommendation:
        'Expand Claude-specific optimization — add structured data',
      recommendationCta: 'View Fix',
    },
  },
];

// ============================================
// RECOMMENDATIONS
// ============================================

export const mockRecommendations: Recommendation[] = [
  {
    id: 'rec-1',
    urgency: 'critical',
    icon: 'danger',
    title: "Create 'Enterprise AEO Guide'",
    badge: 'CRITICAL',
    meta: '+8\u201312 EVI pts \u00B7 High effort \u00B7 2\u20133 weeks',
    why: "This topic cluster scores 23 vs CompetitorX's 71. Their guide is cited 134x/week on ChatGPT. Closing this gap would be your highest single-impact action.",
    primaryCta: 'Create Content \u2192',
    primaryCtaHref:
      '/app/content/new?title=Enterprise+AEO+Guide&topic=Enterprise+AEO+Strategy&source=seo',
  },
  {
    id: 'rec-2',
    urgency: 'critical',
    icon: 'warning',
    title: 'Add FAQ schema to /guide/ai-marketing-tools',
    badge: 'CRITICAL',
    meta: '+3\u20135 EVI pts \u00B7 Low effort \u00B7 1 hour',
    why: 'Structured FAQ increases Gemini citation rate by ~40% for your current most-cited page. Schema markup is currently missing.',
    primaryCta: 'Copy Fix Instructions \u2192',
  },
  {
    id: 'rec-3',
    urgency: 'critical',
    icon: 'warning',
    title: 'Pitch Sarah Chen (TechCrunch)',
    badge: 'CRITICAL',
    meta: '+4\u20136 EVI pts \u00B7 Low effort \u00B7 30 minutes',
    why: "Sarah's published work appears in 12% of ChatGPT responses for your target topics. She hasn't covered Pravado. A placement in TechCrunch is your fastest path to earned citation authority.",
    primaryCta: 'Create Pitch \u2192',
    primaryCtaHref: '/app/pr/pitches/new?journalist=Sarah+Chen',
  },
  {
    id: 'rec-4',
    urgency: 'high',
    icon: 'warning',
    title: "Update 'AI Marketing Tools' guide with 2026 data",
    badge: 'HIGH',
    meta: '+2\u20134 EVI pts \u00B7 Medium effort \u00B7 3\u20134 hours',
    why: 'Perplexity weights recency strongly. Your guide was last updated Oct 2025. Both CompetitorX and CompetitorY updated theirs in Jan 2026.',
    primaryCta: 'Open in Editor \u2192',
    primaryCtaHref:
      '/app/content/new?title=AI+Marketing+Tools+Guide+2026&topic=AI+Marketing+Tools&source=seo',
  },
  {
    id: 'rec-5',
    urgency: 'high',
    icon: 'warning',
    title: "Create 'AI Visibility ROI Calculator'",
    badge: 'HIGH',
    meta: '+3\u20135 EVI pts \u00B7 High effort \u00B7 1\u20132 weeks',
    why: "Interactive tools have 3x citation rate of guides on Perplexity. CompetitorY has one. You don't.",
    primaryCta: 'Create Content \u2192',
    primaryCtaHref:
      '/app/content/new?title=AI+Visibility+ROI+Calculator&topic=AI+Visibility+ROI&source=seo',
  },
];

export const mockMediumCount = 7;
