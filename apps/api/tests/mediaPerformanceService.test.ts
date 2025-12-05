/**
 * Media Performance Service Tests (Sprint S52)
 * Comprehensive test suite for performance analytics engine
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { MediaPerformanceService } from '../src/services/mediaPerformanceService';
import { supabase } from '../src/config/supabase';
import type {
  CreateSnapshotRequest,
  CreateDimensionRequest,
  CreateScoreRequest,
  CreateInsightRequest,
  MediaPerformanceFilters,
  AggregationPeriod,
  InsightCategory,
  ScoreType,
  DimensionType,
  TierDistribution,
} from '@pravado/types';

describe('MediaPerformanceService', () => {
  const service = new MediaPerformanceService();
  const testOrgId = 'test-org-' + Date.now();
  let testSnapshotId: string;
  let testDimensionId: string;
  let testScoreId: string;
  let testInsightId: string;

  // Cleanup after all tests
  afterAll(async () => {
    await supabase
      .from('media_performance_snapshots')
      .delete()
      .eq('org_id', testOrgId);
    await supabase
      .from('media_performance_dimensions')
      .delete()
      .eq('org_id', testOrgId);
    await supabase
      .from('media_performance_scores')
      .delete()
      .eq('org_id', testOrgId);
    await supabase
      .from('media_performance_insights')
      .delete()
      .eq('org_id', testOrgId);
  });

  describe('Snapshot Management', () => {
    it('should create a performance snapshot with all metrics', async () => {
      const tierDistribution: TierDistribution = {
        tier1: 5,
        tier2: 10,
        tier3: 15,
        tier4: 5,
        unknown: 2,
      };

      const request: CreateSnapshotRequest = {
        snapshotAt: new Date(),
        aggregationPeriod: 'daily' as AggregationPeriod,
        brandId: 'test-brand-1',
        campaignId: 'test-campaign-1',
        metrics: {
          mentionCount: 50,
          articleCount: 30,
          journalistCount: 25,
          outletCount: 37,
          avgSentiment: 0.6,
          sentimentDistribution: {
            veryNegative: 1,
            negative: 2,
            neutral: 10,
            positive: 15,
            veryPositive: 22,
          },
          estimatedReach: 500000,
          shareOfVoice: 25.5,
          engagementScore: 75,
          pitchSuccessRate: 60,
          deliverabilityRate: 95,
          coverageVelocity: 5.5,
          momentumScore: 70,
          tierDistribution,
          topJournalists: [
            {
              journalistId: 'j1',
              journalistName: 'John Smith',
              mentionCount: 10,
              avgSentiment: 0.8,
              impactScore: 85,
              outletTier: 'tier1',
            },
          ],
          topKeywords: [
            { keyword: 'innovation', weight: 0.9, frequency: 15 },
            { keyword: 'technology', weight: 0.7, frequency: 10 },
          ],
        },
      };

      const snapshot = await service.createSnapshot(testOrgId, request);

      expect(snapshot).toBeDefined();
      expect(snapshot.orgId).toBe(testOrgId);
      expect(snapshot.mentionCount).toBe(50);
      expect(snapshot.avgSentiment).toBe(0.6);
      expect(snapshot.visibilityScore).toBeGreaterThan(0);
      expect(snapshot.eviScore).toBeGreaterThan(0);
      expect(snapshot.tierDistribution).toEqual(tierDistribution);

      testSnapshotId = snapshot.id;
    });

    it('should retrieve snapshots with filters', async () => {
      const filters: MediaPerformanceFilters = {
        brandId: 'test-brand-1',
        aggregationPeriod: 'daily' as AggregationPeriod,
      };

      const result = await service.getSnapshots(testOrgId, filters, 10, 0);

      expect(result).toBeDefined();
      expect(result.snapshots).toBeInstanceOf(Array);
      expect(result.snapshots.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
      expect(result.snapshots[0].brandId).toBe('test-brand-1');
    });

    it('should get snapshot by ID', async () => {
      const snapshot = await service.getSnapshot(testOrgId, testSnapshotId);

      expect(snapshot).toBeDefined();
      expect(snapshot.id).toBe(testSnapshotId);
      expect(snapshot.orgId).toBe(testOrgId);
    });

    it('should calculate visibility score correctly', async () => {
      const request: CreateSnapshotRequest = {
        snapshotAt: new Date(),
        aggregationPeriod: 'daily' as AggregationPeriod,
        metrics: {
          mentionCount: 100,
          articleCount: 50,
          journalistCount: 30,
          outletCount: 40,
          estimatedReach: 1000000,
          shareOfVoice: 50,
          tierDistribution: {
            tier1: 20,
            tier2: 15,
            tier3: 5,
            tier4: 0,
            unknown: 0,
          },
        },
      };

      const snapshot = await service.createSnapshot(testOrgId, request);

      expect(snapshot.visibilityScore).toBeGreaterThan(70); // Should be high with good metrics
      expect(snapshot.visibilityScore).toBeLessThanOrEqual(100);
    });

    it('should detect anomalies when mention count spikes', async () => {
      // Create baseline snapshots
      for (let i = 0; i < 5; i++) {
        await service.createSnapshot(testOrgId, {
          snapshotAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          aggregationPeriod: 'daily' as AggregationPeriod,
          brandId: 'anomaly-test',
          metrics: {
            mentionCount: 10,
            articleCount: 5,
            journalistCount: 3,
            outletCount: 5,
          },
        });
      }

      // Create anomaly snapshot (10x spike)
      const anomalySnapshot = await service.createSnapshot(testOrgId, {
        snapshotAt: new Date(),
        aggregationPeriod: 'daily' as AggregationPeriod,
        brandId: 'anomaly-test',
        metrics: {
          mentionCount: 100, // 10x spike
          articleCount: 50,
          journalistCount: 30,
          outletCount: 40,
        },
      });

      expect(anomalySnapshot.hasAnomaly).toBe(true);
      expect(anomalySnapshot.anomalyType).toBeDefined();
      expect(anomalySnapshot.anomalyMagnitude).toBeGreaterThan(0);
    });
  });

  describe('Dimension Rollups', () => {
    it('should create dimension rollup', async () => {
      const request: CreateDimensionRequest = {
        dimensionType: 'brand' as DimensionType,
        dimensionValue: 'Test Brand',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        metrics: {
          totalMentions: 500,
          uniqueJournalists: 50,
          uniqueOutlets: 75,
          avgSentiment: 0.7,
          totalReach: 5000000,
          avgVisibilityScore: 80,
          avgEngagementScore: 75,
        },
        rollupData: {
          topCampaigns: ['campaign1', 'campaign2'],
        },
      };

      const dimension = await service.createDimension(testOrgId, request);

      expect(dimension).toBeDefined();
      expect(dimension.dimensionType).toBe('brand');
      expect(dimension.dimensionValue).toBe('Test Brand');
      expect(dimension.totalMentions).toBe(500);
      expect(dimension.avgSentiment).toBe(0.7);

      testDimensionId = dimension.id;
    });

    it('should retrieve dimensions with filters', async () => {
      const result = await service.getDimensions(
        testOrgId,
        { dimensionType: 'brand' as DimensionType },
        10,
        0
      );

      expect(result).toBeDefined();
      expect(result.dimensions).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThan(0);
    });
  });

  describe('Score Management', () => {
    it('should upsert performance score', async () => {
      const request: CreateScoreRequest = {
        entityType: 'campaign',
        entityId: 'test-campaign-1',
        scoreType: 'visibility' as ScoreType,
        scoreValue: 85,
        scoreComponents: {
          reach: 90,
          tier: 85,
          frequency: 80,
          sov: 85,
        },
        windowStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        windowEndDate: new Date(),
        metadata: {
          calculatedBy: 'test',
        },
      };

      const score = await service.upsertScore(testOrgId, request);

      expect(score).toBeDefined();
      expect(score.scoreType).toBe('visibility');
      expect(score.scoreValue).toBe(85);
      expect(score.scoreComponents).toBeDefined();

      testScoreId = score.id;
    });

    it('should retrieve scores with filters', async () => {
      const result = await service.getScores(
        testOrgId,
        { entityType: 'campaign', scoreType: 'visibility' as ScoreType },
        10,
        0
      );

      expect(result).toBeDefined();
      expect(result.scores).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should calculate journalist impact score', async () => {
      const journalistId = 'test-journalist-1';

      // Create snapshots with journalist data
      for (let i = 0; i < 3; i++) {
        await service.createSnapshot(testOrgId, {
          snapshotAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000),
          aggregationPeriod: 'daily' as AggregationPeriod,
          journalistId,
          outletTier: 'tier1',
          metrics: {
            mentionCount: 5,
            articleCount: 5,
            journalistCount: 1,
            outletCount: 1,
            avgSentiment: 0.8,
          },
        });
      }

      const impactScore = await service.calculateJournalistImpact(
        testOrgId,
        journalistId,
        90
      );

      expect(impactScore).toBeGreaterThan(0);
      expect(impactScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Insight Management', () => {
    it('should create manual insight', async () => {
      const request: CreateInsightRequest = {
        category: 'achievement' as InsightCategory,
        title: 'Record Mentions This Month',
        summary: 'Achieved 500 mentions, a 50% increase from last month.',
        recommendation: 'Continue current outreach strategy.',
        generatedByLlm: false,
        impactScore: 85,
        confidenceScore: 0.95,
        supportingData: {
          currentMentions: 500,
          previousMentions: 333,
        },
      };

      const insight = await service.createInsight(testOrgId, request);

      expect(insight).toBeDefined();
      expect(insight.category).toBe('achievement');
      expect(insight.title).toBe('Record Mentions This Month');
      expect(insight.isRead).toBe(false);
      expect(insight.isDismissed).toBe(false);

      testInsightId = insight.id;
    });

    it('should update insight status', async () => {
      const updated = await service.updateInsight(testOrgId, testInsightId, {
        isRead: true,
      });

      expect(updated.isRead).toBe(true);
      expect(updated.isDismissed).toBe(false);
    });

    it('should retrieve insights with filters', async () => {
      const result = await service.getInsights(
        testOrgId,
        { category: 'achievement' as InsightCategory, isRead: true },
        10,
        0
      );

      expect(result).toBeDefined();
      expect(result.insights).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThan(0);
      expect(result.unreadCount).toBeGreaterThanOrEqual(0);
    });

    it('should generate LLM insight from snapshot', async () => {
      // Note: This test requires LLM to be available
      // Mock or skip if LLM is not configured
      try {
        const insight = await service.generateInsight(
          testOrgId,
          testSnapshotId,
          'trend' as InsightCategory
        );

        expect(insight).toBeDefined();
        expect(insight.generatedByLlm).toBe(true);
        expect(insight.llmModel).toBeDefined();
        expect(insight.category).toBe('trend');
      } catch (error: any) {
        if (error.message.includes('LLM') || error.message.includes('API key')) {
          console.log('Skipping LLM test - LLM not configured');
        } else {
          throw error;
        }
      }
    });
  });

  describe('Analytics & Trends', () => {
    beforeEach(async () => {
      // Create time-series data for trend analysis
      const now = Date.now();
      for (let i = 0; i < 10; i++) {
        await service.createSnapshot(testOrgId, {
          snapshotAt: new Date(now - i * 24 * 60 * 60 * 1000),
          aggregationPeriod: 'daily' as AggregationPeriod,
          brandId: 'trend-test-brand',
          metrics: {
            mentionCount: 50 + Math.floor(Math.random() * 20),
            articleCount: 30 + Math.floor(Math.random() * 10),
            journalistCount: 20 + Math.floor(Math.random() * 5),
            outletCount: 25 + Math.floor(Math.random() * 5),
            avgSentiment: 0.5 + Math.random() * 0.3,
          },
        });
      }
    });

    it('should get trend data for mention volume', async () => {
      const trend = await service.getTrend(
        testOrgId,
        'mention_volume' as any,
        { brandId: 'trend-test-brand' },
        10
      );

      expect(trend).toBeDefined();
      expect(trend.metric).toBe('mention_volume');
      expect(trend.dataPoints).toBeInstanceOf(Array);
      expect(trend.dataPoints.length).toBeGreaterThan(0);
      expect(trend.summary).toBeDefined();
      expect(trend.summary.currentValue).toBeGreaterThan(0);
      expect(trend.summary.trendDirection).toMatch(/up|down|stable/);
    });

    it('should get anomalies', async () => {
      const anomalies = await service.getAnomalies(
        testOrgId,
        { brandId: 'anomaly-test' },
        10
      );

      expect(anomalies).toBeDefined();
      expect(anomalies.anomalies).toBeInstanceOf(Array);
      expect(anomalies.total).toBeGreaterThanOrEqual(0);
    });

    it('should get performance overview', async () => {
      const endDate = new Date();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const overview = await service.getOverview(
        testOrgId,
        startDate,
        endDate,
        'trend-test-brand'
      );

      expect(overview).toBeDefined();
      expect(overview.period.start).toEqual(startDate);
      expect(overview.period.end).toEqual(endDate);
      expect(overview.summary).toBeDefined();
      expect(overview.summary.totalMentions).toBeGreaterThan(0);
      expect(overview.trends).toBeDefined();
      expect(overview.topPerformers).toBeDefined();
      expect(overview.insights).toBeInstanceOf(Array);
    });
  });

  describe('Scoring Algorithms', () => {
    it('should calculate EVI score with correct weighting', async () => {
      const tierDistribution: TierDistribution = {
        tier1: 10,
        tier2: 5,
        tier3: 3,
        tier4: 2,
        unknown: 0,
      };

      const snapshot = await service.createSnapshot(testOrgId, {
        snapshotAt: new Date(),
        aggregationPeriod: 'daily' as AggregationPeriod,
        metrics: {
          mentionCount: 20,
          articleCount: 20,
          journalistCount: 20,
          outletCount: 20,
          estimatedReach: 1000000,
          avgSentiment: 0.8, // Very positive
          tierDistribution,
        },
      });

      expect(snapshot.eviScore).toBeGreaterThan(70); // Should be high
      expect(snapshot.eviScore).toBeLessThanOrEqual(100);
      expect(snapshot.eviComponents).toBeDefined();
    });

    it('should handle edge cases in scoring', async () => {
      // Test with zero values
      const zeroSnapshot = await service.createSnapshot(testOrgId, {
        snapshotAt: new Date(),
        aggregationPeriod: 'daily' as AggregationPeriod,
        metrics: {
          mentionCount: 0,
          articleCount: 0,
          journalistCount: 0,
          outletCount: 0,
        },
      });

      expect(zeroSnapshot.visibilityScore).toBe(0);
      expect(zeroSnapshot.eviScore).toBe(0);

      // Test with negative sentiment
      const negativeSnapshot = await service.createSnapshot(testOrgId, {
        snapshotAt: new Date(),
        aggregationPeriod: 'daily' as AggregationPeriod,
        metrics: {
          mentionCount: 10,
          articleCount: 10,
          journalistCount: 10,
          outletCount: 10,
          avgSentiment: -0.8,
        },
      });

      expect(negativeSnapshot.eviScore).toBeLessThan(50);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid org ID', async () => {
      await expect(
        service.getSnapshot('invalid-org-id', 'nonexistent-snapshot-id')
      ).rejects.toThrow();
    });

    it('should throw error for nonexistent snapshot', async () => {
      await expect(
        service.getSnapshot(testOrgId, 'nonexistent-snapshot-id')
      ).rejects.toThrow('not found');
    });

    it('should handle missing required fields gracefully', async () => {
      const invalidRequest = {
        snapshotAt: new Date(),
        aggregationPeriod: 'daily' as AggregationPeriod,
        metrics: {} as any, // Missing required fields
      };

      await expect(
        service.createSnapshot(testOrgId, invalidRequest)
      ).rejects.toThrow();
    });
  });
});
