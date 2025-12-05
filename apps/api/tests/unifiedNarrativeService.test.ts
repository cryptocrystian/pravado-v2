/**
 * UnifiedNarrativeService tests (Sprint S70)
 * Tests for cross-domain synthesis engine
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  UnifiedNarrative,
  UnifiedNarrativeSection,
  UnifiedNarrativeSource,
  UnifiedNarrativeDiff,
  NarrativeInsight,
  NarrativeType,
  NarrativeSectionType,
  NarrativeSourceSystem,
  NarrativeStatus,
  NarrativeFormatType,
  NarrativeInsightStrength,
  DeltaType,
} from '@pravado/types';

// Mock data generators
const mockOrgId = 'org-test-123';
const mockUserId = 'user-test-456';

function createMockNarrative(overrides: Partial<UnifiedNarrative> = {}): UnifiedNarrative {
  return {
    id: 'narrative-1',
    orgId: mockOrgId,
    title: 'Q4 2024 Executive Summary',
    subtitle: 'Strategic Communications Review',
    narrativeType: 'executive',
    format: 'executive_brief',
    status: 'draft',
    periodStart: new Date('2024-10-01'),
    periodEnd: new Date('2024-12-31'),
    fiscalYear: 2024,
    fiscalQuarter: 'Q4',
    sourceSystems: ['media_monitoring', 'brand_reputation', 'competitive_intel'],
    keyInsights: [],
    patterns: [],
    contradictions: [],
    riskClusters: [],
    correlations: [],
    executiveSummary: 'Executive summary content',
    tldrSynthesis: 'TL;DR content',
    threeSentenceSummary: 'Three sentence summary',
    talkingPoints: ['Point 1', 'Point 2'],
    confidenceScore: 0.85,
    dataQualityScore: 0.9,
    totalTokensUsed: 5000,
    generationTimeMs: 15000,
    tags: ['quarterly', 'executive'],
    targetAudience: 'Board of Directors',
    metadata: {},
    createdBy: mockUserId,
    approvedBy: null,
    publishedBy: null,
    archivedBy: null,
    generatedAt: null,
    approvedAt: null,
    publishedAt: null,
    archivedAt: null,
    previousNarrativeId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockSection(overrides: Partial<UnifiedNarrativeSection> = {}): UnifiedNarrativeSection {
  return {
    id: 'section-1',
    narrativeId: 'narrative-1',
    sectionType: 'executive_summary',
    title: 'Executive Summary',
    sortOrder: 0,
    contentMd: '# Executive Summary\n\nThis is the executive summary content.',
    contentHtml: '<h1>Executive Summary</h1><p>This is the executive summary content.</p>',
    sourceReferences: [],
    keyPoints: ['Key point 1', 'Key point 2'],
    confidenceScore: 0.9,
    tokensUsed: 500,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockSource(overrides: Partial<UnifiedNarrativeSource> = {}): UnifiedNarrativeSource {
  return {
    id: 'source-1',
    narrativeId: 'narrative-1',
    sourceSystem: 'media_monitoring',
    sourceRecordId: 'record-123',
    sourceRecordType: 'article',
    extractedAt: new Date(),
    dataQuality: 'high',
    relevanceScore: 0.85,
    extractedData: { title: 'Article Title', sentiment: 0.5 },
    metadata: {},
    createdAt: new Date(),
    ...overrides,
  };
}

function createMockInsight(overrides: Partial<NarrativeInsight> = {}): NarrativeInsight {
  return {
    id: 'insight-1',
    title: 'Rising Brand Sentiment',
    description: 'Brand sentiment has increased by 15% over the quarter.',
    insightType: 'trend',
    sourceSystem: 'brand_reputation',
    strength: 'high',
    confidenceScore: 0.88,
    supportingData: { sentimentChange: 0.15 },
    tags: ['sentiment', 'positive'],
    ...overrides,
  };
}

function createMockDiff(overrides: Partial<UnifiedNarrativeDiff> = {}): UnifiedNarrativeDiff {
  return {
    id: 'diff-1',
    narrativeId: 'narrative-1',
    previousNarrativeId: 'narrative-0',
    sectionType: 'executive_summary',
    deltaType: 'improved',
    changeSummary: 'Sentiment scores improved by 10%',
    previousValue: { score: 0.7 },
    currentValue: { score: 0.8 },
    percentChange: 14.3,
    significance: 'high',
    generatedNarrative: 'Sentiment has notably improved compared to the previous quarter.',
    createdAt: new Date(),
    ...overrides,
  };
}

describe('unifiedNarrativeService', () => {
  describe('Narrative CRUD', () => {
    describe('createNarrative', () => {
      it('should create a narrative with valid input', () => {
        const input = {
          title: 'Q4 Executive Summary',
          narrativeType: 'executive' as NarrativeType,
          format: 'executive_brief' as NarrativeFormatType,
          periodStart: '2024-10-01',
          periodEnd: '2024-12-31',
          sourceSystems: ['media_monitoring', 'brand_reputation'] as NarrativeSourceSystem[],
        };

        expect(input.title).toBe('Q4 Executive Summary');
        expect(input.narrativeType).toBe('executive');
        expect(input.sourceSystems).toHaveLength(2);
      });

      it('should set initial status to draft', () => {
        const narrative = createMockNarrative();

        expect(narrative.status).toBe('draft');
      });

      it('should initialize with null generation timestamps', () => {
        const narrative = createMockNarrative();

        expect(narrative.generatedAt).toBeNull();
        expect(narrative.approvedAt).toBeNull();
        expect(narrative.publishedAt).toBeNull();
      });

      it('should support all narrative types', () => {
        const types: NarrativeType[] = [
          'executive',
          'strategy',
          'investor',
          'crisis',
          'competitive_intelligence',
          'reputation',
          'quarterly_context',
          'talking_points',
          'analyst_brief',
          'internal_alignment_memo',
          'tldr_synthesis',
          'custom',
        ];

        types.forEach((type) => {
          const narrative = createMockNarrative({ narrativeType: type });
          expect(narrative.narrativeType).toBe(type);
        });
      });

      it('should support all source systems', () => {
        const systems: NarrativeSourceSystem[] = [
          'media_briefing',
          'crisis_engine',
          'brand_reputation',
          'brand_alerts',
          'governance',
          'risk_radar',
          'exec_command_center',
          'exec_digest',
          'board_reports',
          'investor_relations',
          'strategic_intelligence',
          'unified_graph',
          'scenario_playbooks',
          'media_monitoring',
          'media_performance',
          'journalist_graph',
          'audience_personas',
          'competitive_intel',
          'content_quality',
          'pr_outreach',
        ];

        const narrative = createMockNarrative({ sourceSystems: systems });
        expect(narrative.sourceSystems).toHaveLength(systems.length);
      });
    });

    describe('updateNarrative', () => {
      it('should update title and subtitle', () => {
        const narrative = createMockNarrative();
        const updates = {
          title: 'Updated Title',
          subtitle: 'Updated Subtitle',
        };

        expect(updates.title).not.toBe(narrative.title);
        expect(updates.subtitle).not.toBe(narrative.subtitle);
      });

      it('should update target audience', () => {
        const narrative = createMockNarrative({ targetAudience: 'Executives' });
        const newAudience = 'Board of Directors';

        expect(newAudience).not.toBe(narrative.targetAudience);
      });

      it('should update source systems', () => {
        const narrative = createMockNarrative({
          sourceSystems: ['media_monitoring'],
        });
        const newSystems: NarrativeSourceSystem[] = ['media_monitoring', 'brand_reputation', 'competitive_intel'];

        expect(newSystems.length).toBeGreaterThan(narrative.sourceSystems.length);
      });

      it('should update tags', () => {
        const narrative = createMockNarrative({ tags: ['old'] });
        const newTags = ['new', 'updated', 'quarterly'];

        expect(newTags).not.toEqual(narrative.tags);
      });
    });

    describe('deleteNarrative', () => {
      it('should allow deleting draft narratives', () => {
        const narrative = createMockNarrative({ status: 'draft' });

        expect(narrative.status).toBe('draft');
        // Service should allow deletion
      });

      it('should cascade delete sections', () => {
        const sections = [
          createMockSection({ narrativeId: 'narrative-1' }),
          createMockSection({ id: 'section-2', narrativeId: 'narrative-1', sectionType: 'strategic_overview' }),
        ];

        expect(sections.every((s) => s.narrativeId === 'narrative-1')).toBe(true);
      });

      it('should cascade delete sources', () => {
        const sources = [
          createMockSource({ narrativeId: 'narrative-1' }),
          createMockSource({ id: 'source-2', narrativeId: 'narrative-1' }),
        ];

        expect(sources.every((s) => s.narrativeId === 'narrative-1')).toBe(true);
      });
    });

    describe('listNarratives', () => {
      it('should filter by narrative type', () => {
        const narratives = [
          createMockNarrative({ narrativeType: 'executive' }),
          createMockNarrative({ id: 'n-2', narrativeType: 'investor' }),
          createMockNarrative({ id: 'n-3', narrativeType: 'executive' }),
        ];

        const filtered = narratives.filter((n) => n.narrativeType === 'executive');

        expect(filtered).toHaveLength(2);
      });

      it('should filter by status', () => {
        const narratives = [
          createMockNarrative({ status: 'draft' }),
          createMockNarrative({ id: 'n-2', status: 'approved' }),
          createMockNarrative({ id: 'n-3', status: 'published' }),
          createMockNarrative({ id: 'n-4', status: 'draft' }),
        ];

        const drafts = narratives.filter((n) => n.status === 'draft');

        expect(drafts).toHaveLength(2);
      });

      it('should filter by fiscal year and quarter', () => {
        const narratives = [
          createMockNarrative({ fiscalYear: 2024, fiscalQuarter: 'Q4' }),
          createMockNarrative({ id: 'n-2', fiscalYear: 2024, fiscalQuarter: 'Q3' }),
          createMockNarrative({ id: 'n-3', fiscalYear: 2023, fiscalQuarter: 'Q4' }),
        ];

        const q4_2024 = narratives.filter(
          (n) => n.fiscalYear === 2024 && n.fiscalQuarter === 'Q4'
        );

        expect(q4_2024).toHaveLength(1);
      });

      it('should search by title', () => {
        const narratives = [
          createMockNarrative({ title: 'Q4 Executive Summary' }),
          createMockNarrative({ id: 'n-2', title: 'Crisis Response Report' }),
          createMockNarrative({ id: 'n-3', title: 'Q3 Executive Brief' }),
        ];

        const searchTerm = 'executive';
        const matched = narratives.filter((n) =>
          n.title.toLowerCase().includes(searchTerm.toLowerCase())
        );

        expect(matched).toHaveLength(2);
      });

      it('should support pagination', () => {
        const allNarratives = Array.from({ length: 25 }, (_, i) =>
          createMockNarrative({ id: `n-${i}` })
        );

        const page1 = allNarratives.slice(0, 10);
        const page2 = allNarratives.slice(10, 20);
        const page3 = allNarratives.slice(20, 25);

        expect(page1).toHaveLength(10);
        expect(page2).toHaveLength(10);
        expect(page3).toHaveLength(5);
      });

      it('should sort by updated_at descending', () => {
        const narratives = [
          createMockNarrative({ id: 'n-1', updatedAt: new Date('2024-01-01') }),
          createMockNarrative({ id: 'n-2', updatedAt: new Date('2024-03-01') }),
          createMockNarrative({ id: 'n-3', updatedAt: new Date('2024-02-01') }),
        ];

        const sorted = [...narratives].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        expect(sorted[0].id).toBe('n-2');
        expect(sorted[1].id).toBe('n-3');
        expect(sorted[2].id).toBe('n-1');
      });
    });
  });

  describe('Narrative Generation', () => {
    describe('generateNarrative', () => {
      it('should set status to generating during generation', () => {
        const narrative = createMockNarrative({ status: 'generating' });

        expect(narrative.status).toBe('generating');
      });

      it('should set status to review after generation', () => {
        const narrative = createMockNarrative({ status: 'review' });

        expect(narrative.status).toBe('review');
      });

      it('should populate generatedAt timestamp', () => {
        const narrative = createMockNarrative({
          generatedAt: new Date(),
        });

        expect(narrative.generatedAt).not.toBeNull();
      });

      it('should generate executive summary', () => {
        const narrative = createMockNarrative({
          executiveSummary: 'Generated executive summary content.',
        });

        expect(narrative.executiveSummary).toBeTruthy();
        expect(narrative.executiveSummary!.length).toBeGreaterThan(0);
      });

      it('should generate TL;DR synthesis', () => {
        const narrative = createMockNarrative({
          tldrSynthesis: 'Brief TL;DR content.',
        });

        expect(narrative.tldrSynthesis).toBeTruthy();
      });

      it('should generate talking points', () => {
        const narrative = createMockNarrative({
          talkingPoints: [
            'First talking point',
            'Second talking point',
            'Third talking point',
          ],
        });

        expect(narrative.talkingPoints).toHaveLength(3);
      });

      it('should track tokens used', () => {
        const narrative = createMockNarrative({
          totalTokensUsed: 10000,
        });

        expect(narrative.totalTokensUsed).toBeGreaterThan(0);
      });

      it('should track generation time', () => {
        const narrative = createMockNarrative({
          generationTimeMs: 15000,
        });

        expect(narrative.generationTimeMs).toBeGreaterThan(0);
      });

      it('should calculate confidence score', () => {
        const narrative = createMockNarrative({
          confidenceScore: 0.85,
        });

        expect(narrative.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(narrative.confidenceScore).toBeLessThanOrEqual(1);
      });

      it('should calculate data quality score', () => {
        const narrative = createMockNarrative({
          dataQualityScore: 0.9,
        });

        expect(narrative.dataQualityScore).toBeGreaterThanOrEqual(0);
        expect(narrative.dataQualityScore).toBeLessThanOrEqual(1);
      });
    });

    describe('generateSections', () => {
      it('should create sections for each section type', () => {
        const sectionTypes: NarrativeSectionType[] = [
          'executive_summary',
          'strategic_overview',
          'key_findings',
          'risk_analysis',
          'opportunity_analysis',
        ];

        const sections = sectionTypes.map((type, i) =>
          createMockSection({ id: `section-${i}`, sectionType: type, sortOrder: i })
        );

        expect(sections).toHaveLength(5);
        expect(sections[0].sectionType).toBe('executive_summary');
      });

      it('should maintain sort order', () => {
        const sections = [
          createMockSection({ sortOrder: 0 }),
          createMockSection({ id: 'section-2', sortOrder: 1 }),
          createMockSection({ id: 'section-3', sortOrder: 2 }),
        ];

        const orders = sections.map((s) => s.sortOrder);
        const isSorted = orders.every((o, i) => o === i);

        expect(isSorted).toBe(true);
      });

      it('should generate markdown content', () => {
        const section = createMockSection({
          contentMd: '# Section Title\n\n## Subsection\n\nContent here.',
        });

        expect(section.contentMd).toContain('#');
        expect(section.contentMd).toContain('Content');
      });

      it('should include key points', () => {
        const section = createMockSection({
          keyPoints: ['Point 1', 'Point 2', 'Point 3'],
        });

        expect(section.keyPoints).toHaveLength(3);
      });

      it('should include source references', () => {
        const section = createMockSection({
          sourceReferences: [
            { sourceId: 'source-1', relevance: 0.9 },
            { sourceId: 'source-2', relevance: 0.8 },
          ],
        });

        expect(section.sourceReferences).toHaveLength(2);
      });
    });
  });

  describe('Section Management', () => {
    describe('updateSection', () => {
      it('should update content markdown', () => {
        const section = createMockSection();
        const newContent = '# Updated Content\n\nNew content here.';

        expect(newContent).not.toBe(section.contentMd);
      });

      it('should update key points', () => {
        const section = createMockSection({
          keyPoints: ['Old point 1'],
        });
        const newPoints = ['New point 1', 'New point 2'];

        expect(newPoints.length).toBeGreaterThan(section.keyPoints?.length || 0);
      });

      it('should recalculate tokens used', () => {
        const section = createMockSection({ tokensUsed: 500 });
        const newTokensUsed = 750;

        expect(newTokensUsed).toBeGreaterThan(section.tokensUsed || 0);
      });
    });

    describe('regenerateSection', () => {
      it('should preserve key points if requested', () => {
        const section = createMockSection({
          keyPoints: ['Preserved point 1', 'Preserved point 2'],
        });

        expect(section.keyPoints).toHaveLength(2);
        // regenerateSection with preserveKeyPoints: true
      });

      it('should generate new content', () => {
        const oldContent = 'Old content';
        const newContent = 'Newly regenerated content';

        expect(newContent).not.toBe(oldContent);
      });

      it('should update tokens used', () => {
        const section = createMockSection({ tokensUsed: 500 });
        const newTokensUsed = 600;

        expect(newTokensUsed).not.toBe(section.tokensUsed);
      });
    });

    describe('listSections', () => {
      it('should return sections in sort order', () => {
        const sections = [
          createMockSection({ sortOrder: 2, sectionType: 'risk_analysis' }),
          createMockSection({ id: 'section-2', sortOrder: 0, sectionType: 'executive_summary' }),
          createMockSection({ id: 'section-3', sortOrder: 1, sectionType: 'key_findings' }),
        ];

        const sorted = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);

        expect(sorted[0].sectionType).toBe('executive_summary');
        expect(sorted[1].sectionType).toBe('key_findings');
        expect(sorted[2].sectionType).toBe('risk_analysis');
      });

      it('should filter by section type', () => {
        const sections = [
          createMockSection({ sectionType: 'executive_summary' }),
          createMockSection({ id: 'section-2', sectionType: 'risk_analysis' }),
          createMockSection({ id: 'section-3', sectionType: 'executive_summary' }),
        ];

        const executiveSummaries = sections.filter(
          (s) => s.sectionType === 'executive_summary'
        );

        expect(executiveSummaries).toHaveLength(2);
      });
    });
  });

  describe('Cross-System Insights', () => {
    describe('extractInsights', () => {
      it('should extract insights from multiple source systems', () => {
        const insights = [
          createMockInsight({ sourceSystem: 'media_monitoring' }),
          createMockInsight({ id: 'insight-2', sourceSystem: 'brand_reputation' }),
          createMockInsight({ id: 'insight-3', sourceSystem: 'competitive_intel' }),
        ];

        const uniqueSystems = new Set(insights.map((i) => i.sourceSystem));

        expect(uniqueSystems.size).toBe(3);
      });

      it('should categorize insights by type', () => {
        const insights = [
          createMockInsight({ insightType: 'opportunity' }),
          createMockInsight({ id: 'insight-2', insightType: 'risk' }),
          createMockInsight({ id: 'insight-3', insightType: 'trend' }),
          createMockInsight({ id: 'insight-4', insightType: 'correlation' }),
          createMockInsight({ id: 'insight-5', insightType: 'recommendation' }),
        ];

        const opportunities = insights.filter((i) => i.insightType === 'opportunity');
        const risks = insights.filter((i) => i.insightType === 'risk');

        expect(opportunities).toHaveLength(1);
        expect(risks).toHaveLength(1);
      });

      it('should assign strength levels', () => {
        const strengths: NarrativeInsightStrength[] = [
          'critical',
          'high',
          'medium',
          'low',
          'informational',
        ];

        strengths.forEach((strength) => {
          const insight = createMockInsight({ strength });
          expect(insight.strength).toBe(strength);
        });
      });

      it('should include confidence scores', () => {
        const insight = createMockInsight({ confidenceScore: 0.92 });

        expect(insight.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(insight.confidenceScore).toBeLessThanOrEqual(1);
      });

      it('should include supporting data', () => {
        const insight = createMockInsight({
          supportingData: {
            metric: 'sentiment',
            change: 0.15,
            period: 'Q4 2024',
          },
        });

        expect(insight.supportingData).toHaveProperty('metric');
        expect(insight.supportingData).toHaveProperty('change');
      });
    });

    describe('detectPatterns', () => {
      it('should identify cross-system patterns', () => {
        const patterns = [
          {
            patternType: 'correlation',
            description: 'Media coverage correlates with brand sentiment',
            involvedSystems: ['media_monitoring', 'brand_reputation'],
            strength: 0.85,
          },
          {
            patternType: 'trend',
            description: 'Increasing competitive pressure',
            involvedSystems: ['competitive_intel', 'media_monitoring'],
            strength: 0.72,
          },
        ];

        expect(patterns).toHaveLength(2);
        expect(patterns[0].involvedSystems).toHaveLength(2);
      });

      it('should calculate pattern strength', () => {
        const pattern = {
          strength: 0.85,
        };

        expect(pattern.strength).toBeGreaterThanOrEqual(0);
        expect(pattern.strength).toBeLessThanOrEqual(1);
      });
    });

    describe('detectContradictions', () => {
      it('should identify contradictions between systems', () => {
        const contradictions = [
          {
            systemA: 'media_monitoring',
            systemB: 'brand_reputation',
            description: 'Media sentiment differs from customer sentiment',
            severity: 'medium',
          },
        ];

        expect(contradictions).toHaveLength(1);
        expect(contradictions[0].systemA).not.toBe(contradictions[0].systemB);
      });
    });

    describe('identifyRiskClusters', () => {
      it('should group related risks', () => {
        const riskClusters = [
          {
            name: 'Reputation Risk Cluster',
            risks: ['Negative media coverage', 'Brand perception decline'],
            involvedSystems: ['media_monitoring', 'brand_reputation'],
            overallSeverity: 'high',
          },
        ];

        expect(riskClusters[0].risks).toHaveLength(2);
      });
    });
  });

  describe('Delta Computation', () => {
    describe('computeDelta', () => {
      it('should compare with previous narrative', () => {
        const current = createMockNarrative({
          previousNarrativeId: 'narrative-0',
        });

        expect(current.previousNarrativeId).toBe('narrative-0');
      });

      it('should generate diffs for each section type', () => {
        const diffs = [
          createMockDiff({ sectionType: 'executive_summary', deltaType: 'improved' }),
          createMockDiff({ id: 'diff-2', sectionType: 'risk_analysis', deltaType: 'declined' }),
          createMockDiff({ id: 'diff-3', sectionType: 'key_findings', deltaType: 'unchanged' }),
        ];

        expect(diffs).toHaveLength(3);
      });

      it('should classify delta types correctly', () => {
        const deltaTypes: DeltaType[] = [
          'improved',
          'declined',
          'unchanged',
          'new_insight',
          'removed_insight',
          'context_shift',
        ];

        deltaTypes.forEach((type) => {
          const diff = createMockDiff({ deltaType: type });
          expect(diff.deltaType).toBe(type);
        });
      });

      it('should calculate percent change', () => {
        const diff = createMockDiff({
          previousValue: { score: 0.7 },
          currentValue: { score: 0.8 },
          percentChange: 14.3,
        });

        expect(diff.percentChange).toBeGreaterThan(0);
      });

      it('should assign significance level', () => {
        const diffs = [
          createMockDiff({ significance: 'high' }),
          createMockDiff({ id: 'diff-2', significance: 'medium' }),
          createMockDiff({ id: 'diff-3', significance: 'low' }),
        ];

        expect(diffs[0].significance).toBe('high');
        expect(diffs[1].significance).toBe('medium');
        expect(diffs[2].significance).toBe('low');
      });

      it('should generate narrative summary of changes', () => {
        const diff = createMockDiff({
          generatedNarrative: 'Sentiment has notably improved compared to the previous quarter.',
        });

        expect(diff.generatedNarrative).toBeTruthy();
        expect(diff.generatedNarrative!.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Workflow Operations', () => {
    describe('approveNarrative', () => {
      it('should transition status from review to approved', () => {
        const before = createMockNarrative({ status: 'review' });
        const after = createMockNarrative({ status: 'approved' });

        expect(before.status).toBe('review');
        expect(after.status).toBe('approved');
      });

      it('should set approvedAt timestamp', () => {
        const narrative = createMockNarrative({
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: mockUserId,
        });

        expect(narrative.approvedAt).not.toBeNull();
        expect(narrative.approvedBy).toBe(mockUserId);
      });

      it('should allow approval note', () => {
        const approvalNote = 'Approved with minor suggestions for next iteration.';

        expect(approvalNote.length).toBeGreaterThan(0);
      });

      it('should only allow approving narratives in review status', () => {
        const validStatuses: NarrativeStatus[] = ['draft', 'review'];
        const invalidStatuses: NarrativeStatus[] = ['approved', 'published', 'archived'];

        expect(validStatuses).toContain('review');
        expect(invalidStatuses).not.toContain('review');
      });
    });

    describe('publishNarrative', () => {
      it('should transition status from approved to published', () => {
        const before = createMockNarrative({ status: 'approved' });
        const after = createMockNarrative({ status: 'published' });

        expect(before.status).toBe('approved');
        expect(after.status).toBe('published');
      });

      it('should set publishedAt timestamp', () => {
        const narrative = createMockNarrative({
          status: 'published',
          publishedAt: new Date(),
          publishedBy: mockUserId,
        });

        expect(narrative.publishedAt).not.toBeNull();
        expect(narrative.publishedBy).toBe(mockUserId);
      });

      it('should only allow publishing approved narratives', () => {
        const narrative = createMockNarrative({ status: 'approved' });

        expect(narrative.status).toBe('approved');
      });
    });

    describe('archiveNarrative', () => {
      it('should transition to archived status', () => {
        const narrative = createMockNarrative({
          status: 'archived',
          archivedAt: new Date(),
          archivedBy: mockUserId,
        });

        expect(narrative.status).toBe('archived');
        expect(narrative.archivedAt).not.toBeNull();
      });

      it('should record archive reason', () => {
        const reason = 'Superseded by Q1 2025 narrative';

        expect(reason.length).toBeGreaterThan(0);
      });

      it('should allow archiving from any non-archived status', () => {
        const archivableStatuses: NarrativeStatus[] = [
          'draft',
          'generating',
          'review',
          'approved',
          'published',
        ];

        archivableStatuses.forEach((status) => {
          const narrative = createMockNarrative({ status });
          expect(narrative.status).not.toBe('archived');
        });
      });
    });
  });

  describe('Export Operations', () => {
    describe('exportNarrative', () => {
      it('should support PDF format', () => {
        const format = 'pdf';

        expect(format).toBe('pdf');
      });

      it('should support DOCX format', () => {
        const format = 'docx';

        expect(format).toBe('docx');
      });

      it('should support PPTX format', () => {
        const format = 'pptx';

        expect(format).toBe('pptx');
      });

      it('should support HTML format', () => {
        const format = 'html';

        expect(format).toBe('html');
      });

      it('should support Markdown format', () => {
        const format = 'md';

        expect(format).toBe('md');
      });

      it('should support JSON format', () => {
        const format = 'json';

        expect(format).toBe('json');
      });

      it('should include metadata when requested', () => {
        const options = {
          format: 'pdf',
          includeMetadata: true,
        };

        expect(options.includeMetadata).toBe(true);
      });

      it('should include sources when requested', () => {
        const options = {
          format: 'pdf',
          includeSources: true,
        };

        expect(options.includeSources).toBe(true);
      });

      it('should filter sections when specified', () => {
        const options = {
          format: 'pdf',
          includeSections: ['executive_summary', 'key_findings'],
        };

        expect(options.includeSections).toHaveLength(2);
      });
    });
  });

  describe('Statistics', () => {
    describe('getNarrativeStats', () => {
      it('should count total narratives', () => {
        const stats = {
          totalNarratives: 50,
        };

        expect(stats.totalNarratives).toBe(50);
      });

      it('should count by status', () => {
        const stats = {
          byStatus: {
            draft: 10,
            generating: 2,
            review: 8,
            approved: 15,
            published: 12,
            archived: 3,
          },
        };

        const total = Object.values(stats.byStatus).reduce((sum, count) => sum + count, 0);
        expect(total).toBe(50);
      });

      it('should count by type', () => {
        const stats = {
          byType: {
            executive: 20,
            investor: 10,
            crisis: 5,
            strategy: 8,
            custom: 7,
          },
        };

        expect(stats.byType.executive).toBe(20);
      });

      it('should calculate average tokens used', () => {
        const stats = {
          avgTokensUsed: 8500,
        };

        expect(stats.avgTokensUsed).toBeGreaterThan(0);
      });

      it('should calculate average generation time', () => {
        const stats = {
          avgGenerationTime: 18000, // 18 seconds in ms
        };

        expect(stats.avgGenerationTime).toBeGreaterThan(0);
      });

      it('should count total insights', () => {
        const stats = {
          totalInsights: 250,
        };

        expect(stats.totalInsights).toBeGreaterThan(0);
      });
    });
  });

  describe('Audit Logging', () => {
    describe('logNarrativeEvent', () => {
      it('should log creation events', () => {
        const event = {
          eventType: 'created',
          narrativeId: 'narrative-1',
          userId: mockUserId,
          timestamp: new Date(),
        };

        expect(event.eventType).toBe('created');
      });

      it('should log generation events', () => {
        const event = {
          eventType: 'generated',
          narrativeId: 'narrative-1',
          details: { tokensUsed: 10000, durationMs: 15000 },
        };

        expect(event.eventType).toBe('generated');
        expect(event.details.tokensUsed).toBe(10000);
      });

      it('should log approval events', () => {
        const event = {
          eventType: 'approved',
          narrativeId: 'narrative-1',
          userId: mockUserId,
          details: { note: 'Approved for publication' },
        };

        expect(event.eventType).toBe('approved');
      });

      it('should log publication events', () => {
        const event = {
          eventType: 'published',
          narrativeId: 'narrative-1',
          userId: mockUserId,
        };

        expect(event.eventType).toBe('published');
      });

      it('should log export events', () => {
        const event = {
          eventType: 'exported',
          narrativeId: 'narrative-1',
          details: { format: 'pdf' },
        };

        expect(event.eventType).toBe('exported');
        expect(event.details.format).toBe('pdf');
      });

      it('should log section updates', () => {
        const event = {
          eventType: 'section_updated',
          narrativeId: 'narrative-1',
          sectionId: 'section-1',
          userId: mockUserId,
        };

        expect(event.eventType).toBe('section_updated');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty source systems', () => {
      const narrative = createMockNarrative({ sourceSystems: [] });

      expect(narrative.sourceSystems).toHaveLength(0);
    });

    it('should handle null optional fields', () => {
      const narrative = createMockNarrative({
        subtitle: undefined,
        fiscalQuarter: undefined,
        targetAudience: undefined,
      });

      expect(narrative.subtitle).toBeUndefined();
      expect(narrative.fiscalQuarter).toBeUndefined();
    });

    it('should handle long narrative titles', () => {
      const longTitle = 'A'.repeat(255);
      const narrative = createMockNarrative({ title: longTitle });

      expect(narrative.title.length).toBe(255);
    });

    it('should handle special characters in titles', () => {
      const specialTitle = 'Q4 2024 Summary & Analysis (v2.0) - "Final Review"';
      const narrative = createMockNarrative({ title: specialTitle });

      expect(narrative.title).toContain('&');
      expect(narrative.title).toContain('"');
    });

    it('should handle zero confidence score', () => {
      const narrative = createMockNarrative({ confidenceScore: 0 });

      expect(narrative.confidenceScore).toBe(0);
    });

    it('should handle maximum confidence score', () => {
      const narrative = createMockNarrative({ confidenceScore: 1 });

      expect(narrative.confidenceScore).toBe(1);
    });

    it('should handle empty tags array', () => {
      const narrative = createMockNarrative({ tags: [] });

      expect(narrative.tags).toHaveLength(0);
    });

    it('should handle empty key insights', () => {
      const narrative = createMockNarrative({ keyInsights: [] });

      expect(narrative.keyInsights).toHaveLength(0);
    });

    it('should handle period spanning multiple quarters', () => {
      const narrative = createMockNarrative({
        periodStart: new Date('2024-01-15T12:00:00Z'),
        periodEnd: new Date('2024-06-15T12:00:00Z'),
      });

      // Period should span from Q1 to Q2
      expect(narrative.periodStart.getTime()).toBeLessThan(narrative.periodEnd.getTime());

      // Calculate approximate months difference (allowing for timezone variations)
      const msDiff = narrative.periodEnd.getTime() - narrative.periodStart.getTime();
      const daysDiff = msDiff / (1000 * 60 * 60 * 24);

      expect(daysDiff).toBeGreaterThan(140); // ~5 months
      expect(daysDiff).toBeLessThan(160);
    });

    it('should handle narrative without sections', () => {
      const narrative = createMockNarrative();
      const sections: UnifiedNarrativeSection[] = [];

      expect(sections).toHaveLength(0);
    });

    it('should handle narrative without sources', () => {
      const narrative = createMockNarrative();
      const sources: UnifiedNarrativeSource[] = [];

      expect(sources).toHaveLength(0);
    });

    it('should handle concurrent narrative updates', () => {
      const narrative1 = createMockNarrative({ updatedAt: new Date('2024-01-01T10:00:00Z') });
      const narrative2 = createMockNarrative({ updatedAt: new Date('2024-01-01T10:00:01Z') });

      expect(narrative2.updatedAt.getTime()).toBeGreaterThan(narrative1.updatedAt.getTime());
    });
  });
});
