/**
 * Crisis Response & Escalation Engine Types (Sprint S55)
 *
 * Type definitions for crisis detection, incident management,
 * escalation rules, crisis briefings, and action recommendations.
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Crisis severity levels
 */
export type CrisisSeverity = 'low' | 'medium' | 'high' | 'critical' | 'severe';
export const CrisisSeverity = {
  LOW: 'low' as const,
  MEDIUM: 'medium' as const,
  HIGH: 'high' as const,
  CRITICAL: 'critical' as const,
  SEVERE: 'severe' as const,
};

/**
 * Source systems that can trigger crisis signals
 */
export type CrisisSourceSystem = 'media_monitoring' | 'media_crawling' | 'media_alerts' | 'journalist_timeline' | 'media_performance' | 'competitive_intel' | 'media_briefing' | 'manual_entry' | 'external_api' | 'social_listening';
export const CrisisSourceSystem = {
  MEDIA_MONITORING: 'media_monitoring' as const,
  MEDIA_CRAWLING: 'media_crawling' as const,
  MEDIA_ALERTS: 'media_alerts' as const,
  JOURNALIST_TIMELINE: 'journalist_timeline' as const,
  MEDIA_PERFORMANCE: 'media_performance' as const,
  COMPETITIVE_INTEL: 'competitive_intel' as const,
  MEDIA_BRIEFING: 'media_briefing' as const,
  MANUAL_ENTRY: 'manual_entry' as const,
  EXTERNAL_API: 'external_api' as const,
  SOCIAL_LISTENING: 'social_listening' as const,
};

/**
 * Crisis trajectory direction
 */
export type CrisisTrajectory = 'improving' | 'stable' | 'worsening' | 'critical' | 'resolved' | 'unknown';
export const CrisisTrajectory = {
  IMPROVING: 'improving' as const,
  STABLE: 'stable' as const,
  WORSENING: 'worsening' as const,
  CRITICAL: 'critical' as const,
  RESOLVED: 'resolved' as const,
  UNKNOWN: 'unknown' as const,
};

/**
 * Crisis propagation level
 */
export type CrisisPropagationLevel = 'contained' | 'spreading' | 'viral' | 'mainstream' | 'saturated';
export const CrisisPropagationLevel = {
  CONTAINED: 'contained' as const,
  SPREADING: 'spreading' as const,
  VIRAL: 'viral' as const,
  MAINSTREAM: 'mainstream' as const,
  SATURATED: 'saturated' as const,
};

/**
 * Crisis brief format types
 */
export enum CrisisBriefFormat {
  EXECUTIVE_SUMMARY = 'executive_summary',
  FULL_BRIEF = 'full_brief',
  SITUATION_REPORT = 'situation_report',
  STAKEHOLDER_BRIEF = 'stakeholder_brief',
  MEDIA_RESPONSE = 'media_response',
  LEGAL_BRIEF = 'legal_brief',
}

/**
 * Crisis brief section types
 */
export enum CrisisBriefSectionType {
  SITUATION_OVERVIEW = 'situation_overview',
  TIMELINE_OF_EVENTS = 'timeline_of_events',
  MEDIA_LANDSCAPE = 'media_landscape',
  KEY_STAKEHOLDERS = 'key_stakeholders',
  SENTIMENT_ANALYSIS = 'sentiment_analysis',
  PROPAGATION_ANALYSIS = 'propagation_analysis',
  RECOMMENDED_ACTIONS = 'recommended_actions',
  TALKING_POINTS = 'talking_points',
  QA_PREPARATION = 'qa_preparation',
  RISK_ASSESSMENT = 'risk_assessment',
  MITIGATION_STATUS = 'mitigation_status',
  NEXT_STEPS = 'next_steps',
}

/**
 * Crisis action types
 */
export enum CrisisActionType {
  STATEMENT_RELEASE = 'statement_release',
  MEDIA_OUTREACH = 'media_outreach',
  SOCIAL_RESPONSE = 'social_response',
  INTERNAL_COMMS = 'internal_comms',
  STAKEHOLDER_BRIEFING = 'stakeholder_briefing',
  LEGAL_REVIEW = 'legal_review',
  EXECUTIVE_ESCALATION = 'executive_escalation',
  MONITORING_INCREASE = 'monitoring_increase',
  CONTENT_CREATION = 'content_creation',
  PRESS_CONFERENCE = 'press_conference',
  INTERVIEW_PREP = 'interview_prep',
  FACT_CHECK = 'fact_check',
  THIRD_PARTY_OUTREACH = 'third_party_outreach',
  NO_COMMENT = 'no_comment',
  OTHER = 'other',
}

