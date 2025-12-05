/**
 * Audit Service Tests (Sprint S35)
 * Comprehensive tests for AuditService functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
};

// Create mock query builder
function createMockQueryBuilder(data: any, error: any = null, count: number | null = null) {
  return {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    then: (resolve: any) => Promise.resolve({ data, error, count }).then(resolve),
  };
}

// Mock dependencies
vi.mock('@pravado/utils', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Import after mocking
import { AuditService, createScopedAuditLogger } from '../src/services/auditService';
import type { AuditLogRecord } from '@pravado/types';

describe('Audit Service (S35)', () => {
  let auditService: AuditService;

  beforeEach(() => {
    vi.clearAllMocks();
    auditService = new AuditService(mockSupabase as any);
  });

  describe('logEvent()', () => {
    it('should successfully log an audit event', async () => {
      const mockRecord: AuditLogRecord = {
        id: 'test-uuid-123',
        org_id: 'org-uuid-456',
        user_id: 'user-uuid-789',
        actor_type: 'user',
        event_type: 'auth.login',
        severity: 'info',
        context: { method: 'password' },
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        created_at: '2024-01-15T10:00:00Z',
      };

      const mockBuilder = createMockQueryBuilder(mockRecord);
      mockSupabase.from.mockReturnValue(mockBuilder);

      const result = await auditService.logEvent({
        orgId: 'org-uuid-456',
        eventType: 'auth.login',
        userId: 'user-uuid-789',
        context: { method: 'password' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('audit_log');
      expect(mockBuilder.insert).toHaveBeenCalled();
      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-uuid-123');
      expect(result?.eventType).toBe('auth.login');
    });

    it('should use default severity from event metadata', async () => {
      const mockRecord: AuditLogRecord = {
        id: 'test-uuid-123',
        org_id: 'org-uuid-456',
        user_id: null,
        actor_type: 'system',
        event_type: 'billing.payment_failed',
        severity: 'error', // default from metadata
        context: {},
        ip_address: null,
        user_agent: null,
        created_at: '2024-01-15T10:00:00Z',
      };

      const mockBuilder = createMockQueryBuilder(mockRecord);
      mockSupabase.from.mockReturnValue(mockBuilder);

      const result = await auditService.logEvent({
        orgId: 'org-uuid-456',
        eventType: 'billing.payment_failed',
        actorType: 'system',
      });

      expect(result?.severity).toBe('error');
    });

    it('should return null on database error (best-effort)', async () => {
      const mockBuilder = createMockQueryBuilder(null, { message: 'DB error' });
      mockSupabase.from.mockReturnValue(mockBuilder);

      const result = await auditService.logEvent({
        orgId: 'org-uuid-456',
        eventType: 'auth.login',
      });

      // Should not throw, just return null
      expect(result).toBeNull();
    });

    it('should handle exceptions gracefully', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const result = await auditService.logEvent({
        orgId: 'org-uuid-456',
        eventType: 'auth.login',
      });

      // Should not throw, just return null
      expect(result).toBeNull();
    });
  });

  describe('logEventAsync()', () => {
    it('should fire and forget without waiting', () => {
      const mockBuilder = createMockQueryBuilder({ id: 'test' });
      mockSupabase.from.mockReturnValue(mockBuilder);

      // Should not throw and should not need await
      auditService.logEventAsync({
        orgId: 'org-uuid-456',
        eventType: 'auth.login',
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('audit_log');
    });
  });

  describe('queryAuditLog()', () => {
    it('should query audit logs with basic filters', async () => {
      const mockEntries: AuditLogRecord[] = [
        {
          id: 'entry-1',
          org_id: 'org-uuid',
          user_id: 'user-1',
          actor_type: 'user',
          event_type: 'auth.login',
          severity: 'info',
          context: {},
          ip_address: null,
          user_agent: null,
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 'entry-2',
          org_id: 'org-uuid',
          user_id: 'user-2',
          actor_type: 'user',
          event_type: 'auth.logout',
          severity: 'info',
          context: {},
          ip_address: null,
          user_agent: null,
          created_at: '2024-01-15T09:00:00Z',
        },
      ];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: (resolve: any) => Promise.resolve({ data: mockEntries, error: null, count: 2 }).then(resolve),
      };
      mockSupabase.from.mockReturnValue(mockBuilder);

      const result = await auditService.queryAuditLog('org-uuid', {
        limit: 50,
        offset: 0,
      });

      expect(result.entries).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.entries[0].id).toBe('entry-1');
    });

    it('should filter by event type', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: (resolve: any) => Promise.resolve({ data: [], error: null, count: 0 }).then(resolve),
      };
      mockSupabase.from.mockReturnValue(mockBuilder);

      await auditService.queryAuditLog('org-uuid', {
        eventType: 'auth.login',
      });

      expect(mockBuilder.eq).toHaveBeenCalledWith('event_type', 'auth.login');
    });

    it('should filter by multiple event types', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: (resolve: any) => Promise.resolve({ data: [], error: null, count: 0 }).then(resolve),
      };
      mockSupabase.from.mockReturnValue(mockBuilder);

      await auditService.queryAuditLog('org-uuid', {
        eventType: ['auth.login', 'auth.logout'],
      });

      expect(mockBuilder.in).toHaveBeenCalledWith('event_type', ['auth.login', 'auth.logout']);
    });

    it('should filter by severity', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: (resolve: any) => Promise.resolve({ data: [], error: null, count: 0 }).then(resolve),
      };
      mockSupabase.from.mockReturnValue(mockBuilder);

      await auditService.queryAuditLog('org-uuid', {
        severity: ['error', 'critical'],
      });

      expect(mockBuilder.in).toHaveBeenCalledWith('severity', ['error', 'critical']);
    });

    it('should filter by date range', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: (resolve: any) => Promise.resolve({ data: [], error: null, count: 0 }).then(resolve),
      };
      mockSupabase.from.mockReturnValue(mockBuilder);

      await auditService.queryAuditLog('org-uuid', {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      });

      expect(mockBuilder.gte).toHaveBeenCalledWith('created_at', '2024-01-01T00:00:00Z');
      expect(mockBuilder.lte).toHaveBeenCalledWith('created_at', '2024-01-31T23:59:59Z');
    });

    it('should support cursor-based pagination', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: (resolve: any) => Promise.resolve({ data: [], error: null, count: 0 }).then(resolve),
      };
      mockSupabase.from.mockReturnValue(mockBuilder);

      await auditService.queryAuditLog('org-uuid', {
        cursor: '2024-01-15T10:00:00Z',
      });

      expect(mockBuilder.lt).toHaveBeenCalledWith('created_at', '2024-01-15T10:00:00Z');
    });

    it('should filter by search term in context', async () => {
      const mockEntries: AuditLogRecord[] = [
        {
          id: 'entry-1',
          org_id: 'org-uuid',
          user_id: null,
          actor_type: 'system',
          event_type: 'billing.payment_succeeded',
          severity: 'info',
          context: { customerId: 'cus_123', amount: 9900 },
          ip_address: null,
          user_agent: null,
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 'entry-2',
          org_id: 'org-uuid',
          user_id: null,
          actor_type: 'system',
          event_type: 'billing.payment_failed',
          severity: 'error',
          context: { customerId: 'cus_456', error: 'insufficient_funds' },
          ip_address: null,
          user_agent: null,
          created_at: '2024-01-15T09:00:00Z',
        },
      ];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: (resolve: any) => Promise.resolve({ data: mockEntries, error: null, count: 2 }).then(resolve),
      };
      mockSupabase.from.mockReturnValue(mockBuilder);

      const result = await auditService.queryAuditLog('org-uuid', {
        searchTerm: 'cus_123',
      });

      // Should filter in-memory
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].id).toBe('entry-1');
    });
  });

  describe('getAuditEntry()', () => {
    it('should get a single audit entry by ID', async () => {
      const mockRecord: AuditLogRecord = {
        id: 'test-uuid-123',
        org_id: 'org-uuid',
        user_id: 'user-uuid',
        actor_type: 'user',
        event_type: 'auth.login',
        severity: 'info',
        context: { method: 'oauth' },
        ip_address: '10.0.0.1',
        user_agent: 'Chrome',
        created_at: '2024-01-15T10:00:00Z',
      };

      const mockBuilder = createMockQueryBuilder(mockRecord);
      mockSupabase.from.mockReturnValue(mockBuilder);

      const result = await auditService.getAuditEntry('org-uuid', 'test-uuid-123');

      expect(mockBuilder.eq).toHaveBeenCalledWith('org_id', 'org-uuid');
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'test-uuid-123');
      expect(result?.id).toBe('test-uuid-123');
      expect(result?.eventType).toBe('auth.login');
    });

    it('should return null for non-existent entry', async () => {
      const mockBuilder = createMockQueryBuilder(null, { code: 'PGRST116', message: 'Not found' });
      mockSupabase.from.mockReturnValue(mockBuilder);

      const result = await auditService.getAuditEntry('org-uuid', 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getAuditStats()', () => {
    it('should calculate audit statistics', async () => {
      const mockEntries: AuditLogRecord[] = [
        {
          id: '1',
          org_id: 'org',
          user_id: null,
          actor_type: 'user',
          event_type: 'auth.login',
          severity: 'info',
          context: {},
          ip_address: null,
          user_agent: null,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          org_id: 'org',
          user_id: null,
          actor_type: 'system',
          event_type: 'billing.payment_failed',
          severity: 'error',
          context: {},
          ip_address: null,
          user_agent: null,
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          org_id: 'org',
          user_id: null,
          actor_type: 'user',
          event_type: 'billing.plan_change',
          severity: 'warning',
          context: {},
          ip_address: null,
          user_agent: null,
          created_at: new Date().toISOString(),
        },
        {
          id: '4',
          org_id: 'org',
          user_id: null,
          actor_type: 'user',
          event_type: 'admin.user_impersonation',
          severity: 'critical',
          context: {},
          ip_address: null,
          user_agent: null,
          created_at: new Date().toISOString(),
        },
      ];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: (resolve: any) => Promise.resolve({ data: mockEntries, error: null }).then(resolve),
      };
      mockSupabase.from.mockReturnValue(mockBuilder);

      const result = await auditService.getAuditStats('org-uuid', 30);

      expect(result.totalEvents).toBe(4);
      expect(result.bySeverity.info).toBe(1);
      expect(result.bySeverity.error).toBe(1);
      expect(result.bySeverity.warning).toBe(1);
      expect(result.bySeverity.critical).toBe(1);
      expect(result.byCategory.auth).toBe(1);
      expect(result.byCategory.billing).toBe(2);
      expect(result.byCategory.admin).toBe(1);
      expect(result.recentCritical).toHaveLength(1);
    });
  });

  describe('getEventTypes()', () => {
    it('should return all event types', () => {
      const types = auditService.getEventTypes();

      expect(types.length).toBeGreaterThan(0);
      expect(types[0]).toHaveProperty('type');
      expect(types[0]).toHaveProperty('category');
      expect(types[0]).toHaveProperty('description');
      expect(types[0]).toHaveProperty('defaultSeverity');
    });

    it('should filter by category', () => {
      const authTypes = auditService.getEventTypes('auth');

      expect(authTypes.length).toBeGreaterThan(0);
      authTypes.forEach((t) => {
        expect(t.category).toBe('auth');
      });
    });
  });

  describe('getEventCategories()', () => {
    it('should return all categories', () => {
      const categories = auditService.getEventCategories();

      expect(categories).toContain('auth');
      expect(categories).toContain('billing');
      expect(categories).toContain('llm');
      expect(categories).toContain('playbook');
    });
  });

  describe('createScopedAuditLogger()', () => {
    it('should create a scoped logger with preset context', async () => {
      const mockBuilder = createMockQueryBuilder({ id: 'test' });
      mockSupabase.from.mockReturnValue(mockBuilder);

      const scopedLogger = createScopedAuditLogger(auditService, {
        orgId: 'org-123',
        userId: 'user-456',
        actorType: 'user',
      });

      await scopedLogger.log('auth.login', { method: 'password' });

      expect(mockSupabase.from).toHaveBeenCalledWith('audit_log');
      expect(mockBuilder.insert).toHaveBeenCalled();
    });

    it('should support async logging', () => {
      const mockBuilder = createMockQueryBuilder({ id: 'test' });
      mockSupabase.from.mockReturnValue(mockBuilder);

      const scopedLogger = createScopedAuditLogger(auditService, {
        orgId: 'org-123',
      });

      // Should not throw
      scopedLogger.logAsync('auth.login');
      expect(mockSupabase.from).toHaveBeenCalled();
    });

    it('should support severity-specific methods', () => {
      const mockBuilder = createMockQueryBuilder({ id: 'test' });
      mockSupabase.from.mockReturnValue(mockBuilder);

      const scopedLogger = createScopedAuditLogger(auditService, {
        orgId: 'org-123',
      });

      scopedLogger.info('auth.login');
      scopedLogger.warn('billing.plan_change');
      scopedLogger.error('llm.call_failure');

      expect(mockSupabase.from).toHaveBeenCalledTimes(3);
    });
  });
});
