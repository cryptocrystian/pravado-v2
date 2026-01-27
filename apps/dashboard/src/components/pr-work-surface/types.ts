/**
 * PR Work Surface V1 Types
 *
 * Contract-first types for the PR Work Surface.
 * @see /contracts/examples/pr-work-surface.json
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
 */

// ============================================
// ENTITY TYPES
// ============================================

export type EntityType = 'journalist' | 'podcast' | 'influencer' | 'kol' | 'outlet';

export type PreferredChannel = 'email' | 'social' | 'form' | 'phone';

export type RelationshipStage = 'cold' | 'warm' | 'engaged' | 'advocate';

export type OutletTier = 't1' | 't2' | 't3' | 'trade' | 'niche';

export type Sentiment = 'positive' | 'neutral' | 'negative';

export type PitchStatus = 'draft' | 'scheduled' | 'sent' | 'opened' | 'replied' | 'declined';

export type DistributionTrack = 'citemind_aeo' | 'legacy_wire';

export type DistributionStatus = 'draft' | 'pending_approval' | 'distributed' | 'failed';

export type AutomationMode = 'manual' | 'copilot' | 'autopilot';

// Alias for styling contract compatibility
export type Mode = AutomationMode;

// ============================================
// MEDIA CONTACT (CRM Entity)
// ============================================

export interface MediaContact {
  id: string;
  entityType: EntityType;
  name: string;
  email?: string;
  outlet?: string;
  beats: string[];
  topicCurrency: number; // 0-100, freshness decay indicator
  preferredChannels: PreferredChannel[];
  relationshipStage: RelationshipStage;
  pitchEligibilityScore: number; // 0-100
  lastInteraction?: string; // ISO datetime
  lastMention?: string; // ISO datetime
  lastCitation?: string; // ISO datetime
  aiCitationScore?: number; // 0-100, CiteMind Engine 3 score
  notes?: string;
  tags: string[];
}

// ============================================
// TIMELINE & INTERACTIONS
// ============================================

export type TimelineEntryType =
  | 'pitch_sent'
  | 'pitch_opened'
  | 'pitch_replied'
  | 'coverage_published'
  | 'citation_detected'
  | 'meeting'
  | 'social_interaction'
  | 'note';

