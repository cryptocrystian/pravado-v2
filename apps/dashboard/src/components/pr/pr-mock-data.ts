/* ── PR Surface Mock Data ─────────────────────────────────
 * Types and mock data for the redesigned PR surface.
 * Will be replaced by real API calls.
 * ──────────────────────────────────────────────────────── */

/* ── Types ─────────────────────────────────────────────── */

export type ActionPriority = 'critical' | 'high' | 'medium' | 'low';
export type AICitationLevel = 'high' | 'medium' | 'low';
export type RelationshipStatus = 'warm' | 'neutral' | 'cold' | 'new';
export type PitchStage = 'drafts' | 'awaiting_send' | 'sent' | 'closed';
export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface PRActionItem {
  id: string;
  priority: ActionPriority;
  iconName: string;
  title: string;
  description: string;
  primaryCta: string;
  secondaryCta?: string;
  dismissible: boolean;
  journalistId?: string;
}

export interface Journalist {
  id: string;
  name: string;
  initials: string;
  email: string;
  publication: string;
  jobTitle: string;
  beats: string[];
  aiCitation: AICitationLevel;
  relationship: RelationshipStatus;
  socialTwitter?: string;
  socialLinkedin?: boolean;
  verified: boolean;
  citationStats?: {
    totalCitations: number;
    aiEngines: number;
    topArticleCitations: number;
    citationPercent: number;
    description: string;
  };
  relationshipStats?: {
    lastContact: string;
    totalInteractions: number;
    coverageReceived: number;
    warmthScore: number;
    owner: string;
  };
  recentArticles?: { title: string; date: string }[];
  activityTimeline?: {
    date: string;
    description: string;
    type: 'sent' | 'replied' | 'outreach';
  }[];
  notes?: string;
  sageReason?: string;
}

export interface PitchItem {
  id: string;
  title: string;
  journalistName: string;
  publication: string;
  priority: 'high' | 'medium' | 'low';
  aeoTarget: string;
  created: string;
  stage: PitchStage;
  beats?: string[];
}

export interface CoverageRow {
  id: string;
  headline: string;
  publication: string;
  reporter: string;
  date: string;
  reach: string;
  sentiment: Sentiment;
  eviImpact: string;
  isPending?: boolean;
}

export interface ConversationMessage {
  id: string;
  sender: string;
  senderType: 'user' | 'journalist';
  date: string;
  body: string;
}

export interface ContentPiece {
  id: string;
  title: string;
  citeMindScore: number;
  sageMatchScore: number;
  type: string;
}

/* ── Action Items ─────────────────────────────────────── */

export const mockActions: PRActionItem[] = [
  {
    id: 'act-1',
    priority: 'critical',
    iconName: 'EnvelopeOpen',
    title: 'Journalist Reply \u2014 Sarah Chen',
    description:
      "Sarah Chen (TechCrunch) replied to your 'AI Visibility Guide' pitch: 'Interesting angle \u2014 can you send me more data on citation rates for enterprise brands?...'",
    primaryCta: 'View Full Reply',
    secondaryCta: 'Open Thread',
    dismissible: true,
    journalistId: 'j-1',
  },
  {
    id: 'act-2',
    priority: 'high',
    iconName: 'Newspaper',
    title: 'Coverage Detected',
    description:
      'Forbes published an article citing your AI visibility research (Feb 17)',
    primaryCta: 'View Coverage',
    secondaryCta: 'Log to Campaign',
    dismissible: true,
  },
  {
    id: 'act-3',
    priority: 'high',
    iconName: 'Bell',
    title: 'Pitch Follow-up Due',
    description:
      "3 journalists from the Q4 Campaign haven't replied \u2014 last contact 5 days ago",
    primaryCta: 'Review & Follow Up',
    secondaryCta: 'Snooze 2 days',
    dismissible: true,
  },
  {
    id: 'act-4',
    priority: 'high',
    iconName: 'FileText',
    title: 'Pitch Ready for Approval',
    description:
      "SAGE-generated pitch for 'Enterprise AEO Guide' is ready for review",
    primaryCta: 'Review Pitch',
    secondaryCta: 'Discard',
    dismissible: true,
  },
  {
    id: 'act-5',
    priority: 'medium',
    iconName: 'Lightning',
    title: 'SAGE Opportunity',
    description:
      'TechCrunch is actively covering AI visibility platforms \u2014 3 journalists writing on this topic this week',
    primaryCta: 'See Journalists',
    secondaryCta: 'Dismiss',
    dismissible: true,
  },
  {
    id: 'act-6',
    priority: 'low',
    iconName: 'ChartBar',
    title: 'Weekly EVI Report Ready',
    description:
      'Earned media drove +3.2 EVI points this week \u2014 your highest PR impact week',
    primaryCta: 'View Report',
    secondaryCta: 'Dismiss',
    dismissible: true,
  },
];

