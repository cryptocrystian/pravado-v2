/**
 * Command Center v2 — Mock Data
 *
 * Realistic hardcoded data for the redesigned Command Center.
 * Will be replaced by API calls in the integration sprint.
 */

export type ActionPriority = 'critical' | 'high' | 'medium';
export type ActionSurface = 'pr' | 'content' | 'seo';

export interface CCActionItem {
  id: string;
  priority: ActionPriority;
  surface: ActionSurface;
  icon: 'newspaper' | 'envelope-open' | 'file-text' | 'warning';
  title: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
}

export interface SageRecommendation {
  id: string;
  rank: number;
  title: string;
  meta: string;
  cta: string;
}

export interface EngineScore {
  name: string;
  score: number;
  direction: 'up' | 'down';
}

export interface SageSignal {
  id: string;
  emoji: string;
  text: string;
  timestamp: string;
}

export interface OnboardingStep {
  id: string;
  label: string;
  completed: boolean;
  ctaLabel?: string;
}

// --- Data ---

export const situationBriefText =
  'Your EVI rose +1.8 points this week, driven by a TechCrunch article now appearing in ChatGPT responses for your target topics. The Enterprise AEO cluster remains your largest gap \u2014 CompetitorX\u2019s content on this topic is cited 3x more than yours. Two journalists replied to pitches this week. Forbes is actively covering AI visibility platforms right now \u2014 two journalists are researching this topic.';

export const actionQueueItems: CCActionItem[] = [
  {
    id: 'act-1',
    priority: 'critical',
    surface: 'pr',
    icon: 'newspaper',
    title: 'Coverage Detected',
    description: 'Forbes published a piece on AI visibility tools (Feb 17)',
    primaryCta: 'View Coverage',
    secondaryCta: 'Log to Campaign',
  },
  {
    id: 'act-2',
    priority: 'high',
    surface: 'pr',
    icon: 'envelope-open',
    title: '2 Journalist Replies',
    description: 'Sarah Chen + Marcus Webb replied to pitches this week',
    primaryCta: 'View Replies',
    secondaryCta: 'Dismiss',
  },
  {
    id: 'act-3',
    priority: 'high',
    surface: 'content',
    icon: 'file-text',
    title: 'Content Brief Ready',
    description: 'SAGE created a brief for Enterprise AEO Guide',
    primaryCta: 'Create Content',
    secondaryCta: 'View Brief',
  },
  {
    id: 'act-4',
    priority: 'medium',
    surface: 'seo',
    icon: 'warning',
    title: 'FAQ Schema Missing',
    description:
      '/guide/ai-marketing-tools is missing schema markup. Estimated +3 EVI pts',
    primaryCta: 'View Fix Instructions',
    secondaryCta: 'Dismiss',
  },
];

export const sageRecommendations: SageRecommendation[] = [
  {
    id: 'rec-1',
    rank: 1,
    title: "Create 'Enterprise AEO Guide'",
    meta: '+8\u201312 EVI points \u00b7 High effort \u00b7 Creates 30-day moat',
    cta: 'Create Content \u2192',
  },
  {
    id: 'rec-2',
    rank: 2,
    title: 'Pitch Sarah Chen (TechCrunch)',
    meta: '+4\u20136 EVI points \u00b7 Low effort \u00b7 30 minutes',
    cta: 'Create Pitch \u2192',
  },
  {
    id: 'rec-3',
    rank: 3,
    title: 'Add FAQ schema to /guide/ai-marketing-tools',
    meta: '+3\u20135 EVI points \u00b7 Low effort \u00b7 1 hour',
    cta: 'Copy Fix Instructions \u2192',
  },
];

export const eviScore = {
  value: 74,
  delta: 4.2,
  status: 'Good Standing' as const,
};

export const engineScores: EngineScore[] = [
  { name: 'ChatGPT', score: 81, direction: 'up' as const },
  { name: 'Perplexity', score: 69, direction: 'up' as const },
  { name: 'Google AI', score: 72, direction: 'up' as const },
  { name: 'Gemini', score: 61, direction: 'down' as const },
  { name: 'Claude', score: 58, direction: 'up' as const },
];

export const sageSignals: SageSignal[] = [
  {
    id: 'sig-1',
    emoji: '\uD83D\uDD25',
    text: 'TechCrunch: 3 articles on AI visibility tools this week',
    timestamp: '2 hours ago',
  },
  {
    id: 'sig-2',
    emoji: '\uD83D\uDCC8',
    text: "Perplexity citation rate for 'AI marketing' up 18% this week",
    timestamp: 'Today',
  },
  {
    id: 'sig-3',
    emoji: '\uD83C\uDD95',
    text: "CompetitorX published 'AEO for Enterprise' \u2014 already being cited",
    timestamp: 'Yesterday',
  },
  {
    id: 'sig-4',
    emoji: '\uD83D\uDC4B',
    text: 'Sarah Chen is writing about AI tools \u2014 prime time to pitch',
    timestamp: '3 days ago',
  },
  {
    id: 'sig-5',
    emoji: '\u2705',
    text: 'Your Forbes placement drove +4.1 EVI points this month',
    timestamp: 'Feb 14',
  },
];

export const onboardingSteps: OnboardingStep[] = [
  { id: 'ob-1', label: 'Brand profile created', completed: true },
  { id: 'ob-2', label: 'First topic cluster added', completed: true },
  { id: 'ob-3', label: 'Add your Brand Voice', completed: false, ctaLabel: 'Do this \u2192' },
  { id: 'ob-4', label: 'Add 3 target journalists', completed: false, ctaLabel: 'Do this \u2192' },
  {
    id: 'ob-5',
    label: 'Connect your website for CiteMind',
    completed: false,
    ctaLabel: 'Do this \u2192',
  },
];
