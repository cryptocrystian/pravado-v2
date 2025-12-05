/**
 * Scheduler Service (Sprint S42)
 * Manages scheduled background tasks and cron job execution
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  HourlyRssFetchMetadata,
  ListSchedulerTasksQuery,
  ListTaskRunsQuery,
  NightlyCleanupMetadata,
  QueueJobsMetadata,
  SchedulerStats,
  SchedulerTask,
  SchedulerTaskListResponse,
  SchedulerTaskRecord,
  SchedulerTaskRunListResponse,
  SchedulerTaskRunRecord,
  SchedulerTaskStatus,
  TaskExecutionResult,
  UpdateSchedulerTaskInput,
} from '@pravado/types';

import {
  transformSchedulerTaskRecord,
  transformSchedulerTaskRunRecord,
} from '@pravado/types';

import type { MediaCrawlerService } from './mediaCrawlerService';

// ========================================
// SERVICE CONFIGURATION
// ========================================

interface SchedulerServiceConfig {
  supabase: SupabaseClient;
  mediaCrawlerService: MediaCrawlerService;
  debugMode?: boolean;
}

// ========================================
// CRON EXPRESSION MATCHING
// ========================================

/**
 * Simple cron expression matcher
 * Format: "minute hour day month weekday" (5 fields)
 * Supports: numbers, asterisk, step values (e.g. every N minutes)
 * Production would use cron-parser or similar library
 */
class CronMatcher {
  static isDue(cronExpr: string, lastRunAt: Date | null): boolean {
    const now = new Date();

    // If never run, it's due
    if (!lastRunAt) {
      return true;
    }

    const parts = cronExpr.trim().split(/\s+/);
    if (parts.length !== 5) {
      return false; // Invalid cron expression
    }

    // Check if we've crossed a scheduled time since last run
    const timeSinceLastRun = now.getTime() - lastRunAt.getTime();
    const minutesSinceLastRun = Math.floor(timeSinceLastRun / 60000);

    // Simple heuristic: if more time has passed than minimum interval
    const minInterval = this.getMinInterval(cronExpr);
    return minutesSinceLastRun >= minInterval;
  }

  // Unused in simplified implementation - kept for future enhancement
  // private static parseField(field: string, min: number, max: number): number[] {
  //   if (field === '*') {
  //     return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  //   }
  //   if (field.startsWith('*/')) {
  //     const step = parseInt(field.slice(2), 10);
  //     const result: number[] = [];
  //     for (let i = min; i <= max; i += step) {
  //       result.push(i);
  //     }
  //     return result;
  //   }
  //   return [parseInt(field, 10)];
  // }

  private static getMinInterval(cronExpr: string): number {
    const parts = cronExpr.trim().split(/\s+/);
    const [minutePart, hourPart] = parts;

    // If hourly or less frequent
    if (hourPart !== '*' && hourPart !== '*/1') {
      return 60; // At least 1 hour
    }

    // If minute is */N
    if (minutePart.startsWith('*/')) {
      return parseInt(minutePart.slice(2), 10);
    }

    // Default to 1 minute
    return 1;
  }
}

// ========================================
// SCHEDULER SERVICE
// ========================================

export class SchedulerService {
  private supabase: SupabaseClient;
  private mediaCrawlerService: MediaCrawlerService;
  private debugMode: boolean;

  constructor(config: SchedulerServiceConfig) {
    this.supabase = config.supabase;
    this.mediaCrawlerService = config.mediaCrawlerService;
    this.debugMode = config.debugMode ?? false;
  }

  private log(message: string, data?: any): void {
    if (this.debugMode) {
      console.log(`[Scheduler] ${message}`, data || '');
    }
  }

  // ========================================
  // TASK MANAGEMENT
  // ========================================