/* ── Journalists (My Contacts) ────────────────────────── */

export const mockJournalists: Journalist[] = [
  {
    id: 'j-1',
    name: 'Sarah Chen',
    initials: 'SC',
    email: 's.chen@techcrunch.com',
    publication: 'TechCrunch',
    jobTitle: 'Senior Reporter',
    beats: ['AI/ML', 'Enterprise Tech', 'Startups', 'SaaS'],
    aiCitation: 'high',
    relationship: 'warm',
    socialTwitter: '@sarahchentech',
    socialLinkedin: true,
    verified: true,
    citationStats: {
      totalCitations: 47,
      aiEngines: 3,
      topArticleCitations: 23,
      citationPercent: 12,
      description:
        "Sarah's published work appears in 12% of AI responses about AI marketing tools. She is one of the highest-impact journalists in your coverage area for driving citation authority.",
    },
    relationshipStats: {
      lastContact: '12 days ago',
      totalInteractions: 8,
      coverageReceived: 2,
      warmthScore: 72,
      owner: 'You',
    },
    recentArticles: [
      { title: 'How AI Is Reshaping Brand Visibility in 2026', date: 'Feb 14' },
      { title: 'The Rise of Answer Engine Optimization', date: 'Feb 3' },
      { title: 'Enterprise AI Tools: A Buyer\'s Guide', date: 'Jan 22' },
      { title: 'Why Citation Authority Matters More Than Backlinks', date: 'Jan 10' },
      { title: 'The AI Marketing Stack: 2026 Edition', date: 'Dec 18' },
    ],
    activityTimeline: [
      { date: 'Feb 10', description: 'You sent pitch: "AI Visibility Guide"', type: 'sent' },
      { date: 'Jan 28', description: 'Sarah replied: "Interesting, send more data"', type: 'replied' },
      { date: 'Jan 15', description: 'You: Initial outreach', type: 'outreach' },
    ],
    notes:
      'Prefers concise pitches. No Friday sends. Best response window: Tue\u2013Thu morning.',
  },
  {
    id: 'j-2',
    name: 'Marcus Webb',
    initials: 'MW',
    email: 'm.webb@forbes.com',
    publication: 'Forbes',
    jobTitle: 'Staff Writer',
    beats: ['Future of Work', 'SaaS'],
    aiCitation: 'high',
    relationship: 'neutral',
    verified: true,
  },
  {
    id: 'j-3',
    name: 'Jennifer Park',
    initials: 'JP',
    email: 'j.park@wired.com',
    publication: 'Wired',
    jobTitle: 'Contributing Writer',
    beats: ['AI', 'Culture', 'Startups'],
    aiCitation: 'medium',
    relationship: 'warm',
    verified: true,
  },
  {
    id: 'j-4',
    name: 'David Kim',
    initials: 'DK',
    email: 'd.kim@venturebeat.com',
    publication: 'VentureBeat',
    jobTitle: 'Enterprise Editor',
    beats: ['Enterprise AI', 'B2B Software'],
    aiCitation: 'high',
    relationship: 'cold',
    verified: true,
  },
  {
    id: 'j-5',
    name: 'Rachel Torres',
    initials: 'RT',
    email: 'r.torres@theinformation.com',
    publication: 'The Information',
    jobTitle: 'Reporter',
    beats: ['SaaS', 'Fundraising'],
    aiCitation: 'medium',
    relationship: 'new',
    verified: true,
  },
  {
    id: 'j-6',
    name: 'James Liu',
    initials: 'JL',
    email: 'j.liu@technologyreview.com',
    publication: 'MIT Tech Review',
    jobTitle: 'Senior Editor',
    beats: ['AI Research', 'Enterprise'],
    aiCitation: 'high',
    relationship: 'neutral',
    verified: true,
  },
  {
    id: 'j-7',
    name: 'Amara Osei',
    initials: 'AO',
    email: 'a.osei@fastcompany.com',
    publication: 'Fast Company',
    jobTitle: 'Technology Editor',
    beats: ['Marketing Tech', 'AI'],
    aiCitation: 'medium',
    relationship: 'warm',
    verified: true,
  },
  {
    id: 'j-8',
    name: 'Chris Nakamura',
    initials: 'CN',
    email: 'c.nakamura@axios.com',
    publication: 'Axios',
    jobTitle: 'Reporter',
    beats: ['Tech Policy', 'AI Regulation'],
    aiCitation: 'low',
    relationship: 'cold',
    verified: false,
  },
];

