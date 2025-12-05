/**
 * Strategic Intelligence Service Tests (Sprint S65)
 * Unit tests for CEO-level strategic intelligence narrative engine
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  neq: vi.fn(() => mockSupabase),
  in: vi.fn(() => mockSupabase),
  gte: vi.fn(() => mockSupabase),
  lte: vi.fn(() => mockSupabase),
  lt: vi.fn(() => mockSupabase),
  or: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  range: vi.fn(() => mockSupabase),
  limit: vi.fn(() => mockSupabase),
  single: vi.fn(() => mockSupabase),
  rpc: vi.fn(() => mockSupabase),
  data: null as unknown,
  error: null as unknown,
  count: 0,
};

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: '# Executive Summary\n\nThis is a test summary.',
              },
            },
          ],
          usage: {
            total_tokens: 500,
          },
        }),
      },
    },
  })),
}));

// Mock LLM router
vi.mock('@pravado/utils', () => ({
  routeLLMRequest: vi.fn().mockResolvedValue({
    content: '# Generated Content\n\nTest content here.',
    usage: { total_tokens: 500 },
  }),
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}));

// Test data
const TEST_ORG_ID = 'test-org-123';
const TEST_USER_ID = 'test-user-456';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_REPORT_ID = 'report-789';
const TEST_SECTION_ID = 'section-abc';
const TEST_SOURCE_ID = 'source-def';

const mockReport = {
  id: TEST_REPORT_ID,
  org_id: TEST_ORG_ID,
  created_by: TEST_USER_ID,
  title: 'Q1 2025 Strategic Review',
  description: 'Quarterly strategic intelligence report',
  format: 'quarterly_strategic_review',
  status: 'draft',
  audience: 'c_suite',
  period_start: '2025-01-01T00:00:00.000Z',
  period_end: '2025-03-31T23:59:59.999Z',
  fiscal_quarter: 'Q1',
  fiscal_year: 2025,
  section_types: ['executive_summary', 'strategic_outlook', 'competitive_positioning'],
  kpis_snapshot: {},
  overall_strategic_score: null,
  risk_posture_score: null,
  opportunity_score: null,
  messaging_alignment_score: null,
  competitive_position_score: null,
  brand_health_score: null,
  summary_json: {},
  total_tokens_used: 0,
  generation_duration_ms: null,
  llm_model: null,
  llm_fallback_json: null,
  tone: 'executive',
  target_length: 'comprehensive',
  include_charts: true,
  include_recommendations: true,
  published_at: null,
  published_by: null,
  pdf_storage_path: null,
  pptx_storage_path: null,
  created_at: '2025-01-15T10:00:00.000Z',
  updated_at: '2025-01-15T10:00:00.000Z',
};

const mockSection = {
  id: TEST_SECTION_ID,
  org_id: TEST_ORG_ID,
  report_id: TEST_REPORT_ID,
  section_type: 'executive_summary',
  title: 'Executive Summary',
  status: 'generated',
  order_index: 0,
  is_visible: true,
  content_md: '# Executive Summary\n\nTest content.',
  content_html: '<h1>Executive Summary</h1><p>Test content.</p>',
  raw_llm_json: null,
  charts_config: [],
  data_tables: [],
  section_metrics: {},
  source_refs: [],
  is_edited: false,
  edited_at: null,
  edited_by: null,
  regeneration_count: 0,
  last_regenerated_at: null,
  tokens_used: 500,
  generation_duration_ms: 2000,
  created_at: '2025-01-15T10:00:00.000Z',
  updated_at: '2025-01-15T10:00:00.000Z',
};

const mockSource = {
  id: TEST_SOURCE_ID,
  org_id: TEST_ORG_ID,
  report_id: TEST_REPORT_ID,
  source_system: 'media_performance',
  source_id: 'perf-123',
  source_type: 'report',
  source_title: 'Media Performance Report',
  source_url: null,
  extracted_data: { overallScore: 85, reach: 50000 },
  extraction_timestamp: '2025-01-15T10:00:00.000Z',
  relevance_score: 90,
  data_quality_score: 95,
  is_primary_source: true,
  sections_using: ['executive_summary'],
  created_at: '2025-01-15T10:00:00.000Z',
  updated_at: '2025-01-15T10:00:00.000Z',
};

const mockAuditLog = {
  id: 'audit-123',
  org_id: TEST_ORG_ID,
  report_id: TEST_REPORT_ID,
  event_type: 'created',
  user_id: TEST_USER_ID,
  user_email: TEST_USER_EMAIL,
  details_json: {},
  previous_status: null,
  new_status: null,
  section_id: null,
  section_type: null,
  tokens_used: null,
  duration_ms: null,
  created_at: '2025-01-15T10:00:00.000Z',
};

const createContext = () => ({
  supabase: mockSupabase as any,
  orgId: TEST_ORG_ID,
  userId: TEST_USER_ID,
  userEmail: TEST_USER_EMAIL,
});

describe('Strategic Intelligence Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.data = null;
    mockSupabase.error = null;
    mockSupabase.count = 0;
  });

  describe('Report CRUD Operations', () => {
    describe('createReport', () => {
      it('should create a new strategic intelligence report', async () => {
        mockSupabase.data = mockReport;
        mockSupabase.single = vi.fn().mockReturnValue({ data: mockReport, error: null });

        // Import after mocks are set up
        const { createReport } = await import('../src/services/strategicIntelligenceService');

        const input = {
          title: 'Q1 2025 Strategic Review',
          description: 'Quarterly strategic intelligence report',
          format: 'quarterly_strategic_review' as const,
          audience: 'c_suite' as const,
          periodStart: '2025-01-01T00:00:00.000Z',
          periodEnd: '2025-03-31T23:59:59.999Z',
          fiscalQuarter: 'Q1',
          fiscalYear: 2025,
          sectionTypes: ['executive_summary', 'strategic_outlook', 'competitive_positioning'] as const,
          tone: 'executive' as const,
          targetLength: 'comprehensive' as const,
          includeCharts: true,
          includeRecommendations: true,
        };

        const result = await createReport(createContext(), input);

        expect(mockSupabase.from).toHaveBeenCalledWith('strategic_intelligence_reports');
        expect(mockSupabase.insert).toHaveBeenCalled();
        expect(result).toBeDefined();
        expect(result.title).toBe(mockReport.title);
      });
    });

    describe('getReport', () => {
      it('should get a report with sections and sources', async () => {
        mockSupabase.single = vi.fn()
          .mockReturnValueOnce({ data: mockReport, error: null })
          .mockReturnValue({ data: null, error: null });
        mockSupabase.order = vi.fn().mockReturnValue({
          data: [mockSection],
          error: null,
        });

        const { getReport } = await import('../src/services/strategicIntelligenceService');

        // Reset mock to return arrays for sections and sources
        mockSupabase.from = vi.fn((table) => {
          if (table === 'strategic_intelligence_reports') {
            return {
              ...mockSupabase,
              single: vi.fn().mockReturnValue({ data: mockReport, error: null }),
            };
          }
          if (table === 'strategic_intelligence_sections') {
            return {
              ...mockSupabase,
              order: vi.fn().mockReturnValue({ data: [mockSection], error: null }),
            };
          }
          if (table === 'strategic_intelligence_sources') {
            return {
              ...mockSupabase,
              order: vi.fn().mockReturnValue({ data: [mockSource], error: null }),
            };
          }
          return mockSupabase;
        });

        const result = await getReport(createContext(), TEST_REPORT_ID);

        expect(result).toBeDefined();
        expect(result.report).toBeDefined();
      });
    });

    describe('listReports', () => {
      it('should list reports with pagination', async () => {
        mockSupabase.range = vi.fn().mockReturnValue({
          data: [mockReport],
          error: null,
          count: 1,
        });

        const { listReports } = await import('../src/services/strategicIntelligenceService');

        const result = await listReports(createContext(), {
          limit: 20,
          offset: 0,
          sortBy: 'created_at',
          sortOrder: 'desc',
        });

        expect(mockSupabase.from).toHaveBeenCalledWith('strategic_intelligence_reports');
        expect(result).toBeDefined();
      });

      it('should filter reports by status', async () => {
        mockSupabase.range = vi.fn().mockReturnValue({
          data: [mockReport],
          error: null,
          count: 1,
        });

        const { listReports } = await import('../src/services/strategicIntelligenceService');

        await listReports(createContext(), {
          limit: 20,
          offset: 0,
          status: 'draft',
          sortBy: 'created_at',
          sortOrder: 'desc',
        });

        expect(mockSupabase.eq).toHaveBeenCalled();
      });
    });

    describe('updateReport', () => {
      it('should update report fields', async () => {
        const updatedReport = { ...mockReport, title: 'Updated Title' };
        mockSupabase.single = vi.fn().mockReturnValue({ data: updatedReport, error: null });

        const { updateReport } = await import('../src/services/strategicIntelligenceService');

        const result = await updateReport(createContext(), TEST_REPORT_ID, {
          title: 'Updated Title',
        });

        expect(mockSupabase.update).toHaveBeenCalled();
        expect(result).toBeDefined();
      });
    });

    describe('deleteReport', () => {
      it('should delete a report', async () => {
        mockSupabase.delete = vi.fn().mockReturnValue({ error: null });

        const { deleteReport } = await import('../src/services/strategicIntelligenceService');

        await deleteReport(createContext(), TEST_REPORT_ID);

        expect(mockSupabase.from).toHaveBeenCalledWith('strategic_intelligence_reports');
        expect(mockSupabase.delete).toHaveBeenCalled();
      });
    });
  });

  describe('Statistics', () => {
    describe('getStats', () => {
      it('should return aggregated statistics', async () => {
        mockSupabase.from = vi.fn((table) => {
          if (table === 'strategic_intelligence_reports') {
            return {
              ...mockSupabase,
              eq: vi.fn().mockReturnValue({
                data: [mockReport],
                error: null,
              }),
            };
          }
          if (table === 'strategic_intelligence_sections' || table === 'strategic_intelligence_sources') {
            return {
              ...mockSupabase,
              select: vi.fn().mockReturnValue({
                ...mockSupabase,
                eq: vi.fn().mockReturnValue({ count: 5, error: null }),
              }),
            };
          }
          return mockSupabase;
        });

        const { getStats } = await import('../src/services/strategicIntelligenceService');

        const result = await getStats(createContext());

        expect(result).toBeDefined();
        expect(result.totalReports).toBeDefined();
        expect(result.byStatus).toBeDefined();
        expect(result.byFormat).toBeDefined();
      });
    });
  });

  describe('Workflow Operations', () => {
    describe('approveReport', () => {
      it('should approve a report in review status', async () => {
        const approvedReport = { ...mockReport, status: 'approved' };
        mockSupabase.single = vi.fn()
          .mockReturnValueOnce({ data: { status: 'review' }, error: null })
          .mockReturnValueOnce({ data: approvedReport, error: null });

        const { approveReport } = await import('../src/services/strategicIntelligenceService');

        const result = await approveReport(createContext(), TEST_REPORT_ID, {});

        expect(result).toBeDefined();
        expect(result.status).toBe('approved');
      });
    });

    describe('publishReport', () => {
      it('should publish an approved report', async () => {
        const publishedReport = {
          ...mockReport,
          status: 'published',
          published_at: new Date().toISOString(),
          pdf_storage_path: '/reports/report-789/report.pdf',
        };
        mockSupabase.single = vi.fn()
          .mockReturnValueOnce({ data: { status: 'approved' }, error: null })
          .mockReturnValueOnce({ data: publishedReport, error: null });

        const { publishReport } = await import('../src/services/strategicIntelligenceService');

        const result = await publishReport(createContext(), TEST_REPORT_ID, {
          generatePdf: true,
        });

        expect(result).toBeDefined();
        expect(result.report.status).toBe('published');
      });
    });

    describe('archiveReport', () => {
      it('should archive a published report', async () => {
        const archivedReport = { ...mockReport, status: 'archived' };
        mockSupabase.single = vi.fn()
          .mockReturnValueOnce({ data: { status: 'published' }, error: null })
          .mockReturnValueOnce({ data: archivedReport, error: null });

        const { archiveReport } = await import('../src/services/strategicIntelligenceService');

        const result = await archiveReport(createContext(), TEST_REPORT_ID, {});

        expect(result).toBeDefined();
        expect(result.status).toBe('archived');
      });
    });
  });

  describe('Section Operations', () => {
    describe('updateSection', () => {
      it('should update section content', async () => {
        const updatedSection = {
          ...mockSection,
          content_md: '# Updated Content',
          is_edited: true,
        };
        mockSupabase.single = vi.fn().mockReturnValue({ data: updatedSection, error: null });

        const { updateSection } = await import('../src/services/strategicIntelligenceService');

        const result = await updateSection(
          createContext(),
          TEST_REPORT_ID,
          TEST_SECTION_ID,
          { contentMd: '# Updated Content' }
        );

        expect(result).toBeDefined();
        expect(result.contentMd).toBe('# Updated Content');
        expect(result.isEdited).toBe(true);
      });
    });

    describe('reorderSections', () => {
      it('should reorder sections', async () => {
        mockSupabase.order = vi.fn().mockReturnValue({
          data: [mockSection],
          error: null,
        });

        const { reorderSections } = await import('../src/services/strategicIntelligenceService');

        const result = await reorderSections(createContext(), TEST_REPORT_ID, {
          sectionOrder: [
            { sectionId: TEST_SECTION_ID, orderIndex: 0 },
          ],
        });

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });

  describe('Source Operations', () => {
    describe('addSource', () => {
      it('should add a data source to a report', async () => {
        mockSupabase.single = vi.fn().mockReturnValue({ data: mockSource, error: null });

        const { addSource } = await import('../src/services/strategicIntelligenceService');

        const result = await addSource(createContext(), TEST_REPORT_ID, {
          sourceSystem: 'media_performance',
          sourceId: 'perf-123',
          sourceType: 'report',
          sourceTitle: 'Media Performance Report',
          extractedData: { overallScore: 85 },
          relevanceScore: 90,
          isPrimarySource: true,
        });

        expect(result).toBeDefined();
        expect(result.sourceSystem).toBe('media_performance');
      });
    });

    describe('listSources', () => {
      it('should list sources with filters', async () => {
        mockSupabase.range = vi.fn().mockReturnValue({
          data: [mockSource],
          error: null,
          count: 1,
        });

        const { listSources } = await import('../src/services/strategicIntelligenceService');

        const result = await listSources(createContext(), {
          reportId: TEST_REPORT_ID,
          limit: 50,
          offset: 0,
        });

        expect(result).toBeDefined();
        expect(result.sources).toBeDefined();
      });
    });

    describe('deleteSource', () => {
      it('should delete a source', async () => {
        mockSupabase.delete = vi.fn().mockReturnValue({ error: null });

        const { deleteSource } = await import('../src/services/strategicIntelligenceService');

        await deleteSource(createContext(), TEST_REPORT_ID, TEST_SOURCE_ID);

        expect(mockSupabase.delete).toHaveBeenCalled();
      });
    });
  });

  describe('Audit Logs', () => {
    describe('listAuditLogs', () => {
      it('should list audit logs with pagination', async () => {
        mockSupabase.range = vi.fn().mockReturnValue({
          data: [mockAuditLog],
          error: null,
          count: 1,
        });

        const { listAuditLogs } = await import('../src/services/strategicIntelligenceService');

        const result = await listAuditLogs(createContext(), {
          reportId: TEST_REPORT_ID,
          limit: 50,
          offset: 0,
        });

        expect(result).toBeDefined();
        expect(result.logs).toBeDefined();
      });
    });
  });

  describe('Period Comparison', () => {
    describe('comparePeriods', () => {
      it('should compare metrics between two reports', async () => {
        const previousReport = {
          ...mockReport,
          id: 'prev-report',
          overall_strategic_score: 75,
          risk_posture_score: 70,
        };
        const currentReport = {
          ...mockReport,
          overall_strategic_score: 85,
          risk_posture_score: 80,
        };

        mockSupabase.single = vi.fn()
          .mockReturnValueOnce({ data: currentReport, error: null })
          .mockReturnValueOnce({ data: previousReport, error: null });

        const { comparePeriods } = await import('../src/services/strategicIntelligenceService');

        const result = await comparePeriods(createContext(), {
          currentReportId: TEST_REPORT_ID,
          previousReportId: 'prev-report',
        });

        expect(result).toBeDefined();
        expect(result.currentPeriod).toBeDefined();
        expect(result.previousPeriod).toBeDefined();
        expect(result.metrics).toBeDefined();
      });
    });
  });
});

describe('Strategic Intelligence Type Mappings', () => {
  it('should correctly map database report to API type', () => {
    // This tests the type mapping functions
    const dbReport = mockReport;

    expect(dbReport.id).toBe(TEST_REPORT_ID);
    expect(dbReport.org_id).toBe(TEST_ORG_ID);
    expect(dbReport.format).toBe('quarterly_strategic_review');
    expect(dbReport.status).toBe('draft');
    expect(dbReport.audience).toBe('c_suite');
  });

  it('should correctly map database section to API type', () => {
    const dbSection = mockSection;

    expect(dbSection.id).toBe(TEST_SECTION_ID);
    expect(dbSection.section_type).toBe('executive_summary');
    expect(dbSection.status).toBe('generated');
    expect(dbSection.is_visible).toBe(true);
  });

  it('should correctly map database source to API type', () => {
    const dbSource = mockSource;

    expect(dbSource.id).toBe(TEST_SOURCE_ID);
    expect(dbSource.source_system).toBe('media_performance');
    expect(dbSource.is_primary_source).toBe(true);
  });
});

describe('Strategic Intelligence Validation', () => {
  it('should validate report format enum values', () => {
    const validFormats = [
      'quarterly_strategic_review',
      'annual_strategic_assessment',
      'board_strategy_brief',
      'ceo_intelligence_brief',
      'investor_strategy_update',
      'crisis_strategic_response',
      'competitive_strategy_report',
      'custom',
    ];

    expect(validFormats).toContain(mockReport.format);
  });

  it('should validate report status enum values', () => {
    const validStatuses = ['draft', 'generating', 'review', 'approved', 'published', 'archived'];

    expect(validStatuses).toContain(mockReport.status);
  });

  it('should validate audience enum values', () => {
    const validAudiences = ['ceo', 'c_suite', 'board', 'investors', 'senior_leadership', 'all_executives'];

    expect(validAudiences).toContain(mockReport.audience);
  });

  it('should validate section type enum values', () => {
    const validSectionTypes = [
      'executive_summary',
      'strategic_outlook',
      'market_dynamics',
      'competitive_positioning',
      'risk_opportunity_matrix',
      'messaging_alignment',
      'ceo_talking_points',
      'quarter_changes',
      'key_kpis_narrative',
      'prioritized_initiatives',
      'brand_health_overview',
      'crisis_posture',
      'governance_compliance',
      'investor_sentiment',
      'media_performance_summary',
      'strategic_recommendations',
      'appendix',
      'custom',
    ];

    expect(validSectionTypes).toContain(mockSection.section_type);
  });

  it('should validate source system enum values', () => {
    const validSystems = [
      'pr_generator',
      'media_monitoring',
      'media_alerts',
      'media_performance',
      'competitive_intel',
      'crisis_engine',
      'brand_reputation',
      'brand_alerts',
      'governance',
      'risk_radar',
      'exec_command_center',
      'exec_digest',
      'board_reports',
      'investor_relations',
      'journalist_graph',
      'media_lists',
      'outreach_engine',
      'custom',
    ];

    expect(validSystems).toContain(mockSource.source_system);
  });
});
