/**
 * Ops Metrics Service (Sprint S27)
 * Provides observability metrics for internal ops dashboard
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { JobQueue } from '../queue/queue';
import type { WorkerPool } from '../queue/worker';

/**
 * Execution statistics for an organization
 */
export interface OrgExecutionStats {
  period: '24h' | '7d';
  runCounts: {
    total: number;
    queued: number;
    running: number;
    success: number;
    failed: number;
    canceled: number;
  };
  avgRuntimeMs: number;
  stepFailuresByType: {
    type: string;
    count: number;
  }[];
}

/**
 * Queue statistics (global)
 */
export interface QueueStats {
  pending: {
    total: number;
    byType: { [type: string]: number };
  };
  avgWaitTimeMs: number;
  retryStats: {
    min: number;
    max: number;
    avg: number;
  };
}

/**
 * LLM usage summary for an organization
 */
export interface LlmUsageSummary {
  period: '24h' | '7d';
  totalTokens: number;
  totalCalls: number;
  errorRate: number;
  byProvider: {
    provider: string;
    model: string;
    totalTokens: number;
    totalCalls: number;
    errorCount: number;
    avgLatencyMs: number;
  }[];
}

/**
 * Recent failure entry
 */
export interface RecentFailure {
  id: string;
  playbookName: string | null;
  createdAt: string;
  error: string | null;
}

/**
 * Ops Metrics Service
 */
export class OpsMetricsService {
  constructor(
    private supabase: SupabaseClient<any>,
    private queue?: JobQueue,
    private workerPool?: WorkerPool
  ) {}

