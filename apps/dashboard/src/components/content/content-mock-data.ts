/**
 * Content Surface v2 — Mock Data
 *
 * Realistic hardcoded data for the Content Dashboard, Template Library,
 * SAGE briefs, and entry-point flows. Replaced by API calls in integration sprint.
 */

import type { ContentOverviewData } from './views/ContentOverviewView';

// --- Types ---

export type DocStatus = 'draft' | 'in_progress' | 'review' | 'published' | 'archived';
export type DocType = 'guide' | 'article' | 'comparison' | 'report' | 'landing_page' | 'newsletter';
export type BriefPriority = 'critical' | 'high' | 'medium';
export type TemplateTag = 'High AEO Impact' | 'PR-Ready' | 'SEO-Focused' | 'Quick <500 words';

export interface ContentDocument {
  id: string;
  title: string;
  type: DocType;
  typeLabel: string;
  status: DocStatus;
  citeMindScore: number;
  wordCount: number;
  lastModified: string;
}

export interface SageBrief {
  id: string;
  topic: string;
  contentType: string;
  priority: BriefPriority;
  aeoGap: string;
}

export interface ContentTemplate {
  id: string;
  name: string;
  icon: string;
  tags: TemplateTag[];
  description: string;
  citeMindBoost: string;
}

export interface BrandVoice {
  id: string;
  name: string;
  tone: string;
  sentenceLength: string;
  vocabularyLevel: string;
  perspective: string;
  keyPhrases: string[];
}

export interface KBCategory {
  id: string;
  name: string;
  helper: string;
  fileCount: number;
}

// --- Mock Documents ---

export const mockDocuments: ContentDocument[] = [
  {
    id: 'doc-1',
    title: 'The Complete Guide to AI Visibility in 2026',
    type: 'guide',
    typeLabel: 'Guide',
    status: 'published',
    citeMindScore: 88,
    wordCount: 3200,
    lastModified: 'Feb 18, 2026',
  },
  {
    id: 'doc-2',
    title: 'Why Traditional SEO Is Dead: The AEO Era',
    type: 'article',
    typeLabel: 'Article',
    status: 'published',
    citeMindScore: 79,
    wordCount: 1800,
    lastModified: 'Feb 15, 2026',
  },
  {
    id: 'doc-3',
    title: 'Enterprise AEO: What the Fortune 500 Gets Wrong',
    type: 'article',
    typeLabel: 'Article',
    status: 'draft',
    citeMindScore: 64,
    wordCount: 920,
    lastModified: 'Feb 20, 2026',
  },
  {
    id: 'doc-4',
    title: 'Pravado vs. Cision: A 2026 Comparison',
    type: 'comparison',
    typeLabel: 'Comparison',
    status: 'in_progress',
    citeMindScore: 71,
    wordCount: 2400,
    lastModified: 'Feb 19, 2026',
  },
  {
    id: 'doc-5',
    title: 'PR Technology Benchmark Report 2026',
    type: 'report',
    typeLabel: 'Report',
    status: 'review',
    citeMindScore: 82,
    wordCount: 4100,
    lastModified: 'Feb 17, 2026',
  },
  {
    id: 'doc-6',
    title: 'How to Measure Earned AI Visibility',
    type: 'guide',
    typeLabel: 'Guide',
    status: 'draft',
    citeMindScore: 42,
    wordCount: 650,
    lastModified: 'Feb 21, 2026',
  },
];

// --- Mock SAGE Briefs ---

export const mockBriefs: SageBrief[] = [
  {
    id: 'brief-1',
    topic: 'Enterprise AEO Guide',
    contentType: 'Guide',
    priority: 'critical',
    aeoGap: 'Gap: \u221248 pts vs competitor',
  },
  {
    id: 'brief-2',
    topic: 'AI Visibility ROI: The 2026 Data',
    contentType: 'Article',
    priority: 'high',
    aeoGap: 'Gap: \u221222 pts vs competitor',
  },
];

// --- Mock Templates ---

export const mockTemplates: ContentTemplate[] = [
  {
    id: 'tpl-thought-leadership',
    name: 'Thought Leadership Article',
    icon: 'microphone',
    tags: ['PR-Ready', 'High AEO Impact'],
    description: 'Expert perspective piece. Ideal for executive bylines and media pitching.',
    citeMindBoost: '+12\u201318 pts',
  },
  {
    id: 'tpl-expert-qa',
    name: 'Expert Q&A / Interview',
    icon: 'chat-circle',
    tags: ['High AEO Impact'],
    description: 'Q&A format naturally generates citation-ready FAQ-structured content.',
    citeMindBoost: '+15\u201322 pts',
  },
  {
    id: 'tpl-how-to',
    name: 'How-To Guide',
    icon: 'list-numbers',
    tags: ['High AEO Impact', 'SEO-Focused'],
    description: 'Step-by-step guide format. Highest citation rate on Perplexity and ChatGPT.',
    citeMindBoost: '+18\u201325 pts',
  },
  {
    id: 'tpl-case-study',
    name: 'Case Study',
    icon: 'chart-bar',
    tags: ['PR-Ready'],
    description: 'Proof content with metrics. Strong for conversion and media credibility.',
    citeMindBoost: '+8\u201314 pts',
  },
  {
    id: 'tpl-press-release',
    name: 'Press Release',
    icon: 'newspaper',
    tags: ['PR-Ready'],
    description: 'Announcement format. Structured for distribution and journalist pickup.',
    citeMindBoost: '+5\u201310 pts',
  },
  {
    id: 'tpl-executive-byline',
    name: 'Executive Byline',
    icon: 'pen-nib',
    tags: ['PR-Ready', 'High AEO Impact'],
    description: 'Opinion piece for media placement. Establishes executive authority.',
    citeMindBoost: '+10\u201316 pts',
  },
  {
    id: 'tpl-seo-landing',
    name: 'SEO Landing Page',
    icon: 'magnifying-glass',
    tags: ['SEO-Focused'],
    description: 'Acquisition page optimized for search intent and AI citation.',
    citeMindBoost: '+8\u201312 pts',
  },
  {
    id: 'tpl-newsletter',
    name: 'Newsletter Section',
    icon: 'envelope-simple',
    tags: ['Quick <500 words'],
    description: 'Owned media content for subscriber nurturing.',
    citeMindBoost: '+4\u20138 pts',
  },
];

