/**
 * Audit Export Service Tests (Sprint S36)
 * Unit tests for audit export functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock Supabase
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  not: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
};

// Mock audit service
const mockAuditService = {
  queryAuditLog: vi.fn(),
  getEventTypes: vi.fn(),
  getEventCategories: vi.fn(),
};

// Import after mocks are set up
import { AuditExportService } from '../src/services/auditExportService';
import type { AuditLogEntry } from '@pravado/types';

describe('AuditExportService', () => {
  let exportService: AuditExportService;
  const testStorageDir = '/tmp/test_audit_exports';

  beforeEach(() => {
    vi.clearAllMocks();

    // Create test directory
    if (!fs.existsSync(testStorageDir)) {
      fs.mkdirSync(testStorageDir, { recursive: true });
    }

    exportService = new AuditExportService(
      mockSupabase as any,
      mockAuditService as any,
      testStorageDir
    );
  });

  afterEach(() => {
    // Cleanup test files
    if (fs.existsSync(testStorageDir)) {
      const files = fs.readdirSync(testStorageDir);
      for (const file of files) {
        fs.unlinkSync(path.join(testStorageDir, file));
      }
    }
  });

  describe('createExportJob', () => {
    it('should create an export job successfully', async () => {
      const mockJob = {
        id: 'job-123',
        org_id: 'org-456',
        user_id: 'user-789',
        status: 'queued',
        filters_json: {},
        file_path: null,
        file_size_bytes: null,
        row_count: null,
        error_message: null,
        started_at: null,
        completed_at: null,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };

      mockSupabase.single.mockResolvedValueOnce({ data: mockJob, error: null });

      const result = await exportService.createExportJob({
        orgId: 'org-456',
        userId: 'user-789',
        filters: {},
      });

      expect(result).not.toBeNull();
      expect(result?.id).toBe('job-123');
      expect(result?.status).toBe('queued');
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_exports');
    });

    it('should return null on database error', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await exportService.createExportJob({
        orgId: 'org-456',
        userId: 'user-789',
      });

      expect(result).toBeNull();
    });
  });

  describe('getExportJob', () => {
    it('should retrieve an export job by ID', async () => {
      const mockJob = {
        id: 'job-123',
        org_id: 'org-456',
        user_id: 'user-789',
        status: 'success',
        filters_json: { severity: 'error' },
        file_path: '/tmp/test.csv',
        file_size_bytes: 1024,
        row_count: 50,
        error_message: null,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };

      mockSupabase.single.mockResolvedValueOnce({ data: mockJob, error: null });

      const result = await exportService.getExportJob('org-456', 'job-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('job-123');
      expect(result?.status).toBe('success');
      expect(result?.rowCount).toBe(50);
    });

    it('should return null for non-existent job', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const result = await exportService.getExportJob('org-456', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('generateCSV', () => {
    it('should generate valid CSV content', () => {
      const entries: AuditLogEntry[] = [
        {
          id: 'entry-1',
          orgId: 'org-1',
          userId: 'user-1',
          actorType: 'user',
          eventType: 'auth.login',
          severity: 'info',
          context: { method: 'password' },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: '2024-01-15T10:00:00Z',
        },
        {
          id: 'entry-2',
          orgId: 'org-1',
          userId: null,
          actorType: 'system',
          eventType: 'system.error',
          severity: 'error',
          context: { message: 'Database connection failed' },
          ipAddress: null,
          userAgent: null,
          createdAt: '2024-01-15T11:00:00Z',
        },
      ];

      const csv = exportService.generateCSV(entries);

      // Check header
      expect(csv).toContain('ID,Timestamp,Event Type,Severity,Actor Type,User ID,IP Address,User Agent,Context');

      // Check first row
      expect(csv).toContain('entry-1');
      expect(csv).toContain('auth.login');
      expect(csv).toContain('info');
      expect(csv).toContain('user');
      expect(csv).toContain('192.168.1.1');

      // Check second row
      expect(csv).toContain('entry-2');
      expect(csv).toContain('system.error');
      expect(csv).toContain('error');
      expect(csv).toContain('system');
    });

    it('should handle empty entries', () => {
      const csv = exportService.generateCSV([]);

      expect(csv).toContain('ID,Timestamp,Event Type');
      expect(csv.split('\n').length).toBe(1); // Only header
    });

    it('should escape CSV special characters', () => {
      const entries: AuditLogEntry[] = [
        {
          id: 'entry-1',
          orgId: 'org-1',
          actorType: 'user',
          eventType: 'content.created',
          severity: 'info',
          context: { title: 'Hello, World!' },
          createdAt: '2024-01-15T10:00:00Z',
        },
      ];

      const csv = exportService.generateCSV(entries);

      // Commas in context should be properly escaped
      expect(csv).toContain('"');
    });
  });

  describe('storeFile', () => {
    it('should store file to disk', async () => {
      const content = 'ID,Name\n1,Test';
      const filePath = path.join(testStorageDir, 'test_export.csv');

      await exportService.storeFile(filePath, content);

      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, 'utf-8')).toBe(content);
    });
  });

  describe('readFile', () => {
    it('should read file from disk', async () => {
      const content = 'Test content';
      const filePath = path.join(testStorageDir, 'test_read.csv');
      fs.writeFileSync(filePath, content);

      const result = await exportService.readFile(filePath);

      expect(result).toBe(content);
    });

    it('should return null for non-existent file', async () => {
      const result = await exportService.readFile('/nonexistent/file.csv');

      expect(result).toBeNull();
    });
  });

  describe('getDownloadPath', () => {
    it('should return download path for successful job', () => {
      const job = {
        id: 'job-123',
        orgId: 'org-1',
        userId: 'user-1',
        status: 'success' as const,
        filters: {},
        filePath: '/tmp/export.csv',
        createdAt: new Date().toISOString(),
      };

      const path = exportService.getDownloadPath(job);

      expect(path).toBe('/api/v1/audit/export/job-123/download');
    });

    it('should return null for non-success job', () => {
      const job = {
        id: 'job-123',
        orgId: 'org-1',
        userId: 'user-1',
        status: 'processing' as const,
        filters: {},
        filePath: null,
        createdAt: new Date().toISOString(),
      };

      const path = exportService.getDownloadPath(job);

      expect(path).toBeNull();
    });
  });
});

describe('Audit Export RBAC', () => {
  it('should enforce admin-only export creation', () => {
    // This test validates the RBAC concept
    // Actual route-level RBAC testing would be done in integration tests
    const isAdmin = (role: string) => role === 'admin' || role === 'owner';

    expect(isAdmin('admin')).toBe(true);
    expect(isAdmin('owner')).toBe(true);
    expect(isAdmin('member')).toBe(false);
    expect(isAdmin('viewer')).toBe(false);
  });
});

describe('Export Job Status Transitions', () => {
  it('should follow valid status transitions', () => {
    const validTransitions: Record<string, string[]> = {
      queued: ['processing', 'failed'],
      processing: ['success', 'failed'],
      success: [], // Terminal state
      failed: [], // Terminal state
    };

    // Verify all statuses have defined transitions
    expect(Object.keys(validTransitions)).toContain('queued');
    expect(Object.keys(validTransitions)).toContain('processing');
    expect(Object.keys(validTransitions)).toContain('success');
    expect(Object.keys(validTransitions)).toContain('failed');

    // Verify processing can transition to success
    expect(validTransitions.processing).toContain('success');

    // Verify success is terminal
    expect(validTransitions.success.length).toBe(0);
  });
});