/* ── SAGE Suggested Journalists ───────────────────────── */

export const mockSageJournalists: Journalist[] = [
  {
    id: 'sj-1',
    name: 'Ana Vasquez',
    initials: 'AV',
    email: 'a.vasquez@protocol.com',
    publication: 'Protocol',
    jobTitle: 'Staff Writer',
    beats: ['AI Business Strategy', 'Enterprise'],
    aiCitation: 'medium',
    relationship: 'new',
    verified: true,
    sageReason:
      'Ana published 4 articles about enterprise AI tooling this quarter. Her Protocol coverage reaches key CTO and VP Engineering audiences. She hasn\'t covered any direct competitors.',
  },
  {
    id: 'sj-2',
    name: 'Tom Whitfield',
    initials: 'TW',
    email: 't.whitfield@bloomberg.com',
    publication: 'Bloomberg Technology',
    jobTitle: 'Columnist',
    beats: ['Enterprise Software', 'Cloud'],
    aiCitation: 'high',
    relationship: 'new',
    verified: true,
    sageReason:
      "Tom's Bloomberg column on enterprise AI tools reaches 2.1M readers. His pieces are cited in 18% of Perplexity responses for 'enterprise software' queries.",
  },
  {
    id: 'sj-3',
    name: 'Priya Sharma',
    initials: 'PS',
    email: 'p.sharma@theverge.com',
    publication: 'The Verge',
    jobTitle: 'AI Reporter',
    beats: ['AI Products', 'Consumer Tech'],
    aiCitation: 'medium',
    relationship: 'new',
    verified: true,
    sageReason:
      'Priya covers AI product launches and recently wrote about the shift from SEO to AEO. She has strong social amplification (48K followers) but hasn\'t covered visibility platforms yet.',
  },
  {
    id: 'sj-4',
    name: 'Nathan Brooks',
    initials: 'NB',
    email: 'n.brooks@businessinsider.com',
    publication: 'Business Insider',
    jobTitle: 'Tech Reporter',
    beats: ['Digital Transformation', 'SaaS'],
    aiCitation: 'low',
    relationship: 'new',
    verified: true,
    sageReason:
      'Nathan writes about digital transformation tools. Lower priority \u2014 his coverage has minimal AI citation impact, but good for awareness-tier reach.',
  },
  {
    id: 'sj-5',
    name: 'Elena Rodriguez',
    initials: 'ER',
    email: 'e.rodriguez@wsj.com',
    publication: 'WSJ',
    jobTitle: 'Enterprise Tech Reporter',
    beats: ['Enterprise Tech', 'AI Policy'],
    aiCitation: 'high',
    relationship: 'new',
    verified: true,
    sageReason:
      'Elena\'s WSJ enterprise tech column has the highest citation authority in your sector. Her articles appear in 22% of ChatGPT responses about enterprise AI. Previously covered competitor tools.',
  },
];

/* ── Pitches ──────────────────────────────────────────── */

