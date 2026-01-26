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

export type ContentStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived';
export type ContentType = 'blog_post' | 'long_form' | 'landing_page' | 'guide' | 'case_study';
export type CiteMindStatus = 'pending' | 'analyzing' | 'passed' | 'warning' | 'blocked';
export type DerivativeType = 'pr_pitch_excerpt' | 'aeo_snippet' | 'ai_summary' | 'social_fragment';
export type BriefStatus = 'draft' | 'approved' | 'in_progress' | 'completed';
export type SearchIntent = 'informational' | 'navigational' | 'commercial' | 'transactional';
export type AutomationMode = 'manual' | 'copilot' | 'autopilot';
export type DensityLevel = 'comfortable' | 'standard' | 'compact';
export type ContentView = 'overview' | 'library' | 'calendar' | 'insights';

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
// CONTENT BRIEF
// ============================================

export interface DerivativeMap {
  surfaces: DerivativeSurface[];
  expectedDerivatives: DerivativeType[];
}

export interface ContentBrief {
  id: string;
  organizationId?: string;
  title: string;
  status: BriefStatus;
  /** Primary keyword to target */
  targetKeyword?: string;
  /** Search intent type */
  targetIntent?: SearchIntent;
  /** SAGE-derived objective */
  strategicObjective?: string;
  /** Allowed claims */
  allowedAssertions?: string[];
  /** Required sources */
  requiredCitations?: string[];
  /** Derivative surface map */
  derivativeMap?: DerivativeMap;
  /** Target audience */
  targetAudience?: string;
  /** Content tone */
  tone?: string;
  /** Due date for the brief */
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

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

export interface ContentBriefsResponse {
  items: ContentBrief[];
  total: number;
}

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
// BRIEF WITH CONTEXT (Expanded response)
// ============================================

export interface ContentBriefWithContext {
  brief: ContentBrief;
  suggestedKeywords: string[];
  relatedTopics: { id: string; name: string }[];
  relatedAssets?: ContentAsset[];
}

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

export interface ContentBriefsParams {
  limit?: number;
  status?: BriefStatus;
}

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
