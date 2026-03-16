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

export interface TopicCluster {
  id: string;
  name: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  promptsTracked: number;
  lastUpdated: string;
  engines: { engine: string; score: number }[];
  competitors: { name: string; score: number; isYou?: boolean }[];
  trackedPrompts: { prompt: string; results: Record<string, 'cited' | 'partial' | 'not_cited'> }[];
  ownedCitations: { url: string; count: number }[];
  earnedCitations: { source: string; count: number }[];
  coverageGap?: string;
  recommendations: { type: 'success' | 'warning' | 'idea'; text: string; cta?: string; ctaHref?: string }[];
}

export interface SuggestedCluster {
  name: string;
}

export interface CompetitorProfile {
  name: string;
  evi: number;
  bestEngine: string;
  bestEngineScore: number;
  weakestEngine: string;
  weakestEngineScore: number;
  strongClusters: number;
  gaps: number;
}

export interface TopicComparison {
  topic: string;
  yourScore: number;
  competitorScore: number;
  delta: number;
  status: 'winning' | 'narrow' | 'critical';
}

export interface CompetitorContent {
  title: string;
  citationsPerWeek: number;
  engine: string;
}

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
  if (score >= 85) return 'bg-cc-cyan/10 text-cc-cyan';
  if (score >= 70) return 'bg-emerald-500/10 text-semantic-success';
  if (score >= 50) return 'bg-amber-500/10 text-amber-500';
  return 'bg-red-500/10 text-red-500';
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
// TOPIC CLUSTERS
// ============================================