/**
 * Crisis action status
 */
export type CrisisActionStatus = 'recommended' | 'approved' | 'in_progress' | 'completed' | 'deferred' | 'rejected' | 'failed';
export const CrisisActionStatus = {
  RECOMMENDED: 'recommended' as const,
  APPROVED: 'approved' as const,
  IN_PROGRESS: 'in_progress' as const,
  COMPLETED: 'completed' as const,
  DEFERRED: 'deferred' as const,
  REJECTED: 'rejected' as const,
  FAILED: 'failed' as const,
};

/**
 * Incident status
 */
export type IncidentStatus = 'active' | 'contained' | 'resolved' | 'closed';
export const IncidentStatus = {
  ACTIVE: 'active' as const,
  CONTAINED: 'contained' as const,
  RESOLVED: 'resolved' as const,
  CLOSED: 'closed' as const,
};

/**
 * Urgency levels
 */
export type CrisisUrgency = 'immediate' | 'urgent' | 'normal' | 'low';

export const CrisisUrgency = {
  IMMEDIATE: 'immediate' as const,
  URGENT: 'urgent' as const,
  NORMAL: 'normal' as const,
  LOW: 'low' as const,
};

/**
 * Escalation rule types
 */
export type EscalationRuleType = 'threshold' | 'pattern' | 'time_based';
export const EscalationRuleType = {
  THRESHOLD: 'threshold' as const,
  PATTERN: 'pattern' as const,
  TIME_BASED: 'time_based' as const,
};

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Raw detected event from source systems
 */
