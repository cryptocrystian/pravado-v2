/**
 * SEO/AEO Mock Data
 *
 * Shared mock data for all three SEO mode views.
 * All timestamps are stable to avoid hydration mismatch.
 *
 * @see /docs/canon/SEO_AEO_PILLAR_CANON.md
 */

import type {
  SEOAsset,
  TechnicalFinding,
  ActionQueueItem,
  CompetitorData,
  LayerHealth,
  SAGEProposal,
  AutopilotException,
  AutopilotExecution,
} from './types';

// ============================================
// SHARE OF MODEL
// ============================================

export const MOCK_SHARE_OF_MODEL = {
  brand: 18.4,
  trend: 2.3,
  period: '30d',
};

export const MOCK_COMPETITORS: CompetitorData[] = [
  { name: 'CompetitorA', shareOfModel: 24.1, trend: -1.2 },
  { name: 'CompetitorB', shareOfModel: 21.8, trend: 0.5 },
  { name: 'Your Brand', shareOfModel: 18.4, trend: 2.3 },
  { name: 'CompetitorC', shareOfModel: 15.2, trend: -0.8 },
  { name: 'CompetitorD', shareOfModel: 11.6, trend: 1.1 },
];

// ============================================
// THREE-LAYER HEALTH
// ============================================

export const MOCK_LAYER_HEALTH: LayerHealth[] = [
  {
    layer: 1,
    label: 'SEO Health',
    score: 78,
    status: 'healthy',
    summary: '3 critical issues, 12 warnings. Core Web Vitals passing.',
  },
  {
    layer: 2,
    label: 'AEO Readiness',
    score: 54,
    status: 'attention',
    summary: '42% of pages have complete schema. Entity coverage at 61%.',
  },
  {
    layer: 3,
    label: 'Share of Model',
    score: 18,
    status: 'attention',
    summary: '18.4% SoM across tracked queries. Trailing leader by 5.7pts.',
  },
];

// ============================================
// SEO ASSETS (AEO TAB)
// ============================================

export const MOCK_SEO_ASSETS: SEOAsset[] = [
  {
    id: 'seo-1',
    url: '/blog/marketing-automation-guide',
    title: 'Ultimate Guide to Marketing Automation',
    aeoScore: 82,
    aeoBreakdown: { entityClarity: 90, schema: 85, semanticDepth: 78, authority: 72 },
    schemaStatus: 'complete',
    entityStatus: 'strong',
    citedBy: ['ChatGPT', 'Perplexity'],
    lastChecked: '2026-02-19T10:00:00Z',
  },
  {
    id: 'seo-2',
    url: '/blog/content-strategy-2026',
    title: 'Content Strategy Best Practices for 2026',
    aeoScore: 56,
    aeoBreakdown: { entityClarity: 65, schema: 40, semanticDepth: 60, authority: 55 },
    schemaStatus: 'partial',
    entityStatus: 'moderate',
    citedBy: ['Perplexity'],
    lastChecked: '2026-02-18T14:00:00Z',
  },
  {
    id: 'seo-3',
    url: '/blog/lead-gen-case-study',
    title: 'Case Study: How Acme Corp Increased Leads by 300%',
    aeoScore: 71,
    aeoBreakdown: { entityClarity: 75, schema: 80, semanticDepth: 65, authority: 60 },
    schemaStatus: 'complete',
    entityStatus: 'moderate',
    citedBy: ['Gemini'],
    lastChecked: '2026-02-19T08:00:00Z',
  },
  {
    id: 'seo-4',
    url: '/resources/seo-checklist',
    title: 'SEO Checklist for AI Visibility',
    aeoScore: 38,
    aeoBreakdown: { entityClarity: 30, schema: 20, semanticDepth: 50, authority: 55 },
    schemaStatus: 'missing',
    entityStatus: 'weak',
    citedBy: [],
    lastChecked: '2026-02-17T16:00:00Z',
  },
  {
    id: 'seo-5',
    url: '/blog/pr-coverage-strategy',
    title: 'Building PR Coverage That AI Models Notice',
    aeoScore: 64,
    aeoBreakdown: { entityClarity: 70, schema: 55, semanticDepth: 68, authority: 60 },
    schemaStatus: 'partial',
    entityStatus: 'moderate',
    citedBy: ['ChatGPT'],
    lastChecked: '2026-02-19T12:00:00Z',
  },
  {
    id: 'seo-6',
    url: '/about/company',
    title: 'About Our Company',
    aeoScore: 45,
    aeoBreakdown: { entityClarity: 55, schema: 30, semanticDepth: 40, authority: 55 },
    schemaStatus: 'partial',
    entityStatus: 'moderate',
    citedBy: [],
    lastChecked: '2026-02-18T09:00:00Z',
  },
];

