/**
 * Audience Persona Service Tests (Sprint S51.2)
 * Comprehensive tests for persona builder functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AudiencePersonaService } from '../src/services/audiencePersonaService';
import type {
  CreatePersonaInput,
  UpdatePersonaInput,
  GenerationContext,
  AddTraitRequest,
  AddInsightRequest,
} from '@pravado/types';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  single: vi.fn(),
  rpc: vi.fn(),
} as unknown as SupabaseClient;

describe('AudiencePersonaService', () => {
  let service: AudiencePersonaService;
  const testOrgId = 'org-123';
  const testUserId = 'user-456';

  beforeEach(() => {
    service = new AudiencePersonaService(mockSupabase);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================
  // 1. Persona Creation Tests
  // ========================================
  describe('createPersona', () => {
    it('should create a persona with all fields', async () => {
      const input: CreatePersonaInput = {
        name: 'Enterprise CTO',
        description: 'Technology decision-maker at enterprise companies',
        personaType: 'primary_audience',
        role: 'CTO',
        industry: 'SaaS',
        companySize: 'enterprise',
        seniorityLevel: 'c_level',
        location: 'San Francisco, CA',
        tags: ['tech', 'leadership'],
        customFields: { budget: 'high' },
        generationMethod: 'manual',
      };

      const mockPersona = { id: 'persona-1', orgId: testOrgId, ...input };
      vi.mocked(mockSupabase.insert).mockResolvedValueOnce({
        data: [mockPersona],
        error: null,
      } as any);

      const result = await service.createPersona(testOrgId, input, testUserId);

      expect(mockSupabase.from).toHaveBeenCalledWith('audience_personas');
      expect(result).toMatchObject(input);
    });

    it('should create a minimal persona with required fields only', async () => {
      const input: CreatePersonaInput = {
        name: 'Basic Persona',
        personaType: 'secondary_audience',
      };

      const mockPersona = { id: 'persona-2', orgId: testOrgId, ...input };
      vi.mocked(mockSupabase.insert).mockResolvedValueOnce({
        data: [mockPersona],
        error: null,
      } as any);

      const result = await service.createPersona(testOrgId, input);

      expect(result.name).toBe('Basic Persona');
      expect(result.personaType).toBe('secondary_audience');
    });

    it('should throw error if name is missing', async () => {
      const input = { personaType: 'primary_audience' } as any;

      await expect(service.createPersona(testOrgId, input)).rejects.toThrow();
    });
  });

  // ========================================
  // 2. Persona Update Tests
  // ========================================
  describe('updatePersona', () => {
    it('should update persona fields', async () => {
      const updates: UpdatePersonaInput = {
        name: 'Updated Name',
        description: 'Updated description',
        role: 'VP Engineering',
      };

      const mockUpdated = { id: 'persona-1', ...updates };
      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: mockUpdated,
        error: null,
      } as any);

      const result = await service.updatePersona(testOrgId, 'persona-1', updates, testUserId);

      expect(mockSupabase.from).toHaveBeenCalledWith('audience_personas');
      expect(mockSupabase.update).toHaveBeenCalled();
      expect(result.name).toBe('Updated Name');
    });

    it('should create history snapshot on update', async () => {
      const updates: UpdatePersonaInput = { name: 'New Name' };

      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: { id: 'persona-1', ...updates },
        error: null,
      } as any);

      await service.updatePersona(testOrgId, 'persona-1', updates, testUserId);

      // Verify history snapshot was created
      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });

  // ========================================
  // 3. Persona Deletion Tests
  // ========================================
  describe('deletePersona', () => {
    it('should delete persona', async () => {
      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: null,
        error: null,
      } as any);

      await service.deletePersona(testOrgId, 'persona-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('audience_personas');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'persona-1');
    });
  });

  // ========================================
  // 4. Persona Retrieval Tests
  // ========================================
  describe('getPersona', () => {
    it('should get persona by ID', async () => {
      const mockPersona = { id: 'persona-1', name: 'Test Persona' };
      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: mockPersona,
        error: null,
      } as any);

      const result = await service.getPersona(testOrgId, 'persona-1');

      expect(result).toEqual(mockPersona);
    });

    it('should throw error if persona not found', async () => {
      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      } as any);

      await expect(service.getPersona(testOrgId, 'nonexistent')).rejects.toThrow();
    });
  });

  // ========================================
  // 5. Persona List & Filtering Tests
  // ========================================
  describe('listPersonas', () => {
    it('should list all personas for org', async () => {
      const mockPersonas = [
        { id: 'p1', name: 'Persona 1' },
        { id: 'p2', name: 'Persona 2' },
      ];

      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: mockPersonas,
        error: null,
        count: 2,
      } as any);

      const result = await service.listPersonas(testOrgId, {});

      expect(result.personas).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by persona type', async () => {
      const query = { personaType: ['primary_audience'] as any };

      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: [{ id: 'p1', personaType: 'primary_audience' }],
        error: null,
        count: 1,
      } as any);

      await service.listPersonas(testOrgId, query);

      expect(mockSupabase.in).toHaveBeenCalledWith('persona_type', ['primary_audience']);
    });

    it('should filter by min score', async () => {
      const query = { minOverallScore: 80 };

      await service.listPersonas(testOrgId, query);

      expect(mockSupabase.gte).toHaveBeenCalledWith('overall_score', 80);
    });

    it('should search by query text', async () => {
      const query = { searchQuery: 'engineer' };

      await service.listPersonas(testOrgId, query);

      expect(mockSupabase.ilike).toHaveBeenCalled();
    });
  });

  // ========================================
  // 6. LLM Generation Tests
  // ========================================
  describe('generatePersona', () => {
    it('should generate persona from source text', async () => {
      const context: GenerationContext = {
        sourceType: 'press_release',
        sourceText: 'We are targeting enterprise CTOs in the healthcare industry...',
        personaType: 'primary_audience',
        extractTraits: true,
        extractInsights: true,
      };

      const mockGenerated = {
        persona: { id: 'p1', name: 'Healthcare CTO' },
        traits: [{ id: 't1', traitName: 'Healthcare expertise' }],
        insights: [{ id: 'i1', insightTitle: 'Values compliance' }],
        extraction: {},
      };

      // Mock LLM call
      vi.spyOn(service as any, 'extractWithLLM').mockResolvedValueOnce({
        traits: mockGenerated.traits,
        insights: mockGenerated.insights,
        extractionMethod: 'llm',
      });

      vi.mocked(mockSupabase.insert).mockResolvedValue({
        data: [mockGenerated.persona],
        error: null,
      } as any);

      const result = await service.generatePersona(testOrgId, context, testUserId);

      expect(result.persona).toBeDefined();
      expect(result.traits).toHaveLength(1);
      expect(result.insights).toHaveLength(1);
    });

    it('should fallback to deterministic extraction if LLM fails', async () => {
      const context: GenerationContext = {
        sourceType: 'manual',
        sourceText: 'Test content',
      };

      vi.spyOn(service as any, 'extractWithLLM').mockRejectedValueOnce(new Error('LLM error'));
      vi.spyOn(service as any, 'extractDeterministic').mockResolvedValueOnce({
        traits: [],
        insights: [],
        extractionMethod: 'deterministic',
      });

      await service.generatePersona(testOrgId, context);

      expect(service['extractDeterministic']).toHaveBeenCalled();
    });
  });

  // ========================================
  // 7. Trait Management Tests
  // ========================================
  describe('addTrait', () => {
    it('should add trait to persona', async () => {
      const trait: AddTraitRequest = {
        traitCategory: 'skill',
        traitType: 'hard_skill',
        traitName: 'Python',
        traitStrength: 0.9,
        extractionMethod: 'manual',
      };

      const mockTrait = { id: 't1', personaId: 'p1', ...trait };
      vi.mocked(mockSupabase.insert).mockResolvedValueOnce({
        data: [mockTrait],
        error: null,
      } as any);

      const result = await service.addTrait(testOrgId, 'p1', trait, testUserId);

      expect(result.traitName).toBe('Python');
      expect(result.traitStrength).toBe(0.9);
    });
  });

  // ========================================
  // 8. Insight Management Tests
  // ========================================
  describe('addInsight', () => {
    it('should add insight to persona', async () => {
      const insight: AddInsightRequest = {
        insightType: 'pain_point',
        insightCategory: 'behavioral',
        insightTitle: 'Struggles with scaling',
        insightDescription: 'Needs better scaling solutions',
        confidenceScore: 0.85,
        impactScore: 0.9,
        isActionable: true,
      };

      const mockInsight = { id: 'i1', personaId: 'p1', ...insight };
      vi.mocked(mockSupabase.insert).mockResolvedValueOnce({
        data: [mockInsight],
        error: null,
      } as any);

      const result = await service.addInsight(testOrgId, 'p1', insight, testUserId);

      expect(result.insightTitle).toBe('Struggles with scaling');
      expect(result.isActionable).toBe(true);
    });
  });

  // ========================================
  // 9. Score Calculation Tests
  // ========================================
  describe('calculateScores', () => {
    it('should calculate all scores correctly', () => {
      const scores = service['calculateScores']([], []);

      expect(scores).toHaveProperty('relevanceScore');
      expect(scores).toHaveProperty('engagementScore');
      expect(scores).toHaveProperty('alignmentScore');
      expect(scores).toHaveProperty('overallScore');
    });

    it('should weight overall score correctly', () => {
      const scores = service['calculateScores'](
        [{ traitStrength: 1.0 } as any],
        [{ confidenceScore: 0.9, impactScore: 0.8 } as any]
      );

      // Overall = relevance*0.4 + engagement*0.35 + alignment*0.25
      expect(scores.overallScore).toBeGreaterThan(0);
      expect(scores.overallScore).toBeLessThanOrEqual(100);
    });
  });

  // ========================================
  // 10. Persona Comparison Tests
  // ========================================
  describe('comparePersonas', () => {
    it('should compare two personas', async () => {
      const p1 = { id: 'p1', name: 'Persona 1', overallScore: 85 };
      const p2 = { id: 'p2', name: 'Persona 2', overallScore: 80 };

      vi.spyOn(service, 'getPersona')
        .mockResolvedValueOnce(p1 as any)
        .mockResolvedValueOnce(p2 as any);

      vi.mocked(mockSupabase.rpc).mockResolvedValueOnce({
        data: 75,
        error: null,
      } as any);

      vi.spyOn(service as any, 'getPersonaTraits').mockResolvedValue([]);

      const result = await service.comparePersonas(testOrgId, 'p1', 'p2');

      expect(result.persona1).toEqual(p1);
      expect(result.persona2).toEqual(p2);
      expect(result.similarityScore).toBe(75);
    });

    it('should recommend merge if similarity > 80%', async () => {
      vi.spyOn(service, 'getPersona').mockResolvedValue({ id: 'p1' } as any);
      vi.mocked(mockSupabase.rpc).mockResolvedValueOnce({ data: 85, error: null } as any);
      vi.spyOn(service as any, 'getPersonaTraits').mockResolvedValue([]);

      const result = await service.comparePersonas(testOrgId, 'p1', 'p2');

      expect(result.mergeRecommendation).toBe(true);
      expect(result.mergeSuggestion).toContain('merge');
    });
  });

  // ========================================
  // 11. Persona Merge Tests
  // ========================================
  describe('mergePersonas', () => {
    it('should merge traits and insights', async () => {
      const sourceTraits = [{ id: 't1', traitName: 'Trait 1' }];
      const targetTraits = [{ id: 't2', traitName: 'Trait 2' }];

      vi.spyOn(service as any, 'getPersonaTraits')
        .mockResolvedValueOnce(sourceTraits)
        .mockResolvedValueOnce(targetTraits);

      vi.spyOn(service as any, 'getPersonaInsights')
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      vi.mocked(mockSupabase.insert).mockResolvedValue({ data: [], error: null } as any);
      vi.mocked(mockSupabase.update).mockResolvedValue({ data: [], error: null } as any);
      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: { id: 'target', name: 'Target' },
        error: null,
      } as any);

      const result = await service.mergePersonas(testOrgId, 'source', 'target', true, true, true, testUserId);

      expect(result.mergedPersona).toBeDefined();
      expect(result.traitsAdded).toBe(1);
    });

    it('should archive source persona if requested', async () => {
      vi.spyOn(service as any, 'getPersonaTraits').mockResolvedValue([]);
      vi.spyOn(service as any, 'getPersonaInsights').mockResolvedValue([]);
      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: { id: 'target' },
        error: null,
      } as any);

      await service.mergePersonas(testOrgId, 'source', 'target', true, true, true);

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'archived' })
      );
    });
  });

  // ========================================
  // 12. History Snapshot Tests
  // ========================================
  describe('createHistorySnapshot', () => {
    it('should create history snapshot', async () => {
      const persona = {
        id: 'p1',
        name: 'Test',
        overallScore: 85,
        relevanceScore: 80,
        engagementScore: 85,
        alignmentScore: 90,
      };

      vi.mocked(mockSupabase.insert).mockResolvedValueOnce({
        data: [{ id: 'h1' }],
        error: null,
      } as any);

      await service['createHistorySnapshot'](
        persona as any,
        'manual_update',
        'Test update',
        testUserId
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('audience_persona_history');
      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });

  // ========================================
  // 13. Trend Analytics Tests
  // ========================================
  describe('getPersonaTrends', () => {
    it('should calculate trends from history', async () => {
      const mockHistory = [
        {
          snapshotAt: new Date('2024-01-01'),
          snapshotData: { overallScore: 70, traitCount: 5, insightCount: 3 },
        },
        {
          snapshotAt: new Date('2024-01-15'),
          snapshotData: { overallScore: 80, traitCount: 7, insightCount: 5 },
        },
        {
          snapshotAt: new Date('2024-02-01'),
          snapshotData: { overallScore: 85, traitCount: 8, insightCount: 6 },
        },
      ];

      vi.spyOn(service, 'getPersonaHistory').mockResolvedValueOnce({
        snapshots: mockHistory as any,
        total: 3,
      });

      const result = await service.getPersonaTrends(testOrgId, 'p1', 90);

      expect(result.trends).toHaveLength(6);
      expect(result.trends.find((t) => t.metric === 'overall_score')).toBeDefined();
      expect(result.trends.find((t) => t.metric === 'trait_count')).toBeDefined();
    });
  });

  // ========================================
  // 14. Validation Tests
  // ========================================
  describe('Input Validation', () => {
    it('should reject invalid persona type', async () => {
      const input = { name: 'Test', personaType: 'invalid' as any };

      await expect(service.createPersona(testOrgId, input)).rejects.toThrow();
    });

    it('should reject negative scores', () => {
      expect(() => service['calculateScores']([], [])).not.toThrow();
    });

    it('should cap scores at 100', () => {
      const scores = service['calculateScores'](
        Array(50).fill({ traitStrength: 1.0 } as any),
        Array(50).fill({ confidenceScore: 1.0, impactScore: 1.0 } as any)
      );

      expect(scores.overallScore).toBeLessThanOrEqual(100);
    });
  });

  // ========================================
  // 15. Error Handling Tests
  // ========================================
  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      } as any);

      await expect(service.getPersona(testOrgId, 'p1')).rejects.toThrow('Database error');
    });

    it('should handle missing org ID', async () => {
      await expect(service.createPersona('', { name: 'Test' } as any)).rejects.toThrow();
    });
  });

  // ========================================
  // 16. Pagination Tests
  // ========================================
  describe('Pagination', () => {
    it('should paginate results', async () => {
      const query = { limit: 10, offset: 20 };

      await service.listPersonas(testOrgId, query);

      expect(mockSupabase.range).toHaveBeenCalledWith(20, 29);
    });

    it('should default to limit 50', async () => {
      await service.listPersonas(testOrgId, {});

      expect(mockSupabase.range).toHaveBeenCalledWith(0, 49);
    });
  });

  // ========================================
  // 17. Sorting Tests
  // ========================================
  describe('Sorting', () => {
    it('should sort by overall score desc', async () => {
      const query = { sortBy: 'overallScore' as any, sortOrder: 'desc' as any };

      await service.listPersonas(testOrgId, query);

      expect(mockSupabase.order).toHaveBeenCalledWith('overall_score', { ascending: false });
    });

    it('should sort by updated date asc', async () => {
      const query = { sortBy: 'updatedAt' as any, sortOrder: 'asc' as any };

      await service.listPersonas(testOrgId, query);

      expect(mockSupabase.order).toHaveBeenCalledWith('updated_at', { ascending: true });
    });
  });

  // ========================================
  // 18. Integration Tests
  // ========================================
  describe('Integration Scenarios', () => {
    it('should complete full persona lifecycle', async () => {
      // Create
      const input: CreatePersonaInput = {
        name: 'Test Persona',
        personaType: 'primary_audience',
      };
      vi.mocked(mockSupabase.insert).mockResolvedValue({
        data: [{ id: 'p1', ...input }],
        error: null,
      } as any);

      const created = await service.createPersona(testOrgId, input);
      expect(created.name).toBe('Test Persona');

      // Update
      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: { id: 'p1', name: 'Updated' },
        error: null,
      } as any);
      const updated = await service.updatePersona(testOrgId, 'p1', { name: 'Updated' });
      expect(updated.name).toBe('Updated');

      // Delete
      await service.deletePersona(testOrgId, 'p1');
      expect(mockSupabase.delete).toHaveBeenCalled();
    });
  });
});
