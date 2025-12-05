/**
 * Sprint S35: Audit Logging & Compliance Ledger Types
 * Comprehensive type system for audit events across PRAVADO platform
 */

/**
 * Actor Types - Who/What initiated the event
 */
export type ActorType = 'user' | 'system' | 'agent';

/**
 * Severity Levels - Importance/criticality of the event
 */
export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Comprehensive Event Type Taxonomy
 * Hierarchical naming: category.action
 */
export type AuditEventType =
  // Authentication & Authorization
  | 'auth.login'
  | 'auth.logout'
  | 'auth.login_failed'
  | 'auth.password_reset'
  | 'auth.token_refresh'

  // User Management
  | 'user.invite_sent'
  | 'user.invite_accepted'
  | 'user.invite_revoked'
  | 'user.role_changed'
  | 'user.removed'

  // Billing Events
  | 'billing.plan_change'
  | 'billing.plan_upgraded'
  | 'billing.plan_downgraded'
  | 'billing.downgrade_blocked'
  | 'billing.subscription_created'
  | 'billing.subscription_canceled'
  | 'billing.subscription_resumed'
  | 'billing.trial_started'
  | 'billing.trial_expiring'
  | 'billing.trial_ended'
  | 'billing.invoice_synced'
  | 'billing.invoice_finalized'
  | 'billing.payment_succeeded'
  | 'billing.payment_failed'
  | 'billing.overage_charged'
  | 'billing.usage_alert_triggered'

  // LLM Operations
  | 'llm.call'
  | 'llm.call_success'
  | 'llm.call_failure'
  | 'llm.rate_limit_exceeded'
  | 'llm.timeout'
  | 'llm.provider_error'

  // Playbook Execution
  | 'playbook.created'
  | 'playbook.updated'
  | 'playbook.deleted'
  | 'playbook.execution_started'
  | 'playbook.execution_completed'
  | 'playbook.execution_failed'
  | 'playbook.execution_step_completed'
  | 'playbook.execution_step_failed'
  | 'playbook.retry_scheduled'
  | 'playbook.retry_executed'

  // PR Intelligence
  | 'pr.list_created'
  | 'pr.list_updated'
  | 'pr.list_deleted'
  | 'pr.member_added'
  | 'pr.member_removed'
  | 'pr.journalist_contacted'

  // SEO Operations
  | 'seo.audit_generated'
  | 'seo.keyword_analysis_completed'
  | 'seo.backlink_analysis_completed'
  | 'seo.opportunity_identified'

  // Content Operations
  | 'content.created'
  | 'content.updated'
  | 'content.deleted'
  | 'content.brief_generated'
  | 'content.rewrite_generated'
  | 'content.quality_scored'

  // System Events
  | 'system.migration_executed'
  | 'system.backup_completed'
  | 'system.maintenance_started'
  | 'system.maintenance_completed'
  | 'system.error'

  // Admin Actions
  | 'admin.user_impersonation'
  | 'admin.config_changed'
  | 'admin.feature_flag_toggled'
  | 'admin.data_export'
  | 'admin.data_deletion';

/**
 * Generic context type for audit events
 * Each event type can have its own specific context structure
 */
export interface AuditContext {
  [key: string]: any;
}

/**
 * Base Audit Log Entry
 */
export interface AuditLogEntry {
  id?: string;
  orgId: string;
  userId?: string | null;
  actorType: ActorType;
  eventType: AuditEventType;
  severity: AuditSeverity;
  context: AuditContext;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt?: string;
}

/**
 * Audit Log Record (from database)
 */
