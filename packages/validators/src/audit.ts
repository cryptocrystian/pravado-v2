/**
 * Sprint S35: Audit Logging & Compliance Ledger Validators
 * Zod schemas for audit log validation
 */

import { z } from 'zod';

/**
 * Actor type schema
 */
export const actorTypeSchema = z.enum(['user', 'system', 'agent']);

/**
 * Severity level schema
 */
export const auditSeveritySchema = z.enum(['info', 'warning', 'error', 'critical']);

/**
 * Comprehensive event type schema
 * Hierarchical naming: category.action
 */
export const auditEventTypeSchema = z.enum([
  // Authentication & Authorization
  'auth.login',
  'auth.logout',
  'auth.login_failed',
  'auth.password_reset',
  'auth.token_refresh',

  // User Management
  'user.invite_sent',
  'user.invite_accepted',
  'user.invite_revoked',
  'user.role_changed',
  'user.removed',

  // Billing Events
  'billing.plan_change',
  'billing.plan_upgraded',
  'billing.plan_downgraded',
  'billing.downgrade_blocked',
  'billing.subscription_created',
  'billing.subscription_canceled',
  'billing.subscription_resumed',
  'billing.trial_started',
  'billing.trial_expiring',
  'billing.trial_ended',
  'billing.invoice_synced',
  'billing.invoice_finalized',
  'billing.payment_succeeded',
  'billing.payment_failed',
  'billing.overage_charged',
  'billing.usage_alert_triggered',

  // LLM Operations
  'llm.call',
  'llm.call_success',
  'llm.call_failure',
  'llm.rate_limit_exceeded',
  'llm.timeout',
  'llm.provider_error',

  // Playbook Execution
  'playbook.created',
  'playbook.updated',
  'playbook.deleted',
  'playbook.execution_started',
  'playbook.execution_completed',
  'playbook.execution_failed',
  'playbook.execution_step_completed',
  'playbook.execution_step_failed',
  'playbook.retry_scheduled',
  'playbook.retry_executed',

  // PR Intelligence
  'pr.list_created',
  'pr.list_updated',
  'pr.list_deleted',
  'pr.member_added',
  'pr.member_removed',
  'pr.journalist_contacted',

  // SEO Operations
  'seo.audit_generated',
  'seo.keyword_analysis_completed',
  'seo.backlink_analysis_completed',
  'seo.opportunity_identified',

  // Content Operations
  'content.created',
  'content.updated',
  'content.deleted',
  'content.brief_generated',
  'content.rewrite_generated',
  'content.quality_scored',

  // System Events
  'system.migration_executed',
  'system.backup_completed',
  'system.maintenance_started',
  'system.maintenance_completed',
  'system.error',

  // Admin Actions
  'admin.user_impersonation',
  'admin.config_changed',
  'admin.feature_flag_toggled',
  'admin.data_export',
  'admin.data_deletion',
]);

/**
 * Generic context schema (flexible JSONB)
 */
export const auditContextSchema = z.record(z.any());

/**
 * Create audit log entry schema (for API requests)
 */
export const createAuditLogSchema = z.object({
  eventType: auditEventTypeSchema,
  severity: auditSeveritySchema.optional().default('info'),
  actorType: actorTypeSchema.optional().default('user'),
  context: auditContextSchema.optional().default({}),
  userId: z.string().uuid().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
});

/**
 * Audit log entry schema (complete record)
 */
export const auditLogEntrySchema = z.object({
  id: z.string().uuid().optional(),
  orgId: z.string().uuid(),
  userId: z.string().uuid().nullable().optional(),
  actorType: actorTypeSchema,
  eventType: auditEventTypeSchema,
  severity: auditSeveritySchema,
  context: auditContextSchema,
  ipAddress: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  createdAt: z.string().datetime().optional(),
});

/**
 * Audit log database record schema (snake_case)
 */