export const mockClusters: TopicCluster[] = [
  {
    id: 'tc-1',
    name: 'AI Marketing Tools',
    score: 88,
    trend: 'up',
    promptsTracked: 23,
    lastUpdated: '6 hours ago',
    engines: [
      { engine: 'ChatGPT', score: 91 },
      { engine: 'Perplexity', score: 87 },
      { engine: 'Google AI', score: 84 },
      { engine: 'Gemini', score: 76 },
    ],
    competitors: [
      { name: 'Pravado', score: 88, isYou: true },
      { name: 'CompetitorX', score: 79 },
      { name: 'CompetitorY', score: 61 },
      { name: 'CompetitorZ', score: 44 },
    ],
    trackedPrompts: [
      { prompt: 'What are the best AI marketing tools?', results: { ChatGPT: 'cited', Perplexity: 'cited', Gemini: 'cited' } },
      { prompt: 'How do AI tools improve marketing productivity?', results: { ChatGPT: 'cited', Perplexity: 'partial', Gemini: 'cited' } },
      { prompt: 'AI marketing platform comparison', results: { ChatGPT: 'not_cited', Perplexity: 'not_cited', Gemini: 'cited' } },
    ],
    ownedCitations: [
      { url: '/guide/ai-marketing-tools', count: 34 },
      { url: '/blog/ai-visibility-2026', count: 21 },
    ],
    earnedCitations: [
      { source: "TechCrunch: 'AI Tools Landscape'", count: 18 },
    ],
    coverageGap: 'No citations from /product or /pricing pages despite high traffic intent',
    recommendations: [
      { type: 'success', text: 'Strong coverage — maintain publishing cadence' },
      { type: 'warning', text: 'Gemini gap: Add structured FAQ schema to /guide/ai-marketing-tools page', cta: 'View Fix' },
      { type: 'idea', text: "'AI marketing ROI' sub-topic has 0 coverage — high search intent detected", cta: 'Create targeted article', ctaHref: '/app/content/new' },
    ],
  },
  {
    id: 'tc-2',
    name: 'PR Technology',
    score: 74,
    trend: 'up',
    promptsTracked: 15,
    lastUpdated: '12 hours ago',
    engines: [
      { engine: 'ChatGPT', score: 78 },
      { engine: 'Perplexity', score: 72 },
      { engine: 'Google AI', score: 70 },
      { engine: 'Gemini', score: 65 },
    ],
    competitors: [
      { name: 'CompetitorX', score: 83, },
      { name: 'Pravado', score: 74, isYou: true },
      { name: 'CompetitorY', score: 58 },
      { name: 'CompetitorZ', score: 41 },
    ],
    trackedPrompts: [
      { prompt: 'Best PR technology platforms', results: { ChatGPT: 'cited', Perplexity: 'partial', Gemini: 'not_cited' } },
    ],
    ownedCitations: [{ url: '/blog/pr-technology-guide', count: 12 }],
    earnedCitations: [{ source: "Forbes: 'PR Tech Stack'", count: 9 }],
    recommendations: [
      { type: 'warning', text: 'CompetitorX leads by 9 points — increase publishing frequency' },
    ],
  },
  {
    id: 'tc-3',
    name: 'AI Visibility Strategy',
    score: 71,
    trend: 'up',
    promptsTracked: 11,
    lastUpdated: '1 day ago',
    engines: [
      { engine: 'ChatGPT', score: 75 },
      { engine: 'Perplexity', score: 70 },
      { engine: 'Google AI', score: 68 },
      { engine: 'Gemini', score: 62 },
    ],
    competitors: [
      { name: 'CompetitorX', score: 77 },
      { name: 'Pravado', score: 71, isYou: true },
      { name: 'CompetitorY', score: 55 },
      { name: 'CompetitorZ', score: 38 },
    ],
    trackedPrompts: [
      { prompt: 'How to improve AI visibility', results: { ChatGPT: 'cited', Perplexity: 'cited', Gemini: 'partial' } },
    ],
    ownedCitations: [{ url: '/guide/ai-visibility', count: 15 }],
    earnedCitations: [],
    recommendations: [
      { type: 'warning', text: 'Gemini citation rate declining — add schema' },
    ],
  },
  {
    id: 'tc-4',
    name: 'Enterprise AEO',
    score: 23,
    trend: 'down',
    promptsTracked: 8,
    lastUpdated: '3 days ago',
    engines: [
      { engine: 'ChatGPT', score: 28 },
      { engine: 'Perplexity', score: 19 },
      { engine: 'Google AI', score: 22 },
      { engine: 'Gemini', score: 15 },
    ],
    competitors: [
      { name: 'CompetitorX', score: 71 },
      { name: 'CompetitorY', score: 45 },
      { name: 'CompetitorZ', score: 31 },
      { name: 'Pravado', score: 23, isYou: true },
    ],
    trackedPrompts: [
      { prompt: 'Enterprise AEO strategy', results: { ChatGPT: 'not_cited', Perplexity: 'not_cited', Gemini: 'not_cited' } },
    ],
    ownedCitations: [],
    earnedCitations: [],
    coverageGap: 'Zero owned content for this cluster — CompetitorX dominates with 134 citations/week',
    recommendations: [
      { type: 'idea', text: "Create a comprehensive 'Enterprise AEO Guide' — estimated +8-12 EVI pts", cta: 'Create Content', ctaHref: '/app/content/new' },
    ],
  },
  {
    id: 'tc-5',
    name: 'Brand Monitoring',
    score: 54,
    trend: 'down',
    promptsTracked: 9,
    lastUpdated: '2 days ago',
    engines: [
      { engine: 'ChatGPT', score: 58 },
      { engine: 'Perplexity', score: 52 },
      { engine: 'Google AI', score: 51 },
      { engine: 'Gemini', score: 48 },
    ],
    competitors: [
      { name: 'CompetitorX', score: 61 },
      { name: 'Pravado', score: 54, isYou: true },
      { name: 'CompetitorY', score: 42 },
      { name: 'CompetitorZ', score: 35 },
    ],
    trackedPrompts: [
      { prompt: 'AI brand monitoring tools', results: { ChatGPT: 'partial', Perplexity: 'not_cited', Gemini: 'not_cited' } },
    ],
    ownedCitations: [{ url: '/product/citemind', count: 4 }],
    earnedCitations: [],
    recommendations: [
      { type: 'warning', text: 'Score declining — publish dedicated brand monitoring guide' },
    ],
  },
  {
    id: 'tc-6',
    name: 'GEO',
    score: 61,
    trend: 'stable',
    promptsTracked: 7,
    lastUpdated: '1 day ago',
    engines: [
      { engine: 'ChatGPT', score: 65 },
      { engine: 'Perplexity', score: 60 },
      { engine: 'Google AI', score: 58 },
      { engine: 'Gemini', score: 55 },
    ],
    competitors: [
      { name: 'CompetitorX', score: 68 },
      { name: 'Pravado', score: 61, isYou: true },
      { name: 'CompetitorY', score: 49 },
      { name: 'CompetitorZ', score: 37 },
    ],
    trackedPrompts: [],
    ownedCitations: [{ url: '/blog/geo-optimization', count: 8 }],
    earnedCitations: [],
    recommendations: [],
  },
  {
    id: 'tc-7',
    name: 'Content Marketing AI',
    score: 67,
    trend: 'up',
    promptsTracked: 10,
    lastUpdated: '8 hours ago',
    engines: [
      { engine: 'ChatGPT', score: 72 },
      { engine: 'Perplexity', score: 65 },
      { engine: 'Google AI', score: 63 },
      { engine: 'Gemini', score: 59 },
    ],
    competitors: [
      { name: 'CompetitorX', score: 74 },
      { name: 'Pravado', score: 67, isYou: true },
      { name: 'CompetitorY', score: 52 },
      { name: 'CompetitorZ', score: 40 },
    ],
    trackedPrompts: [],
    ownedCitations: [{ url: '/blog/content-marketing-ai', count: 11 }],
    earnedCitations: [],
    recommendations: [],
  },
  {
    id: 'tc-8',
    name: 'Competitor Intelligence',
    score: 45,
    trend: 'up',
    promptsTracked: 5,
    lastUpdated: '2 days ago',
    engines: [
      { engine: 'ChatGPT', score: 50 },
      { engine: 'Perplexity', score: 42 },
      { engine: 'Google AI', score: 44 },
      { engine: 'Gemini', score: 38 },
    ],
    competitors: [
      { name: 'CompetitorX', score: 59 },
      { name: 'Pravado', score: 45, isYou: true },
      { name: 'CompetitorY', score: 38 },
      { name: 'CompetitorZ', score: 29 },
    ],
    trackedPrompts: [],
    ownedCitations: [],
    earnedCitations: [],
    recommendations: [],
  },
];

