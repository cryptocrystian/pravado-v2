/**
 * Crisis Response & Escalation Engine Validators (Sprint S55)
 *
 * Zod schemas for validating crisis-related API requests
 */

import { z } from 'zod';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const crisisSeveritySchema = z.enum([
  'low',
  'medium',
  'high',
  'critical',
  'severe',
]);

export const crisisSourceSystemSchema = z.enum([
  'media_monitoring',
  'media_crawling',
  'media_alerts',
  'journalist_timeline',
  'media_performance',
  'competitive_intel',
  'media_briefing',
  'manual_entry',
  'external_api',
  'social_listening',
]);

export const crisisTrajectorySchema = z.enum([
  'improving',
  'stable',
  'worsening',
  'critical',
  'resolved',
  'unknown',
]);

export const crisisPropagationLevelSchema = z.enum([
  'contained',
  'spreading',
  'viral',
  'mainstream',
  'saturated',
]);

export const crisisBriefFormatSchema = z.enum([
  'executive_summary',
  'full_brief',
  'situation_report',
  'stakeholder_brief',
  'media_response',
  'legal_brief',
]);

export const crisisBriefSectionTypeSchema = z.enum([
  'situation_overview',
  'timeline_of_events',
  'media_landscape',
  'key_stakeholders',
  'sentiment_analysis',
  'propagation_analysis',
  'recommended_actions',
  'talking_points',
  'qa_preparation',
  'risk_assessment',
  'mitigation_status',
  'next_steps',
]);

export const crisisActionTypeSchema = z.enum([
  'statement_release',
  'media_outreach',
  'social_response',
  'internal_comms',
  'stakeholder_briefing',
  'legal_review',
  'executive_escalation',
  'monitoring_increase',
  'content_creation',
  'press_conference',
  'interview_prep',
  'fact_check',
  'third_party_outreach',
  'no_comment',
  'other',
]);

export const crisisActionStatusSchema = z.enum([
  'recommended',
  'approved',
  'in_progress',
  'completed',
  'deferred',
  'rejected',
  'failed',
]);

export const incidentStatusSchema = z.enum([
  'active',
  'contained',
  'resolved',
  'closed',
]);

export const crisisUrgencySchema = z.enum([
  'immediate',
  'urgent',
  'normal',
  'low',
]);

export const escalationRuleTypeSchema = z.enum([
  'threshold',
  'pattern',
  'time_based',
]);

// ============================================================================
// INCIDENT SCHEMAS
// ============================================================================

export const createIncidentSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  severity: crisisSeveritySchema.optional(),
  crisisType: z.string().max(100).optional(),
  affectedProducts: z.array(z.string()).optional(),
  affectedRegions: z.array(z.string()).optional(),
  affectedStakeholders: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
  linkedSignalIds: z.array(z.string().uuid()).optional(),
  linkedEventIds: z.array(z.string().uuid()).optional(),
  linkedMentionIds: z.array(z.string().uuid()).optional(),
  linkedAlertIds: z.array(z.string().uuid()).optional(),
  linkedCompetitorIds: z.array(z.string().uuid()).optional(),
  ownerId: z.string().uuid().optional(),
  teamIds: z.array(z.string().uuid()).optional(),
});

export const updateIncidentSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  summary: z.string().max(2000).optional(),
  severity: crisisSeveritySchema.optional(),
  trajectory: crisisTrajectorySchema.optional(),
  propagationLevel: crisisPropagationLevelSchema.optional(),
  status: incidentStatusSchema.optional(),
  crisisType: z.string().max(100).optional(),
  affectedProducts: z.array(z.string()).optional(),
  affectedRegions: z.array(z.string()).optional(),
  affectedStakeholders: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
  linkedSignalIds: z.array(z.string().uuid()).optional(),
  linkedEventIds: z.array(z.string().uuid()).optional(),
  linkedMentionIds: z.array(z.string().uuid()).optional(),
  linkedAlertIds: z.array(z.string().uuid()).optional(),
  linkedCompetitorIds: z.array(z.string().uuid()).optional(),
  ownerId: z.string().uuid().nullable().optional(),
  teamIds: z.array(z.string().uuid()).optional(),
  escalationLevel: z.number().int().min(0).max(5).optional(),
});

