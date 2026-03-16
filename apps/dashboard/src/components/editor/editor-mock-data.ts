/* ── Editor Mock Data ─────────────────────────────────────
 * Types and mock data for the Content Editor + CiteMind rail.
 * Sprint 2B — will be replaced by real API calls.
 * ──────────────────────────────────────────────────────── */

/* ── Types ─────────────────────────────────────────────── */

export interface EditorDocument {
  id: string;
  title: string;
  status: 'draft' | 'needs_review' | 'ready' | 'published';
  updatedAt: string;
  citeMindScore: number;
  type: string;
  wordCount: number;
}

export interface BriefContext {
  topic: string;
  contentType: string;
  keywords: string[];
  angle: string;
  competitorContext: string;
}

export interface AeoScoreData {
  overall: number;
  breakdown: { category: string; score: number; label: string }[];
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

export interface EntityItem {
  name: string;
  type: 'primary' | 'secondary' | 'technical';
  status: 'covered' | 'partial' | 'missing';
  mentions: number;
  required: number;
}

export interface CitationSignal {
  engine: string;
  query: string;
  cited: boolean;
  position: number | null;
  trend: 'up' | 'down' | 'stable' | 'new';
}

export interface DerivativeItem {
  id: string;
  type: 'social_post' | 'email' | 'summary' | 'thread';
  title: string;
  status: 'ready' | 'generating' | 'pending';
  platform?: string;
}

export interface CrossPillarHook {
  pillar: 'pr' | 'seo';
  type: string;
  title: string;
  description: string;
  matches?: { name: string; outlet: string; relevance: number }[];
}

export interface SlashCommand {
  id: string;
  name: string;
  description: string;
  iconName: string;
  category: 'ai-generate' | 'rewrite' | 'insert' | 'structure' | 'brand';
  shortcut?: string;
}

/* ── Mock Documents ───────────────────────────────────── */

export const mockDocuments: EditorDocument[] = [
  { id: 'doc-1', title: 'Enterprise AEO Strategy Guide', status: 'draft', updatedAt: '2 min ago', citeMindScore: 72, type: 'article', wordCount: 2340 },
  { id: 'doc-2', title: 'AI Citation Authority Report', status: 'needs_review', updatedAt: '1 hour ago', citeMindScore: 85, type: 'article', wordCount: 3100 },
  { id: 'doc-3', title: 'Q1 Visibility Benchmarks', status: 'ready', updatedAt: '2 days ago', citeMindScore: 91, type: 'article', wordCount: 1850 },
  { id: 'doc-4', title: 'Content Optimization Playbook', status: 'draft', updatedAt: '3 days ago', citeMindScore: 58, type: 'article', wordCount: 4200 },
  { id: 'doc-5', title: 'Share of Model Analysis', status: 'published', updatedAt: '1 week ago', citeMindScore: 94, type: 'article', wordCount: 2780 },
];

/* ── Mock Brief Context ───────────────────────────────── */

export const mockBriefContext: BriefContext = {
  topic: 'Enterprise AEO Strategy Guide',
  contentType: 'Thought Leadership Article',
  keywords: ['enterprise AEO', 'AI content optimization', 'citation authority', 'Share of Model'],
  angle: 'Differentiate with proprietary data and first-party case studies that competitors lack.',
  competitorContext: 'CompetitorX published similar content 2 weeks ago and is cited by ChatGPT in 68% of related queries.',
};

/* ── Mock AEO Score ───────────────────────────────────── */

export const mockAeoScore: AeoScoreData = {
  overall: 72,
  breakdown: [
    { category: 'Authority', score: 78, label: 'Strong' },
    { category: 'Entities', score: 65, label: 'Needs work' },
    { category: 'Structure', score: 82, label: 'Strong' },
    { category: 'Freshness', score: 63, label: 'Needs work' },
  ],
  trend: 'up',
  lastUpdated: '5s ago',
};

/* ── Mock Entities ────────────────────────────────────── */

export const mockEntities: EntityItem[] = [
  { name: 'AEO (Answer Engine Optimization)', type: 'primary', status: 'covered', mentions: 12, required: 8 },
  { name: 'Share of Model', type: 'primary', status: 'covered', mentions: 6, required: 4 },
  { name: 'CiteMind', type: 'primary', status: 'partial', mentions: 2, required: 5 },
  { name: 'Enterprise visibility', type: 'secondary', status: 'covered', mentions: 4, required: 3 },
  { name: 'AI citation tracking', type: 'secondary', status: 'partial', mentions: 1, required: 3 },
  { name: 'LLM answer presence', type: 'technical', status: 'missing', mentions: 0, required: 2 },
  { name: 'Structured data markup', type: 'technical', status: 'covered', mentions: 3, required: 2 },
  { name: 'Content authority signals', type: 'secondary', status: 'missing', mentions: 0, required: 3 },
];

/* ── Mock Citation Signals ────────────────────────────── */

export const mockCitationSignals: CitationSignal[] = [
  { engine: 'ChatGPT', query: 'what is AEO optimization', cited: true, position: 2, trend: 'up' },
  { engine: 'Perplexity', query: 'enterprise content strategy AI', cited: true, position: 1, trend: 'stable' },
  { engine: 'Gemini', query: 'AI citation authority', cited: false, position: null, trend: 'down' },
  { engine: 'Claude', query: 'share of model measurement', cited: true, position: 3, trend: 'new' },
];

/* ── Mock Derivatives ─────────────────────────────────── */

export const mockDerivatives: DerivativeItem[] = [
  { id: 'deriv-1', type: 'social_post', title: 'LinkedIn summary post', status: 'ready', platform: 'LinkedIn' },
  { id: 'deriv-2', type: 'email', title: 'Newsletter excerpt', status: 'generating' },
  { id: 'deriv-3', type: 'thread', title: 'Twitter/X thread (8 posts)', status: 'pending', platform: 'X' },
  { id: 'deriv-4', type: 'summary', title: 'Executive brief (1-pager)', status: 'pending' },
];

/* ── Mock Cross-Pillar Hooks ──────────────────────────── */

export const mockCrossPillarHooks: CrossPillarHook[] = [
  {
    pillar: 'pr',
    type: 'Pitch Angle',
    title: 'Enterprise AEO adoption story',
    description: 'This article\'s data supports a trend piece on enterprise AI visibility strategies.',
    matches: [
      { name: 'Sarah Chen', outlet: 'TechCrunch', relevance: 92 },
      { name: 'Mike Torres', outlet: 'The Information', relevance: 87 },
      { name: 'Lisa Park', outlet: 'VentureBeat', relevance: 81 },
    ],
  },
  {
    pillar: 'seo',
    type: 'AEO Gap',
    title: 'Missing entity coverage for "LLM answer presence"',
    description: 'Adding this entity could improve Gemini citation probability by ~15%.',
  },
];

/* ── Slash Commands ───────────────────────────────────── */

export const slashCommands: SlashCommand[] = [
  // AI Generate
  { id: 'continue', name: 'Continue writing', description: 'AI continues from cursor position', iconName: 'PencilLine', category: 'ai-generate' },
  { id: 'generate-para', name: 'Generate paragraph', description: 'Generate a new paragraph on the topic', iconName: 'Paragraph', category: 'ai-generate' },
  { id: 'generate-section', name: 'Generate section', description: 'Generate a full section with heading', iconName: 'Article', category: 'ai-generate' },
  { id: 'summarize', name: 'Summarize above', description: 'Summarize content above cursor', iconName: 'ListBullets', category: 'ai-generate' },
  // Rewrite & Improve
  { id: 'rewrite', name: 'Rewrite', description: 'Rewrite the current paragraph', iconName: 'ArrowsClockwise', category: 'rewrite' },
  { id: 'simplify', name: 'Simplify', description: 'Make the text simpler and clearer', iconName: 'TextAlignLeft', category: 'rewrite' },
  { id: 'detail', name: 'Make more detailed', description: 'Add more depth and examples', iconName: 'MagnifyingGlassPlus', category: 'rewrite' },
  { id: 'grammar', name: 'Fix grammar', description: 'Correct grammar and spelling', iconName: 'CheckCircle', category: 'rewrite' },
  // Insert
  { id: 'image', name: 'Image placeholder', description: 'Insert an image placeholder block', iconName: 'Image', category: 'insert' },
  { id: 'table', name: 'Table', description: 'Insert a data table', iconName: 'Table', category: 'insert' },
  { id: 'callout', name: 'Callout box', description: 'Insert a highlighted callout', iconName: 'Info', category: 'insert' },
  { id: 'divider', name: 'Divider', description: 'Insert a horizontal divider', iconName: 'Minus', category: 'insert' },
  // Structure
  { id: 'h2', name: 'Heading 2', description: 'Insert a section heading', iconName: 'TextHTwo', category: 'structure', shortcut: '##' },
  { id: 'h3', name: 'Heading 3', description: 'Insert a sub-heading', iconName: 'TextHThree', category: 'structure', shortcut: '###' },
  { id: 'bullet', name: 'Bullet list', description: 'Start a bullet list', iconName: 'ListBullets', category: 'structure' },
  { id: 'numbered', name: 'Numbered list', description: 'Start a numbered list', iconName: 'ListNumbers', category: 'structure' },
  // Brand
  { id: 'brand-voice', name: 'Apply brand voice', description: 'Rewrite in your brand voice', iconName: 'Microphone', category: 'brand' },
];

export const slashCommandCategories = [
  { id: 'ai-generate', label: 'AI Generate' },
  { id: 'rewrite', label: 'Rewrite & Improve' },
  { id: 'insert', label: 'Insert' },
  { id: 'structure', label: 'Structure' },
  { id: 'brand', label: 'Brand' },
] as const;

/* ── Mock Editor HTML Content ─────────────────────────── */

export const mockEditorContent = `<h1>Enterprise AEO Strategy Guide</h1>
<p>As AI-powered answer engines reshape how audiences discover and consume information, enterprises face a critical strategic imperative: <strong>Answer Engine Optimization (AEO)</strong>. Unlike traditional SEO, which focuses on ranking in link-based search results, AEO is about becoming the <em>cited source</em> in AI-generated answers.</p>
<h2>The Shift from Search to Answers</h2>
<p>The landscape of information discovery is undergoing its most significant transformation since the advent of Google. ChatGPT, Perplexity, Gemini, and Claude are not just supplementing traditional search — they're replacing it for a growing segment of users. Enterprise brands that fail to adapt risk becoming invisible in the most rapidly growing discovery channel.</p>
<p>According to recent data, <strong>42% of enterprise decision-makers</strong> now use AI assistants as their primary research tool for vendor evaluation. This represents a fundamental shift in how B2B purchase decisions begin.</p>
<h2>Understanding Share of Model</h2>
<p>Share of Model (SoM) is the metric that quantifies your brand's presence in AI-generated answers. Think of it as share of voice, but for the AI era. It measures how frequently and prominently your brand, products, or content are cited when AI engines respond to queries in your domain.</p>
<p>Key dimensions of Share of Model include:</p>
<ul>
<li><strong>Citation frequency</strong> — How often your content is referenced</li>
<li><strong>Citation position</strong> — Where in the answer your citation appears</li>
<li><strong>Citation context</strong> — Whether you're cited as authoritative or merely mentioned</li>
<li><strong>Query coverage</strong> — The breadth of queries where you appear</li>
</ul>
<h2>Building Citation Authority</h2>
<p>Citation authority is not built overnight. It requires a systematic approach to content creation that prioritizes the signals AI engines use to evaluate source credibility. The three pillars of citation authority are:</p>
<ol>
<li><strong>Entity clarity</strong> — Ensuring your content clearly defines and consistently uses key entities</li>
<li><strong>Structural integrity</strong> — Formatting content so AI engines can easily parse and extract relevant answers</li>
<li><strong>Freshness signals</strong> — Maintaining and updating content to signal ongoing relevance</li>
</ol>
<h2>Implementation Framework</h2>
<p>The most effective enterprise AEO strategies follow a structured implementation framework that aligns content creation with citation optimization. This framework integrates traditional SEO fundamentals with the new requirements of AI-driven discovery.</p>
<p>Organizations that have implemented comprehensive AEO strategies report a <strong>3.2x increase</strong> in AI citation frequency within the first quarter, with compounding returns as content authority builds over time.</p>`;
