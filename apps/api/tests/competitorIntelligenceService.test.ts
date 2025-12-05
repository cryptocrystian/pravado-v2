/**
 * Competitive Intelligence Service Tests (Sprint S53)
 * Comprehensive test suite for competitor tracking and analytics engine
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { CompetitorIntelligenceService } from '../src/services/competitorIntelligenceService';
import { supabase } from '../src/config/supabase';
import type {
  CreateCompetitorRequest,
  UpdateCompetitorRequest,
  CreateCompetitorMentionRequest,
  CreateCompetitorInsightRequest,
  CompetitorTier,
  CIInsightCategory,
  OverlapType,
  SnapshotPeriod,
} from '@pravado/types';

describe('CompetitorIntelligenceService', () => {
  const service = new CompetitorIntelligenceService(supabase);
  const testOrgId = 'test-org-ci-' + Date.now();
  let testCompetitorId: string;
  let testMentionId: string;
  let testInsightId: string;

  // Cleanup after all tests
  afterAll(async () => {
    // Clean up in reverse dependency order
    await supabase
      .from('ci_competitor_insights')
      .delete()
      .eq('org_id', testOrgId);
    await supabase
      .from('ci_competitor_overlap')
      .delete()
      .eq('org_id', testOrgId);
    await supabase
      .from('ci_competitor_metrics_snapshots')
      .delete()
      .eq('org_id', testOrgId);
    await supabase
      .from('ci_competitor_mentions')
      .delete()
      .eq('org_id', testOrgId);
    await supabase
      .from('ci_competitors')
      .delete()
      .eq('org_id', testOrgId);
  });

  describe('Competitor Management', () => {
    it('should create a new competitor with keywords', async () => {
      const request: CreateCompetitorRequest = {
        name: 'Test Competitor Corp',
        domain: 'https://testcompetitor.com',
        tier: 'tier_1' as CompetitorTier,
        industry: 'Technology',
        description: 'A test competitor for CI tests',
        keywords: ['competitor', 'tech', 'innovation'],
        domains: ['https://blog.testcompetitor.com'],
        socialHandles: {
          twitter: '@testcompetitor',
          linkedin: 'testcompetitor-corp',
        },
      };

      const competitor = await service.createCompetitor(testOrgId, request);

      expect(competitor).toBeDefined();
      expect(competitor.id).toBeDefined();
      expect(competitor.name).toBe('Test Competitor Corp');
      expect(competitor.tier).toBe('tier_1');
      expect(competitor.keywords).toContain('competitor');
      expect(competitor.keywords).toContain('tech');
      expect(competitor.isActive).toBe(true);

      testCompetitorId = competitor.id;
    });

    it('should get competitor by ID', async () => {
      const competitor = await service.getCompetitor(testOrgId, testCompetitorId);

      expect(competitor).toBeDefined();
      expect(competitor?.id).toBe(testCompetitorId);
      expect(competitor?.name).toBe('Test Competitor Corp');
    });

    it('should list competitors with filters', async () => {
      const result = await service.getCompetitors(testOrgId, {
        tier: 'tier_1' as CompetitorTier,
        isActive: true,
      });

      expect(result.competitors).toBeDefined();
      expect(result.competitors.length).toBeGreaterThan(0);
      expect(result.competitors.some((c) => c.id === testCompetitorId)).toBe(true);
    });

    it('should update competitor details', async () => {
      const updateRequest: UpdateCompetitorRequest = {
        name: 'Test Competitor Corp Updated',
        tier: 'tier_2' as CompetitorTier,
        keywords: ['competitor', 'tech', 'innovation', 'market'],
      };

      const updated = await service.updateCompetitor(testOrgId, testCompetitorId, updateRequest);

      expect(updated).toBeDefined();
      expect(updated.name).toBe('Test Competitor Corp Updated');
      expect(updated.tier).toBe('tier_2');
      expect(updated.keywords).toContain('market');
    });

    it('should deactivate competitor', async () => {
      const updated = await service.updateCompetitor(testOrgId, testCompetitorId, {
        isActive: false,
      });

      expect(updated.isActive).toBe(false);

      // Re-activate for subsequent tests
      await service.updateCompetitor(testOrgId, testCompetitorId, {
        isActive: true,
      });
    });
  });

  describe('Mention Tracking', () => {
    it('should create a competitor mention', async () => {
      const request: CreateCompetitorMentionRequest = {
        competitorId: testCompetitorId,
        sourceType: 'news_article',
        sourceUrl: 'https://example.com/article/competitor-news',
        publishedAt: new Date(),
        title: 'Test Competitor Launches New Product',
        content: 'The competitor has launched an innovative new product...',
        excerpt: 'Test Competitor Corp announced...',
        authorName: 'John Doe',
        outletName: 'Tech News Daily',
        outletTier: 1,
        sentimentScore: 0.7,
        topics: ['product_launch', 'technology'],
        keywords: ['innovation', 'product'],
        estimatedReach: 50000,
        matchedKeywords: ['competitor', 'innovation'],
        confidenceScore: 0.95,
      };

      const mention = await service.createMention(testOrgId, request);

      expect(mention).toBeDefined();
      expect(mention.id).toBeDefined();
      expect(mention.competitorId).toBe(testCompetitorId);
      expect(mention.sourceType).toBe('news_article');
      expect(mention.sentimentScore).toBe(0.7);
      expect(mention.matchedKeywords).toContain('competitor');

      testMentionId = mention.id;
    });

    it('should list mentions with filters', async () => {
      const result = await service.getMentions(testOrgId, {
        competitorId: testCompetitorId,
        sourceType: 'news_article',
      });

      expect(result.mentions).toBeDefined();
      expect(result.mentions.length).toBeGreaterThan(0);
      expect(result.mentions.some((m) => m.id === testMentionId)).toBe(true);
    });

    it('should filter mentions by sentiment range', async () => {
      const result = await service.getMentions(testOrgId, {
        minSentiment: 0.5,
        maxSentiment: 1.0,
      });

      expect(result.mentions).toBeDefined();
      result.mentions.forEach((mention) => {
        if (mention.sentimentScore !== null) {
          expect(mention.sentimentScore).toBeGreaterThanOrEqual(0.5);
          expect(mention.sentimentScore).toBeLessThanOrEqual(1.0);
        }
      });
    });
  });

  describe('Metrics Snapshots', () => {
    it('should create a metrics snapshot', async () => {
      const snapshot = await service.createSnapshot(
        testOrgId,
        testCompetitorId,
        'daily' as SnapshotPeriod
      );

      expect(snapshot).toBeDefined();
      expect(snapshot.id).toBeDefined();
      expect(snapshot.competitorId).toBe(testCompetitorId);
      expect(snapshot.period).toBe('daily');
      expect(snapshot.mentionCount).toBeDefined();
    });

    it('should list snapshots with filters', async () => {
      const result = await service.getSnapshots(testOrgId, {
        competitorId: testCompetitorId,
        period: 'daily' as SnapshotPeriod,
      });

      expect(result.snapshots).toBeDefined();
      expect(result.snapshots.length).toBeGreaterThan(0);
    });
  });

  describe('Insight Generation', () => {
    it('should create a competitor insight', async () => {
      const request: CreateCompetitorInsightRequest = {
        competitorId: testCompetitorId,
        category: 'opportunity' as CIInsightCategory,
        title: 'Gap in Competitor Coverage',
        description:
          'Competitor has low coverage in enterprise segment, presenting opportunity',
        recommendation: 'Target enterprise-focused publications',
        impactScore: 75,
        confidenceScore: 80,
        priorityScore: 70,
        supportingMetrics: {
          enterpriseMentions: 5,
          smbMentions: 45,
          gap: 40,
        },
        timeWindowStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        timeWindowEnd: new Date(),
        generatedBy: 'rule',
      };

      const insight = await service.createInsight(testOrgId, request);

      expect(insight).toBeDefined();
      expect(insight.id).toBeDefined();
      expect(insight.competitorId).toBe(testCompetitorId);
      expect(insight.category).toBe('opportunity');
      expect(insight.impactScore).toBe(75);
      expect(insight.isRead).toBe(false);
      expect(insight.isDismissed).toBe(false);

      testInsightId = insight.id;
    });

    it('should list insights with filters', async () => {
      const result = await service.getInsights(testOrgId, {
        competitorId: testCompetitorId,
        category: 'opportunity' as CIInsightCategory,
        isDismissed: false,
      });

      expect(result.insights).toBeDefined();
      expect(result.insights.length).toBeGreaterThan(0);
      expect(result.insights.some((i) => i.id === testInsightId)).toBe(true);
    });

    it('should update insight status', async () => {
      const updated = await service.updateInsight(testOrgId, testInsightId, {
        isRead: true,
      });

      expect(updated.isRead).toBe(true);
      expect(updated.isDismissed).toBe(false);
    });

    it('should dismiss insight', async () => {
      const updated = await service.updateInsight(testOrgId, testInsightId, {
        isDismissed: true,
        userFeedback: 'Not relevant to our strategy',
      });

      expect(updated.isDismissed).toBe(true);
      expect(updated.userFeedback).toBe('Not relevant to our strategy');
    });
  });

  describe('Comparative Analytics', () => {
    it('should calculate competitor metrics summary', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const summary = await service.getCompetitorMetrics(
        testOrgId,
        testCompetitorId,
        startDate,
        endDate
      );

      expect(summary).toBeDefined();
      expect(summary.competitorId).toBe(testCompetitorId);
      expect(summary.totalMentions).toBeDefined();
      expect(summary.periodStart).toBeDefined();
      expect(summary.periodEnd).toBeDefined();
    });

    it('should perform comparative analysis', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const comparison = await service.getComparativeAnalytics(
        testOrgId,
        testCompetitorId,
        startDate,
        endDate
      );

      expect(comparison).toBeDefined();
      expect(comparison.brandMetrics).toBeDefined();
      expect(comparison.competitorMetrics).toBeDefined();
      expect(comparison.differentials).toBeDefined();
      expect(comparison.advantageScore).toBeDefined();
    });
  });

  describe('Overlap Analysis', () => {
    it('should perform journalist overlap analysis', async () => {
      const result = await service.analyzeOverlap(
        testOrgId,
        testCompetitorId,
        'journalist_overlap' as OverlapType,
        30
      );

      expect(result).toBeDefined();
      expect(result.overlapType).toBe('journalist_overlap');
      expect(result.overlapScore).toBeDefined();
      expect(result.sharedCount).toBeDefined();
      expect(result.brandExclusiveCount).toBeDefined();
      expect(result.competitorExclusiveCount).toBeDefined();
    });

    it('should perform outlet overlap analysis', async () => {
      const result = await service.analyzeOverlap(
        testOrgId,
        testCompetitorId,
        'outlet_overlap' as OverlapType,
        30
      );

      expect(result).toBeDefined();
      expect(result.overlapType).toBe('outlet_overlap');
      expect(result.overlapScore).toBeDefined();
    });

    it('should list overlap records with filters', async () => {
      const result = await service.getOverlap(testOrgId, {
        competitorId: testCompetitorId,
        overlapType: 'journalist_overlap' as OverlapType,
      });

      expect(result.overlaps).toBeDefined();
    });
  });

  describe('Competitor Evaluation', () => {
    it('should evaluate competitor and generate insights', async () => {
      const result = await service.evaluateCompetitor(testOrgId, testCompetitorId, 30);

      expect(result).toBeDefined();
      expect(result.snapshot).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.message).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle competitor not found gracefully', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const competitor = await service.getCompetitor(testOrgId, nonExistentId);
      expect(competitor).toBeNull();
    });

    it('should handle empty mentions gracefully', async () => {
      const result = await service.getMentions(testOrgId, {
        competitorId: '00000000-0000-0000-0000-000000000000',
      });
      expect(result.mentions).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle empty keywords validation', async () => {
      const request: CreateCompetitorRequest = {
        name: 'Invalid Competitor',
        tier: 'tier_1' as CompetitorTier,
        keywords: [], // Empty keywords should fail
      };

      await expect(service.createCompetitor(testOrgId, request)).rejects.toThrow();
    });
  });

  describe('Competitor Deletion', () => {
    it('should delete competitor and cascade to related records', async () => {
      // Create a competitor to delete
      const tempCompetitor = await service.createCompetitor(testOrgId, {
        name: 'Temp Competitor for Deletion',
        tier: 'tier_4' as CompetitorTier,
        keywords: ['temp', 'delete'],
      });

      // Delete the competitor
      await service.deleteCompetitor(testOrgId, tempCompetitor.id);

      // Verify deletion
      const deleted = await service.getCompetitor(testOrgId, tempCompetitor.id);
      expect(deleted).toBeNull();
    });
  });
});
