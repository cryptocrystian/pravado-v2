/**
 * Content Work Surface Types
 *
 * TypeScript interfaces for the Content pillar work surface.
 * Derived from CONTENT_WORK_SURFACE_CONTRACT.md
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

// ============================================
// ENUMS & UNIONS
// ============================================

/**
 * Content lifecycle status - visible, simple states
 * Every content item clearly shows its state
 */
export type ContentStatus = 'draft' | 'needs_review' | 'ready' | 'published' | 'archived';

/**
 * Content types used across existing components and mock data
 */
export type ContentType = 'article' | 'email' | 'social_post' | 'landing_page' | 'campaign';

/**
 * Content types for the creation overlay (new creation flow)
 */
export type CreationContentType = 'blog_post' | 'long_form_article' | 'newsletter' | 'social_series' | 'press_release';

/**
 * Entry path for content creation (SAGE brief or manual)
 */
export type CreationEntryPath = 'sage_brief' | 'manual';

/**
 * Config for creation content types (used in creation overlay)
 */
export interface CreationTypeConfig {
  label: string;
  iconName: string;
  description: string;
  sageDriven: boolean;
  crossPillarNote?: string;
}

export const CREATION_TYPE_CONFIG: Record<CreationContentType, CreationTypeConfig> = {
  blog_post: {
    label: 'Blog Post',
    iconName: 'Article',
    description: '800\u20131,500 words. SEO-oriented, frequent cadence.',
    sageDriven: false,
  },
  long_form_article: {
    label: 'Long-Form Article',
    iconName: 'BookOpenText',
    description: '2,000+ words. Thought leadership, byline-eligible.',
    sageDriven: false,
  },
  newsletter: {
    label: 'Newsletter',
    iconName: 'EnvelopeSimple',
    description: 'Section-based, owned audience, scheduled cadence.',
    sageDriven: false,
  },
  social_series: {
    label: 'Social Series',
    iconName: 'ShareNetwork',
    description: 'LinkedIn carousel, X thread, Instagram sequence.',
    sageDriven: false,
  },
  press_release: {
    label: 'Press Release',
    iconName: 'Megaphone',
    description: 'Creates a linked draft in your PR surface automatically.',
    sageDriven: false,
    crossPillarNote: 'Syncs to PR surface \u2192',
  },
};

/**
 * Outline section for AI scaffold stage
 */
export interface OutlineSection {
  id: string;
  title: string;
  status: 'pending' | 'generating' | 'complete';
}

/**
 * Legacy content type mapping for backward compatibility
 * Maps old types to new creation types
 */
export const LEGACY_CONTENT_TYPE_MAP: Record<string, CreationContentType> = {
  'article': 'long_form_article',
  'email': 'newsletter',
  'social_post': 'social_series',
  'landing_page': 'blog_post',
  'campaign': 'blog_post',
  'blog_post': 'blog_post',
  'long_form': 'long_form_article',
  'guide': 'long_form_article',
  'case_study': 'long_form_article',
};

export type CiteMindStatus = 'pending' | 'analyzing' | 'passed' | 'warning' | 'blocked';
export type DerivativeType = 'pr_pitch_excerpt' | 'aeo_snippet' | 'ai_summary' | 'social_fragment';
export type SearchIntent = 'informational' | 'navigational' | 'commercial' | 'transactional';
export type AutomationMode = 'manual' | 'copilot' | 'autopilot';
export type DensityLevel = 'comfortable' | 'standard' | 'compact';
export type ContentView = 'work-queue' | 'library' | 'calendar' | 'insights' | 'editor';

/**
 * Data passed from creation flow (Stage 3) to the editor view (Stage 4).
 */
export interface EditorInitData {
  title: string;
  topic: string;
  keyword: string;
  audience: string;
  tone: string;
  contentType: CreationContentType | null;
  outline: OutlineSection[];
}

/**
 * User-friendly content type labels and metadata
 * Used for display in UI, dropdowns, and type badges
 */
export interface ContentTypeConfig {
  label: string;
  icon: string;
  placeholder: string;
  description: string;
}

export const CONTENT_TYPE_CONFIG: Record<ContentType, ContentTypeConfig> = {
  article: {
    label: 'Article',
    icon: '📝',
    placeholder: 'Write your headline...',
    description: 'Long-form content for blogs, guides, and thought leadership',
  },
  email: {
    label: 'Email',
    icon: '✉️',
    placeholder: 'Subject line...',
    description: 'Email campaigns, newsletters, and outreach',
  },
  social_post: {
    label: 'Social Post',
    icon: '📱',
    placeholder: 'Hook your audience...',
    description: 'Social media content for any platform',
  },
  landing_page: {
    label: 'Landing Page',
    icon: '🌐',
    placeholder: 'Your headline goes here...',
    description: 'Conversion-focused web pages',
  },
  campaign: {
    label: 'Campaign',
    icon: '📣',
    placeholder: 'Campaign name...',
    description: 'Container for organizing related content',
  },
};

/**
 * Content status labels for display
 */