  /**
   * Get execution statistics for an organization
   */
  async getOrgExecutionStats(orgId: string, period: '24h' | '7d' = '24h'): Promise<OrgExecutionStats> {
    const periodHours = period === '24h' ? 24 : 168;
    const since = new Date(Date.now() - periodHours * 60 * 60 * 1000).toISOString();

    // Get run counts by state
    const { data: runs, error: runsError } = await this.supabase
      .from('playbook_runs')
      .select('id, state, started_at, completed_at')
      .eq('org_id', orgId)
      .gte('created_at', since);

    if (runsError) {
      throw new Error(`Failed to fetch run stats: ${runsError.message}`);
    }

    const runCounts = {
      total: runs?.length || 0,
      queued: runs?.filter((r) => r.state === 'queued').length || 0,
      running: runs?.filter((r) => r.state === 'running').length || 0,
      success: runs?.filter((r) => r.state === 'success').length || 0,
      failed: runs?.filter((r) => r.state === 'failed').length || 0,
      canceled: runs?.filter((r) => r.state === 'canceled').length || 0,
    };

    // Calculate average runtime for successful runs
    const successfulRuns = runs?.filter(
      (r) => r.state === 'success' && r.started_at && r.completed_at
    ) || [];

    const avgRuntimeMs = successfulRuns.length > 0
      ? successfulRuns.reduce((sum, r) => {
          const start = new Date(r.started_at!).getTime();
          const end = new Date(r.completed_at!).getTime();
          return sum + (end - start);
        }, 0) / successfulRuns.length
      : 0;

    // Get step failures by type
    const { data: stepFailures, error: stepFailuresError } = await this.supabase
      .from('playbook_step_runs')
      .select('step_type')
      .eq('org_id', orgId)
      .eq('state', 'failed')
      .gte('created_at', since);

    if (stepFailuresError) {
      throw new Error(`Failed to fetch step failures: ${stepFailuresError.message}`);
    }

    const failuresByType = stepFailures?.reduce((acc, step) => {
      const type = step.step_type || 'UNKNOWN';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const stepFailuresByType = Object.entries(failuresByType).map(([type, count]) => ({
      type,
      count,
    }));

    return {
      period,
      runCounts,
      avgRuntimeMs,
      stepFailuresByType,
    };
  }

  /**
   * Get queue statistics (global)
   */
  async getQueueStats(): Promise<QueueStats> {
    if (!this.queue || !this.workerPool) {
      return {
        pending: { total: 0, byType: {} },
        avgWaitTimeMs: 0,
        retryStats: { min: 0, max: 0, avg: 0 },
      };
    }

    // Get all jobs to analyze
    const allJobs = this.queue.getAllJobs();
    const pendingJobs = allJobs.filter((j) => j.status === 'queued' || j.status === 'retrying');

    // Calculate wait times
    const now = Date.now();
    const waitTimes = pendingJobs.map((j) => {
      const createdAt = new Date(j.createdAt).getTime();
      return now - createdAt;
    });

    const avgWaitTimeMs = waitTimes.length > 0
      ? waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length
      : 0;

    // Calculate retry stats
    const attempts = allJobs.map((j) => j.attempt);
    const retryStats = attempts.length > 0
      ? {
          min: Math.min(...attempts),
          max: Math.max(...attempts),
          avg: attempts.reduce((sum, a) => sum + a, 0) / attempts.length,
        }
      : { min: 0, max: 0, avg: 0 };

    // Group pending jobs by type
    const byType = pendingJobs.reduce((acc, job) => {
      acc[job.type] = (acc[job.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      pending: {
        total: pendingJobs.length,
        byType,
      },
      avgWaitTimeMs,
      retryStats,
    };
  }

  /**
   * Get LLM usage summary for an organization
   */
  async getLlmUsageSummary(orgId: string, period: '24h' | '7d' = '24h'): Promise<LlmUsageSummary> {
    const periodHours = period === '24h' ? 24 : 168;
    const since = new Date(Date.now() - periodHours * 60 * 60 * 1000).toISOString();

    const { data: entries, error } = await this.supabase
      .from('llm_usage_ledger')
      .select('provider, model, tokens_total, status, latency_ms')
      .eq('org_id', orgId)
      .gte('created_at', since);

    if (error) {
      throw new Error(`Failed to fetch LLM usage: ${error.message}`);
    }

    if (!entries || entries.length === 0) {
      return {
        period,
        totalTokens: 0,
        totalCalls: 0,
        errorRate: 0,
        byProvider: [],
      };
    }

    const totalTokens = entries.reduce((sum, e) => sum + (e.tokens_total || 0), 0);
    const totalCalls = entries.length;
    const errorCount = entries.filter((e) => e.status === 'error').length;
    const errorRate = errorCount / totalCalls;

    // Group by provider and model
    const byProviderModel = entries.reduce((acc, entry) => {
      const key = `${entry.provider}:${entry.model}`;
      if (!acc[key]) {
        acc[key] = {
          provider: entry.provider,
          model: entry.model,
          totalTokens: 0,
          totalCalls: 0,
          errorCount: 0,
          totalLatency: 0,
        };
      }
      acc[key].totalTokens += entry.tokens_total || 0;
      acc[key].totalCalls += 1;
      if (entry.status === 'error') {
        acc[key].errorCount += 1;
      }
      acc[key].totalLatency += entry.latency_ms || 0;
      return acc;
    }, {} as Record<string, any>);

    const byProvider = Object.values(byProviderModel).map((p: any) => ({
      provider: p.provider,
      model: p.model,
      totalTokens: p.totalTokens,
      totalCalls: p.totalCalls,
      errorCount: p.errorCount,
      avgLatencyMs: Math.round(p.totalLatency / p.totalCalls),
    }));

    return {
      period,
      totalTokens,
      totalCalls,
      errorRate,
      byProvider,
    };
  }

  /**
   * Get recent failures for an organization
   */
  async getRecentFailures(orgId: string, limit: number = 10): Promise<RecentFailure[]> {
    const { data: runs, error } = await this.supabase
      .from('playbook_runs')
      .select('id, playbook_id, created_at, error, playbooks(name)')
      .eq('org_id', orgId)
      .eq('state', 'failed')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch recent failures: ${error.message}`);
    }

    return (runs || []).map((run) => ({
      id: run.id,
      playbookName: (run as any).playbooks?.name || null,
      createdAt: run.created_at,
      error: run.error ? JSON.stringify(run.error) : null,
    }));
  }
}
