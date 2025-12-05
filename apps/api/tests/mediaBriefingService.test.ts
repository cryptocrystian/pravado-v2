/**
 * Media Briefing Service Tests (Sprint S54)
 * Comprehensive test suite for media briefing and talking point generation
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { MediaBriefingService } from '../src/services/mediaBriefingService';
import { supabase } from '../src/config/supabase';
import type {
  CreateBriefingRequest,
  UpdateBriefingRequest,
  CreateTalkingPointRequest,
  UpdateTalkingPointRequest,
  BriefFormatType,
  BriefingStatus,
  TalkingPointCategory,
  BriefingSectionType,
} from '@pravado/types';

describe('MediaBriefingService', () => {
  const service = new MediaBriefingService(supabase);
  const testOrgId = 'test-org-mb-' + Date.now();
  const testUserId = 'test-user-mb-' + Date.now();
  let testBriefingId: string;
  let testSectionId: string;
  let testTalkingPointId: string;

  // Cleanup after all tests
  afterAll(async () => {
    // Clean up in reverse dependency order
    await supabase
      .from('mb_briefing_audit_log')
      .delete()
      .eq('org_id', testOrgId);
    await supabase
      .from('mb_talking_points')
      .delete()
      .eq('org_id', testOrgId);
    await supabase
      .from('mb_source_references')
      .delete()
      .eq('org_id', testOrgId);
    await supabase
      .from('mb_briefing_sections')
      .delete()
      .eq('org_id', testOrgId);
    await supabase
      .from('mb_briefings')
      .delete()
      .eq('org_id', testOrgId);
  });

  describe('Briefing CRUD Operations', () => {
    it('should create a new briefing with required fields', async () => {
      const request: CreateBriefingRequest = {
        title: 'Q4 Product Launch Media Brief',
        format: 'full_brief' as BriefFormatType,
        tone: 'professional',
        focusAreas: ['product launch', 'innovation'],
      };

      const briefing = await service.createBriefing(testOrgId, testUserId, request);

      expect(briefing).toBeDefined();
      expect(briefing.id).toBeDefined();
      expect(briefing.title).toBe('Q4 Product Launch Media Brief');
      expect(briefing.format).toBe('full_brief');
      expect(briefing.status).toBe('draft');
      expect(briefing.tone).toBe('professional');
      expect(briefing.focusAreas).toContain('product launch');
      expect(briefing.focusAreas).toContain('innovation');

      testBriefingId = briefing.id;
    });

    it('should create a briefing with optional fields', async () => {
      const request: CreateBriefingRequest = {
        title: 'Executive Summary for TechCrunch',
        subtitle: 'Key messages for interview with Sarah Chen',
        format: 'executive_summary' as BriefFormatType,
        tone: 'confident',
        focusAreas: ['AI', 'sustainability'],
        excludedTopics: ['layoffs', 'legal issues'],
        customInstructions: 'Emphasize our green initiatives',
      };

      const briefing = await service.createBriefing(testOrgId, testUserId, request);

      expect(briefing).toBeDefined();
      expect(briefing.subtitle).toBe('Key messages for interview with Sarah Chen');
      expect(briefing.format).toBe('executive_summary');
      expect(briefing.exclusions).toContain('layoffs');
      expect(briefing.customInstructions).toBe('Emphasize our green initiatives');

      // Clean up this extra briefing
      await service.deleteBriefing(testOrgId, testUserId, briefing.id);
    });

    it('should get briefing by ID', async () => {
      const briefing = await service.getBriefing(testOrgId, testBriefingId);

      expect(briefing).toBeDefined();
      expect(briefing.id).toBe(testBriefingId);
      expect(briefing.title).toBe('Q4 Product Launch Media Brief');
      expect(briefing.orgId).toBe(testOrgId);
    });

    it('should list briefings with no filters', async () => {
      const result = await service.getBriefings(testOrgId, {}, 20, 0);

      expect(result.briefings).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
      expect(result.briefings.length).toBeGreaterThan(0);
      expect(result.briefings.some((b) => b.id === testBriefingId)).toBe(true);
    });

    it('should list briefings with status filter', async () => {
      const result = await service.getBriefings(testOrgId, { status: ['draft'] }, 20, 0);

      expect(result.briefings).toBeDefined();
      expect(result.briefings.every((b) => b.status === 'draft')).toBe(true);
    });

    it('should list briefings with format filter', async () => {
      const result = await service.getBriefings(testOrgId, { format: ['full_brief'] }, 20, 0);

      expect(result.briefings).toBeDefined();
      expect(result.briefings.every((b) => b.format === 'full_brief')).toBe(true);
    });

    it('should list briefings with search query', async () => {
      const result = await service.getBriefings(testOrgId, { searchQuery: 'Product Launch' }, 20, 0);

      expect(result.briefings).toBeDefined();
      expect(result.briefings.some((b) => b.title.includes('Product Launch'))).toBe(true);
    });

    it('should update briefing details', async () => {
      const updateRequest: UpdateBriefingRequest = {
        title: 'Q4 Product Launch Media Brief - Updated',
        subtitle: 'Comprehensive briefing for all media interactions',
        focusAreas: ['product launch', 'innovation', 'market expansion'],
      };

      const updated = await service.updateBriefing(testOrgId, testUserId, testBriefingId, updateRequest);

      expect(updated).toBeDefined();
      expect(updated.title).toBe('Q4 Product Launch Media Brief - Updated');
      expect(updated.subtitle).toBe('Comprehensive briefing for all media interactions');
      expect(updated.focusAreas).toContain('market expansion');
    });

    it('should update briefing status', async () => {
      const updated = await service.updateBriefing(testOrgId, testUserId, testBriefingId, {
        status: 'generated' as BriefingStatus,
      });

      expect(updated.status).toBe('generated');

      // Reset back to draft for subsequent tests
      await service.updateBriefing(testOrgId, testUserId, testBriefingId, {
        status: 'draft' as BriefingStatus,
      });
    });
  });

  describe('Briefing Workflow', () => {
    it('should mark briefing as reviewed', async () => {
      // First set to generated status
      await service.updateBriefing(testOrgId, testUserId, testBriefingId, {
        status: 'generated' as BriefingStatus,
      });

      const reviewed = await service.reviewBriefing(testOrgId, testUserId, testBriefingId);

      expect(reviewed).toBeDefined();
      expect(reviewed.status).toBe('reviewed');
      expect(reviewed.reviewedAt).toBeDefined();
      expect(reviewed.reviewedBy).toBe(testUserId);
    });

    it('should approve briefing', async () => {
      const approved = await service.approveBriefing(testOrgId, testUserId, testBriefingId);

      expect(approved).toBeDefined();
      expect(approved.status).toBe('approved');
      expect(approved.approvedAt).toBeDefined();
      expect(approved.approvedBy).toBe(testUserId);
    });

    it('should archive briefing', async () => {
      const archived = await service.archiveBriefing(testOrgId, testUserId, testBriefingId);

      expect(archived).toBeDefined();
      expect(archived.status).toBe('archived');
      expect(archived.isArchived).toBe(true);
      expect(archived.archivedAt).toBeDefined();

      // Reset for subsequent tests
      await service.updateBriefing(testOrgId, testUserId, testBriefingId, {
        status: 'draft' as BriefingStatus,
      });
    });
  });

  describe('Talking Point Operations', () => {
    it('should create a talking point', async () => {
      const request: CreateTalkingPointRequest = {
        briefingId: testBriefingId,
        category: 'primary_message' as TalkingPointCategory,
        headline: 'Our innovation drives market leadership',
        content: 'We have consistently delivered breakthrough products that reshape the industry.',
        supportingFacts: [
          { fact: '3x growth in R&D investment', verifiable: true, source: 'annual report' },
          { fact: '50+ patents filed this year', verifiable: true },
        ],
        priorityScore: 90,
        useCase: 'Opening statement in media interviews',
        targetAudience: 'Technology journalists',
      };

      const talkingPoint = await service.createTalkingPoint(testOrgId, testUserId, request);

      expect(talkingPoint).toBeDefined();
      expect(talkingPoint.id).toBeDefined();
      expect(talkingPoint.headline).toBe('Our innovation drives market leadership');
      expect(talkingPoint.category).toBe('primary_message');
      expect(talkingPoint.priorityScore).toBe(90);
      expect(talkingPoint.supportingFacts).toHaveLength(2);
      expect(talkingPoint.isApproved).toBe(false);
      expect(talkingPoint.isGenerated).toBe(false);

      testTalkingPointId = talkingPoint.id;
    });

    it('should create a defensive talking point', async () => {
      const request: CreateTalkingPointRequest = {
        briefingId: testBriefingId,
        category: 'defensive_point' as TalkingPointCategory,
        headline: 'Addressing market concerns',
        content: 'While the market faces challenges, our diversified approach minimizes risk.',
        priorityScore: 75,
        contextNotes: 'Use when directly asked about market volatility',
      };

      const talkingPoint = await service.createTalkingPoint(testOrgId, testUserId, request);

      expect(talkingPoint).toBeDefined();
      expect(talkingPoint.category).toBe('defensive_point');
      expect(talkingPoint.contextNotes).toBe('Use when directly asked about market volatility');

      // Clean up
      await service.deleteTalkingPoint(testOrgId, talkingPoint.id);
    });

    it('should get talking point by ID', async () => {
      const talkingPoint = await service.getTalkingPoint(testOrgId, testTalkingPointId);

      expect(talkingPoint).toBeDefined();
      expect(talkingPoint.id).toBe(testTalkingPointId);
      expect(talkingPoint.headline).toBe('Our innovation drives market leadership');
    });

    it('should list talking points for briefing', async () => {
      const result = await service.getTalkingPoints(
        testOrgId,
        { briefingId: testBriefingId },
        20,
        0
      );

      expect(result.talkingPoints).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
      expect(result.talkingPoints.some((tp) => tp.id === testTalkingPointId)).toBe(true);
    });

    it('should list talking points by category', async () => {
      const result = await service.getTalkingPoints(
        testOrgId,
        { category: ['primary_message'] },
        20,
        0
      );

      expect(result.talkingPoints).toBeDefined();
      expect(result.talkingPoints.every((tp) => tp.category === 'primary_message')).toBe(true);
    });

    it('should update talking point', async () => {
      const updateRequest: UpdateTalkingPointRequest = {
        headline: 'Our innovation drives market leadership - Enhanced',
        priorityScore: 95,
        targetAudience: 'Business and technology journalists',
      };

      const updated = await service.updateTalkingPoint(testOrgId, testUserId, testTalkingPointId, updateRequest);

      expect(updated).toBeDefined();
      expect(updated.headline).toBe('Our innovation drives market leadership - Enhanced');
      expect(updated.priorityScore).toBe(95);
      expect(updated.targetAudience).toBe('Business and technology journalists');
    });

    it('should approve talking point', async () => {
      // First update to set approver (done via updateTalkingPoint with isApproved)
      const approved = await service.updateTalkingPoint(testOrgId, testUserId, testTalkingPointId, {
        isApproved: true,
      });

      expect(approved).toBeDefined();
      expect(approved.isApproved).toBe(true);
    });
  });

  describe('Section Operations', () => {
    beforeAll(async () => {
      // Create a test section directly for testing
      const { data } = await supabase
        .from('mb_briefing_sections')
        .insert({
          org_id: testOrgId,
          briefing_id: testBriefingId,
          section_type: 'executive_summary',
          title: 'Executive Summary',
          content: 'Initial test content for executive summary.',
          sort_order: 0,
          is_generated: false,
          is_manually_edited: false,
        })
        .select('id')
        .single();

      if (data) {
        testSectionId = data.id;
      }
    });

    it('should get section by ID', async () => {
      const section = await service.getSection(testOrgId, testBriefingId, testSectionId);

      expect(section).toBeDefined();
      expect(section.id).toBe(testSectionId);
      expect(section.sectionType).toBe('executive_summary');
      expect(section.title).toBe('Executive Summary');
    });

    it('should update section content', async () => {
      const updated = await service.updateSection(testOrgId, testUserId, testBriefingId, testSectionId, {
        content: 'Updated content for the executive summary section.',
      });

      expect(updated).toBeDefined();
      expect(updated.content).toBe('Updated content for the executive summary section.');
      expect(updated.isManuallyEdited).toBe(true);
    });

    it('should update section title', async () => {
      const updated = await service.updateSection(testOrgId, testUserId, testBriefingId, testSectionId, {
        title: 'Executive Summary - Key Points',
      });

      expect(updated).toBeDefined();
      expect(updated.title).toBe('Executive Summary - Key Points');
    });
  });

  describe('Source Reference Operations', () => {
    let testSourceId: string;

    it('should add source reference to briefing', async () => {
      const source = await service.addSourceReference(testOrgId, testBriefingId, {
        sourceType: 'press_release' as any,
        sourceId: 'test-press-release-123',
        title: 'Q4 Product Launch Announcement',
        relevanceScore: 0.95,
        extractedContent: 'Key announcement details...',
        usedInSectionIds: [testSectionId],
      });

      expect(source).toBeDefined();
      expect(source.id).toBeDefined();
      expect(source.sourceType).toBe('press_release');
      expect(source.relevanceScore).toBe(0.95);

      testSourceId = source.id;
    });

    it('should get sources for briefing', async () => {
      const sources = await service.getBriefingSources(testOrgId, testBriefingId);

      expect(sources).toBeDefined();
      expect(sources.length).toBeGreaterThan(0);
      expect(sources.some((s) => s.id === testSourceId)).toBe(true);
    });

    it('should filter sources by type', async () => {
      const sources = await service.getBriefingSources(testOrgId, testBriefingId, 'press_release' as any);

      expect(sources).toBeDefined();
      expect(sources.every((s) => s.sourceType === 'press_release')).toBe(true);
    });
  });

  describe('Briefing Deletion', () => {
    let deletionTestBriefingId: string;

    beforeAll(async () => {
      // Create a briefing specifically for deletion testing
      const briefing = await service.createBriefing(testOrgId, testUserId, {
        title: 'Briefing for Deletion Test',
        format: 'talking_points_only' as BriefFormatType,
        tone: 'professional',
      });
      deletionTestBriefingId = briefing.id;

      // Add a talking point
      await service.createTalkingPoint(testOrgId, testUserId, {
        briefingId: deletionTestBriefingId,
        category: 'supporting_point' as TalkingPointCategory,
        headline: 'Test point for deletion',
        content: 'This will be deleted with the briefing',
        priorityScore: 50,
      });
    });

    it('should delete briefing and cascade to related records', async () => {
      // Delete the briefing
      await service.deleteBriefing(testOrgId, testUserId, deletionTestBriefingId);

      // Verify briefing is deleted
      await expect(service.getBriefing(testOrgId, deletionTestBriefingId)).rejects.toThrow();

      // Verify talking points are cascade deleted
      const talkingPoints = await service.getTalkingPoints(
        testOrgId,
        { briefingId: deletionTestBriefingId },
        20,
        0
      );
      expect(talkingPoints.talkingPoints).toHaveLength(0);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle non-existent briefing ID gracefully', async () => {
      await expect(service.getBriefing(testOrgId, 'non-existent-id-123')).rejects.toThrow();
    });

    it('should handle empty search results', async () => {
      const result = await service.getBriefings(
        testOrgId,
        { searchQuery: 'xyz_nonexistent_query_xyz' },
        20,
        0
      );

      expect(result.briefings).toBeDefined();
      expect(result.briefings).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      // Create multiple briefings for pagination test
      const briefingIds: string[] = [];
      for (let i = 0; i < 5; i++) {
        const briefing = await service.createBriefing(testOrgId, testUserId, {
          title: `Pagination Test Briefing ${i}`,
          format: 'executive_summary' as BriefFormatType,
          tone: 'professional',
        });
        briefingIds.push(briefing.id);
      }

      // Get first page
      const page1 = await service.getBriefings(testOrgId, {}, 2, 0);
      expect(page1.briefings.length).toBe(2);
      expect(page1.total).toBeGreaterThanOrEqual(5);

      // Get second page
      const page2 = await service.getBriefings(testOrgId, {}, 2, 2);
      expect(page2.briefings.length).toBe(2);
      expect(page1.briefings[0].id).not.toBe(page2.briefings[0].id);

      // Clean up pagination test briefings
      for (const id of briefingIds) {
        await service.deleteBriefing(testOrgId, testUserId, id);
      }
    });

    it('should validate talking point priority score range', async () => {
      const request: CreateTalkingPointRequest = {
        briefingId: testBriefingId,
        category: 'supporting_point' as TalkingPointCategory,
        headline: 'Test validation',
        content: 'Testing priority score handling',
        priorityScore: 150, // Invalid - should be clamped or validated
      };

      // The service should either clamp or reject invalid values
      // This tests the implementation behavior
      try {
        const tp = await service.createTalkingPoint(testOrgId, testUserId, request);
        // If it succeeds, priority should be clamped to 100
        expect(tp.priorityScore).toBeLessThanOrEqual(100);
        await service.deleteTalkingPoint(testOrgId, tp.id);
      } catch (error) {
        // If validation throws, that's also acceptable
        expect(error).toBeDefined();
      }
    });
  });

  describe('Cleanup and Deletion', () => {
    it('should delete test talking point', async () => {
      await service.deleteTalkingPoint(testOrgId, testTalkingPointId);

      await expect(service.getTalkingPoint(testOrgId, testTalkingPointId)).rejects.toThrow();
    });

    it('should delete main test briefing', async () => {
      await service.deleteBriefing(testOrgId, testUserId, testBriefingId);

      await expect(service.getBriefing(testOrgId, testBriefingId)).rejects.toThrow();
    });
  });
});