// ============================================
// TECHNICAL FINDINGS
// ============================================

export const MOCK_TECHNICAL_FINDINGS: TechnicalFinding[] = [
  {
    id: 'tf-1',
    category: 'structured-data',
    severity: 'critical',
    title: 'Missing Organization schema on homepage',
    description: '12 pages lack Organization JSON-LD, reducing entity recognition by AI models.',
    aeoBridgeImpact: 'Directly limits entity clarity score. AI models cannot confidently attribute content to your brand.',
    affectedPages: 12,
    fixable: true,
  },
  {
    id: 'tf-2',
    category: 'performance',
    severity: 'critical',
    title: 'LCP exceeds 4.0s on 8 pages',
    description: 'Largest Contentful Paint is above Core Web Vitals threshold on key landing pages.',
    aeoBridgeImpact: 'Poor performance reduces crawl frequency. Less frequent indexing delays AI model updates.',
    affectedPages: 8,
    fixable: true,
  },
  {
    id: 'tf-3',
    category: 'crawlability',
    severity: 'warning',
    title: 'Orphaned pages detected',
    description: '5 content pages have no internal links pointing to them.',
    aeoBridgeImpact: 'Orphaned pages are rarely crawled, preventing AI systems from discovering and citing your content.',
    affectedPages: 5,
    fixable: true,
  },
  {
    id: 'tf-4',
    category: 'structured-data',
    severity: 'warning',
    title: 'Incomplete FAQ schema on 3 pages',
    description: 'FAQ pages have partial schema — missing answer fields.',
    aeoBridgeImpact: 'FAQ schema directly feeds AI answer generation. Incomplete schema reduces citation probability.',
    affectedPages: 3,
    fixable: true,
  },
  {
    id: 'tf-5',
    category: 'indexing',
    severity: 'warning',
    title: 'Duplicate meta descriptions on blog posts',
    description: '7 blog posts share identical meta descriptions.',
    aeoBridgeImpact: 'Duplicate metadata confuses AI retrieval systems, diluting topical authority signals.',
    affectedPages: 7,
    fixable: true,
  },
  {
    id: 'tf-6',
    category: 'mobile',
    severity: 'info',
    title: 'Viewport issues on 2 legacy pages',
    description: 'Two older pages have viewport configuration warnings.',
    aeoBridgeImpact: 'Minor — mobile usability primarily affects traditional search ranking, limited AEO impact.',
    affectedPages: 2,
    fixable: true,
  },
  {
    id: 'tf-7',
    category: 'security',
    severity: 'info',
    title: 'Mixed content warnings',
    description: '1 page loads HTTP resources over HTTPS.',
    aeoBridgeImpact: 'Security signals contribute to domain trust. Low individual impact but compounds over time.',
    affectedPages: 1,
    fixable: true,
  },
];

// ============================================
// ACTION QUEUE (Manual mode)
// ============================================