export const auditLogRecordSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  actor_type: actorTypeSchema,
  event_type: auditEventTypeSchema,
  severity: auditSeveritySchema,
  context: auditContextSchema,
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  created_at: z.string(),
});

/**
 * Audit query filters schema
 */
export const auditQueryFiltersSchema = z.object({
  eventType: z.union([
    auditEventTypeSchema,
    z.array(auditEventTypeSchema),
  ]).optional(),
  severity: z.union([
    auditSeveritySchema,
    z.array(auditSeveritySchema),
  ]).optional(),
  actorType: z.union([
    actorTypeSchema,
    z.array(actorTypeSchema),
  ]).optional(),
  userId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  searchTerm: z.string().max(200).optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
  cursor: z.string().optional(),
});

/**
 * Audit query result schema
 */
export const auditQueryResultSchema = z.object({
  entries: z.array(auditLogEntrySchema),
  total: z.number().int().min(0),
  hasMore: z.boolean(),
  nextCursor: z.string().optional(),
});

/**
 * API request schemas
 */

// GET /audit - list audit logs
export const getAuditLogsQuerySchema = z.object({
  eventType: z.string().optional(),
  severity: z.string().optional(),
  actorType: z.string().optional(),
  userId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  cursor: z.string().optional(),
});

// GET /audit/:id - get single audit log
export const getAuditLogParamsSchema = z.object({
  id: z.string().uuid(),
});

// GET /audit/events - list event types
export const getAuditEventTypesQuerySchema = z.object({
  category: z.string().optional(), // Filter by category prefix (e.g., 'billing', 'auth')
});

/**
 * Specific context schemas for common events
 */

export const authLoginContextSchema = z.object({
  success: z.boolean(),
  method: z.enum(['password', 'oauth', 'magic_link']),
  provider: z.string().optional(),
  failureReason: z.string().optional(),
});

export const billingPlanChangeContextSchema = z.object({
  oldPlan: z.string(),
  newPlan: z.string(),
  changeType: z.enum(['upgrade', 'downgrade']),
  effectiveDate: z.string(),
  prorationAmount: z.number().optional(),
});

export const llmCallContextSchema = z.object({
  provider: z.string(),
  model: z.string(),
  tokensUsed: z.number().int().min(0),
  latencyMs: z.number().int().min(0),
  success: z.boolean(),
  errorMessage: z.string().optional(),
  cost: z.number().min(0).optional(),
});

export const auditPlaybookExecutionContextSchema = z.object({
  playbookId: z.string().uuid(),
  playbookName: z.string(),
  runId: z.string().uuid(),
  stepId: z.string().uuid().optional(),
  stepName: z.string().optional(),
  status: z.enum(['started', 'running', 'completed', 'failed']),
  duration: z.number().int().min(0).optional(),
  errorMessage: z.string().optional(),
});

export const prListContextSchema = z.object({
  listId: z.string().uuid(),
  listName: z.string(),
  memberCount: z.number().int().min(0).optional(),
  journalistId: z.string().uuid().optional(),
  journalistName: z.string().optional(),
});

export const contentOperationContextSchema = z.object({
  contentId: z.string().uuid(),
  contentType: z.string(),
  operation: z.enum(['create', 'update', 'delete', 'generate']),
  wordCount: z.number().int().min(0).optional(),
  qualityScore: z.number().min(0).max(100).optional(),
});

export const overageChargeContextSchema = z.object({
  resourceType: z.enum(['tokens', 'playbook_runs', 'seats']),
  overage: z.number().int().min(0),
  limit: z.number().int().min(0),
  chargeAmount: z.number().min(0),
  billingPeriod: z.string(),
});

/**
 * Event type metadata schema
 */
export const auditEventTypeMetadataSchema = z.object({
  type: auditEventTypeSchema,
  category: z.string(),
  description: z.string(),
  defaultSeverity: auditSeveritySchema,
  requiresUserContext: z.boolean(),
});

/**
 * Type exports
 */