export interface TimelineEntry {
  id: string;
  contactId: string;
  type: TimelineEntryType;
  timestamp: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// PITCH
// ============================================

export interface Pitch {
  id: string;
  contactId: string;
  sequenceId?: string; // Required for manual send API
  contact?: MediaContact;
  subject: string;
  body: string;
  personalizationScore: number; // 0-100
  status: PitchStatus;
  createdAt: string;
  sentAt?: string;
  openedAt?: string;
  repliedAt?: string;
  followUpCount: number;
}

// ============================================
// COVERAGE
// ============================================

export interface Coverage {
  id: string;
  url: string;
  headline: string;
  outlet: string;
  tier: OutletTier;
  sentiment: Sentiment;
  publishedAt: string;
  citationDetected: boolean;
  attributedPitchId?: string;
  attributedReleaseId?: string;
  summary?: string;
}

// ============================================
// DISTRIBUTION
// ============================================

export interface PressRelease {
  id: string;
  headline: string;
  subheadline?: string;
  body: string;
  boilerplate?: string;
  mediaContactInfo?: string;
  status: 'draft' | 'ready' | 'distributed';
  createdAt: string;
  updatedAt: string;
  schema?: {
    type: 'NewsArticle';
    generated: boolean;
  };
}

export interface Distribution {
  id: string;
  releaseId: string;
  release?: PressRelease;
  track: DistributionTrack;
  status: DistributionStatus;
  cost?: number; // Cost in cents
  distributedAt?: string;
  citeMindEnabled: boolean;
  indexNowSent: boolean;
  citationTrackingEnabled: boolean;
}

export interface DistributionTrackConfig {
  id: DistributionTrack;
  label: string;
  description: string;
  defaultEnabled: boolean;
  requiresExplicitConfirmation?: boolean;
  planGated?: boolean;
  minimumPlan?: string;
  cost: number;
  features: string[];
}

// ============================================
// COPILOT SUGGESTIONS
// ============================================

export type SuggestionType =
  | 'pitch_opportunity'
  | 'follow_up'
  | 'relationship_maintenance'
  | 'trending_topic'
  | 'competitive_response';

export interface CopilotSuggestion {
  id: string;
  type: SuggestionType;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  rationale: string;
  confidence: number; // 0-100
  actionLabel: string;
  actionUrl?: string;
  relatedContactIds?: string[];
  expiresAt?: string;
}

// ============================================
// ATTENTION ITEMS (Manual Tasks)
// ============================================

export type AttentionItemType =
  | 'respond_inquiry'
  | 'follow_up_pitch'
  | 'review_coverage'
  | 'approve_distribution'
  | 'relationship_decay';

export interface AttentionItem {
  id: string;
  type: AttentionItemType;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionLabel: string;
  actionUrl?: string;
  dueBy?: string;
  relatedContactId?: string;
  relatedPitchId?: string;
}

// ============================================
// SITUATION BRIEF (Overview)
// ============================================

export interface PRSituationBrief {
  generatedAt: string;
  stats: {
    activePitches: number;
    pendingFollowUps: number;
    newCoverage7d: number;
    citationsDetected7d: number;
    relationshipsAtRisk: number;
  };
  topSignals: Array<{
    id: string;
    type: 'opportunity' | 'risk' | 'trend';
    severity: number;
    title: string;
    description: string;
    affectedPillars: string[];
    ctaLabel?: string;
    ctaHref?: string;
  }>;
  attentionItems: AttentionItem[];
  copilotSuggestions: CopilotSuggestion[];
}

// ============================================
// AUTOMATION CEILING
// ============================================

export interface AutomationCeiling {
  action: string;
  modeCeiling: AutomationMode;
  rationale: string;
  overridable: boolean;
}

// ============================================
// GUARDRAILS
// ============================================

export interface PRGuardrails {
  personalizationMinimum: number;
  followUpLimitPerWeek: number;
  dailyPitchCap: Record<string, number>;
  newContactRateWarning: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface DatabaseResponse {
  contacts: MediaContact[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PitchesResponse {
  pitches: Pitch[];
  total: number;
}

export interface CoverageResponse {
  coverage: Coverage[];
  total: number;
}

export interface DistributionResponse {
  distributions: Distribution[];
  releases: PressRelease[];
}

// ============================================
// V1.1 TYPES — INBOX
// ============================================

export type InboxItemType =
  | 'inquiry'
  | 'follow_up_due'
  | 'coverage_triage'
  | 'relationship_decay'
  | 'approval_queue'
  | 'data_hygiene';

export interface InboxItem {
  id: string;
  type: InboxItemType;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  dueAt?: string; // ISO datetime
  urgency: number; // 0-100, affects sort order
  confidence?: number; // 0-100, system confidence
  risk?: 'none' | 'low' | 'medium' | 'high';

  // Related entities
  relatedContactId?: string;
  relatedPitchId?: string;
  relatedCoverageId?: string;
  relatedReleaseId?: string;

  // Primary CTA
  primaryAction: {
    label: string;
    targetRoute: string;
    preloadContext?: Record<string, unknown>;
  };

  // Secondary action (optional)
  secondaryAction?: {
    label: string;
    onClick?: () => void;
  };

  // Automation context
  modeCeiling: AutomationMode;
  sageContributions?: SAGEContribution[];
  eviImpact?: EVIImpact;

  createdAt: string;
  expiresAt?: string;
}

// ============================================
// V1.1 TYPES — RELATIONSHIP LEDGER
// ============================================

export type LedgerEventType =
  | 'pitch_drafted'
  | 'pitch_sent'
  | 'pitch_opened'
  | 'reply_received'
  | 'coverage_won'
  | 'coverage_lost'
  | 'note_added'
  | 'task_created'
  | 'task_completed'
  | 'relationship_stage_changed'
  | 'topic_currency_changed'
  | 'enrichment_suggested'
  | 'enrichment_approved'
  | 'enrichment_rejected'
  | 'meeting_logged'
  | 'social_interaction'
  | 'citation_detected';

export interface LedgerEventChange {
  field: string;
  previousValue: unknown;
  newValue: unknown;
  reason: string; // Human-readable explanation
}

export interface LedgerEventActor {
  type: 'user' | 'system' | 'contact';
  id?: string;
  name?: string;
}

export interface LedgerEvent {
  id: string;
  contactId: string;
  type: LedgerEventType;
  timestamp: string;

  // Event details
  title: string;
  description?: string;

  // Related entities
  relatedPitchId?: string;
  relatedCoverageId?: string;
  relatedTaskId?: string;

  // Metadata
  metadata?: Record<string, unknown>;

  // For stage/score changes - explainability
  change?: LedgerEventChange;

  // Actor
  actor: LedgerEventActor;

  // SAGE/EVI context
  sageContribution?: SAGEContribution;
  eviImpact?: EVIImpact;
}

export interface NextBestAction {
  id: string;
  contactId: string;
  title: string;
  description: string;
  rationale: string;
  confidence: number;
  modeCeiling: AutomationMode;
  sageContributions: SAGEContribution[];
  eviImpact: EVIImpact;
  primaryAction: {
    label: string;
    targetRoute?: string;
    onClick?: () => void;
  };
}

// ============================================
// V1.1 TYPES — PITCH PIPELINE
// ============================================

export type PitchPipelineStage =
  | 'drafting'
  | 'ready_to_send'
  | 'sent'
  | 'opened'
  | 'replied'
  | 'won'
  | 'lost'
  | 'follow_up_due';

export interface FollowUpWindow {
  opensAt: string;
  closesAt: string;
  suggestedTemplates: string[];
}

export interface PitchPipelineItem {
  id: string;
  pitchId: string;
  pitch: Pitch;
  contact: MediaContact;

  stage: PitchPipelineStage;
  stageEnteredAt: string;

  // Follow-up tracking
  followUpWindow?: FollowUpWindow;
  followUpCount: number;
  maxFollowUps: number; // Guardrail: max 2 per 7 days

  // Timing
  daysSinceLastActivity: number;
  isOverdue: boolean;

  // Context
  sageContributions?: SAGEContribution[];
  eviImpact?: EVIImpact;
}

// ============================================
// V1.1 TYPES — IMPACT STRIP (SAGE/EVI/AUTOMATE)
// ============================================

export type SAGEDimension = 'signal' | 'authority' | 'growth' | 'exposure';

export interface SAGEContribution {
  dimension: SAGEDimension;
  isPrimary: boolean;
  weight?: number; // 0-1
  label?: string;
}

export type EVIDriver = 'visibility' | 'authority' | 'momentum';
export type EVIDirection = 'positive' | 'neutral' | 'negative';

export interface EVIImpact {
  driver: EVIDriver;
  direction: EVIDirection;
  delta?: number; // Expected change
  explanation?: string;
}

export interface ImpactStripData {
  sageContributions: SAGEContribution[];
  eviImpact: EVIImpact;
  mode: AutomationMode;
  modeRationale?: string;
}

// ============================================
// V1.1 TYPES — ENHANCED DISTRIBUTION
// ============================================

export interface DistributionTrackInfo {
  track: DistributionTrack;
  isPrimary: boolean;
  headline: string;
  description: string;
  features: string[];
  cost?: number;
  costDescription?: string;
  requiresConfirmation: boolean;
  expectedOutcomes: string[];
  citeMindIntegration?: {
    schemaGeneration: boolean;
    indexNow: boolean;
    citationTracking: boolean;
  };
}

// ============================================
// V1.1 TYPES — DATABASE ADVANCED FILTERS
// ============================================

export type OutletType = 'newspaper' | 'magazine' | 'blog' | 'broadcast' | 'wire' | 'podcast' | 'newsletter';

export type VerificationStatus = 'verified' | 'unverified' | 'outdated' | 'needs_review';

export type AudienceSignal = 'growing' | 'stable' | 'declining' | 'unknown';

export interface DateRangeFilter {
  from?: string; // ISO date
  to?: string;
}

export interface RangeFilter {
  min?: number;
  max?: number;
}

export interface DatabaseFilterState {
  // Quick filters (always visible as chips)
  entityTypes: EntityType[];
  relationshipStages: RelationshipStage[];

  // Advanced filters (in drawer)
  geos: string[];
  languages: string[];
  outletTypes: OutletType[];
  outletTiers: OutletTier[];
  beatTags: string[];
  topicCurrencyRange: RangeFilter;
  lastTouchRange: DateRangeFilter;
  pitchScoreRange: RangeFilter;
  verificationStatuses: VerificationStatus[];
  audienceSignals: AudienceSignal[];

  // Search
  searchQuery: string;
}

export interface SavedSegment {
  id: string;
  name: string;
  description?: string;
  filters: DatabaseFilterState;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  color?: string;
}

export interface DataQualityStats {
  totalContacts: number;
  verifiedCount: number;
  unverifiedCount: number;
  outdatedCount: number;
  missingEmailCount: number;
  missingBeatsCount: number;
  lowTopicCurrencyCount: number;
  qualityScore: number; // 0-100
}
