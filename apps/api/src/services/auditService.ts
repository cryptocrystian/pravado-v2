/**
 * Audit Service (Sprint S35)
 * Comprehensive audit logging for compliance and security tracking
 *
 * Features:
 * - Best-effort logging (never blocks core flows)
 * - RLS-secured org isolation
 * - Cursor-based pagination for high performance
 * - Flexible JSONB context storage
 */

import type {
  ActorType,
  AuditContext,
  AuditEventType,
  AuditEventTypeMetadata,
  AuditLogEntry,
  AuditLogRecord,
  AuditQueryFilters,
  AuditQueryResult,
  AuditSeverity,
} from '@pravado/types';
import { createLogger } from '@pravado/utils';
import {
  AUDIT_EVENT_METADATA,
  getEventCategories,
  getEventMetadata,
  getEventsByCategory,
} from '@pravado/validators';
import type { SupabaseClient } from '@supabase/supabase-js';

const logger = createLogger('audit-service');

/**
 * Options for logging an audit event
 */
export interface LogEventOptions {
  orgId: string;
  eventType: AuditEventType;
  actorType?: ActorType;
  severity?: AuditSeverity;
  userId?: string | null;
  context?: AuditContext;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Audit Service
 * Handles all audit logging operations
 */
export class AuditService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Log an audit event (best-effort, non-blocking)
   *
   * @param options - Event logging options
   * @returns The created audit log entry, or null if logging failed
   */
  async logEvent(options: LogEventOptions): Promise<AuditLogEntry | null> {
    try {
      const {
        orgId,
        eventType,
        actorType = 'user',
        userId = null,
        context = {},
        ipAddress = null,
        userAgent = null,
      } = options;

      // Get default severity from event metadata if not provided
      const severity = options.severity ?? AUDIT_EVENT_METADATA[eventType]?.defaultSeverity ?? 'info';

      const record = {
        org_id: orgId,
        user_id: userId,
        actor_type: actorType,
        event_type: eventType,
        severity,
        context,
        ip_address: ipAddress,
        user_agent: userAgent,
      };

      const { data, error } = await this.supabase
        .from('audit_log')
        .insert(record)
        .select()
        .single();

      if (error) {
        // Best-effort: log error but don't throw
        logger.warn('Failed to create audit log entry', {
          error: error.message,
          eventType,
          orgId,
        });
        return null;
      }

      logger.debug('Audit event logged', { eventType, orgId, id: data?.id });
      return this.mapRecordToEntry(data);
    } catch (error) {
      // Best-effort: log error but don't throw
      logger.error('Error logging audit event', { error, options });
      return null;
    }
  }

  /**
   * Log an audit event without awaiting (fire-and-forget)
   *
   * Use this when you don't need the result and want minimal latency impact.
   *
   * @param options - Event logging options
   */
  logEventAsync(options: LogEventOptions): void {
    // Fire and forget - don't await
    this.logEvent(options).catch((error) => {
      logger.error('Async audit logging failed', { error, eventType: options.eventType });
    });
  }