export type ActorType = z.infer<typeof actorTypeSchema>;
export type AuditSeverity = z.infer<typeof auditSeveritySchema>;
export type AuditEventType = z.infer<typeof auditEventTypeSchema>;
export type AuditContext = z.infer<typeof auditContextSchema>;
export type CreateAuditLog = z.infer<typeof createAuditLogSchema>;
export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;
export type AuditLogRecord = z.infer<typeof auditLogRecordSchema>;
export type AuditQueryFilters = z.infer<typeof auditQueryFiltersSchema>;
export type AuditQueryResult = z.infer<typeof auditQueryResultSchema>;
export type GetAuditLogsQuery = z.infer<typeof getAuditLogsQuerySchema>;
export type GetAuditLogParams = z.infer<typeof getAuditLogParamsSchema>;
export type GetAuditEventTypesQuery = z.infer<typeof getAuditEventTypesQuerySchema>;
export type AuthLoginContext = z.infer<typeof authLoginContextSchema>;
export type BillingPlanChangeContext = z.infer<typeof billingPlanChangeContextSchema>;
export type LLMCallContext = z.infer<typeof llmCallContextSchema>;
export type AuditPlaybookExecutionContext = z.infer<typeof auditPlaybookExecutionContextSchema>;
export type PRListContext = z.infer<typeof prListContextSchema>;
export type ContentOperationContext = z.infer<typeof contentOperationContextSchema>;
export type OverageChargeContext = z.infer<typeof overageChargeContextSchema>;
export type AuditEventTypeMetadata = z.infer<typeof auditEventTypeMetadataSchema>;

/**
 * Event type metadata registry
 */
