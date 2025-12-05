/**
 * Audit Export Service (Sprint S36)
 * Handles audit log CSV exports with async job processing
 *
 * Features:
 * - Async export job queuing
 * - CSV generation with streaming
 * - File storage management
 * - Job status tracking
 */

import * as fs from 'fs';
import * as path from 'path';

import type {
  AuditExportJob,
  AuditExportJobRecord,
  AuditExportStatus,
  AuditLogEntry,
  AuditQueryFilters,
} from '@pravado/types';
import { createLogger } from '@pravado/utils';
import type { SupabaseClient } from '@supabase/supabase-js';

import { AuditService } from './auditService';

const logger = createLogger('audit-export-service');

/**
 * Export job creation options
 */
export interface CreateExportOptions {
  orgId: string;
  userId: string;
  filters?: AuditQueryFilters;
}

/**
 * Audit Export Service
 * Handles all audit export operations
 */
export class AuditExportService {
  private storageDir: string;

  constructor(
    private supabase: SupabaseClient,
    private auditService: AuditService,
    storageDir: string = '/tmp/audit_exports'
  ) {
    this.storageDir = storageDir;
    this.ensureStorageDir();
  }

  /**
   * Ensure storage directory exists
   */
  private ensureStorageDir(): void {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
    } catch (error) {
      logger.error('Failed to create storage directory', { error, storageDir: this.storageDir });
    }
  }

  /**
   * Create a new export job
   */
  async createExportJob(options: CreateExportOptions): Promise<AuditExportJob | null> {
    try {
      const { orgId, userId, filters = {} } = options;

      // Set expiration to 24 hours from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const record = {
        org_id: orgId,
        user_id: userId,
        status: 'queued' as AuditExportStatus,
        filters_json: filters,
        expires_at: expiresAt.toISOString(),
      };

      const { data, error } = await this.supabase
        .from('audit_exports')
        .insert(record)
        .select()
        .single();

      if (error) {
        logger.error('Failed to create export job', { error, orgId });
        return null;
      }

      logger.info('Export job created', { jobId: data.id, orgId });
      return this.mapRecordToJob(data);
    } catch (error) {
      logger.error('Error creating export job', { error, options });
      return null;
    }
  }

  /**
   * Get export job by ID
   */
  async getExportJob(orgId: string, jobId: string): Promise<AuditExportJob | null> {
    try {
      const { data, error } = await this.supabase
        .from('audit_exports')
        .select('*')
        .eq('org_id', orgId)
        .eq('id', jobId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        logger.error('Failed to get export job', { error, jobId });
        return null;
      }

      return this.mapRecordToJob(data);
    } catch (error) {
      logger.error('Error getting export job', { error, jobId });
      return null;
    }
  }

  /**
   * List export jobs for an organization
   */
  async listExportJobs(
    orgId: string,
    limit: number = 20
  ): Promise<AuditExportJob[]> {
    try {
      const { data, error } = await this.supabase
        .from('audit_exports')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Failed to list export jobs', { error, orgId });
        return [];
      }

      return (data || []).map(this.mapRecordToJob);
    } catch (error) {
      logger.error('Error listing export jobs', { error, orgId });
      return [];
    }
  }

  /**
   * Process an export job (called by worker)
   */
  async processExportJob(jobId: string): Promise<boolean> {
    try {
      // Get the job
      const { data: job, error: fetchError } = await this.supabase
        .from('audit_exports')
        .select('*')
        .eq('id', jobId)
        .single();

      if (fetchError || !job) {
        logger.error('Export job not found', { jobId });
        return false;
      }

      // Update status to processing
      await this.updateJobStatus(jobId, 'processing');

      // Fetch all audit logs matching filters
      const filters = job.filters_json as AuditQueryFilters;
      const allEntries: AuditLogEntry[] = [];
      let offset = 0;
      const batchSize = 100;
      let hasMore = true;

      while (hasMore) {
        const result = await this.auditService.queryAuditLog(job.org_id, {
          ...filters,
          limit: batchSize,
          offset,
        });

        allEntries.push(...result.entries);
        hasMore = result.hasMore;
        offset += batchSize;

        // Safety limit to prevent infinite loops
        if (offset > 10000) {
          logger.warn('Export reached safety limit', { jobId, offset });
          break;
        }
      }

      // Generate CSV
      const csvContent = this.generateCSV(allEntries);

      // Store file
      const fileName = `audit_export_${jobId}.csv`;
      const filePath = path.join(this.storageDir, fileName);

      await this.storeFile(filePath, csvContent);

      // Get file size
      const stats = fs.statSync(filePath);

      // Update job as successful
      await this.supabase
        .from('audit_exports')
        .update({
          status: 'success',
          file_path: filePath,
          file_size_bytes: stats.size,
          row_count: allEntries.length,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      logger.info('Export job completed', {
        jobId,
        rowCount: allEntries.length,
        fileSize: stats.size,
      });

      return true;
    } catch (error) {
      logger.error('Export job failed', { error, jobId });

      await this.supabase
        .from('audit_exports')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      return false;
    }
  }

  /**
   * Generate CSV content from audit entries
   */
  generateCSV(entries: AuditLogEntry[]): string {
    const headers = [
      'ID',
      'Timestamp',
      'Event Type',
      'Severity',
      'Actor Type',
      'User ID',
      'IP Address',
      'User Agent',
      'Context',
    ];

    const rows = entries.map((entry) => [
      entry.id || '',
      entry.createdAt || '',
      entry.eventType,
      entry.severity,
      entry.actorType,
      entry.userId || '',
      entry.ipAddress || '',
      entry.userAgent || '',
      JSON.stringify(entry.context),
    ]);

    // Escape CSV values
    const escapeCSV = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvRows = [
      headers.join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ];

    return csvRows.join('\n');
  }

  /**
   * Store file to disk
   */
  async storeFile(filePath: string, content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, content, 'utf-8', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Read file from disk
   */
  async readFile(filePath: string): Promise<string | null> {
    return new Promise((resolve) => {
      fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
          logger.error('Failed to read file', { error: err, filePath });
          resolve(null);
        } else {
          resolve(data);
        }
      });
    });
  }

  /**
   * Get download URL for a completed export
   */
  getDownloadPath(job: AuditExportJob): string | null {
    if (job.status !== 'success' || !job.filePath) {
      return null;
    }
    return `/api/v1/audit/export/${job.id}/download`;
  }

  /**
   * Update job status
   */
  private async updateJobStatus(
    jobId: string,
    status: AuditExportStatus
  ): Promise<void> {
    const updates: Record<string, unknown> = { status };

    if (status === 'processing') {
      updates.started_at = new Date().toISOString();
    }

    await this.supabase
      .from('audit_exports')
      .update(updates)
      .eq('id', jobId);
  }

  /**
   * Map database record to job type
   */
  private mapRecordToJob(record: AuditExportJobRecord): AuditExportJob {
    return {
      id: record.id,
      orgId: record.org_id,
      userId: record.user_id,
      status: record.status,
      filters: record.filters_json,
      filePath: record.file_path,
      fileSizeBytes: record.file_size_bytes,
      rowCount: record.row_count,
      errorMessage: record.error_message,
      startedAt: record.started_at,
      completedAt: record.completed_at,
      expiresAt: record.expires_at,
      createdAt: record.created_at,
    };
  }

  /**
   * Cleanup expired exports
   */
  async cleanupExpiredExports(): Promise<number> {
    try {
      // Get expired exports
      const { data: expired, error: fetchError } = await this.supabase
        .from('audit_exports')
        .select('id, file_path')
        .lt('expires_at', new Date().toISOString())
        .not('file_path', 'is', null);

      if (fetchError) {
        logger.error('Failed to fetch expired exports', { error: fetchError });
        return 0;
      }

      let cleaned = 0;
      for (const job of expired || []) {
        try {
          // Delete file if exists
          if (job.file_path && fs.existsSync(job.file_path)) {
            fs.unlinkSync(job.file_path);
          }

          // Delete record
          await this.supabase
            .from('audit_exports')
            .delete()
            .eq('id', job.id);

          cleaned++;
        } catch (error) {
          logger.warn('Failed to cleanup export', { error, jobId: job.id });
        }
      }

      logger.info('Cleaned up expired exports', { count: cleaned });
      return cleaned;
    } catch (error) {
      logger.error('Error cleaning up expired exports', { error });
      return 0;
    }
  }
}

/**
 * Singleton instance
 */
let exportServiceInstance: AuditExportService | null = null;

/**
 * Initialize the export service singleton
 */
export function initAuditExportService(
  supabase: SupabaseClient,
  auditService: AuditService,
  storageDir?: string
): AuditExportService {
  exportServiceInstance = new AuditExportService(supabase, auditService, storageDir);
  return exportServiceInstance;
}

/**
 * Get the export service singleton
 */
export function getAuditExportService(): AuditExportService {
  if (!exportServiceInstance) {
    throw new Error('AuditExportService not initialized');
  }
  return exportServiceInstance;
}