export interface AuditLogRecord {
  id: string;
  org_id: string;
  user_id: string | null;
  actor_type: ActorType;
  event_type: AuditEventType;
  severity: AuditSeverity;
  context: AuditContext;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/**
 * Audit Query Filters
 */
export interface AuditQueryFilters {
  eventType?: AuditEventType | AuditEventType[];
  severity?: AuditSeverity | AuditSeverity[];
  actorType?: ActorType | ActorType[];
  userId?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string; // For searching within context
  limit?: number;
  offset?: number;
  cursor?: string; // For cursor-based pagination
}

/**
 * Audit Query Result
 */
export interface AuditQueryResult {
  entries: AuditLogEntry[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Event Type Metadata
 */
export interface AuditEventTypeMetadata {
  type: AuditEventType;
  category: string;
  description: string;
  defaultSeverity: AuditSeverity;
  requiresUserContext: boolean;
}

/**
 * Specific Context Types for Common Events
 */

export interface AuthLoginContext {
  success: boolean;
  method: 'password' | 'oauth' | 'magic_link';
  provider?: string;
  failureReason?: string;
}

export interface BillingPlanChangeContext {
  oldPlan: string;
  newPlan: string;
  changeType: 'upgrade' | 'downgrade';
  effectiveDate: string;
  prorationAmount?: number;
}

export interface LLMCallContext {
  provider: string;
  model: string;
  tokensUsed: number;
  latencyMs: number;
  success: boolean;
  errorMessage?: string;
  cost?: number;
}

export interface AuditPlaybookExecutionContext {
  playbookId: string;
  playbookName: string;
  runId: string;
  stepId?: string;
  stepName?: string;
  status: 'started' | 'running' | 'completed' | 'failed';
  duration?: number;
  errorMessage?: string;
}

export interface PRListContext {
  listId: string;
  listName: string;
  memberCount?: number;
  journalistId?: string;
  journalistName?: string;
}

export interface ContentOperationContext {
  contentId: string;
  contentType: string;
  operation: 'create' | 'update' | 'delete' | 'generate';
  wordCount?: number;
  qualityScore?: number;
}

export interface OverageChargeContext {
  resourceType: 'tokens' | 'playbook_runs' | 'seats';
  overage: number;
  limit: number;
  chargeAmount: number;
  billingPeriod: string;
}

/**
 * Type Guards
 */
export function isAuditEventType(value: string): value is AuditEventType {
  const validTypes: AuditEventType[] = [
    'auth.login', 'auth.logout', 'auth.login_failed', 'auth.password_reset', 'auth.token_refresh',
    'user.invite_sent', 'user.invite_accepted', 'user.invite_revoked', 'user.role_changed', 'user.removed',
    'billing.plan_change', 'billing.plan_upgraded', 'billing.plan_downgraded', 'billing.downgrade_blocked',
    'billing.subscription_created', 'billing.subscription_canceled', 'billing.subscription_resumed',
    'billing.trial_started', 'billing.trial_expiring', 'billing.trial_ended',
    'billing.invoice_synced', 'billing.invoice_finalized', 'billing.payment_succeeded', 'billing.payment_failed',
    'billing.overage_charged', 'billing.usage_alert_triggered',
    'llm.call', 'llm.call_success', 'llm.call_failure', 'llm.rate_limit_exceeded', 'llm.timeout', 'llm.provider_error',
    'playbook.created', 'playbook.updated', 'playbook.deleted',
    'playbook.execution_started', 'playbook.execution_completed', 'playbook.execution_failed',
    'playbook.execution_step_completed', 'playbook.execution_step_failed',
    'playbook.retry_scheduled', 'playbook.retry_executed',
    'pr.list_created', 'pr.list_updated', 'pr.list_deleted', 'pr.member_added', 'pr.member_removed', 'pr.journalist_contacted',
    'seo.audit_generated', 'seo.keyword_analysis_completed', 'seo.backlink_analysis_completed', 'seo.opportunity_identified',
    'content.created', 'content.updated', 'content.deleted', 'content.brief_generated', 'content.rewrite_generated', 'content.quality_scored',
    'system.migration_executed', 'system.backup_completed', 'system.maintenance_started', 'system.maintenance_completed', 'system.error',
    'admin.user_impersonation', 'admin.config_changed', 'admin.feature_flag_toggled', 'admin.data_export', 'admin.data_deletion',
  ];
  return validTypes.includes(value as AuditEventType);
}

export function isAuditSeverity(value: string): value is AuditSeverity {
  return ['info', 'warning', 'error', 'critical'].includes(value);
}

export function isActorType(value: string): value is ActorType {
  return ['user', 'system', 'agent'].includes(value);
}

/**
 * Sprint S36: Audit Export Types
 */

/**
 * Export Job Status
 */
export type AuditExportStatus = 'queued' | 'processing' | 'success' | 'failed';

/**
 * Audit Export Job Entry
 */
export interface AuditExportJob {
  id: string;
  orgId: string;
  userId: string;
  status: AuditExportStatus;
  filters: AuditQueryFilters;
  filePath?: string | null;
  fileSizeBytes?: number | null;
  rowCount?: number | null;
  errorMessage?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

/**
 * Audit Export Job Record (from database)
 */
export interface AuditExportJobRecord {
  id: string;
  org_id: string;
  user_id: string;
  status: AuditExportStatus;
  filters_json: AuditQueryFilters;
  file_path: string | null;
  file_size_bytes: number | null;
  row_count: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  created_at: string;
}

/**
 * Create Export Job Request
 */
export interface CreateAuditExportRequest {
  filters?: AuditQueryFilters;
}

/**
 * Export Job Status Response
 */
export interface AuditExportStatusResponse {
  job: AuditExportJob;
  downloadUrl?: string;
}

/**
 * Type guard for export status
 */
export function isAuditExportStatus(value: string): value is AuditExportStatus {
  return ['queued', 'processing', 'success', 'failed'].includes(value);
}

/**
 * Sprint S37: Audit Replay Engine Types
 */

/**
 * Replay Job Status
 */
export type AuditReplayStatus = 'queued' | 'running' | 'success' | 'failed';

/**
 * Replay Filters - extends AuditQueryFilters with replay-specific options
 */
export interface AuditReplayFilters extends Omit<AuditQueryFilters, 'limit' | 'offset' | 'cursor'> {
  entityTypes?: string[]; // Filter by entity type (content, playbook, billing, etc.)
  entityIds?: string[]; // Filter by specific entity IDs
}

/**
 * Entity State Snapshot
 */
export interface EntityState {
  entityType: string;
  entityId: string;
  state: Record<string, unknown>;
  timestamp: string;
}

/**
 * State Diff between snapshots
 */
export interface StateDiff {
  field: string;
  before: unknown;
  after: unknown;
  operation: 'added' | 'removed' | 'modified';
}

/**
 * Replay Snapshot - represents a point-in-time state
 */
export interface ReplaySnapshot {
  id: string;
  replayRunId: string;
  snapshotIndex: number;
  eventId?: string;
  eventType: string;
  timestamp: string;
  stateBefore?: Record<string, unknown>;
  stateAfter?: Record<string, unknown>;
  diff: StateDiff[];
  entityType?: string;
  entityId?: string;
  createdAt: string;
}

/**
 * Replay Snapshot Record (from database)
 */
export interface ReplaySnapshotRecord {
  id: string;
  replay_run_id: string;
  snapshot_index: number;
  event_id: string | null;
  event_type: string;
  timestamp: string;
  state_before: Record<string, unknown> | null;
  state_after: Record<string, unknown> | null;
  diff_json: StateDiff[] | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

/**
 * Timeline Event - simplified view for UI
 */
export interface ReplayTimelineEvent {
  index: number;
  eventId: string;
  eventType: string;
  timestamp: string;
  severity: AuditSeverity;
  actorType: ActorType;
  summary: string;
  entityType?: string;
  entityId?: string;
  changeCount: number;
}

/**
 * Replay Result Summary
 */
export interface ReplayResultSummary {
  totalEvents: number;
  totalSnapshots: number;
  entityBreakdown: Record<string, number>;
  eventTypeBreakdown: Record<string, number>;
  severityBreakdown: Record<AuditSeverity, number>;
  timeRange: {
    start: string;
    end: string;
  };
  stateChanges: {
    additions: number;
    modifications: number;
    deletions: number;
  };
}

/**
 * Audit Replay Run
 */
export interface AuditReplayRun {
  id: string;
  orgId: string;
  userId: string;
  status: AuditReplayStatus;
  filters: AuditReplayFilters;
  startedAt?: string | null;
  finishedAt?: string | null;
  result?: ReplayResultSummary | null;
  eventCount: number;
  snapshotCount: number;
  errorMessage?: string | null;
  createdAt: string;
}

/**
 * Audit Replay Run Record (from database)
 */
export interface AuditReplayRunRecord {
  id: string;
  org_id: string;
  user_id: string;
  status: AuditReplayStatus;
  filters_json: AuditReplayFilters;
  started_at: string | null;
  finished_at: string | null;
  result_json: ReplayResultSummary | null;
  event_count: number;
  snapshot_count: number;
  error_message: string | null;
  created_at: string;
}

/**
 * Create Replay Job Request
 */
export interface CreateAuditReplayRequest {
  filters?: AuditReplayFilters;
}

/**
 * Replay Job Status Response
 */
export interface AuditReplayStatusResponse {
  run: AuditReplayRun;
  timeline?: ReplayTimelineEvent[];
}

/**
 * SSE Event Types for replay streaming
 */
export type ReplaySSEEventType =
  | 'replay.started'
  | 'replay.progress'
  | 'replay.snapshot'
  | 'replay.completed'
  | 'replay.failed';

/**
 * SSE Event Data
 */
export interface ReplaySSEEvent {
  type: ReplaySSEEventType;
  data: {
    runId: string;
    progress?: number;
    currentEvent?: number;
    totalEvents?: number;
    snapshot?: ReplaySnapshot;
    result?: ReplayResultSummary;
    error?: string;
  };
}

/**
 * Type guard for replay status
 */
export function isAuditReplayStatus(value: string): value is AuditReplayStatus {
  return ['queued', 'running', 'success', 'failed'].includes(value);
}