export const mockPitches: PitchItem[] = [
  { id: 'p-1', title: 'AI Visibility Best Practices', journalistName: 'Sarah Chen', publication: 'TechCrunch', priority: 'high', aeoTarget: '+8 pts est.', created: 'Feb 18', stage: 'drafts', beats: ['AI/ML'] },
  { id: 'p-2', title: "Why Your Brand Isn't Cited by ChatGPT", journalistName: 'Marcus Webb', publication: 'Forbes', priority: 'medium', aeoTarget: '+5 pts est.', created: 'Feb 16', stage: 'drafts', beats: ['Future of Work'] },
  { id: 'p-3', title: 'Enterprise AEO Guide Launch', journalistName: 'Jennifer Park', publication: 'Wired', priority: 'high', aeoTarget: '+12 pts est.', created: 'Feb 15', stage: 'drafts', beats: ['AI'] },
  { id: 'p-4', title: 'The AEO Measurement Problem', journalistName: 'David Kim', publication: 'VentureBeat', priority: 'high', aeoTarget: '+9 pts est.', created: 'Feb 14', stage: 'awaiting_send', beats: ['Enterprise AI'] },
  { id: 'p-5', title: "PR's New ROI: AI Citation Rate", journalistName: 'Rachel Torres', publication: 'The Information', priority: 'medium', aeoTarget: '+6 pts est.', created: 'Feb 13', stage: 'awaiting_send', beats: ['SaaS'] },
  { id: 'p-6', title: 'The Future of AI-Driven PR', journalistName: 'James Liu', publication: 'MIT Tech Review', priority: 'high', aeoTarget: '+11 pts est.', created: 'Feb 12', stage: 'sent' },
  { id: 'p-7', title: 'How Enterprise Brands Build Citation Authority', journalistName: 'Amara Osei', publication: 'Fast Company', priority: 'medium', aeoTarget: '+7 pts est.', created: 'Feb 8', stage: 'sent' },
  { id: 'p-8', title: 'AI Visibility: The New Marketing Imperative', journalistName: 'Chris Nakamura', publication: 'Axios', priority: 'medium', aeoTarget: '+4 pts est.', created: 'Feb 5', stage: 'sent' },
  { id: 'p-9', title: 'Share of Model: What Every CMO Needs to Know', journalistName: 'Jennifer Park', publication: 'Wired', priority: 'high', aeoTarget: '+10 pts est.', created: 'Jan 28', stage: 'sent' },
];

/* ── Coverage ─────────────────────────────────────────── */

export const mockCoverage: CoverageRow[] = [
  { id: 'cov-1', headline: 'Why AI Is Reshaping the PR Industry', publication: 'TechCrunch', reporter: 'Sarah Chen', date: 'Feb 14', reach: '2.4M', sentiment: 'positive', eviImpact: '+4.1 pts' },
  { id: 'cov-2', headline: 'The AEO Opportunity for Enterprise Brands', publication: 'Forbes', reporter: 'Marcus Webb', date: 'Feb 10', reach: '3.1M', sentiment: 'positive', eviImpact: '+0.8 pts' },
  { id: 'cov-3', headline: 'AI Tools for Communications Teams', publication: 'VentureBeat', reporter: 'David Kim', date: 'Feb 6', reach: '0.9M', sentiment: 'neutral', eviImpact: '+0.3 pts' },
  { id: 'cov-4', headline: 'Meet the Platforms Tracking AI Citations', publication: 'Wired', reporter: 'Jennifer Park', date: 'Jan 30', reach: '4.2M', sentiment: 'positive', eviImpact: 'Pending (24hr)', isPending: true },
  { id: 'cov-5', headline: 'PR Technology in 2026: A Landscape Review', publication: 'MIT Tech Review', reporter: 'James Liu', date: 'Jan 22', reach: '1.1M', sentiment: 'positive', eviImpact: '+1.4 pts' },
];

/* ── Conversation Thread (Sarah Chen) ─────────────────── */

export const mockConversation: ConversationMessage[] = [
  {
    id: 'msg-1',
    sender: 'You',
    senderType: 'user',
    date: 'Jan 15, 2026',
    body: "Hi Sarah,\n\nI've been following your coverage of AI marketing tools and think you'd be interested in some research we're publishing on how enterprise brands are approaching AI visibility.\n\nWould love to chat if you have 15 minutes this week.\n\nBest,\nAlex Jordan\nPravado",
  },
  {
    id: 'msg-2',
    sender: 'Sarah Chen',
    senderType: 'journalist',
    date: 'Jan 28, 2026',
    body: "Thanks for reaching out. Interesting topic \u2014 I'm actually working on a piece about how brands are adapting to AI-driven search. Send me more details on what you're publishing and I'll take a look.",
  },
  {
    id: 'msg-3',
    sender: 'You',
    senderType: 'user',
    date: 'Feb 10, 2026',
    body: "Hi Sarah,\n\nYour piece last week on how AI is reshaping brand visibility was one of the clearest takes I've read on this topic \u2014 especially the point about citation bias toward authoritative sources.\n\nI thought you'd find this timely: we just published a guide that digs into the exact mechanism behind AI citation selection, with data from 2,400 enterprise brands. The headline finding: 73% of ChatGPT responses in B2B categories cite fewer than 5 unique sources per topic cluster.\n\nWould it be worth a 15-minute conversation this week? Happy to share the full dataset.\n\n[Your name]",
  },
  {
    id: 'msg-4',
    sender: 'Sarah Chen',
    senderType: 'journalist',
    date: 'Feb 19, 2026',
    body: "Interesting angle \u2014 can you send me more data on citation rates for enterprise brands? I'm working on a piece about AI tools for PR teams and this could fit nicely. Also, do you have any case studies with before/after citation data?",
  },
];