export const CONTENT_STATUS_CONFIG: Record<ContentStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'text-white/50' },
  needs_review: { label: 'Needs Review', color: 'text-amber-400' },
  ready: { label: 'Ready', color: 'text-brand-cyan' },
  published: { label: 'Published', color: 'text-green-400' },
  archived: { label: 'Archived', color: 'text-white/30' },
};

// ============================================
// AUTHORITY SIGNALS
// ============================================

export interface AuthoritySignals {
  /** 0-100, primary content KPI */
  authorityContributionScore: number;
  /** 0-100, CiteMind readiness */
  citationEligibilityScore: number;
  /** 0-100, AI discoverability */
  aiIngestionLikelihood: number;
  /** 0-100, PR+SEO reinforcement */
  crossPillarImpact: number;
  /** -100 to 100, vs competitors */
  competitiveAuthorityDelta: number;
  /** When measured */
  measuredAt: string;
}

// ============================================
// CONTENT ASSET
// ============================================

export interface ContentAsset {
  id: string;
  organizationId?: string;
  title: string;
  contentType: ContentType;
  status: ContentStatus;
  /** What authority it reinforces */
  authorityIntent?: string;
  /** CiteMind qualification state */
  citeMindStatus: CiteMindStatus;
  /** CiteMind issues if any */
  citeMindIssues?: CiteMindIssue[];
  /** Associated entities (brand, product, person, concept) */
  entityAssociations?: string[];
  /** Word count */
  wordCount?: number;
  /** Publication date */
  publishedAt?: string;
  /** Last update */
  updatedAt: string;
  /** Creation date */
  createdAt: string;
  /** Authority metrics */
  authoritySignals?: AuthoritySignals;
  /** Slug for URL */
  slug?: string;
  /** Published URL */
  url?: string;
  /** Body content */
  body?: string;
  /** Reading time in minutes */
  readingTimeMinutes?: number;
}

// ============================================
// CONTENT ITEM (Primary content entity)
// ============================================

export interface DerivativeMap {
  surfaces: DerivativeSurface[];
  expectedDerivatives: DerivativeType[];
}

/**
 * ContentItem - The primary content entity users create and edit
 *
 * This replaces the previous "Brief" concept with a direct, user-friendly
 * content object that opens directly into an editor.
 */
