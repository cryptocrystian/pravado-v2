/**
 * Executive Board Report Service Tests (Sprint S63)
 * Board Reporting & Quarterly Executive Pack Generator V1
 *
 * Tests for:
 * - Report CRUD operations
 * - Section management
 * - Audience management
 * - Generation workflow
 * - Approval and publishing
 * - Statistics
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createExecutiveBoardReportService } from '../src/services/executiveBoardReportService';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
function createMockSupabaseClient() {
  const mockData: Record<string, unknown[]> = {
    exec_board_reports: [],
    exec_board_report_sections: [],
    exec_board_report_audience: [],
    exec_board_report_sources: [],
    exec_board_report_audit_log: [],
  };

  const createChainMock = (tableName: string) => {
    return {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockImplementation((data) => {
        const newRecord = Array.isArray(data) ? data[0] : data;
        const record = {
          id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...newRecord,
        };
        mockData[tableName].push(record);
        return {
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: record, error: null }),
          }),
        };
      }),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockData[tableName][0] || null, error: null }),
    };
  };

  return {
    from: vi.fn((tableName: string) => createChainMock(tableName)),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test/path' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test' } }),
      }),
    },
  } as unknown as SupabaseClient;
}

describe('ExecutiveBoardReportService', () => {
  let service: ReturnType<typeof createExecutiveBoardReportService>;
  let mockSupabase: SupabaseClient;

  const testOrgId = 'test-org-123';
  const testUserId = 'test-user-456';

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = createExecutiveBoardReportService({
      supabase: mockSupabase,
      openaiApiKey: 'test-api-key',
      storageBucket: 'test-bucket',
      debugMode: true,
    });
  });

  describe('createReport', () => {
    it('should create a new report with default values', async () => {
      const input = {
        title: 'Q1 2025 Board Report',
        format: 'quarterly' as const,
        periodStart: '2025-01-01',
        periodEnd: '2025-03-31',
      };

      const result = await service.createReport(testOrgId, testUserId, input);

      expect(result).toBeDefined();
      expect(result.title).toBe(input.title);
      expect(result.format).toBe('quarterly');
      expect(result.status).toBe('draft');
      expect(mockSupabase.from).toHaveBeenCalledWith('exec_board_reports');
    });

    it('should create a report with custom section types', async () => {
      const input = {
        title: 'Custom Report',
        format: 'board_meeting' as const,
        periodStart: '2025-01-01',
        periodEnd: '2025-03-31',
        sectionTypes: ['executive_summary', 'kpi_dashboard', 'action_items'] as const,
      };

      const result = await service.createReport(testOrgId, testUserId, input);

      expect(result).toBeDefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('exec_board_report_sections');
    });
  });

  describe('getReport', () => {
    it('should return null for non-existent report', async () => {
      const mockFrom = mockSupabase.from as ReturnType<typeof vi.fn>;
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      const result = await service.getReport(testOrgId, 'non-existent-id');

      expect(result).toBeNull();
    });

    it('should return report with sections and audience', async () => {
      const mockReport = {
        id: 'test-report-123',
        org_id: testOrgId,
        title: 'Test Report',
        format: 'quarterly',
        status: 'draft',
        period_start: '2025-01-01',
        period_end: '2025-03-31',
        section_types: ['executive_summary'],
        template_config: {},
        llm_model: 'gpt-4o',
        tone: 'professional',
        target_length: 'comprehensive',
        total_tokens_used: 0,
        is_archived: false,
        data_sources_used: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockFrom = mockSupabase.from as ReturnType<typeof vi.fn>;
      mockFrom.mockImplementation((tableName: string) => {
        if (tableName === 'exec_board_reports') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockReport, error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const result = await service.getReport(testOrgId, 'test-report-123');

      expect(result).toBeDefined();
      expect(result?.report.id).toBe('test-report-123');
    });
  });

  describe('updateReport', () => {
    it('should update report fields', async () => {
      const mockReport = {
        id: 'test-report-123',
        org_id: testOrgId,
        title: 'Updated Report',
        format: 'quarterly',
        status: 'draft',
        period_start: '2025-01-01',
        period_end: '2025-03-31',
        section_types: ['executive_summary'],
        template_config: {},
        llm_model: 'gpt-4o',
        tone: 'professional',
        target_length: 'comprehensive',
        total_tokens_used: 0,
        is_archived: false,
        data_sources_used: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockFrom = mockSupabase.from as ReturnType<typeof vi.fn>;
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockReport, error: null }),
      });

      const result = await service.updateReport(testOrgId, 'test-report-123', testUserId, {
        title: 'Updated Report',
      });

      expect(result).toBeDefined();
      expect(result?.title).toBe('Updated Report');
    });

    it('should archive report when isArchived is true', async () => {
      const mockReport = {
        id: 'test-report-123',
        org_id: testOrgId,
        title: 'Archived Report',
        is_archived: true,
        archived_at: new Date().toISOString(),
        archived_by: testUserId,
      };

      const mockFrom = mockSupabase.from as ReturnType<typeof vi.fn>;
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockReport, error: null }),
      });

      const result = await service.updateReport(testOrgId, 'test-report-123', testUserId, {
        isArchived: true,
      });

      expect(result?.isArchived).toBe(true);
    });
  });

  describe('deleteReport', () => {
    it('should soft delete (archive) by default', async () => {
      const mockFrom = mockSupabase.from as ReturnType<typeof vi.fn>;
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { is_archived: true }, error: null }),
      });

      const result = await service.deleteReport(testOrgId, 'test-report-123', testUserId, false);

      expect(result.archived).toBe(true);
      expect(result.deleted).toBe(false);
    });

    it('should hard delete when specified', async () => {
      const mockFrom = mockSupabase.from as ReturnType<typeof vi.fn>;
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const result = await service.deleteReport(testOrgId, 'test-report-123', testUserId, true);

      expect(result.deleted).toBe(true);
      expect(result.archived).toBe(false);
    });
  });

  describe('addAudienceMember', () => {
    it('should add a new audience member', async () => {
      const mockMember = {
        id: 'test-member-123',
        report_id: 'test-report-123',
        org_id: testOrgId,
        email: 'ceo@company.com',
        name: 'John CEO',
        role: 'CEO',
        access_level: 'approve',
        is_active: true,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockFrom = mockSupabase.from as ReturnType<typeof vi.fn>;
      mockFrom.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMember, error: null }),
      });

      const result = await service.addAudienceMember(testOrgId, 'test-report-123', testUserId, {
        email: 'ceo@company.com',
        name: 'John CEO',
        role: 'CEO',
        accessLevel: 'approve',
      });

      expect(result).toBeDefined();
      expect(result.email).toBe('ceo@company.com');
      expect(result.accessLevel).toBe('approve');
    });
  });

  describe('updateAudienceMember', () => {
    it('should update audience member fields', async () => {
      const mockMember = {
        id: 'test-member-123',
        report_id: 'test-report-123',
        org_id: testOrgId,
        email: 'ceo@company.com',
        name: 'Updated Name',
        role: 'Chairman',
        access_level: 'approve',
        is_active: true,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockFrom = mockSupabase.from as ReturnType<typeof vi.fn>;
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMember, error: null }),
      });

      const result = await service.updateAudienceMember(
        testOrgId,
        'test-report-123',
        'test-member-123',
        testUserId,
        { name: 'Updated Name', role: 'Chairman' }
      );

      expect(result?.name).toBe('Updated Name');
      expect(result?.role).toBe('Chairman');
    });
  });

  describe('removeAudienceMember', () => {
    it('should remove audience member', async () => {
      const mockFrom = mockSupabase.from as ReturnType<typeof vi.fn>;
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      await expect(
        service.removeAudienceMember(testOrgId, 'test-report-123', 'test-member-123', testUserId)
      ).resolves.not.toThrow();

      expect(mockSupabase.from).toHaveBeenCalledWith('exec_board_report_audience');
    });
  });

  describe('getReportStats', () => {
    it('should return statistics for organization', async () => {
      const mockFrom = mockSupabase.from as ReturnType<typeof vi.fn>;
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      });

      const result = await service.getReportStats(testOrgId);

      expect(result).toBeDefined();
      expect(typeof result.totalReports).toBe('number');
      expect(typeof result.draftReports).toBe('number');
      expect(typeof result.publishedReports).toBe('number');
    });
  });

  describe('listReports', () => {
    it('should list reports with pagination', async () => {
      const mockReports = [
        {
          id: 'report-1',
          org_id: testOrgId,
          title: 'Report 1',
          format: 'quarterly',
          status: 'draft',
          period_start: '2025-01-01',
          period_end: '2025-03-31',
          section_types: [],
          template_config: {},
          llm_model: 'gpt-4o',
          tone: 'professional',
          target_length: 'comprehensive',
          total_tokens_used: 0,
          is_archived: false,
          data_sources_used: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockFrom = mockSupabase.from as ReturnType<typeof vi.fn>;
      mockFrom.mockImplementation((tableName: string) => {
        if (tableName === 'exec_board_reports') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({ data: mockReports, error: null, count: 1 }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
        };
      });

      const result = await service.listReports(testOrgId, { limit: 10, offset: 0 });

      expect(result.reports).toBeDefined();
      expect(result.total).toBe(1);
    });

    it('should filter reports by format', async () => {
      const mockFrom = mockSupabase.from as ReturnType<typeof vi.fn>;
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      });

      await service.listReports(testOrgId, { format: 'quarterly' });

      expect(mockSupabase.from).toHaveBeenCalledWith('exec_board_reports');
    });
  });

  describe('getDigestsForScheduledDelivery', () => {
    // Note: This method exists in S62 but is not implemented in S63 board reports
    // Board reports use manual generation and publishing rather than scheduled delivery
  });
});
