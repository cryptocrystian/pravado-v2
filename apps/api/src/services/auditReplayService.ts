/**
 * Audit Replay Service (Sprint S37)
 * Reconstructs past system state using audit logs
 *
 * Features:
 * - Log fetching with filters
 * - State reconstruction from event streams
 * - Diff computation between states
 * - Replay job management
 * - SSE streaming support
 */

import { EventEmitter } from 'events';

import type {
  AuditLogEntry,
  AuditLogRecord,
  AuditReplayFilters,
  AuditReplayRun,
  AuditReplayRunRecord,
  AuditReplayStatus,
  ReplaySnapshot,
  ReplaySnapshotRecord,
  ReplayTimelineEvent,
  ReplayResultSummary,
  StateDiff,
  AuditSeverity,
  ActorType,
} from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Event emitter for SSE streaming
export const replayEventEmitter = new EventEmitter();

/**
 * Reconstructed state types for different entity domains
 */
interface ContentState {
  id: string;
  title?: string;
  status?: string;
  wordCount?: number;
  qualityScore?: number;
  lastUpdated?: string;
  createdBy?: string;
}

interface AgentState {
  id: string;
  name?: string;
  status?: string;
  lastExecution?: string;
  executionCount?: number;
}

interface PlaybookState {
  id: string;
  name?: string;
  status?: string;
  version?: number;
  lastRun?: string;
  runCount?: number;
  successCount?: number;
  failureCount?: number;
}

interface BillingState {
  plan?: string;
  status?: string;
  tokensUsed?: number;
  playbookRuns?: number;
  lastPayment?: string;
  trialEndsAt?: string;
}

interface ExecutionState {
  runId: string;
  playbookId: string;
  status?: string;
  currentStep?: number;
  totalSteps?: number;
  startedAt?: string;
  completedAt?: string;
}

type EntityStateMap = {
  content: Map<string, ContentState>;
  agent: Map<string, AgentState>;
  playbook: Map<string, PlaybookState>;
  billing: BillingState;
  execution: Map<string, ExecutionState>;
};

/**
 * AuditReplayService - Main service class
 */