  /**
   * Query audit logs with filters and pagination
   *
   * @param orgId - Organization ID
   * @param filters - Query filters
   * @returns Paginated audit log results
   */
  async queryAuditLog(
    orgId: string,
    filters: AuditQueryFilters = {}
  ): Promise<AuditQueryResult> {
    try {
      const {
        eventType,
        severity,
        actorType,
        userId,
        startDate,
        endDate,
        searchTerm,
        limit = 50,
        offset = 0,
        cursor,
      } = filters;

      // Build query
      let query = this.supabase
        .from('audit_log')
        .select('*', { count: 'exact' })
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (eventType) {
        if (Array.isArray(eventType)) {
          query = query.in('event_type', eventType);
        } else {
          query = query.eq('event_type', eventType);
        }
      }

      if (severity) {
        if (Array.isArray(severity)) {
          query = query.in('severity', severity);
        } else {
          query = query.eq('severity', severity);
        }
      }

      if (actorType) {
        if (Array.isArray(actorType)) {
          query = query.in('actor_type', actorType);
        } else {
          query = query.eq('actor_type', actorType);
        }
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      // Cursor-based pagination (more efficient for large datasets)
      if (cursor) {
        query = query.lt('created_at', cursor);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        logger.error('Failed to query audit log', { error, orgId, filters });
        return {
          entries: [],
          total: 0,
          hasMore: false,
        };
      }

      const entries = (data || []).map(this.mapRecordToEntry);

      // Filter by search term in context (post-query for JSONB)
      const filteredEntries = searchTerm
        ? entries.filter((entry) =>
            JSON.stringify(entry.context).toLowerCase().includes(searchTerm.toLowerCase())
          )
        : entries;

      // Determine if there are more results
      const total = count || 0;
      const hasMore = offset + filteredEntries.length < total;

      // Generate next cursor from last entry
      const nextCursor = hasMore && filteredEntries.length > 0
        ? filteredEntries[filteredEntries.length - 1].createdAt
        : undefined;

      return {
        entries: filteredEntries,
        total,
        hasMore,
        nextCursor,
      };
    } catch (error) {
      logger.error('Error querying audit log', { error, orgId, filters });
      return {
        entries: [],
        total: 0,
        hasMore: false,
      };
    }
  }

  /**
   * Get a single audit log entry by ID
   *
   * @param orgId - Organization ID
   * @param id - Audit log entry ID
   * @returns Audit log entry or null
   */
  async getAuditEntry(orgId: string, id: string): Promise<AuditLogEntry | null> {
    try {
      const { data, error } = await this.supabase
        .from('audit_log')
        .select('*')
        .eq('org_id', orgId)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        logger.error('Failed to get audit entry', { error, orgId, id });
        return null;
      }

      return this.mapRecordToEntry(data);
    } catch (error) {
      logger.error('Error getting audit entry', { error, orgId, id });
      return null;
    }
  }

  /**
   * Get audit log statistics for an organization
   *
   * @param orgId - Organization ID
   * @param days - Number of days to look back (default 30)
   * @returns Statistics object
   */
  async getAuditStats(
    orgId: string,
    days: number = 30
  ): Promise<{
    totalEvents: number;
    bySeverity: Record<AuditSeverity, number>;
    byCategory: Record<string, number>;
    recentCritical: AuditLogEntry[];
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get all events in range
      const { data, error } = await this.supabase
        .from('audit_log')
        .select('*')
        .eq('org_id', orgId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to get audit stats', { error, orgId });
        return {
          totalEvents: 0,
          bySeverity: { info: 0, warning: 0, error: 0, critical: 0 },
          byCategory: {},
          recentCritical: [],
        };
      }

      const entries = (data || []).map(this.mapRecordToEntry);

      // Calculate stats
      const bySeverity: Record<AuditSeverity, number> = {
        info: 0,
        warning: 0,
        error: 0,
        critical: 0,
      };

      const byCategory: Record<string, number> = {};

      for (const entry of entries) {
        bySeverity[entry.severity]++;

        const category = entry.eventType.split('.')[0];
        byCategory[category] = (byCategory[category] || 0) + 1;
      }

      // Get recent critical events
      const recentCritical = entries
        .filter((e) => e.severity === 'critical')
        .slice(0, 5);

      return {
        totalEvents: entries.length,
        bySeverity,
        byCategory,
        recentCritical,
      };
    } catch (error) {
      logger.error('Error getting audit stats', { error, orgId });
      return {
        totalEvents: 0,
        bySeverity: { info: 0, warning: 0, error: 0, critical: 0 },
        byCategory: {},
        recentCritical: [],
      };
    }
  }

  /**
   * Get all event type metadata
   *
   * @param category - Optional category filter
   * @returns Array of event type metadata
   */
  getEventTypes(category?: string): AuditEventTypeMetadata[] {
    const types = category
      ? getEventsByCategory(category)
      : (Object.keys(AUDIT_EVENT_METADATA) as AuditEventType[]);

    return types.map((type) => getEventMetadata(type));
  }

  /**
   * Get all event categories
   *
   * @returns Array of category names
   */
  getEventCategories(): string[] {
    return getEventCategories();
  }

  /**
   * Map database record to entry type
   */
  private mapRecordToEntry(record: AuditLogRecord): AuditLogEntry {
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
}