export interface CrisisEvent {
  id: string;
  orgId: string;
  title: string;
  description?: string;
  sourceSystem: CrisisSourceSystem;
  sourceId?: string;
  sourceUrl?: string;
  eventType: string;
  keywords: string[];
  topics: string[];
  sentimentScore?: number;
  magnitudeScore?: number;
  confidenceScore?: number;
  estimatedReach?: number;
  velocityScore?: number;
  sourceMetadata: Record<string, unknown>;
  entitiesMentioned: CrisisEntityMention[];
  outletsInvolved: string[];
  journalistsInvolved: string[];
  isProcessed: boolean;
  processedAt?: Date;
  linkedIncidentId?: string;
  linkedSignalId?: string;
  eventTimestamp: Date;
  detectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entity mentioned in crisis event
 */
export interface CrisisEntityMention {
  type: 'person' | 'organization' | 'brand' | 'product' | 'location';
  name: string;
  sentiment?: number;
  relevance?: number;
}

/**
 * Aggregated signal indicating potential crisis
 */
export interface CrisisSignal {
  id: string;
  orgId: string;
  signalType: string;
  title: string;
  description?: string;
  severity: CrisisSeverity;
  confidenceScore: number;
  priorityScore: number;
  detectionMethod: string;
  triggerConditions: TriggerConditions;
  sourceEvents: string[];
  sourceSystems: CrisisSourceSystem[];
  sentimentScore?: number;
  sentimentVelocity?: number;
  mentionVelocity?: number;
  estimatedImpact?: number;
  propagationScore?: number;
  windowStart: Date;
  windowEnd: Date;
  isActive: boolean;
  isEscalated: boolean;
  escalatedAt?: Date;
  escalatedBy?: string;
  linkedIncidentId?: string;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Trigger conditions for signals
 */
export interface TriggerConditions {
  severityGte?: CrisisSeverity;
  sentimentLte?: number;
  mentionVelocityGte?: number;
  propagationLevel?: CrisisPropagationLevel[];
  keywordsAny?: string[];
  sourcesAny?: CrisisSourceSystem[];
  timeWindowMinutes?: number;
}

/**
 * Main incident record for crisis management
 */
export interface CrisisIncident {
  id: string;
  orgId: string;
  title: string;
  description?: string;
  summary?: string;
  incidentCode?: string;
  severity: CrisisSeverity;
  trajectory: CrisisTrajectory;
  propagationLevel: CrisisPropagationLevel;
  crisisType?: string;
  affectedProducts: string[];
  affectedRegions: string[];
  affectedStakeholders: string[];
  keywords: string[];
  topics: string[];
  linkedSignalIds: string[];
  linkedEventIds: string[];
  linkedMentionIds: string[];
  linkedAlertIds: string[];
  linkedArticleIds: string[];
  linkedCompetitorIds: string[];
  sentimentScore?: number;
  sentimentTrend?: number;
  mentionCount: number;
  estimatedReach: number;
  mediaValueImpact?: number;
  propagationScore?: number;
  riskScore?: number;
  sentimentHistory: SentimentWindow[];
  mentionHistory: MentionWindow[];
  status: IncidentStatus;
  isEscalated: boolean;
  escalationLevel: number;
  firstDetectedAt: Date;
  escalatedAt?: Date;
  containedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  ownerId?: string;
  teamIds: string[];
  createdBy: string;
  llmModel?: string;
  llmGeneratedSummary?: string;
  llmRiskAssessment?: RiskAssessment;
  llmRecommendations?: ActionRecommendation[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Sentiment time window entry
 */
export interface SentimentWindow {
  timestamp: Date;
  score: number;
  sampleSize?: number;
}

/**
 * Mention count time window entry
 */
export interface MentionWindow {
  timestamp: Date;
  count: number;
  sources?: string[];
}

/**
 * Risk assessment structure
 */
export interface RiskAssessment {
  overallRisk: number;
  reputationRisk: number;
  financialRisk: number;
  operationalRisk: number;
  legalRisk: number;
  factors: RiskFactor[];
  mitigationStatus: MitigationLevel;
}

/**
 * Individual risk factor
 */
export interface RiskFactor {
  name: string;
  description: string;
  severity: CrisisSeverity;
  likelihood: number;
  impact: number;
  mitigated: boolean;
}

/**
 * Mitigation level
 */
export enum MitigationLevel {
  NONE = 'none',
  PARTIAL = 'partial',
  SUBSTANTIAL = 'substantial',
  FULL = 'full',
}

/**
 * Action recommendation from AI
 */
export interface ActionRecommendation {
  actionType: CrisisActionType;
  title: string;
  description: string;
  priority: number;
  urgency: CrisisUrgency;
  rationale: string;
  expectedOutcome: string;
  estimatedDurationMins?: number;
  dependencies?: string[];
  risks?: string[];
}

/**
 * Crisis action record
 */
export interface CrisisAction {
  id: string;
  orgId: string;
  incidentId: string;
  title: string;
  description?: string;
  actionType: CrisisActionType;
  status: CrisisActionStatus;
  priorityScore: number;
  urgency?: CrisisUrgency;
  dueAt?: Date;
  estimatedDurationMins?: number;
  isAiGenerated: boolean;
  generationContext?: Record<string, unknown>;
  llmModel?: string;
  confidenceScore?: number;
  assignedTo?: string;
  approvedBy?: string;
  approvedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  completionNotes?: string;
  outcome?: 'success' | 'partial' | 'failed';
  outcomeNotes?: string;
  impactAssessment?: Record<string, unknown>;
  linkedContentIds: string[];
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Attachment structure
 */
export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number;
}

/**
 * Escalation rule
 */
export interface CrisisEscalationRule {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  ruleType: EscalationRuleType;
  conditions: EscalationConditions;
  escalationActions: EscalationAction[];
  escalationLevel: number;
  notifyChannels: string[];
  notifyRoles: string[];
  notifyUserIds: string[];
  isActive: boolean;
  isSystem: boolean;
  lastTriggeredAt?: Date;
  triggerCount: number;
  cooldownMinutes: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Escalation conditions
 */
export interface EscalationConditions {
  severityGte?: CrisisSeverity;
  sentimentLte?: number;
  mentionVelocityGte?: number;
  propagationLevel?: CrisisPropagationLevel[];
  keywordsAny?: string[];
  sourcesAny?: CrisisSourceSystem[];
  timeWindowMinutes?: number;
  trajectoryIn?: CrisisTrajectory[];
  riskScoreGte?: number;
}

/**
 * Escalation action to take when rule triggers
 */
export interface EscalationAction {
  type: 'notify' | 'create_incident' | 'generate_brief' | 'webhook' | 'update_severity';
  channel?: string;
  recipients?: string[];
  severity?: CrisisSeverity;
  format?: CrisisBriefFormat;
  url?: string;
  payload?: Record<string, unknown>;
}

/**
 * Crisis brief document
 */
export interface CrisisBrief {
  id: string;
  orgId: string;
  incidentId: string;
  title: string;
  subtitle?: string;
  format: CrisisBriefFormat;
  version: number;
  executiveSummary?: string;
  keyTakeaways: KeyTakeaway[];
  riskAssessment?: RiskAssessment;
  recommendations: ActionRecommendation[];
  status: 'draft' | 'generated' | 'reviewed' | 'approved';
  isCurrent: boolean;
  generatedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  approvedAt?: Date;
  approvedBy?: string;
  llmModel?: string;
  llmTemperature?: number;
  totalTokensUsed: number;
  generationDurationMs?: number;
  generationContext?: Record<string, unknown>;
  sharedWith: string[];
  sharedAt?: Date;
  distributionChannels: string[];
  sections?: CrisisBriefSection[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Key takeaway structure
 */
export interface KeyTakeaway {
  title: string;
  content: string;
  priority: number;
  category?: string;
}

/**
 * Crisis brief section
 */
export interface CrisisBriefSection {
  id: string;
  orgId: string;
  briefId: string;
  sectionType: CrisisBriefSectionType;
  title?: string;
  sortOrder: number;
  content?: string;
  summary?: string;
  bulletPoints: BulletPoint[];
  supportingData: Record<string, unknown>;
  sourceReferences: CrisisSourceReference[];
  isGenerated: boolean;
  isManuallyEdited: boolean;
  generationPrompt?: string;
  llmModel?: string;
  tokensUsed?: number;
  generationDurationMs?: number;
  generatedAt?: Date;
  editedAt?: Date;
  editedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Bullet point structure
 */
export interface BulletPoint {
  text: string;
  subPoints?: string[];
  importance?: 'high' | 'medium' | 'low';
}

/**
 * Source reference for sections
 */
export interface CrisisSourceReference {
  type: string;
  id?: string;
  title: string;
  url?: string;
  excerpt?: string;
}

/**
 * Audit log entry
 */
export interface CrisisAuditLogEntry {
  id: string;
  orgId: string;
  incidentId?: string;
  userId?: string;
  action: string;
  entityType: 'incident' | 'action' | 'brief' | 'signal' | 'rule' | 'event';
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  changeSummary?: string;
  metadata: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// ============================================================================
// PROPAGATION & TRAJECTORY TYPES
// ============================================================================

/**
 * Crisis propagation data
 */
export interface CrisisPropagation {
  level: CrisisPropagationLevel;
  velocity: number;
  outlets: PropagationOutlet[];
  timeline: PropagationEvent[];
  estimatedPeak?: Date;
  containmentLikelihood: number;
}

/**
 * Outlet in propagation chain
 */
export interface PropagationOutlet {
  name: string;
  tier: number;
  reach: number;
  firstMention: Date;
  mentionCount: number;
  sentiment: number;
}

/**
 * Event in propagation timeline
 */
export interface PropagationEvent {
  timestamp: Date;
  eventType: string;
  outlet?: string;
  description: string;
  impact: number;
}

/**
 * Trajectory analysis
 */
export interface TrajectoryAnalysis {
  current: CrisisTrajectory;
  predicted: CrisisTrajectory;
  confidence: number;
  factors: TrajectoryFactor[];
  projectedResolution?: Date;
}

/**
 * Factor affecting trajectory
 */
export interface TrajectoryFactor {
  name: string;
  direction: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Create incident request
 */
export interface CreateIncidentRequest {
  title: string;
  description?: string;
  severity?: CrisisSeverity;
  crisisType?: string;
  affectedProducts?: string[];
  affectedRegions?: string[];
  affectedStakeholders?: string[];
  keywords?: string[];
  topics?: string[];
  linkedSignalIds?: string[];
  linkedEventIds?: string[];
  linkedMentionIds?: string[];
  linkedAlertIds?: string[];
  linkedCompetitorIds?: string[];
  ownerId?: string;
  teamIds?: string[];
}

/**
 * Update incident request
 */
export interface UpdateIncidentRequest {
  title?: string;
  description?: string;
  summary?: string;
  severity?: CrisisSeverity;
  trajectory?: CrisisTrajectory;
  propagationLevel?: CrisisPropagationLevel;
  status?: IncidentStatus;
  crisisType?: string;
  affectedProducts?: string[];
  affectedRegions?: string[];
  affectedStakeholders?: string[];
  keywords?: string[];
  topics?: string[];
  linkedSignalIds?: string[];
  linkedEventIds?: string[];
  linkedMentionIds?: string[];
  linkedAlertIds?: string[];
  linkedCompetitorIds?: string[];
  ownerId?: string;
  teamIds?: string[];
  escalationLevel?: number;
}

/**
 * Create action request
 */
export interface CreateActionRequest {
  incidentId: string;
  title: string;
  description?: string;
  actionType: CrisisActionType;
  priorityScore?: number;
  urgency?: CrisisUrgency;
  dueAt?: Date;
  estimatedDurationMins?: number;
  assignedTo?: string;
}

/**
 * Update action request
 */
export interface UpdateActionRequest {
  title?: string;
  description?: string;
  status?: CrisisActionStatus;
  priorityScore?: number;
  urgency?: CrisisUrgency;
  dueAt?: Date;
  assignedTo?: string;
  completionNotes?: string;
  outcome?: 'success' | 'partial' | 'failed';
  outcomeNotes?: string;
}

/**
 * Create escalation rule request
 */
export interface CreateEscalationRuleRequest {
  name: string;
  description?: string;
  ruleType: EscalationRuleType;
  conditions: EscalationConditions;
  escalationActions: EscalationAction[];
  escalationLevel?: number;
  notifyChannels?: string[];
  notifyRoles?: string[];
  notifyUserIds?: string[];
  cooldownMinutes?: number;
}

/**
 * Update escalation rule request
 */
export interface UpdateEscalationRuleRequest {
  name?: string;
  description?: string;
  conditions?: EscalationConditions;
  escalationActions?: EscalationAction[];
  escalationLevel?: number;
  notifyChannels?: string[];
  notifyRoles?: string[];
  notifyUserIds?: string[];
  isActive?: boolean;
  cooldownMinutes?: number;
}

/**
 * Generate crisis brief request
 */
export interface GenerateCrisisBriefRequest {
  format?: CrisisBriefFormat;
  focusAreas?: string[];
  customInstructions?: string;
  includeSections?: CrisisBriefSectionType[];
  excludeSections?: CrisisBriefSectionType[];
}

/**
 * Regenerate section request
 */
export interface CrisisRegenerateSectionRequest {
  customInstructions?: string;
  preserveManualEdits?: boolean;
}

/**
 * Update section request
 */
export interface CrisisUpdateSectionRequest {
  title?: string;
  content?: string;
  summary?: string;
  bulletPoints?: BulletPoint[];
}

/**
 * Detection trigger request
 */
export interface TriggerDetectionRequest {
  timeWindowMinutes?: number;
  sourceSystems?: CrisisSourceSystem[];
  keywords?: string[];
  forceRefresh?: boolean;
}

// ============================================================================
// QUERY FILTERS
// ============================================================================

/**
 * Incident filters
 */
export interface IncidentFilters {
  status?: IncidentStatus[];
  severity?: CrisisSeverity[];
  trajectory?: CrisisTrajectory[];
  propagationLevel?: CrisisPropagationLevel[];
  crisisType?: string;
  searchQuery?: string;
  ownerId?: string;
  isEscalated?: boolean;
  escalationLevelGte?: number;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'createdAt' | 'updatedAt' | 'severity' | 'riskScore' | 'mentionCount';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Signal filters
 */
export interface SignalFilters {
  severity?: CrisisSeverity[];
  isActive?: boolean;
  isEscalated?: boolean;
  sourceSystems?: CrisisSourceSystem[];
  linkedIncidentId?: string;
  windowFrom?: Date;
  windowTo?: Date;
  sortBy?: 'createdAt' | 'priorityScore' | 'severity';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Action filters
 */
export interface ActionFilters {
  incidentId?: string;
  status?: CrisisActionStatus[];
  actionType?: CrisisActionType[];
  assignedTo?: string;
  isAiGenerated?: boolean;
  dueBefore?: Date;
  sortBy?: 'createdAt' | 'priorityScore' | 'dueAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Brief filters
 */
export interface BriefFilters {
  incidentId?: string;
  format?: CrisisBriefFormat[];
  status?: string[];
  isCurrent?: boolean;
  sortBy?: 'createdAt' | 'version';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Get incidents response
 */
export interface GetIncidentsResponse {
  incidents: CrisisIncident[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Get signals response
 */
export interface GetSignalsResponse {
  signals: CrisisSignal[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Get actions response
 */
export interface GetActionsResponse {
  actions: CrisisAction[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Get briefs response
 */
export interface GetBriefsResponse {
  briefs: CrisisBrief[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Detection result response
 */
export interface DetectionResultResponse {
  eventsProcessed: number;
  signalsGenerated: number;
  incidentsCreated: number;
  escalationsTriggered: number;
  signals: CrisisSignal[];
  incidents: CrisisIncident[];
  processingTimeMs: number;
}

/**
 * Brief generation response
 */
export interface BriefGenerationResponse {
  brief: CrisisBrief;
  sections: CrisisBriefSection[];
  tokensUsed: number;
  generationTimeMs: number;
}

/**
 * Section regeneration response
 */
export interface CrisisSectionRegenerationResponse {
  section: CrisisBriefSection;
  tokensUsed: number;
  generationTimeMs: number;
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

/**
 * Crisis dashboard statistics
 */
export interface CrisisDashboardStats {
  activeIncidents: number;
  activeSignals: number;
  pendingActions: number;
  escalatedCount: number;
  bySeverity: Record<CrisisSeverity, number>;
  byTrajectory: Record<CrisisTrajectory, number>;
  recentActivity: RecentActivity[];
  sentimentTrend: SentimentWindow[];
}

/**
 * Recent activity entry
 */
export interface RecentActivity {
  type: 'incident' | 'signal' | 'action' | 'brief' | 'escalation';
  title: string;
  description: string;
  severity?: CrisisSeverity;
  timestamp: Date;
  entityId: string;
}

// ============================================================================
// SECTION CONFIGS
// ============================================================================

/**
 * Section type configurations
 */
export const CRISIS_SECTION_CONFIGS: Record<
  CrisisBriefSectionType,
  { label: string; icon: string; description: string }
> = {
  [CrisisBriefSectionType.SITUATION_OVERVIEW]: {
    label: 'Situation Overview',
    icon: '🎯',
    description: 'Current state of the crisis',
  },
  [CrisisBriefSectionType.TIMELINE_OF_EVENTS]: {
    label: 'Timeline',
    icon: '📅',
    description: 'Chronological event sequence',
  },
  [CrisisBriefSectionType.MEDIA_LANDSCAPE]: {
    label: 'Media Landscape',
    icon: '📰',
    description: 'Coverage analysis and trends',
  },
  [CrisisBriefSectionType.KEY_STAKEHOLDERS]: {
    label: 'Key Stakeholders',
    icon: '👥',
    description: 'Affected parties and influencers',
  },
  [CrisisBriefSectionType.SENTIMENT_ANALYSIS]: {
    label: 'Sentiment Analysis',
    icon: '📊',
    description: 'Public perception and trends',
  },
  [CrisisBriefSectionType.PROPAGATION_ANALYSIS]: {
    label: 'Propagation Analysis',
    icon: '🌐',
    description: 'Spread patterns and reach',
  },
  [CrisisBriefSectionType.RECOMMENDED_ACTIONS]: {
    label: 'Recommended Actions',
    icon: '✅',
    description: 'Suggested response steps',
  },
  [CrisisBriefSectionType.TALKING_POINTS]: {
    label: 'Talking Points',
    icon: '💬',
    description: 'Key messages for communications',
  },
  [CrisisBriefSectionType.QA_PREPARATION]: {
    label: 'Q&A Preparation',
    icon: '❓',
    description: 'Anticipated questions and answers',
  },
  [CrisisBriefSectionType.RISK_ASSESSMENT]: {
    label: 'Risk Assessment',
    icon: '⚠️',
    description: 'Risk evaluation and factors',
  },
  [CrisisBriefSectionType.MITIGATION_STATUS]: {
    label: 'Mitigation Status',
    icon: '🛡️',
    description: 'Response progress and effectiveness',
  },
  [CrisisBriefSectionType.NEXT_STEPS]: {
    label: 'Next Steps',
    icon: '➡️',
    description: 'Immediate priorities and follow-ups',
  },
};