export const listIncidentsSchema = z.object({
  status: z.array(incidentStatusSchema).optional(),
  severity: z.array(crisisSeveritySchema).optional(),
  trajectory: z.array(crisisTrajectorySchema).optional(),
  propagationLevel: z.array(crisisPropagationLevelSchema).optional(),
  crisisType: z.string().optional(),
  searchQuery: z.string().optional(),
  ownerId: z.string().uuid().optional(),
  isEscalated: z.boolean().optional(),
  escalationLevelGte: z.number().int().min(0).max(5).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'severity', 'riskScore', 'mentionCount']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

// ============================================================================
// ACTION SCHEMAS
// ============================================================================

export const createActionSchema = z.object({
  incidentId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  actionType: crisisActionTypeSchema,
  priorityScore: z.number().min(0).max(100).optional(),
  urgency: crisisUrgencySchema.optional(),
  dueAt: z.string().datetime().optional(),
  estimatedDurationMins: z.number().int().min(1).optional(),
  assignedTo: z.string().uuid().optional(),
});

export const updateActionSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  status: crisisActionStatusSchema.optional(),
  priorityScore: z.number().min(0).max(100).optional(),
  urgency: crisisUrgencySchema.optional(),
  dueAt: z.string().datetime().nullable().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  completionNotes: z.string().max(2000).optional(),
  outcome: z.enum(['success', 'partial', 'failed']).optional(),
  outcomeNotes: z.string().max(2000).optional(),
});

export const listActionsSchema = z.object({
  incidentId: z.string().uuid().optional(),
  status: z.array(crisisActionStatusSchema).optional(),
  actionType: z.array(crisisActionTypeSchema).optional(),
  assignedTo: z.string().uuid().optional(),
  isAiGenerated: z.boolean().optional(),
  dueBefore: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'priorityScore', 'dueAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

// ============================================================================
// ESCALATION RULE SCHEMAS
// ============================================================================

export const escalationConditionsSchema = z.object({
  severityGte: crisisSeveritySchema.optional(),
  sentimentLte: z.number().min(-1).max(1).optional(),
  mentionVelocityGte: z.number().min(0).optional(),
  propagationLevel: z.array(crisisPropagationLevelSchema).optional(),
  keywordsAny: z.array(z.string()).optional(),
  sourcesAny: z.array(crisisSourceSystemSchema).optional(),
  timeWindowMinutes: z.number().int().min(1).max(10080).optional(), // max 1 week
  trajectoryIn: z.array(crisisTrajectorySchema).optional(),
  riskScoreGte: z.number().min(0).max(100).optional(),
});

export const escalationActionSchema = z.object({
  type: z.enum(['notify', 'create_incident', 'generate_brief', 'webhook', 'update_severity']),
  channel: z.string().optional(),
  recipients: z.array(z.string()).optional(),
  severity: crisisSeveritySchema.optional(),
  format: crisisBriefFormatSchema.optional(),
  url: z.string().url().optional(),
  payload: z.record(z.unknown()).optional(),
});

export const createEscalationRuleSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  ruleType: escalationRuleTypeSchema,
  conditions: escalationConditionsSchema,
  escalationActions: z.array(escalationActionSchema).min(1),
  escalationLevel: z.number().int().min(1).max(5).optional(),
  notifyChannels: z.array(z.string()).optional(),
  notifyRoles: z.array(z.string()).optional(),
  notifyUserIds: z.array(z.string().uuid()).optional(),
  cooldownMinutes: z.number().int().min(1).max(10080).optional(),
});

export const updateEscalationRuleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  conditions: escalationConditionsSchema.optional(),
  escalationActions: z.array(escalationActionSchema).optional(),
  escalationLevel: z.number().int().min(1).max(5).optional(),
  notifyChannels: z.array(z.string()).optional(),
  notifyRoles: z.array(z.string()).optional(),
  notifyUserIds: z.array(z.string().uuid()).optional(),
  isActive: z.boolean().optional(),
  cooldownMinutes: z.number().int().min(1).max(10080).optional(),
});