/**
 * Helper function to create audit context with request info
 */
export function createAuditContext(
  baseContext: AuditContext,
  request?: {
    ip?: string;
    userAgent?: string;
    method?: string;
    path?: string;
  }
): AuditContext {
  const context = { ...baseContext };

  if (request) {
    if (request.method || request.path) {
      context.request = {
        method: request.method,
        path: request.path,
      };
    }
  }

  return context;
}

/**
 * Singleton instance for use across the application
 */
let auditServiceInstance: AuditService | null = null;

/**
 * Initialize the audit service singleton
 */
export function initAuditService(supabase: SupabaseClient): AuditService {
  auditServiceInstance = new AuditService(supabase);
  return auditServiceInstance;
}

/**
 * Get the audit service singleton (throws if not initialized)
 */
export function getAuditService(): AuditService {
  if (!auditServiceInstance) {
    throw new Error('AuditService not initialized. Call initAuditService() first.');
  }
  return auditServiceInstance;
}

/**
 * Create a scoped audit logger for a specific service
 *
 * This provides a convenient way to log events from a service
 * without needing to pass orgId and userId every time.
 */
export function createScopedAuditLogger(
  service: AuditService,
  scope: {
    orgId: string;
    userId?: string | null;
    actorType?: ActorType;
    ipAddress?: string | null;
    userAgent?: string | null;
  }
) {
  return {
    /**
     * Log an event with the scoped context
     */
    log: (
      eventType: AuditEventType,
      context?: AuditContext,
      overrides?: Partial<LogEventOptions>
    ) => {
      return service.logEvent({
        orgId: scope.orgId,
        userId: scope.userId,
        actorType: scope.actorType ?? 'user',
        ipAddress: scope.ipAddress,
        userAgent: scope.userAgent,
        eventType,
        context,
        ...overrides,
      });
    },

    /**
     * Log an event asynchronously (fire-and-forget)
     */
    logAsync: (
      eventType: AuditEventType,
      context?: AuditContext,
      overrides?: Partial<LogEventOptions>
    ) => {
      service.logEventAsync({
        orgId: scope.orgId,
        userId: scope.userId,
        actorType: scope.actorType ?? 'user',
        ipAddress: scope.ipAddress,
        userAgent: scope.userAgent,
        eventType,
        context,
        ...overrides,
      });
    },

    /**
     * Log an info event
     */
    info: (eventType: AuditEventType, context?: AuditContext) => {
      service.logEventAsync({
        orgId: scope.orgId,
        userId: scope.userId,
        actorType: scope.actorType ?? 'user',
        ipAddress: scope.ipAddress,
        userAgent: scope.userAgent,
        eventType,
        context,
        severity: 'info',
      });
    },

    /**
     * Log a warning event
     */
    warn: (eventType: AuditEventType, context?: AuditContext) => {
      service.logEventAsync({
        orgId: scope.orgId,
        userId: scope.userId,
        actorType: scope.actorType ?? 'user',
        ipAddress: scope.ipAddress,
        userAgent: scope.userAgent,
        eventType,
        context,
        severity: 'warning',
      });
    },

    /**
     * Log an error event
     */
    error: (eventType: AuditEventType, context?: AuditContext) => {
      service.logEventAsync({
        orgId: scope.orgId,
        userId: scope.userId,
        actorType: scope.actorType ?? 'user',
        ipAddress: scope.ipAddress,
        userAgent: scope.userAgent,
        eventType,
        context,
        severity: 'error',
      });
    },

    /**
     * Log a critical event
     */
    critical: (eventType: AuditEventType, context?: AuditContext) => {
      return service.logEvent({
        orgId: scope.orgId,
        userId: scope.userId,
        actorType: scope.actorType ?? 'user',
        ipAddress: scope.ipAddress,
        userAgent: scope.userAgent,
        eventType,
        context,
        severity: 'critical',
      });
    },
  };
}