export interface ContentItem {
  id: string;
  organizationId?: string;
  /** User-visible title */
  title: string;
  /** Content type - determines editor scaffolding */
  contentType: ContentType;
  /** Lifecycle status */
  status: ContentStatus;
  /** Main content body */
  body?: string;
  /** Primary keyword to target (optional metadata) */
  targetKeyword?: string;
  /** Search intent type (optional metadata) */
  targetIntent?: SearchIntent;
  /** SAGE-derived objective (optional metadata) */
  strategicObjective?: string;
  /** Derivative surface map */
  derivativeMap?: DerivativeMap;
  /** Target audience */
  targetAudience?: string;
  /** Content tone */
  tone?: string;
  /** Due date */
  deadline?: string;
  /** Last edited timestamp for display */
  lastEditedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * @deprecated Use ContentItem instead
 * Kept for backward compatibility during migration
 */
export type ContentBrief = ContentItem;
export type BriefStatus = ContentStatus;

// ============================================
// DERIVATIVE SURFACE
// ============================================

export interface DerivativeSurface {
  id: string;
  parentAssetId: string;
  surfaceType: DerivativeType;
  content: string;
  /** Whether derivative is still valid (parent not edited) */
  valid: boolean;
  generatedAt: string;
}

// ============================================
// CALENDAR ENTRY
// ============================================

export interface CrossPillarDependency {
  pillar: 'pr' | 'seo';
  type: 'blocks' | 'blocked_by' | 'syncs_with';
  entityId: string;
  entityLabel: string;
}

export interface ContentCalendarEntry {
  id: string;
  assetId: string;
  asset: ContentAsset;
  scheduledAt: string;
  campaign?: string;
  theme?: string;
  crossPillarDeps: CrossPillarDependency[];
  automationMode: AutomationMode;
}

// ============================================
// CONTENT GAP & CLUSTER
// ============================================

export interface ContentGap {
  keyword: string;
  intent?: SearchIntent;
  seoOpportunityScore: number;
  existingContentCount: number;
  suggestedAction?: string;
  competitorCount?: number;
}

export interface ContentCluster {
  id: string;
  organizationId?: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// QUALITY ANALYSIS
// ============================================

export interface QualityScore {
  score: number;
  readability: number | null;
  keywordAlignment: number | null;
}

export interface QualityAnalysis {
  score: QualityScore;
  suggestedImprovements: string[];
  citeMindStatus: CiteMindStatus;
  issues?: CiteMindIssue[];
}

export interface CiteMindIssue {
  type: 'unverified_claim' | 'missing_citation' | 'orphan_assertion' | 'repetition';
  section?: string;
  message: string;
  severity: 'error' | 'warning';
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ContentItemsResponse {
  items: ContentAsset[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ContentItemsListResponse {
  items: ContentItem[];
  total: number;
}

/** @deprecated Use ContentItemsListResponse */
export type ContentBriefsResponse = ContentItemsListResponse;

export interface ContentGapsResponse {
  items: ContentGap[];
  total: number;
}

export interface ContentClustersResponse {
  items: ContentClusterDTO[];
  total: number;
}

export interface ContentTopic {
  id: string;
  name: string;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContentClusterDTO {
  cluster: ContentCluster;
  topics: ContentTopic[];
  representativeContent: ContentAsset[];
}

// ============================================
// CONTENT ITEM WITH CONTEXT (Expanded response)
// ============================================

export interface ContentItemWithContext {
  item: ContentItem;
  suggestedKeywords: string[];
  relatedTopics: { id: string; name: string }[];
  relatedAssets?: ContentAsset[];
}

/** @deprecated Use ContentItemWithContext */
export type ContentBriefWithContext = ContentItemWithContext;

// ============================================
// FILTER & PARAMS TYPES
// ============================================

export interface ContentItemsParams {
  page?: number;
  pageSize?: number;
  status?: ContentStatus;
  contentType?: ContentType;
  q?: string;
  entityId?: string;
  theme?: string;
}

export interface ContentItemsQueryParams {
  limit?: number;
  status?: ContentStatus;
  contentType?: ContentType;
}

/** @deprecated Use ContentItemsQueryParams */
export type ContentBriefsParams = ContentItemsQueryParams;

export interface ContentGapsParams {
  limit?: number;
  minScore?: number;
}

export interface ContentClustersParams {
  limit?: number;
}

export interface ContentCalendarParams {
  startDate?: string;
  endDate?: string;
  campaign?: string;
  theme?: string;
}

// ============================================
// IMPACT STRIP TYPES (Content-specific)
// ============================================

export type SAGEDimension = 'signal' | 'authority' | 'growth' | 'exposure';
export type EVIDriver = 'visibility' | 'authority' | 'momentum';
export type EVIDirection = 'positive' | 'neutral' | 'negative';

export interface SAGEContribution {
  dimension: SAGEDimension;
  isPrimary: boolean;
}

export interface EVIImpact {
  driver: EVIDriver;
  direction: EVIDirection;
  delta?: number;
  explanation?: string;
}

export interface ImpactStripData {
  sageContributions: SAGEContribution[];
  eviImpact?: EVIImpact;
  mode: AutomationMode;
  modeRationale?: string;
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface ContentWorkSurfaceProps {
  initialView?: ContentView;
}

export interface ContentAssetCardProps {
  asset: ContentAsset;
  density: DensityLevel;
  isSelected?: boolean;
  onClick?: () => void;
}

export interface ContentFiltersPanelProps {
  statusFilter: ContentStatus | '';
  typeFilter: ContentType | '';
  searchQuery: string;
  onStatusChange: (status: ContentStatus | '') => void;
  onTypeChange: (type: ContentType | '') => void;
  onSearchChange: (query: string) => void;
}

export interface AuthorityDashboardProps {
  signals: AuthoritySignals;
  isLoading?: boolean;
}

export interface CiteMindStatusIndicatorProps {
  status: CiteMindStatus;
  issues?: CiteMindIssue[];
  onViewIssues?: () => void;
}

// ============================================
// AUDIT LEDGER (P2.6 - AUTOMATE_EXECUTION_MODEL)
// ============================================

/**
 * Audit Ledger Entry - Structured execution record per AUTOMATE_EXECUTION_MODEL
 *
 * P2.6: Upgrade Autopilot "recently handled" to structured execution ledger shape.
 * Provides transparent audit trail for all automated actions.
 *
 * @see /docs/canon/AUTOMATE_EXECUTION_MODEL.md
 */
export interface AuditLedgerEntry {
  /** Unique entry identifier */
  id: string;
  /** ISO 8601 timestamp of execution */
  timestamp: string;
  /** Who performed the action: system (AUTOMATE) or user */
  actor: 'system' | 'user';
  /** Type of action performed */
  actionType: 'brief_execution' | 'derivative_generation' | 'citemind_check' | 'cross_pillar_sync' | 'scheduling' | 'status_change';
  /** Human-readable summary of the action */
  summary: string;
  /** Outcome of the action */
  outcome: 'completed' | 'passed' | 'failed' | 'pending';
  /** Optional provenance information for deep audit */
  provenance?: {
    /** Confidence score at time of execution (0-1) */
    confidence?: number;
    /** Risk class per AUTOMATE Section 5 */
    riskClass?: 'low' | 'medium' | 'high' | 'critical';
    /** Source pillar if cross-pillar action */
    sourcePillar?: 'content' | 'pr' | 'seo';
    /** Target pillar if cross-pillar action */
    targetPillar?: 'content' | 'pr' | 'seo';
    /** Related entity ID */
    relatedEntityId?: string;
    /** Automation mode at time of execution */
    mode?: AutomationMode;
  };
}