export const MOCK_ACTION_QUEUE: ActionQueueItem[] = [
  {
    id: 'aq-1',
    title: 'Add Organization schema to homepage',
    description: 'Generate and deploy Organization JSON-LD to improve entity recognition.',
    severity: 'critical',
    aeoBridgeImpact: '+8 AEO pts. Entity Clarity score will improve by ~15pts across 12 pages.',
    estimatedImpact: 8,
    layer: 2,
    status: 'pending',
  },
  {
    id: 'aq-2',
    title: 'Fix LCP on top landing pages',
    description: 'Optimize images and defer non-critical scripts on 8 affected pages.',
    severity: 'critical',
    aeoBridgeImpact: '+3 AEO pts. Improved crawl frequency leads to faster AI model updates.',
    estimatedImpact: 3,
    layer: 1,
    status: 'pending',
  },
  {
    id: 'aq-3',
    title: 'Complete FAQ schema on support pages',
    description: 'Add missing answer fields to FAQ schema on 3 pages.',
    severity: 'high',
    aeoBridgeImpact: '+5 AEO pts. FAQ schema directly feeds AI answer generation.',
    estimatedImpact: 5,
    layer: 2,
    status: 'pending',
  },
  {
    id: 'aq-4',
    title: 'Fix orphaned content pages',
    description: 'Add internal links to 5 orphaned content pages.',
    severity: 'medium',
    aeoBridgeImpact: '+2 AEO pts. Improved discoverability for AI crawlers.',
    estimatedImpact: 2,
    layer: 1,
    status: 'in_progress',
  },
  {
    id: 'aq-5',
    title: 'Deduplicate meta descriptions',
    description: 'Write unique meta descriptions for 7 blog posts.',
    severity: 'medium',
    aeoBridgeImpact: '+2 AEO pts. Clearer topical signals for AI retrieval systems.',
    estimatedImpact: 2,
    layer: 1,
    status: 'pending',
  },
];

// ============================================
// SAGE PROPOSALS (Copilot mode)
// ============================================

export const MOCK_SAGE_PROPOSALS: SAGEProposal[] = [
  {
    id: 'sp-1',
    title: 'Deploy Organization schema across all pages',
    reasoning: 'Entity clarity is the highest-weight AEO factor (30%). Your brand entity is under-specified in structured data. Deploying Organization schema will improve AI model recognition of your brand.',
    confidence: 92,
    estimatedAEOImpact: 8,
    estimatedEVIImpact: 4.2,
    type: 'schema',
    status: 'pending',
  },
  {
    id: 'sp-2',
    title: 'Generate HowTo schema for tutorial content',
    reasoning: 'Your tutorial pages have strong semantic depth but zero HowTo markup. Adding schema will make these pages eligible for AI-generated procedure answers.',
    confidence: 87,
    estimatedAEOImpact: 5,
    estimatedEVIImpact: 2.8,
    type: 'schema',
    status: 'pending',
  },
  {
    id: 'sp-3',
    title: 'Rewrite meta descriptions for top 7 blog posts',
    reasoning: 'Duplicate meta descriptions are confusing AI retrieval systems. Unique, entity-rich descriptions will strengthen topical authority signals.',
    confidence: 78,
    estimatedAEOImpact: 3,
    estimatedEVIImpact: 1.5,
    type: 'technical',
    status: 'pending',
  },
  {
    id: 'sp-4',
    title: 'Create entity bridge content for competitor gap',
    reasoning: 'A competitor leads on "marketing automation ROI" queries. A focused entity-bridge piece will strengthen your brand entity in this topic cluster.',
    confidence: 71,
    estimatedAEOImpact: 4,
    estimatedEVIImpact: 3.1,
    type: 'content',
    status: 'pending',
  },
  {
    id: 'sp-5',
    title: 'Fix Core Web Vitals on landing pages',
    reasoning: 'LCP > 4s on 8 pages reduces crawl priority. Faster pages get re-indexed sooner, updating AI model knowledge of your content.',
    confidence: 85,
    estimatedAEOImpact: 3,
    estimatedEVIImpact: 1.8,
    type: 'technical',
    status: 'pending',
  },
];

// ============================================
// AUTOPILOT DATA
// ============================================