export class AuditReplayService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // ============================================================================
  // A. LOG FETCHER
  // ============================================================================

  /**
   * Fetch audit logs with filters, sorted by timestamp ASC for replay
   */
  async fetchLogs(
    orgId: string,
    filters: AuditReplayFilters
  ): Promise<AuditLogEntry[]> {
    let query = this.supabase
      .from('audit_log')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: true });

    // Apply event type filter
    if (filters.eventType) {
      const eventTypes = Array.isArray(filters.eventType)
        ? filters.eventType
        : [filters.eventType];
      query = query.in('event_type', eventTypes);
    }

    // Apply severity filter
    if (filters.severity) {
      const severities = Array.isArray(filters.severity)
        ? filters.severity
        : [filters.severity];
      query = query.in('severity', severities);
    }

    // Apply actor type filter
    if (filters.actorType) {
      const actorTypes = Array.isArray(filters.actorType)
        ? filters.actorType
        : [filters.actorType];
      query = query.in('actor_type', actorTypes);
    }

    // Apply user ID filter
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    // Apply date range filters
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    // Apply search term filter (searches in context JSONB)
    if (filters.searchTerm) {
      query = query.ilike('context::text', `%${filters.searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch audit logs for replay:', error);
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }

    return (data || []).map((record: AuditLogRecord) => this.recordToEntry(record));
  }

  /**
   * Convert database record to AuditLogEntry
   */
  private recordToEntry(record: AuditLogRecord): AuditLogEntry {
    return {
      id: record.id,
      orgId: record.org_id,
      userId: record.user_id,
      actorType: record.actor_type,
      eventType: record.event_type,
      severity: record.severity,
      context: record.context,
      ipAddress: record.ip_address,
      userAgent: record.user_agent,
      createdAt: record.created_at,
    };
  }

  // ============================================================================
  // B. STATE RECONSTRUCTION
  // ============================================================================

  /**
   * Initialize empty state map
   */
  private initializeStateMap(): EntityStateMap {
    return {
      content: new Map(),
      agent: new Map(),
      playbook: new Map(),
      billing: {},
      execution: new Map(),
    };
  }

  /**
   * Reconstruct content state from event
   */
  private reconstructContentState(
    state: Map<string, ContentState>,
    entry: AuditLogEntry
  ): { entityId: string; before: ContentState | null; after: ContentState } | null {
    const context = entry.context;
    const contentId = context.contentId as string;

    if (!contentId) return null;

    const before = state.get(contentId) || null;
    let after: ContentState;

    switch (entry.eventType) {
      case 'content.created':
        after = {
          id: contentId,
          title: context.title as string,
          status: 'draft',
          wordCount: context.wordCount as number,
          createdBy: entry.userId || undefined,
          lastUpdated: entry.createdAt,
        };
        break;

      case 'content.updated':
        after = {
          ...(before || { id: contentId }),
          title: (context.title as string) || before?.title,
          status: (context.status as string) || before?.status,
          wordCount: (context.wordCount as number) || before?.wordCount,
          lastUpdated: entry.createdAt,
        };
        break;

      case 'content.deleted':
        after = {
          ...(before || { id: contentId }),
          status: 'deleted',
          lastUpdated: entry.createdAt,
        };
        break;

      case 'content.quality_scored':
        after = {
          ...(before || { id: contentId }),
          qualityScore: context.qualityScore as number,
          lastUpdated: entry.createdAt,
        };
        break;

      default:
        return null;
    }

    state.set(contentId, after);
    return { entityId: contentId, before, after };
  }

  /**
   * Reconstruct agent state from event
   */
  private reconstructAgentState(
    state: Map<string, AgentState>,
    entry: AuditLogEntry
  ): { entityId: string; before: AgentState | null; after: AgentState } | null {
    const context = entry.context;
    const agentId = context.agentId as string;

    if (!agentId) return null;

    const before = state.get(agentId) || null;
    let after: AgentState;

    // Handle agent-related events (derived from LLM calls)
    if (entry.eventType.startsWith('llm.')) {
      after = {
        id: agentId,
        name: (context.agentName as string) || before?.name,
        status: entry.eventType === 'llm.call_success' ? 'active' :
                entry.eventType === 'llm.call_failure' ? 'error' : before?.status,
        lastExecution: entry.createdAt,
        executionCount: (before?.executionCount || 0) + 1,
      };
      state.set(agentId, after);
      return { entityId: agentId, before, after };
    }

    return null;
  }

  /**
   * Reconstruct playbook state from event
   */
  private reconstructPlaybookState(
    state: Map<string, PlaybookState>,
    entry: AuditLogEntry
  ): { entityId: string; before: PlaybookState | null; after: PlaybookState } | null {
    const context = entry.context;
    const playbookId = context.playbookId as string;

    if (!playbookId) return null;

    const before = state.get(playbookId) || null;
    let after: PlaybookState;

    switch (entry.eventType) {
      case 'playbook.created':
        after = {
          id: playbookId,
          name: context.playbookName as string,
          status: 'draft',
          version: 1,
          runCount: 0,
          successCount: 0,
          failureCount: 0,
        };
        break;

      case 'playbook.updated':
        after = {
          ...(before || { id: playbookId }),
          name: (context.playbookName as string) || before?.name,
          version: (before?.version || 0) + 1,
        };
        break;

      case 'playbook.deleted':
        after = {
          ...(before || { id: playbookId }),
          status: 'deleted',
        };
        break;

      case 'playbook.execution_started':
        after = {
          ...(before || { id: playbookId }),
          status: 'running',
          lastRun: entry.createdAt,
          runCount: (before?.runCount || 0) + 1,
        };
        break;

      case 'playbook.execution_completed':
        after = {
          ...(before || { id: playbookId }),
          status: 'idle',
          successCount: (before?.successCount || 0) + 1,
        };
        break;

      case 'playbook.execution_failed':
        after = {
          ...(before || { id: playbookId }),
          status: 'error',
          failureCount: (before?.failureCount || 0) + 1,
        };
        break;

      default:
        return null;
    }

    state.set(playbookId, after);
    return { entityId: playbookId, before, after };
  }

  /**
   * Reconstruct billing state from event
   */
  private reconstructBillingState(
    state: BillingState,
    entry: AuditLogEntry
  ): { before: BillingState; after: BillingState } | null {
    const context = entry.context;
    const before = { ...state };
    let after: BillingState;

    switch (entry.eventType) {
      case 'billing.plan_change':
      case 'billing.plan_upgraded':
      case 'billing.plan_downgraded':
        after = {
          ...before,
          plan: context.newPlan as string,
        };
        break;

      case 'billing.subscription_created':
        after = {
          ...before,
          status: 'active',
          plan: context.plan as string,
        };
        break;

      case 'billing.subscription_canceled':
        after = {
          ...before,
          status: 'canceled',
        };
        break;

      case 'billing.trial_started':
        after = {
          ...before,
          status: 'trialing',
          trialEndsAt: context.trialEndsAt as string,
        };
        break;

      case 'billing.trial_ended':
        after = {
          ...before,
          status: 'active',
          trialEndsAt: undefined,
        };
        break;

      case 'billing.payment_succeeded':
        after = {
          ...before,
          lastPayment: entry.createdAt,
        };
        break;

      case 'llm.call_success':
        after = {
          ...before,
          tokensUsed: (before.tokensUsed || 0) + (context.tokensUsed as number || 0),
        };
        break;

      default:
        return null;
    }

    // Update state reference
    Object.assign(state, after);
    return { before, after };
  }

  /**
   * Reconstruct execution state from event
   */
  private reconstructExecutionState(
    state: Map<string, ExecutionState>,
    entry: AuditLogEntry
  ): { entityId: string; before: ExecutionState | null; after: ExecutionState } | null {
    const context = entry.context;
    const runId = context.runId as string;

    if (!runId) return null;

    const before = state.get(runId) || null;
    let after: ExecutionState;

    switch (entry.eventType) {
      case 'playbook.execution_started':
        after = {
          runId,
          playbookId: context.playbookId as string,
          status: 'running',
          currentStep: 0,
          totalSteps: context.totalSteps as number,
          startedAt: entry.createdAt,
        };
        break;

      case 'playbook.execution_step_completed':
        after = {
          ...(before || { runId, playbookId: context.playbookId as string }),
          currentStep: (context.stepIndex as number) + 1,
        };
        break;

      case 'playbook.execution_completed':
        after = {
          ...(before || { runId, playbookId: context.playbookId as string }),
          status: 'completed',
          completedAt: entry.createdAt,
        };
        break;

      case 'playbook.execution_failed':
        after = {
          ...(before || { runId, playbookId: context.playbookId as string }),
          status: 'failed',
          completedAt: entry.createdAt,
        };
        break;

      default:
        return null;
    }

    state.set(runId, after);
    return { entityId: runId, before, after };
  }

  // ============================================================================
  // C. DIFF COMPUTATION
  // ============================================================================

  /**
   * Compute diffs between two state objects
   */
  computeDiffs(
    before: Record<string, unknown> | null,
    after: Record<string, unknown>
  ): StateDiff[] {
    const diffs: StateDiff[] = [];
    const allKeys = new Set([
      ...Object.keys(before || {}),
      ...Object.keys(after),
    ]);

    for (const key of allKeys) {
      const beforeValue = before?.[key];
      const afterValue = after[key];

      if (beforeValue === undefined && afterValue !== undefined) {
        diffs.push({
          field: key,
          before: undefined,
          after: afterValue,
          operation: 'added',
        });
      } else if (beforeValue !== undefined && afterValue === undefined) {
        diffs.push({
          field: key,
          before: beforeValue,
          after: undefined,
          operation: 'removed',
        });
      } else if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
        diffs.push({
          field: key,
          before: beforeValue,
          after: afterValue,
          operation: 'modified',
        });
      }
    }

    return diffs;
  }

  /**
   * Generate summary text for an event
   */
  private generateEventSummary(entry: AuditLogEntry): string {
    const [category, action] = entry.eventType.split('.');
    const formattedAction = action?.replace(/_/g, ' ') || entry.eventType;

    switch (category) {
      case 'content':
        return `Content ${formattedAction}: ${entry.context.title || entry.context.contentId}`;
      case 'playbook':
        return `Playbook ${formattedAction}: ${entry.context.playbookName || entry.context.playbookId}`;
      case 'billing':
        return `Billing ${formattedAction}`;
      case 'auth':
        return `Auth ${formattedAction}`;
      case 'llm':
        return `LLM ${formattedAction}: ${entry.context.model || 'unknown model'}`;
      default:
        return `${category} ${formattedAction}`;
    }
  }

  // ============================================================================
  // D. REPLAY JOB MANAGEMENT
  // ============================================================================

  /**
   * Create a new replay job
   */
  async createReplayJob(
    orgId: string,
    userId: string,
    filters: AuditReplayFilters = {}
  ): Promise<AuditReplayRun | null> {
    const { data, error } = await this.supabase
      .from('audit_replay_runs')
      .insert({
        org_id: orgId,
        user_id: userId,
        status: 'queued' as AuditReplayStatus,
        filters_json: filters,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create replay job:', error);
      return null;
    }

    return this.recordToRun(data);
  }

  /**
   * Get a replay job by ID
   */
  async getReplayJob(orgId: string, jobId: string): Promise<AuditReplayRun | null> {
    const { data, error } = await this.supabase
      .from('audit_replay_runs')
      .select('*')
      .eq('id', jobId)
      .eq('org_id', orgId)
      .single();

    if (error) {
      console.error('Failed to get replay job:', error);
      return null;
    }

    return this.recordToRun(data);
  }

  /**
   * List replay jobs for an organization
   */
  async listReplayJobs(
    orgId: string,
    limit = 20,
    offset = 0
  ): Promise<{ runs: AuditReplayRun[]; total: number }> {
    const { data, error, count } = await this.supabase
      .from('audit_replay_runs')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to list replay jobs:', error);
      return { runs: [], total: 0 };
    }

    return {
      runs: (data || []).map((record: AuditReplayRunRecord) => this.recordToRun(record)),
      total: count || 0,
    };
  }

  /**
   * Update replay job status
   */
  async updateReplayJobStatus(
    jobId: string,
    status: AuditReplayStatus,
    updates: Partial<{
      startedAt: string;
      finishedAt: string;
      result: ReplayResultSummary;
      eventCount: number;
      snapshotCount: number;
      errorMessage: string;
    }> = {}
  ): Promise<boolean> {
    const updateData: Record<string, unknown> = { status };

    if (updates.startedAt) updateData.started_at = updates.startedAt;
    if (updates.finishedAt) updateData.finished_at = updates.finishedAt;
    if (updates.result) updateData.result_json = updates.result;
    if (updates.eventCount !== undefined) updateData.event_count = updates.eventCount;
    if (updates.snapshotCount !== undefined) updateData.snapshot_count = updates.snapshotCount;
    if (updates.errorMessage) updateData.error_message = updates.errorMessage;

    const { error } = await this.supabase
      .from('audit_replay_runs')
      .update(updateData)
      .eq('id', jobId);

    if (error) {
      console.error('Failed to update replay job status:', error);
      return false;
    }

    return true;
  }

  /**
   * Start processing a replay job
   */
  async startReplayJob(jobId: string): Promise<void> {
    await this.updateReplayJobStatus(jobId, 'running', {
      startedAt: new Date().toISOString(),
    });

    // Emit SSE event
    replayEventEmitter.emit(`replay:${jobId}`, {
      type: 'replay.started',
      data: { runId: jobId },
    });
  }

  /**
   * Process a replay job - main replay algorithm
   */
  async processReplayJob(jobId: string, orgId: string): Promise<void> {
    try {
      // Get the job
      const job = await this.getReplayJob(orgId, jobId);
      if (!job) {
        throw new Error('Replay job not found');
      }

      // Start the job
      await this.startReplayJob(jobId);

      // Fetch all relevant logs
      const logs = await this.fetchLogs(orgId, job.filters);

      if (logs.length === 0) {
        await this.updateReplayJobStatus(jobId, 'success', {
          finishedAt: new Date().toISOString(),
          eventCount: 0,
          snapshotCount: 0,
          result: {
            totalEvents: 0,
            totalSnapshots: 0,
            entityBreakdown: {},
            eventTypeBreakdown: {},
            severityBreakdown: { info: 0, warning: 0, error: 0, critical: 0 },
            timeRange: { start: '', end: '' },
            stateChanges: { additions: 0, modifications: 0, deletions: 0 },
          },
        });
        return;
      }

      // Initialize state tracking
      const stateMap = this.initializeStateMap();
      const snapshots: ReplaySnapshot[] = [];
      const timeline: ReplayTimelineEvent[] = [];

      // Tracking for summary
      const entityBreakdown: Record<string, number> = {};
      const eventTypeBreakdown: Record<string, number> = {};
      const severityBreakdown: Record<AuditSeverity, number> = {
        info: 0,
        warning: 0,
        error: 0,
        critical: 0,
      };
      let additions = 0;
      let modifications = 0;
      let deletions = 0;

      // Process each log entry
      for (let i = 0; i < logs.length; i++) {
        const entry = logs[i];
        let stateChange: {
          entityId?: string;
          entityType?: string;
          before: Record<string, unknown> | null;
          after: Record<string, unknown>;
        } | null = null;

        // Determine entity type and reconstruct state
        const [category] = entry.eventType.split('.');

        switch (category) {
          case 'content': {
            const contentChange = this.reconstructContentState(stateMap.content, entry);
            if (contentChange) {
              stateChange = {
                ...contentChange,
                entityType: 'content',
                before: contentChange.before as unknown as Record<string, unknown> | null,
                after: contentChange.after as unknown as Record<string, unknown>,
              };
            }
            break;
          }

          case 'playbook': {
            const playbookChange = this.reconstructPlaybookState(stateMap.playbook, entry);
            if (playbookChange) {
              stateChange = {
                ...playbookChange,
                entityType: 'playbook',
                before: playbookChange.before as unknown as Record<string, unknown> | null,
                after: playbookChange.after as unknown as Record<string, unknown>,
              };
            }
            // Also track execution state
            const execChange = this.reconstructExecutionState(stateMap.execution, entry);
            if (execChange && !stateChange) {
              stateChange = {
                ...execChange,
                entityType: 'execution',
                before: execChange.before as unknown as Record<string, unknown> | null,
                after: execChange.after as unknown as Record<string, unknown>,
              };
            }
            break;
          }

          case 'billing': {
            const billingChange = this.reconstructBillingState(stateMap.billing, entry);
            if (billingChange) {
              stateChange = {
                entityType: 'billing',
                entityId: 'org-billing',
                before: billingChange.before as unknown as Record<string, unknown>,
                after: billingChange.after as unknown as Record<string, unknown>,
              };
            }
            break;
          }

          case 'llm': {
            const agentChange = this.reconstructAgentState(stateMap.agent, entry);
            if (agentChange) {
              stateChange = {
                ...agentChange,
                entityType: 'agent',
                before: agentChange.before as unknown as Record<string, unknown> | null,
                after: agentChange.after as unknown as Record<string, unknown>,
              };
            }
            // Also update billing token usage
            this.reconstructBillingState(stateMap.billing, entry);
            break;
          }
        }

        // Compute diffs and create snapshot
        const diffs = stateChange
          ? this.computeDiffs(stateChange.before, stateChange.after)
          : [];

        // Count state changes
        for (const diff of diffs) {
          if (diff.operation === 'added') additions++;
          else if (diff.operation === 'modified') modifications++;
          else if (diff.operation === 'removed') deletions++;
        }

        // Create snapshot
        const snapshot: ReplaySnapshot = {
          id: `snapshot-${jobId}-${i}`,
          replayRunId: jobId,
          snapshotIndex: i,
          eventId: entry.id,
          eventType: entry.eventType,
          timestamp: entry.createdAt || new Date().toISOString(),
          stateBefore: stateChange?.before as Record<string, unknown> | undefined,
          stateAfter: stateChange?.after,
          diff: diffs,
          entityType: stateChange?.entityType,
          entityId: stateChange?.entityId,
          createdAt: new Date().toISOString(),
        };

        snapshots.push(snapshot);

        // Store snapshot in database
        await this.storeSnapshot(snapshot);

        // Create timeline event
        const timelineEvent: ReplayTimelineEvent = {
          index: i,
          eventId: entry.id || `event-${i}`,
          eventType: entry.eventType,
          timestamp: entry.createdAt || new Date().toISOString(),
          severity: entry.severity,
          actorType: entry.actorType,
          summary: this.generateEventSummary(entry),
          entityType: stateChange?.entityType,
          entityId: stateChange?.entityId,
          changeCount: diffs.length,
        };
        timeline.push(timelineEvent);

        // Update breakdowns
        if (stateChange?.entityType) {
          entityBreakdown[stateChange.entityType] =
            (entityBreakdown[stateChange.entityType] || 0) + 1;
        }
        eventTypeBreakdown[entry.eventType] =
          (eventTypeBreakdown[entry.eventType] || 0) + 1;
        severityBreakdown[entry.severity]++;

        // Emit progress event
        if (i % 10 === 0 || i === logs.length - 1) {
          replayEventEmitter.emit(`replay:${jobId}`, {
            type: 'replay.progress',
            data: {
              runId: jobId,
              progress: Math.round(((i + 1) / logs.length) * 100),
              currentEvent: i + 1,
              totalEvents: logs.length,
            },
          });
        }

        // Emit snapshot event
        replayEventEmitter.emit(`replay:${jobId}`, {
          type: 'replay.snapshot',
          data: {
            runId: jobId,
            snapshot,
          },
        });
      }

      // Create result summary
      const result: ReplayResultSummary = {
        totalEvents: logs.length,
        totalSnapshots: snapshots.length,
        entityBreakdown,
        eventTypeBreakdown,
        severityBreakdown,
        timeRange: {
          start: logs[0].createdAt || '',
          end: logs[logs.length - 1].createdAt || '',
        },
        stateChanges: { additions, modifications, deletions },
      };

      // Update job as completed
      await this.updateReplayJobStatus(jobId, 'success', {
        finishedAt: new Date().toISOString(),
        eventCount: logs.length,
        snapshotCount: snapshots.length,
        result,
      });

      // Emit completion event
      replayEventEmitter.emit(`replay:${jobId}`, {
        type: 'replay.completed',
        data: {
          runId: jobId,
          result,
        },
      });

    } catch (error) {
      console.error('Replay job failed:', error);

      await this.updateReplayJobStatus(jobId, 'failed', {
        finishedAt: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      // Emit failure event
      replayEventEmitter.emit(`replay:${jobId}`, {
        type: 'replay.failed',
        data: {
          runId: jobId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  // ============================================================================
  // E. SNAPSHOT MANAGEMENT
  // ============================================================================

  /**
   * Store a snapshot in the database
   */
  async storeSnapshot(snapshot: ReplaySnapshot): Promise<void> {
    const { error } = await this.supabase
      .from('audit_replay_snapshots')
      .insert({
        id: snapshot.id,
        replay_run_id: snapshot.replayRunId,
        snapshot_index: snapshot.snapshotIndex,
        event_id: snapshot.eventId,
        event_type: snapshot.eventType,
        timestamp: snapshot.timestamp,
        state_before: snapshot.stateBefore,
        state_after: snapshot.stateAfter,
        diff_json: snapshot.diff,
        entity_type: snapshot.entityType,
        entity_id: snapshot.entityId,
      });

    if (error) {
      console.error('Failed to store snapshot:', error);
    }
  }

  /**
   * Get a snapshot by index
   */
  async getSnapshot(
    runId: string,
    snapshotIndex: number
  ): Promise<ReplaySnapshot | null> {
    const { data, error } = await this.supabase
      .from('audit_replay_snapshots')
      .select('*')
      .eq('replay_run_id', runId)
      .eq('snapshot_index', snapshotIndex)
      .single();

    if (error) {
      console.error('Failed to get snapshot:', error);
      return null;
    }

    return this.recordToSnapshot(data);
  }

  /**
   * Get timeline for a replay run
   */
  async getTimeline(runId: string): Promise<ReplayTimelineEvent[]> {
    const { data, error } = await this.supabase
      .from('audit_replay_snapshots')
      .select('*')
      .eq('replay_run_id', runId)
      .order('snapshot_index', { ascending: true });

    if (error) {
      console.error('Failed to get timeline:', error);
      return [];
    }

    // We need to also get the original audit log entries to build timeline
    // For now, build simplified timeline from snapshots
    return (data || []).map((record: ReplaySnapshotRecord, index: number) => ({
      index,
      eventId: record.event_id || `event-${index}`,
      eventType: record.event_type,
      timestamp: record.timestamp,
      severity: 'info' as AuditSeverity, // Default, would need to join with audit_log
      actorType: 'system' as ActorType, // Default
      summary: `${record.event_type} event`,
      entityType: record.entity_type || undefined,
      entityId: record.entity_id || undefined,
      changeCount: (record.diff_json || []).length,
    }));
  }

  // ============================================================================
  // F. HELPER CONVERTERS
  // ============================================================================

  /**
   * Convert database record to AuditReplayRun
   */
  private recordToRun(record: AuditReplayRunRecord): AuditReplayRun {
    return {
      id: record.id,
      orgId: record.org_id,
      userId: record.user_id,
      status: record.status,
      filters: record.filters_json,
      startedAt: record.started_at,
      finishedAt: record.finished_at,
      result: record.result_json,
      eventCount: record.event_count,
      snapshotCount: record.snapshot_count,
      errorMessage: record.error_message,
      createdAt: record.created_at,
    };
  }

  /**
   * Convert database record to ReplaySnapshot
   */
  private recordToSnapshot(record: ReplaySnapshotRecord): ReplaySnapshot {
    return {
      id: record.id,
      replayRunId: record.replay_run_id,
      snapshotIndex: record.snapshot_index,
      eventId: record.event_id || undefined,
      eventType: record.event_type,
      timestamp: record.timestamp,
      stateBefore: record.state_before || undefined,
      stateAfter: record.state_after || undefined,
      diff: record.diff_json || [],
      entityType: record.entity_type || undefined,
      entityId: record.entity_id || undefined,
      createdAt: record.created_at,
    };
  }

  /**
   * Summarize replay results
   */
  summarizeReplay(result: ReplayResultSummary): string {
    const lines: string[] = [];
    lines.push(`Replay completed with ${result.totalEvents} events and ${result.totalSnapshots} snapshots.`);
    lines.push(`Time range: ${result.timeRange.start} to ${result.timeRange.end}`);
    lines.push(`State changes: ${result.stateChanges.additions} additions, ${result.stateChanges.modifications} modifications, ${result.stateChanges.deletions} deletions`);

    const topEntities = Object.entries(result.entityBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
    if (topEntities.length > 0) {
      lines.push(`Top entities: ${topEntities.map(([k, v]) => `${k} (${v})`).join(', ')}`);
    }

    return lines.join('\n');
  }
}