export const mockSuggestedClusters: SuggestedCluster[] = [
  { name: 'AI-Powered PR Analytics' },
  { name: 'Marketing Attribution AI' },
  { name: 'LLM Brand Monitoring' },
];

// ============================================
// COMPETITORS
// ============================================

export const mockShareOfVoice = [
  { name: 'Pravado', value: 28, fill: '#00E5CC' },
  { name: 'CompetitorX', value: 35, fill: '#8B5CF6' },
  { name: 'CompetitorY', value: 19, fill: '#F59E0B' },
  { name: 'CompetitorZ', value: 11, fill: '#EC4899' },
  { name: 'Others', value: 7, fill: 'rgba(255,255,255,0.2)' },
];

export const mockPravadoProfile: CompetitorProfile = {
  name: 'Pravado',
  evi: 74,
  bestEngine: 'ChatGPT',
  bestEngineScore: 81,
  weakestEngine: 'Gemini',
  weakestEngineScore: 61,
  strongClusters: 5,
  gaps: 3,
};

export const mockCompetitorXProfile: CompetitorProfile = {
  name: 'CompetitorX',
  evi: 81,
  bestEngine: 'Gemini',
  bestEngineScore: 88,
  weakestEngine: 'Perplexity',
  weakestEngineScore: 71,
  strongClusters: 7,
  gaps: 2,
};

export const mockTopicComparisons: TopicComparison[] = [
  { topic: 'AI Marketing Tools', yourScore: 88, competitorScore: 79, delta: 9, status: 'winning' },
  { topic: 'PR Technology', yourScore: 74, competitorScore: 83, delta: -9, status: 'narrow' },
  { topic: 'AI Visibility Strat.', yourScore: 71, competitorScore: 77, delta: -6, status: 'narrow' },
  { topic: 'Enterprise AEO', yourScore: 23, competitorScore: 71, delta: -48, status: 'critical' },
  { topic: 'Brand Monitoring', yourScore: 54, competitorScore: 61, delta: -7, status: 'narrow' },
];

export const mockCompetitorContent: CompetitorContent[] = [
  { title: 'Enterprise guide to AEO', citationsPerWeek: 134, engine: 'ChatGPT' },
  { title: 'AI visibility ROI calculator', citationsPerWeek: 89, engine: 'Perplexity' },
  { title: 'B2B AI marketing benchmark report', citationsPerWeek: 67, engine: 'Gemini' },
];

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
      engineBreakdown: [{ engine: 'ChatGPT', count: 34 }, { engine: 'Perplexity', count: 28 }, { engine: 'Gemini', count: 12 }],
      triggerPrompts: ['What are the best AI marketing tools?', 'AI marketing platform comparison', 'How to choose AI marketing software'],
      recommendation: 'Adding FAQ schema would increase citation frequency by ~40%',
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
      triggerPrompts: ['Best AI tools for marketers', 'AI marketing platform reviews'],
      recommendation: 'Update with 2026 data to maintain Perplexity recency preference',
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
      engineBreakdown: [{ engine: 'ChatGPT', count: 18 }, { engine: 'Perplexity', count: 5 }],
      triggerPrompts: ['AI marketing landscape overview', 'Latest trends in marketing AI'],
      recommendation: 'Pitch author for an updated mention with Pravado product data',
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
      engineBreakdown: [{ engine: 'Gemini', count: 12 }, { engine: 'ChatGPT', count: 6 }],
      triggerPrompts: ['What is AEO?', 'How to optimize for AI engines', 'AEO guide 2026'],
      recommendation: 'Strong performance — add cross-links from PR Technology cluster',
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
      engineBreakdown: [{ engine: 'Perplexity', count: 9 }, { engine: 'ChatGPT', count: 3 }],
      triggerPrompts: ['AI PR technology trends', 'How AI is changing public relations'],
      recommendation: 'Leverage this earned placement — create derivative content',
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
      recommendation: 'Low citation count — add detailed feature comparison table',
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
      recommendation: 'Expand Claude-specific optimization — add structured data',
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
    primaryCtaHref: '/app/content/new?title=Enterprise+AEO+Guide&topic=Enterprise+AEO+Strategy&source=seo',
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
    primaryCtaHref: '/app/content/new?title=AI+Marketing+Tools+Guide+2026&topic=AI+Marketing+Tools&source=seo',
  },
  {
    id: 'rec-5',
    urgency: 'high',
    icon: 'warning',
    title: "Create 'AI Visibility ROI Calculator'",
    badge: 'HIGH',
    meta: "+3\u20135 EVI pts \u00B7 High effort \u00B7 1\u20132 weeks",
    why: "Interactive tools have 3x citation rate of guides on Perplexity. CompetitorY has one. You don't.",
    primaryCta: 'Create Content \u2192',
    primaryCtaHref: '/app/content/new?title=AI+Visibility+ROI+Calculator&topic=AI+Visibility+ROI&source=seo',
  },
];

export const mockMediumCount = 7;