export const MOCK_AUTOPILOT_EXCEPTIONS: AutopilotException[] = [
  {
    id: 'ae-1',
    title: 'Schema deployment blocked on /pricing',
    attempted: 'Deploy Organization JSON-LD to /pricing page',
    reason: 'Page uses custom template not in approved schema templates.',
    requiresDecision: 'Approve custom template OR manually add schema',
    timestamp: '2026-02-20T09:30:00Z',
    severity: 'high',
  },
];

export const MOCK_AUTOPILOT_RECENT: AutopilotExecution[] = [
  {
    id: 'ar-0-xpillar',
    title: 'Content published: "AI Citation Optimization Guide" → AEO score updated to 74',
    completedAt: '2026-02-20T09:45:00Z',
    impactDelta: 3.4,
    type: 'content_publish',
  },
  {
    id: 'ar-1',
    title: 'Deployed NewsArticle schema to /blog/marketing-automation-guide',
    completedAt: '2026-02-20T08:15:00Z',
    impactDelta: 2.1,
    type: 'schema',
  },
  {
    id: 'ar-2',
    title: 'Sent IndexNow ping for 3 updated blog posts',
    completedAt: '2026-02-20T07:45:00Z',
    impactDelta: 0.5,
    type: 'indexing',
  },
  {
    id: 'ar-3',
    title: 'Citation scan completed — 2 new citations detected',
    completedAt: '2026-02-20T06:00:00Z',
    impactDelta: 1.8,
    type: 'monitoring',
  },
  {
    id: 'ar-4',
    title: 'FAQ schema repaired on /support/getting-started',
    completedAt: '2026-02-19T22:30:00Z',
    impactDelta: 1.2,
    type: 'schema',
  },
  {
    id: 'ar-5',
    title: 'Meta description generated for /blog/pr-coverage-strategy',
    completedAt: '2026-02-19T21:00:00Z',
    impactDelta: 0.3,
    type: 'technical',
  },
];

export const MOCK_AUTOPILOT_STATUS = {
  running: 3,
  queued: 7,
  nextAction: 'Deploy Person schema to /team page (scheduled 10:00)',
};

// ============================================
// CITATION ACTIVITY (Intelligence tab)
// ============================================

export const MOCK_CITATION_ACTIVITY = [
  {
    id: 'ca-1',
    surface: 'ChatGPT',
    query: 'best marketing automation tools',
    timestamp: '2026-02-20T08:30:00Z',
    sentiment: 'positive' as const,
    context: 'Referenced your guide as a comprehensive resource for evaluating marketing automation platforms.',
  },
  {
    id: 'ca-2',
    surface: 'Perplexity',
    query: 'content strategy best practices 2026',
    timestamp: '2026-02-19T15:20:00Z',
    sentiment: 'neutral' as const,
    context: 'Listed among several sources for content strategy recommendations.',
  },
  {
    id: 'ca-3',
    surface: 'Gemini',
    query: 'B2B lead generation case studies',
    timestamp: '2026-02-19T11:45:00Z',
    sentiment: 'positive' as const,
    context: 'Directly cited the Acme Corp case study with attribution.',
  },
  {
    id: 'ca-4',
    surface: 'ChatGPT',
    query: 'PR coverage that AI notices',
    timestamp: '2026-02-18T09:10:00Z',
    sentiment: 'positive' as const,
    context: 'Mentioned strategies from your PR coverage article as innovative approach.',
  },
];

// ============================================
// TOPIC CLUSTERS (Intelligence tab)
// ============================================

export const MOCK_TOPIC_CLUSTERS = [
  { name: 'Marketing Automation', health: 82, articles: 5, citations: 8 },
  { name: 'Content Strategy', health: 64, articles: 3, citations: 3 },
  { name: 'Lead Generation', health: 71, articles: 4, citations: 4 },
  { name: 'PR & Visibility', health: 48, articles: 2, citations: 2 },
  { name: 'SEO/AEO', health: 35, articles: 1, citations: 0 },
];