export const AUDIT_EVENT_METADATA: Record<AuditEventType, Omit<AuditEventTypeMetadata, 'type'>> = {
  // Authentication & Authorization
  'auth.login': { category: 'auth', description: 'User logged in', defaultSeverity: 'info', requiresUserContext: true },
  'auth.logout': { category: 'auth', description: 'User logged out', defaultSeverity: 'info', requiresUserContext: true },
  'auth.login_failed': { category: 'auth', description: 'Login attempt failed', defaultSeverity: 'warning', requiresUserContext: false },
  'auth.password_reset': { category: 'auth', description: 'Password reset requested', defaultSeverity: 'info', requiresUserContext: true },
  'auth.token_refresh': { category: 'auth', description: 'Auth token refreshed', defaultSeverity: 'info', requiresUserContext: true },

  // User Management
  'user.invite_sent': { category: 'user', description: 'Team invitation sent', defaultSeverity: 'info', requiresUserContext: true },
  'user.invite_accepted': { category: 'user', description: 'Team invitation accepted', defaultSeverity: 'info', requiresUserContext: true },
  'user.invite_revoked': { category: 'user', description: 'Team invitation revoked', defaultSeverity: 'info', requiresUserContext: true },
  'user.role_changed': { category: 'user', description: 'User role changed', defaultSeverity: 'info', requiresUserContext: true },
  'user.removed': { category: 'user', description: 'User removed from organization', defaultSeverity: 'warning', requiresUserContext: true },

  // Billing Events
  'billing.plan_change': { category: 'billing', description: 'Subscription plan changed', defaultSeverity: 'info', requiresUserContext: true },
  'billing.plan_upgraded': { category: 'billing', description: 'Plan upgraded', defaultSeverity: 'info', requiresUserContext: true },
  'billing.plan_downgraded': { category: 'billing', description: 'Plan downgraded', defaultSeverity: 'info', requiresUserContext: true },
  'billing.downgrade_blocked': { category: 'billing', description: 'Downgrade blocked due to usage', defaultSeverity: 'warning', requiresUserContext: true },
  'billing.subscription_created': { category: 'billing', description: 'Subscription created', defaultSeverity: 'info', requiresUserContext: true },
  'billing.subscription_canceled': { category: 'billing', description: 'Subscription canceled', defaultSeverity: 'warning', requiresUserContext: true },
  'billing.subscription_resumed': { category: 'billing', description: 'Subscription resumed', defaultSeverity: 'info', requiresUserContext: true },
  'billing.trial_started': { category: 'billing', description: 'Trial period started', defaultSeverity: 'info', requiresUserContext: false },
  'billing.trial_expiring': { category: 'billing', description: 'Trial expiring soon', defaultSeverity: 'warning', requiresUserContext: false },
  'billing.trial_ended': { category: 'billing', description: 'Trial period ended', defaultSeverity: 'info', requiresUserContext: false },
  'billing.invoice_synced': { category: 'billing', description: 'Invoice synced from Stripe', defaultSeverity: 'info', requiresUserContext: false },
  'billing.invoice_finalized': { category: 'billing', description: 'Invoice finalized', defaultSeverity: 'info', requiresUserContext: false },
  'billing.payment_succeeded': { category: 'billing', description: 'Payment succeeded', defaultSeverity: 'info', requiresUserContext: false },
  'billing.payment_failed': { category: 'billing', description: 'Payment failed', defaultSeverity: 'error', requiresUserContext: false },
  'billing.overage_charged': { category: 'billing', description: 'Overage charges applied', defaultSeverity: 'warning', requiresUserContext: false },
  'billing.usage_alert_triggered': { category: 'billing', description: 'Usage threshold alert triggered', defaultSeverity: 'warning', requiresUserContext: false },

  // LLM Operations
  'llm.call': { category: 'llm', description: 'LLM API call made', defaultSeverity: 'info', requiresUserContext: false },
  'llm.call_success': { category: 'llm', description: 'LLM call succeeded', defaultSeverity: 'info', requiresUserContext: false },
  'llm.call_failure': { category: 'llm', description: 'LLM call failed', defaultSeverity: 'error', requiresUserContext: false },
  'llm.rate_limit_exceeded': { category: 'llm', description: 'LLM rate limit exceeded', defaultSeverity: 'warning', requiresUserContext: false },
  'llm.timeout': { category: 'llm', description: 'LLM call timed out', defaultSeverity: 'error', requiresUserContext: false },
  'llm.provider_error': { category: 'llm', description: 'LLM provider error', defaultSeverity: 'error', requiresUserContext: false },

  // Playbook Execution
  'playbook.created': { category: 'playbook', description: 'Playbook created', defaultSeverity: 'info', requiresUserContext: true },
  'playbook.updated': { category: 'playbook', description: 'Playbook updated', defaultSeverity: 'info', requiresUserContext: true },
  'playbook.deleted': { category: 'playbook', description: 'Playbook deleted', defaultSeverity: 'warning', requiresUserContext: true },
  'playbook.execution_started': { category: 'playbook', description: 'Playbook execution started', defaultSeverity: 'info', requiresUserContext: false },
  'playbook.execution_completed': { category: 'playbook', description: 'Playbook execution completed', defaultSeverity: 'info', requiresUserContext: false },
  'playbook.execution_failed': { category: 'playbook', description: 'Playbook execution failed', defaultSeverity: 'error', requiresUserContext: false },
  'playbook.execution_step_completed': { category: 'playbook', description: 'Playbook step completed', defaultSeverity: 'info', requiresUserContext: false },
  'playbook.execution_step_failed': { category: 'playbook', description: 'Playbook step failed', defaultSeverity: 'error', requiresUserContext: false },
  'playbook.retry_scheduled': { category: 'playbook', description: 'Playbook retry scheduled', defaultSeverity: 'info', requiresUserContext: false },
  'playbook.retry_executed': { category: 'playbook', description: 'Playbook retry executed', defaultSeverity: 'info', requiresUserContext: false },

  // PR Intelligence
  'pr.list_created': { category: 'pr', description: 'PR list created', defaultSeverity: 'info', requiresUserContext: true },
  'pr.list_updated': { category: 'pr', description: 'PR list updated', defaultSeverity: 'info', requiresUserContext: true },
  'pr.list_deleted': { category: 'pr', description: 'PR list deleted', defaultSeverity: 'warning', requiresUserContext: true },
  'pr.member_added': { category: 'pr', description: 'Member added to PR list', defaultSeverity: 'info', requiresUserContext: true },
  'pr.member_removed': { category: 'pr', description: 'Member removed from PR list', defaultSeverity: 'info', requiresUserContext: true },
  'pr.journalist_contacted': { category: 'pr', description: 'Journalist contacted', defaultSeverity: 'info', requiresUserContext: true },

  // SEO Operations
  'seo.audit_generated': { category: 'seo', description: 'SEO audit generated', defaultSeverity: 'info', requiresUserContext: true },
  'seo.keyword_analysis_completed': { category: 'seo', description: 'Keyword analysis completed', defaultSeverity: 'info', requiresUserContext: false },
  'seo.backlink_analysis_completed': { category: 'seo', description: 'Backlink analysis completed', defaultSeverity: 'info', requiresUserContext: false },
  'seo.opportunity_identified': { category: 'seo', description: 'SEO opportunity identified', defaultSeverity: 'info', requiresUserContext: false },

  // Content Operations
  'content.created': { category: 'content', description: 'Content created', defaultSeverity: 'info', requiresUserContext: true },
  'content.updated': { category: 'content', description: 'Content updated', defaultSeverity: 'info', requiresUserContext: true },
  'content.deleted': { category: 'content', description: 'Content deleted', defaultSeverity: 'warning', requiresUserContext: true },
  'content.brief_generated': { category: 'content', description: 'Content brief generated', defaultSeverity: 'info', requiresUserContext: true },
  'content.rewrite_generated': { category: 'content', description: 'Content rewrite generated', defaultSeverity: 'info', requiresUserContext: true },
  'content.quality_scored': { category: 'content', description: 'Content quality scored', defaultSeverity: 'info', requiresUserContext: false },

  // System Events
  'system.migration_executed': { category: 'system', description: 'Database migration executed', defaultSeverity: 'info', requiresUserContext: false },
  'system.backup_completed': { category: 'system', description: 'System backup completed', defaultSeverity: 'info', requiresUserContext: false },
  'system.maintenance_started': { category: 'system', description: 'System maintenance started', defaultSeverity: 'warning', requiresUserContext: false },
  'system.maintenance_completed': { category: 'system', description: 'System maintenance completed', defaultSeverity: 'info', requiresUserContext: false },
  'system.error': { category: 'system', description: 'System error occurred', defaultSeverity: 'error', requiresUserContext: false },

  // Admin Actions
  'admin.user_impersonation': { category: 'admin', description: 'Admin impersonated user', defaultSeverity: 'critical', requiresUserContext: true },
  'admin.config_changed': { category: 'admin', description: 'System config changed', defaultSeverity: 'warning', requiresUserContext: true },
  'admin.feature_flag_toggled': { category: 'admin', description: 'Feature flag toggled', defaultSeverity: 'info', requiresUserContext: true },
  'admin.data_export': { category: 'admin', description: 'Data exported', defaultSeverity: 'warning', requiresUserContext: true },
  'admin.data_deletion': { category: 'admin', description: 'Data deleted', defaultSeverity: 'critical', requiresUserContext: true },
};

/**
 * Helper to get event categories
 */
export function getEventCategories(): string[] {
  return [...new Set(Object.values(AUDIT_EVENT_METADATA).map(m => m.category))];
}

/**
 * Helper to get events by category
 */
export function getEventsByCategory(category: string): AuditEventType[] {
  return (Object.entries(AUDIT_EVENT_METADATA) as [AuditEventType, Omit<AuditEventTypeMetadata, 'type'>][])
    .filter(([_, meta]) => meta.category === category)
    .map(([type]) => type);
}

/**
 * Helper to get full metadata for an event type
 */
export function getEventMetadata(type: AuditEventType): AuditEventTypeMetadata {
  return { type, ...AUDIT_EVENT_METADATA[type] };
}