  /**
   * List all scheduler tasks
   */
  async listTasks(query: ListSchedulerTasksQuery = {}): Promise<SchedulerTaskListResponse> {
    this.log('Listing scheduler tasks:', query);

    let dbQuery = this.supabase.from('scheduler_tasks').select('*', { count: 'exact' });

    if (query.enabled !== undefined) {
      dbQuery = dbQuery.eq('enabled', query.enabled);
    }

    dbQuery = dbQuery.order('name', { ascending: true });

    if (query.limit) {
      dbQuery = dbQuery.range(query.offset || 0, (query.offset || 0) + query.limit - 1);
    }

    const { data, error, count } = await dbQuery;

    if (error) {
      throw new Error(`Failed to list scheduler tasks: ${error.message}`);
    }

    const tasks = (data || []).map((record) =>
      transformSchedulerTaskRecord(record as SchedulerTaskRecord)
    );

    return {
      tasks,
      total: count || 0,
    };
  }

  /**
   * Get a single task by ID
   */
  async getTask(taskId: string): Promise<SchedulerTask | null> {
    this.log('Getting scheduler task:', { taskId });

    const { data, error } = await this.supabase
      .from('scheduler_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get scheduler task: ${error.message}`);
    }

    return transformSchedulerTaskRecord(data as SchedulerTaskRecord);
  }