export const listEscalationRulesSchema = z.object({
  isActive: z.boolean().optional(),
  ruleType: escalationRuleTypeSchema.optional(),
  escalationLevelGte: z.number().int().min(1).max(5).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

// ============================================================================
// SIGNAL SCHEMAS
// ============================================================================

export const listSignalsSchema = z.object({
  severity: z.array(crisisSeveritySchema).optional(),
  isActive: z.boolean().optional(),
  isEscalated: z.boolean().optional(),
  sourceSystems: z.array(crisisSourceSystemSchema).optional(),
  linkedIncidentId: z.string().uuid().optional(),
  windowFrom: z.string().datetime().optional(),
  windowTo: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'priorityScore', 'severity']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

export const acknowledgeSignalSchema = z.object({
  linkedIncidentId: z.string().uuid().optional(),
  resolutionNotes: z.string().max(1000).optional(),
});

// ============================================================================
// BRIEF SCHEMAS
// ============================================================================

export const generateCrisisBriefSchema = z.object({
  format: crisisBriefFormatSchema.optional(),
  focusAreas: z.array(z.string()).optional(),
  customInstructions: z.string().max(2000).optional(),
  includeSections: z.array(crisisBriefSectionTypeSchema).optional(),
  excludeSections: z.array(crisisBriefSectionTypeSchema).optional(),
});

export const regenerateSectionSchema = z.object({
  customInstructions: z.string().max(2000).optional(),
  preserveManualEdits: z.boolean().optional(),
});

export const updateSectionSchema = z.object({
  title: z.string().max(500).optional(),
  content: z.string().max(10000).optional(),
  summary: z.string().max(1000).optional(),
  bulletPoints: z.array(z.object({
    text: z.string(),
    subPoints: z.array(z.string()).optional(),
    importance: z.enum(['high', 'medium', 'low']).optional(),
  })).optional(),
});

export const listBriefsSchema = z.object({
  incidentId: z.string().uuid().optional(),
  format: z.array(crisisBriefFormatSchema).optional(),
  status: z.array(z.enum(['draft', 'generated', 'reviewed', 'approved'])).optional(),
  isCurrent: z.boolean().optional(),
  sortBy: z.enum(['createdAt', 'version']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

// ============================================================================
// DETECTION SCHEMAS
// ============================================================================

export const triggerDetectionSchema = z.object({
  timeWindowMinutes: z.number().int().min(1).max(10080).optional(),
  sourceSystems: z.array(crisisSourceSystemSchema).optional(),
  keywords: z.array(z.string()).optional(),
  forceRefresh: z.boolean().optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;
export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>;
export type ListIncidentsInput = z.infer<typeof listIncidentsSchema>;
export type CreateActionInput = z.infer<typeof createActionSchema>;
export type UpdateActionInput = z.infer<typeof updateActionSchema>;
export type ListActionsInput = z.infer<typeof listActionsSchema>;
export type CreateEscalationRuleInput = z.infer<typeof createEscalationRuleSchema>;
export type UpdateEscalationRuleInput = z.infer<typeof updateEscalationRuleSchema>;
export type ListEscalationRulesInput = z.infer<typeof listEscalationRulesSchema>;
export type ListSignalsInput = z.infer<typeof listSignalsSchema>;
export type AcknowledgeSignalInput = z.infer<typeof acknowledgeSignalSchema>;
export type GenerateCrisisBriefInput = z.infer<typeof generateCrisisBriefSchema>;
export type CrisisRegenerateSectionInput = z.infer<typeof regenerateSectionSchema>;
export type CrisisUpdateSectionInput = z.infer<typeof updateSectionSchema>;
export type ListBriefsInput = z.infer<typeof listBriefsSchema>;
export type TriggerDetectionInput = z.infer<typeof triggerDetectionSchema>;
export type EscalationConditionsInput = z.infer<typeof escalationConditionsSchema>;
export type EscalationActionInput = z.infer<typeof escalationActionSchema>;