// --- Template field schemas (for intake forms) ---

export interface IntakeField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multi-text';
  placeholder?: string;
  options?: string[];
  defaultValue?: string;
  required?: boolean;
  count?: number; // for multi-text
  subLabels?: string[]; // for multi-text
}

export const thoughtLeadershipFields: IntakeField[] = [
  {
    name: 'title',
    label: 'Topic / Working Title',
    type: 'text',
    placeholder: 'e.g. Why Traditional SEO Is Dead in the Age of AI',
    required: true,
  },
  {
    name: 'audience',
    label: 'Target Audience',
    type: 'text',
    placeholder: 'e.g. B2B marketing leaders at SaaS companies',
    required: true,
  },
  {
    name: 'thesis',
    label: 'Core Argument (your thesis)',
    type: 'textarea',
    placeholder:
      'e.g. AI search engines have fundamentally changed what content gets seen, and brands that don\u2019t adapt to AEO will lose visibility within 18 months.',
    required: true,
  },
  {
    name: 'supportingPoints',
    label: 'Key Supporting Points',
    type: 'multi-text',
    count: 3,
    subLabels: ['Point 1', 'Point 2', 'Point 3'],
    placeholder: 'e.g. 73% of AI responses cite only 3\u20135 sources per topic cluster',
  },
  {
    name: 'tone',
    label: 'Target Tone',
    type: 'select',
    options: ['Authoritative', 'Conversational', 'Technical', 'Accessible'],
    defaultValue: 'Authoritative',
  },
  {
    name: 'wordCount',
    label: 'Target Word Count',
    type: 'select',
    options: [
      '600\u2013800 (short)',
      '800\u20131200 (medium)',
      '1200\u20132000 (long)',
    ],
    defaultValue: '800\u20131200 (medium)',
  },
];

export const advancedFields: IntakeField[] = [
  {
    name: 'brandVoice',
    label: 'Brand Voice Override',
    type: 'select',
    options: ['Default Voice', 'Executive Voice', 'Technical Blog'],
  },
  {
    name: 'internalLinks',
    label: 'Internal links to include',
    type: 'text',
    placeholder: 'Comma-separated URLs',
  },
  {
    name: 'competitor',
    label: 'Competitor to differentiate from',
    type: 'text',
    placeholder: 'e.g. CompetitorX',
  },
];

// Example outline for right-side preview
export const exampleOutline = [
  'Introduction: Why AI Visibility Matters Now',
  'The Death of Traditional SEO Signals',
  'What AEO Actually Means for B2B Brands',
  'Three Strategies to Increase Citation Rate',
  'Conclusion: The 18-Month Window',
];

// --- Mock Brand Voice ---

export const mockBrandVoice: BrandVoice = {
  id: 'voice-1',
  name: 'Default Voice',
  tone: 'Authoritative / Professional',
  sentenceLength: 'Medium (15\u201322 words avg)',
  vocabularyLevel: 'Advanced \u2014 uses industry terminology naturally',
  perspective: 'First person plural (\u2018we\u2019, \u2018our\u2019)',
  keyPhrases: ['AI visibility', 'earned media', 'citation intelligence'],
};

// ============================================
// CONTENT OVERVIEW EMPTY-STATE DATA
// Used by ContentOverviewView and the new route page.
// All values are zero/empty — real data comes from /api/content/* endpoints.
// TODO: Replace with SWR-fetched data in integration sprint.
// ============================================

export const CONTENT_OVERVIEW_MOCK: ContentOverviewData = {
  avgCiteMindScore: 0,
  citeMindDelta: 0,
  avgCitationEligibility: 0,
  avgAiIngestion: 0,
  avgCrossPillarImpact: 0,

  proposals: [],

  inProgressCount: 0,
  publishedThisMonth: 0,
  topAssetThisMonth: null,
  needsAttentionCount: 0,

  themes: [],

  crossPillarFeed: [],

  recentAssets: [],
};

// --- Knowledge Base Categories ---

export const kbCategories: KBCategory[] = [
  {
    id: 'kb-1',
    name: 'Company Overview',
    helper: 'Who you are, your mission, founding story, team size',
    fileCount: 1,
  },
  {
    id: 'kb-2',
    name: 'Products & Services',
    helper: 'Product names, features, pricing, use cases',
    fileCount: 2,
  },
  {
    id: 'kb-3',
    name: 'Key Statistics & Data',
    helper: 'Customer numbers, case study results, market data you own',
    fileCount: 0,
  },
  {
    id: 'kb-4',
    name: 'Messaging & Positioning',
    helper: 'Brand messages, value propositions, taglines, elevator pitch',
    fileCount: 1,
  },
  {
    id: 'kb-5',
    name: 'Style Guide',
    helper: 'Formatting rules, forbidden phrases, capitalization standards',
    fileCount: 0,
  },
];