  /**
   * Get a task by name
   */
  async getTaskByName(taskName: string): Promise<SchedulerTask | null> {
    this.log('Getting scheduler task by name:', { taskName });

    const { data, error } = await this.supabase
      .from('scheduler_tasks')
      .select('*')
      .eq('name', taskName)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get scheduler task: ${error.message}`);
    }

    return transformSchedulerTaskRecord(data as SchedulerTaskRecord);
  }

  /**
   * Update task status (enable/disable)
   */
  async updateTaskStatus(taskId: string, input: UpdateSchedulerTaskInput): Promise<void> {
    this.log('Updating scheduler task:', { taskId, input });

    const updates: Partial<SchedulerTaskRecord> = {};

    if (input.enabled !== undefined) {
      updates.enabled = input.enabled;
    }

    if (input.description !== undefined) {
      updates.description = input.description;
    }

    const { error } = await this.supabase
      .from('scheduler_tasks')
      .update(updates)
      .eq('id', taskId);

    if (error) {
      throw new Error(`Failed to update scheduler task: ${error.message}`);
    }
  }

  // ========================================
  // TASK RUN RECORDING
  // ========================================

  /**
   * Record the start of a task run
   */
  async recordTaskRunStart(taskName: string): Promise<string> {
    this.log('Recording task run start:', { taskName });

    const task = await this.getTaskByName(taskName);
    if (!task) {
      throw new Error(`Task not found: ${taskName}`);
    }

    const { data, error } = await this.supabase
      .from('scheduler_task_runs')
      .insert({
        task_id: task.id,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to record task run start: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Record the end of a task run
   */
  async recordTaskRunEnd(
    runId: string,
    status: SchedulerTaskStatus,
    error: string | null = null,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    this.log('Recording task run end:', { runId, status });

    const { error: updateError } = await this.supabase
      .from('scheduler_task_runs')
      .update({
        finished_at: new Date().toISOString(),
        status,
        error,
        metadata,
      })
      .eq('id', runId);

    if (updateError) {
      throw new Error(`Failed to record task run end: ${updateError.message}`);
    }

    // Update last_run_at and last_run_status on the task
    const { data: runData } = await this.supabase
      .from('scheduler_task_runs')
      .select('task_id')
      .eq('id', runId)
      .single();

    if (runData) {
      await this.supabase
        .from('scheduler_tasks')
        .update({
          last_run_at: new Date().toISOString(),
          last_run_status: status,
        })
        .eq('id', runData.task_id);
    }
  }

  /**
   * List task runs
   */
  async listTaskRuns(query: ListTaskRunsQuery = {}): Promise<SchedulerTaskRunListResponse> {
    this.log('Listing task runs:', query);

    let dbQuery = this.supabase.from('scheduler_task_runs').select('*', { count: 'exact' });

    if (query.taskId) {
      dbQuery = dbQuery.eq('task_id', query.taskId);
    }

    if (query.status) {
      dbQuery = dbQuery.eq('status', query.status);
    }

    if (query.startDate) {
      dbQuery = dbQuery.gte('started_at', query.startDate);
    }

    if (query.endDate) {
      dbQuery = dbQuery.lte('started_at', query.endDate);
    }

    dbQuery = dbQuery.order('started_at', { ascending: false });

    if (query.limit) {
      dbQuery = dbQuery.range(query.offset || 0, (query.offset || 0) + query.limit - 1);
    }

    const { data, error, count } = await dbQuery;

    if (error) {
      throw new Error(`Failed to list task runs: ${error.message}`);
    }

    const runs = (data || []).map((record) =>
      transformSchedulerTaskRunRecord(record as SchedulerTaskRunRecord)
    );

    return {
      runs,
      total: count || 0,
    };
  }

  // ========================================
  // TASK EXECUTION
  // ========================================

  /**
   * Execute a task immediately
   */
  async runTaskNow(taskName: string): Promise<TaskExecutionResult> {
    this.log('Running task now:', { taskName });

    const task = await this.getTaskByName(taskName);
    if (!task) {
      throw new Error(`Task not found: ${taskName}`);
    }

    return await this.executeTask(task);
  }

  /**
   * Execute all due tasks based on cron schedules
   */
  async executeDueTasks(): Promise<TaskExecutionResult[]> {
    this.log('Checking for due tasks...');

    const { tasks } = await this.listTasks({ enabled: true });

    const dueTasks = tasks.filter((task) =>
      CronMatcher.isDue(task.schedule, task.lastRunAt)
    );

    this.log(`Found ${dueTasks.length} due tasks:`, dueTasks.map((t) => t.name));

    const results: TaskExecutionResult[] = [];

    for (const task of dueTasks) {
      try {
        const result = await this.executeTask(task);
        results.push(result);
      } catch (error) {
        this.log(`Error executing task ${task.name}:`, error);
        // Continue with other tasks
      }
    }

    return results;
  }

  /**
   * Internal: Execute a single task
   */
  private async executeTask(task: SchedulerTask): Promise<TaskExecutionResult> {
    const startTime = Date.now();
    const runId = await this.recordTaskRunStart(task.name);

    try {
      this.log(`Executing task: ${task.name}`);

      let metadata: Record<string, any> = {};

      // Route to appropriate task handler
      switch (task.name) {
        case 'crawl:hourly-fetch-rss':
          metadata = await this.executeHourlyRssFetch();
          break;

        case 'crawl:10min-queue-jobs':
          metadata = await this.executeQueueJobs();
          break;

        case 'crawl:nightly-cleanup':
          metadata = await this.executeNightlyCleanup();
          break;

        default:
          throw new Error(`Unknown task: ${task.name}`);
      }

      const duration = Date.now() - startTime;

      await this.recordTaskRunEnd(runId, 'success', null, metadata);

      this.log(`Task ${task.name} completed successfully:`, metadata);

      return {
        taskId: task.id,
        taskName: task.name,
        runId,
        status: 'success',
        error: null,
        duration,
        metadata,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.recordTaskRunEnd(runId, 'failure', errorMessage);

      this.log(`Task ${task.name} failed:`, errorMessage);

      return {
        taskId: task.id,
        taskName: task.name,
        runId,
        status: 'failure',
        error: errorMessage,
        duration,
        metadata: {},
      };
    }
  }

  // ========================================
  // TASK HANDLERS
  // ========================================

  /**
   * Task 1: Hourly RSS Fetch
   * Fetch all active RSS feeds and create crawl jobs
   */
  private async executeHourlyRssFetch(): Promise<HourlyRssFetchMetadata> {
    this.log('Executing hourly RSS fetch...');

    // Get all active RSS feeds across all orgs
    const { data: feeds, error } = await this.supabase
      .from('media_rss_feeds')
      .select('id, org_id')
      .eq('active', true);

    if (error) {
      throw new Error(`Failed to fetch RSS feeds: ${error.message}`);
    }

    const errors: string[] = [];
    let totalJobsCreated = 0;

    // Group by org_id to process per organization
    const orgFeeds = new Map<string, string[]>();
    for (const feed of feeds || []) {
      if (!orgFeeds.has(feed.org_id)) {
        orgFeeds.set(feed.org_id, []);
      }
      orgFeeds.get(feed.org_id)!.push(feed.id);
    }

    // Fetch for each org
    for (const [feedOrgId, feedIds] of orgFeeds) {
      try {
        const results = await this.mediaCrawlerService.fetchAllActiveFeeds(feedOrgId, feedIds);
        totalJobsCreated += results.reduce((sum, r) => sum + r.jobsCreated, 0);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Org ${feedOrgId}: ${msg}`);
      }
    }

    return {
      feedsFetched: feeds?.length || 0,
      jobsCreated: totalJobsCreated,
      errors,
    };
  }

  /**
   * Task 2: Queue Pending Jobs (every 10 minutes)
   * Find queued crawl jobs and enqueue them
   */
  private async executeQueueJobs(): Promise<QueueJobsMetadata> {
    this.log('Executing queue jobs task...');

    // Get pending crawl jobs
    const { data: jobs, error } = await this.supabase
      .from('media_crawl_jobs')
      .select('id, org_id, url')
      .eq('status', 'queued')
      .limit(100); // Process up to 100 at a time

    if (error) {
      throw new Error(`Failed to fetch queued jobs: ${error.message}`);
    }

    const errors: string[] = [];
    let jobsEnqueued = 0;

    // For S42, we'll use the MediaCrawlerService to process jobs directly
    // In production with a real queue system (S18), you'd enqueue to the worker queue
    for (const job of jobs || []) {
      try {
        await this.mediaCrawlerService.executeCrawlJob(job.org_id, job.id);
        jobsEnqueued++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Job ${job.id}: ${msg}`);
      }
    }

    return {
      jobsEnqueued,
      errors,
    };
  }

  /**
   * Task 3: Nightly Cleanup
   * Delete old crawl jobs and task runs
   */
  private async executeNightlyCleanup(): Promise<NightlyCleanupMetadata> {
    this.log('Executing nightly cleanup...');

    const errors: string[] = [];

    // Delete crawl jobs older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { error: jobsError, count: crawlJobsDeleted } = await this.supabase
      .from('media_crawl_jobs')
      .delete({ count: 'exact' })
      .lt('created_at', thirtyDaysAgo.toISOString());

    if (jobsError) {
      errors.push(`Failed to delete crawl jobs: ${jobsError.message}`);
    }

    // Delete task runs older than 60 days
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { error: runsError, count: taskRunsDeleted } = await this.supabase
      .from('scheduler_task_runs')
      .delete({ count: 'exact' })
      .lt('created_at', sixtyDaysAgo.toISOString());

    if (runsError) {
      errors.push(`Failed to delete task runs: ${runsError.message}`);
    }

    return {
      crawlJobsDeleted: crawlJobsDeleted || 0,
      taskRunsDeleted: taskRunsDeleted || 0,
      errors,
    };
  }

  // ========================================
  // STATISTICS
  // ========================================

  /**
   * Get scheduler statistics
   */
  async getStats(): Promise<SchedulerStats> {
    this.log('Getting scheduler stats');

    try {
      // Try RPC function first
      const { data, error } = await this.supabase.rpc('get_scheduler_stats');

      if (!error && data) {
        return {
          totalTasks: data.total_tasks,
          enabledTasks: data.enabled_tasks,
          totalRuns: data.total_runs,
          successfulRuns: data.successful_runs,
          failedRuns: data.failed_runs,
          last24hRuns: data.last_24h_runs,
        };
      }
    } catch (error) {
      this.log('RPC failed, using fallback', error);
    }

    // Fallback: manual queries
    return await this.getStatsFallback();
  }

  /**
   * Fallback statistics calculation
   */
  private async getStatsFallback(): Promise<SchedulerStats> {
    const { data: tasks } = await this.supabase.from('scheduler_tasks').select('*');

    const { data: runs } = await this.supabase.from('scheduler_task_runs').select('*');

    const last24h = new Date();
    last24h.setHours(last24h.getHours() - 24);

    return {
      totalTasks: tasks?.length || 0,
      enabledTasks: tasks?.filter((t) => t.enabled).length || 0,
      totalRuns: runs?.length || 0,
      successfulRuns: runs?.filter((r) => r.status === 'success').length || 0,
      failedRuns: runs?.filter((r) => r.status === 'failure').length || 0,
      last24hRuns:
        runs?.filter((r) => new Date(r.started_at) >= last24h).length || 0,
    };
  }
}

// ========================================
// FACTORY
// ========================================

export function createSchedulerService(config: SchedulerServiceConfig): SchedulerService {
  return new SchedulerService(config);
}