/* ── Content Pieces (for Pitch Wizard) ────────────────── */

export const mockContentPieces: ContentPiece[] = [
  { id: 'cp-1', title: 'Enterprise AEO Strategy Guide', citeMindScore: 72, sageMatchScore: 94, type: 'article' },
  { id: 'cp-2', title: 'AI Citation Authority Report', citeMindScore: 85, sageMatchScore: 88, type: 'article' },
  { id: 'cp-3', title: 'Q1 Visibility Benchmarks', citeMindScore: 91, sageMatchScore: 76, type: 'article' },
  { id: 'cp-4', title: 'Content Optimization Playbook', citeMindScore: 58, sageMatchScore: 62, type: 'article' },
  { id: 'cp-5', title: 'Share of Model Analysis', citeMindScore: 94, sageMatchScore: 91, type: 'article' },
  { id: 'cp-6', title: 'The Complete AEO Implementation Guide', citeMindScore: 82, sageMatchScore: 85, type: 'article' },
];

/* ── Pitch Wizard Helpers ─────────────────────────────── */

export const mockPitchBody = `Hi Sarah,

Your piece last week on how AI is reshaping brand visibility was one of the clearest takes I\u2019ve read on this topic \u2014 especially the point about citation bias toward authoritative sources.

I thought you\u2019d find this timely: we just published a guide that digs into the exact mechanism behind AI citation selection, with data from 2,400 enterprise brands. The headline finding: 73% of ChatGPT responses in B2B categories cite fewer than 5 unique sources per topic cluster.

Would it be worth a 15-minute conversation this week? Happy to share the full dataset.

Alex Jordan
Pravado`;

export const mockPitchSubject =
  'Data: How enterprise brands are winning AI citations (73% cite <5 sources)';

export const sageReasoningPoints = [
  { type: 'success' as const, text: 'Sarah wrote about AI marketing tools 3x this quarter' },
  { type: 'success' as const, text: 'Her published work appears in 12% of ChatGPT responses for your topic cluster' },
  { type: 'warning' as const, text: 'She covered CompetitorX last month \u2014 differentiate clearly' },
];

export const wizardLoadingMessages = [
  "Reviewing Sarah's recent coverage...",
  'Identifying personalization hooks...',
  'Applying your brand voice...',
  'Drafting pitch...',
];

/* ── Topic Activity (Intelligence stub) ───────────────── */

export const mockTopicActivity = [
  { topic: 'AI marketing technology', articles: 8, delta: '+4 vs last week', trending: false },
  { topic: 'Generative Engine Optimization', articles: 12, delta: null, trending: true },
];

/* ── Priority + Citation Configs ──────────────────────── */

export const priorityConfig: Record<ActionPriority, { bg: string; text: string }> = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-500' },
  high: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
  medium: { bg: 'bg-white/5', text: 'text-white/45' },
  low: { bg: 'bg-white/5', text: 'text-white/30' },
};

export const citationBadgeConfig: Record<AICitationLevel, { bg: string; text: string }> = {
  high: { bg: 'bg-brand-teal/10', text: 'text-brand-teal' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
  low: { bg: 'bg-white/5', text: 'text-white/45' },
};

export const relationshipDotConfig: Record<RelationshipStatus, string> = {
  warm: 'bg-emerald-500',
  neutral: 'bg-white/30',
  cold: 'bg-red-500',
  new: 'bg-brand-teal',
};
