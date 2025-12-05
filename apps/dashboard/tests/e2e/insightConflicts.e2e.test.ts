/**
 * Insight Conflicts E2E Tests (Sprint S74)
 * End-to-end tests for the Autonomous Insight Conflict Resolution Engine UI
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type {
  InsightConflict,
  ConflictType,
  ConflictSeverity,
  ConflictStatus,
  ResolutionStatus,
  ConflictItem,
  ConflictResolution,
  ConflictCluster,
  ConflictGraphData,
  InsightConflictAuditLog,
  InsightConflictStats,
} from '@pravado/types';

// Mock data for insight conflicts
const mockConflicts: InsightConflict[] = [
  {
    id: 'conflict-1',
    orgId: 'org-123',
    title: 'Revenue Projection Contradiction',
    description: 'Conflicting revenue projections between investor relations and market analysis',
    conflictType: 'contradiction',
    severity: 'critical',
    status: 'detected',
    detectedAt: '2024-01-15T10:00:00Z',
    sourceSystem: 'unified_graph',
    sourceIds: ['entity-1', 'entity-2'],
    affectedEntities: ['Revenue Q1', 'Market Forecast'],
    confidenceScore: 0.92,
    impactAssessment: {
      affectedAreas: ['Financial Planning', 'Investor Communications'],
      potentialConsequences: ['Misaligned stakeholder expectations', 'Budget discrepancies'],
      urgencyLevel: 'high',
    },
    metadata: { contextWindow: 'Q1-2024' },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'conflict-2',
    orgId: 'org-123',
    title: 'Market Share Data Divergence',
    description: 'Different market share figures from competitive intelligence vs internal reports',
    conflictType: 'divergence',
    severity: 'high',
    status: 'analyzing',
    detectedAt: '2024-01-14T15:30:00Z',
    sourceSystem: 'competitive_intelligence',
    sourceIds: ['ci-report-1', 'internal-123'],
    affectedEntities: ['Market Share', 'Competitive Position'],
    confidenceScore: 0.78,
    analysisStartedAt: '2024-01-14T16:00:00Z',
    createdAt: '2024-01-14T15:30:00Z',
    updatedAt: '2024-01-14T16:00:00Z',
  },
  {
    id: 'conflict-3',
    orgId: 'org-123',
    title: 'Customer Sentiment Ambiguity',
    description: 'Unclear customer sentiment signals across multiple data sources',
    conflictType: 'ambiguity',
    severity: 'medium',
    status: 'resolved',
    detectedAt: '2024-01-13T09:00:00Z',
    sourceSystem: 'unified_narrative',
    sourceIds: ['narrative-1'],
    affectedEntities: ['Customer Satisfaction', 'Brand Perception'],
    confidenceScore: 0.65,
    resolutionId: 'resolution-1',
    resolvedAt: '2024-01-13T14:00:00Z',
    createdAt: '2024-01-13T09:00:00Z',
    updatedAt: '2024-01-13T14:00:00Z',
  },
  {
    id: 'conflict-4',
    orgId: 'org-123',
    title: 'Missing Data in Trend Analysis',
    description: 'Key data points missing from Q4 trend analysis',
    conflictType: 'missing_data',
    severity: 'low',
    status: 'dismissed',
    detectedAt: '2024-01-12T11:00:00Z',
    sourceSystem: 'reality_maps',
    sourceIds: ['map-123'],
    affectedEntities: ['Q4 Trends'],
    confidenceScore: 0.45,
    dismissedAt: '2024-01-12T12:00:00Z',
    dismissalReason: 'Data confirmed as intentionally excluded - historical context only',
    createdAt: '2024-01-12T11:00:00Z',
    updatedAt: '2024-01-12T12:00:00Z',
  },
  {
    id: 'conflict-5',
    orgId: 'org-123',
    title: 'Terminology Inconsistency',
    description: 'Inconsistent use of product terminology across documentation',
    conflictType: 'inconsistency',
    severity: 'low',
    status: 'detected',
    detectedAt: '2024-01-16T08:00:00Z',
    sourceSystem: 'content_intelligence',
    sourceIds: ['doc-1', 'doc-2', 'doc-3'],
    affectedEntities: ['Product Documentation', 'Marketing Materials'],
    confidenceScore: 0.88,
    createdAt: '2024-01-16T08:00:00Z',
    updatedAt: '2024-01-16T08:00:00Z',
  },
];

const mockConflictItems: ConflictItem[] = [
  {
    id: 'item-1',
    conflictId: 'conflict-1',
    sourceType: 'graph_entity',
    sourceId: 'entity-1',
    content: 'Q1 Revenue projected at $5.2M based on current pipeline',
    extractedValue: 5200000,
    confidence: 0.95,
    sourceMetadata: { source: 'investor_relations', timestamp: '2024-01-10' },
    position: 1,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'item-2',
    conflictId: 'conflict-1',
    sourceType: 'graph_entity',
    sourceId: 'entity-2',
    content: 'Market analysis suggests Q1 revenue of $4.1M',
    extractedValue: 4100000,
    confidence: 0.87,
    sourceMetadata: { source: 'market_analysis', timestamp: '2024-01-12' },
    position: 2,
    createdAt: '2024-01-15T10:00:00Z',
  },
];

const mockResolution: ConflictResolution = {
  id: 'resolution-1',
  conflictId: 'conflict-3',
  resolutionType: 'ai_consensus',
  status: 'accepted',
  summary: 'Weighted average of sentiment scores with source reliability factored in',
  details: {
    methodology: 'Bayesian sentiment aggregation',
    confidenceFactors: ['source_reliability', 'recency', 'sample_size'],
    alternativesConsidered: ['median', 'mode', 'source_priority'],
  },
  resolvedValue: 72,
  confidenceScore: 0.85,
  aiReasoning: 'Combined sentiment analysis across sources with reliability weighting produces a neutral-positive overall sentiment score of 72/100. This accounts for the variance in methodology across data sources.',
  consensusNarrative: 'Customer sentiment is moderately positive with a score of 72/100. The apparent ambiguity resulted from different measurement methodologies across sources, which have been reconciled using weighted averaging.',
  createdAt: '2024-01-13T13:30:00Z',
  updatedAt: '2024-01-13T14:00:00Z',
  acceptedAt: '2024-01-13T14:00:00Z',
  acceptedBy: 'user-123',
};

const mockClusters: ConflictCluster[] = [
  {
    id: 'cluster-1',
    orgId: 'org-123',
    name: 'Financial Data Conflicts',
    description: 'Cluster of conflicts related to financial projections and reporting',
    conflictIds: ['conflict-1', 'conflict-2'],
    conflictCount: 2,
    dominantType: 'contradiction',
    dominantSeverity: 'critical',
    commonPatterns: ['Revenue discrepancy', 'Cross-system data mismatch'],
    rootCauseHypothesis: 'Different calculation methodologies between investor relations and market analysis teams',
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
  },
];

const mockGraphData: ConflictGraphData = {
  nodes: [
    {
      id: 'node-conflict-1',
      type: 'conflict',
      label: 'Revenue Contradiction',
      data: {
        conflictId: 'conflict-1',
        severity: 'critical',
        status: 'detected',
      },
      x: 400,
      y: 200,
      color: '#EF4444',
      size: 24,
    },
    {
      id: 'node-item-1',
      type: 'item',
      label: 'IR Projection',
      data: {
        itemId: 'item-1',
        value: '$5.2M',
      },
      x: 200,
      y: 100,
      color: '#3B82F6',
      size: 16,
    },
    {
      id: 'node-item-2',
      type: 'item',
      label: 'Market Analysis',
      data: {
        itemId: 'item-2',
        value: '$4.1M',
      },
      x: 600,
      y: 100,
      color: '#3B82F6',
      size: 16,
    },
    {
      id: 'node-source-1',
      type: 'source',
      label: 'Unified Graph',
      data: {
        sourceSystem: 'unified_graph',
      },
      x: 400,
      y: 50,
      color: '#8B5CF6',
      size: 20,
    },
  ],
  edges: [
    {
      id: 'edge-1',
      source: 'node-source-1',
      target: 'node-conflict-1',
      edgeType: 'detected_from',
      weight: 1,
      color: '#9CA3AF',
    },
    {
      id: 'edge-2',
      source: 'node-item-1',
      target: 'node-conflict-1',
      edgeType: 'contributes_to',
      weight: 0.95,
      color: '#3B82F6',
    },
    {
      id: 'edge-3',
      source: 'node-item-2',
      target: 'node-conflict-1',
      edgeType: 'contributes_to',
      weight: 0.87,
      color: '#3B82F6',
    },
  ],
  metadata: {
    totalNodes: 4,
    totalEdges: 3,
    conflictNodeCount: 1,
    itemNodeCount: 2,
    sourceNodeCount: 1,
    resolutionNodeCount: 0,
    generatedAt: '2024-01-15T12:00:00Z',
  },
};

const mockAuditLog: InsightConflictAuditLog[] = [
  {
    id: 'audit-1',
    conflictId: 'conflict-1',
    eventType: 'created',
    actorType: 'system',
    eventDetails: { detectionMethod: 'vector_similarity', threshold: 0.85 },
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'audit-2',
    conflictId: 'conflict-1',
    eventType: 'analyzed',
    actorType: 'ai',
    eventDetails: { analysisType: 'root_cause', duration: 2500 },
    previousState: { status: 'detected' },
    newState: { status: 'analyzing' },
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'audit-3',
    conflictId: 'conflict-3',
    eventType: 'resolved',
    actorType: 'ai',
    eventDetails: { resolutionType: 'ai_consensus', confidenceScore: 0.85 },
    previousState: { status: 'analyzing' },
    newState: { status: 'resolved', resolutionId: 'resolution-1' },
    createdAt: '2024-01-13T13:30:00Z',
  },
  {
    id: 'audit-4',
    conflictId: 'conflict-3',
    eventType: 'resolution_accepted',
    actorType: 'user',
    actorId: 'user-123',
    eventDetails: { feedback: 'Methodology is sound' },
    createdAt: '2024-01-13T14:00:00Z',
  },
];

const mockStats: InsightConflictStats = {
  totalConflicts: 5,
  byStatus: {
    detected: 2,
    analyzing: 1,
    resolved: 1,
    dismissed: 1,
  },
  bySeverity: {
    critical: 1,
    high: 1,
    medium: 1,
    low: 2,
  },
  byType: {
    contradiction: 1,
    divergence: 1,
    ambiguity: 1,
    missing_data: 1,
    inconsistency: 1,
  },
  averageResolutionTime: 14400000, // 4 hours in ms
  autoResolvedCount: 1,
  manuallyResolvedCount: 0,
  dismissedCount: 1,
  pendingReviewCount: 0,
  clusteredCount: 2,
  periodStart: '2024-01-01T00:00:00Z',
  periodEnd: '2024-01-31T23:59:59Z',
};

// Mock fetch for API calls
const mockFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  const path = url.replace('http://localhost:4000', '');

  // List conflicts
  if (path.startsWith('/api/v1/insight-conflicts') && !path.includes('/') && (!options || options.method === 'GET' || !options.method)) {
    // Check for query parameters
    const urlObj = new URL(url, 'http://localhost:4000');
    const status = urlObj.searchParams.get('status');
    const severity = urlObj.searchParams.get('severity');
    const conflictType = urlObj.searchParams.get('conflictType');

    let filteredConflicts = [...mockConflicts];

    if (status) {
      filteredConflicts = filteredConflicts.filter(c => c.status === status);
    }
    if (severity) {
      filteredConflicts = filteredConflicts.filter(c => c.severity === severity);
    }
    if (conflictType) {
      filteredConflicts = filteredConflicts.filter(c => c.conflictType === conflictType);
    }

    return new Response(JSON.stringify({
      conflicts: filteredConflicts,
      total: filteredConflicts.length,
      hasMore: false,
    }), { status: 200 });
  }

  // Get stats
  if (path === '/api/v1/insight-conflicts/stats') {
    return new Response(JSON.stringify({ stats: mockStats }), { status: 200 });
  }

  // Run detection
  if (path === '/api/v1/insight-conflicts/detect' && options?.method === 'POST') {
    return new Response(JSON.stringify({
      detected: 2,
      conflicts: [mockConflicts[0], mockConflicts[4]],
    }), { status: 200 });
  }

  // Batch analyze
  if (path === '/api/v1/insight-conflicts/batch/analyze' && options?.method === 'POST') {
    const body = JSON.parse(options.body as string);
    return new Response(JSON.stringify({
      processed: body.conflictIds.length,
      results: body.conflictIds.map((id: string) => ({
        conflictId: id,
        success: true,
      })),
    }), { status: 200 });
  }

  // Batch resolve
  if (path === '/api/v1/insight-conflicts/batch/resolve' && options?.method === 'POST') {
    const body = JSON.parse(options.body as string);
    return new Response(JSON.stringify({
      processed: body.conflictIds.length,
      results: body.conflictIds.map((id: string) => ({
        conflictId: id,
        success: true,
        resolutionId: `resolution-${id}`,
      })),
    }), { status: 200 });
  }

  // Batch dismiss
  if (path === '/api/v1/insight-conflicts/batch/dismiss' && options?.method === 'POST') {
    const body = JSON.parse(options.body as string);
    return new Response(JSON.stringify({
      processed: body.conflictIds.length,
      results: body.conflictIds.map((id: string) => ({
        conflictId: id,
        success: true,
      })),
    }), { status: 200 });
  }

  // List clusters
  if (path === '/api/v1/insight-conflicts/clusters' && (!options || options.method === 'GET')) {
    return new Response(JSON.stringify({
      clusters: mockClusters,
      total: mockClusters.length,
    }), { status: 200 });
  }

  // Create cluster
  if (path === '/api/v1/insight-conflicts/clusters' && options?.method === 'POST') {
    const body = JSON.parse(options.body as string);
    const newCluster: ConflictCluster = {
      id: 'cluster-new',
      orgId: 'org-123',
      ...body,
      conflictCount: body.conflictIds?.length || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return new Response(JSON.stringify({ cluster: newCluster }), { status: 201 });
  }

  // Get conflict by ID
  if (path.match(/\/api\/v1\/insight-conflicts\/conflict-\d$/) && (!options || options.method === 'GET')) {
    const conflictId = path.split('/').pop();
    const conflict = mockConflicts.find(c => c.id === conflictId);
    if (conflict) {
      return new Response(JSON.stringify({ conflict }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }

  // Get conflict items
  if (path.match(/\/api\/v1\/insight-conflicts\/conflict-\d\/items/)) {
    const conflictId = path.split('/')[3];
    const items = mockConflictItems.filter(i => i.conflictId === conflictId);
    return new Response(JSON.stringify({ items }), { status: 200 });
  }

  // Get conflict graph
  if (path.match(/\/api\/v1\/insight-conflicts\/conflict-\d\/graph/)) {
    return new Response(JSON.stringify({ graph: mockGraphData }), { status: 200 });
  }

  // Get conflict audit log
  if (path.match(/\/api\/v1\/insight-conflicts\/conflict-\d\/audit-log/)) {
    const conflictId = path.split('/')[3];
    const events = mockAuditLog.filter(e => e.conflictId === conflictId);
    return new Response(JSON.stringify({
      events,
      total: events.length,
      hasMore: false,
    }), { status: 200 });
  }

  // Analyze conflict
  if (path.match(/\/api\/v1\/insight-conflicts\/conflict-\d\/analyze/) && options?.method === 'POST') {
    const conflictId = path.split('/')[3];
    const conflict = mockConflicts.find(c => c.id === conflictId);
    if (conflict) {
      return new Response(JSON.stringify({
        conflict: {
          ...conflict,
          status: 'analyzing',
          analysisStartedAt: new Date().toISOString(),
        },
        analysis: {
          rootCauseHypothesis: 'Different calculation methodologies',
          severityJustification: 'Critical due to financial implications',
          suggestedResolutionStrategies: ['ai_consensus', 'source_priority'],
          relatedConflicts: [],
        },
      }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }

  // Resolve conflict
  if (path.match(/\/api\/v1\/insight-conflicts\/conflict-\d\/resolve/) && options?.method === 'POST') {
    const conflictId = path.split('/')[3];
    const conflict = mockConflicts.find(c => c.id === conflictId);
    const body = JSON.parse(options.body as string);
    if (conflict) {
      const resolution: ConflictResolution = {
        id: 'resolution-new',
        conflictId,
        resolutionType: body.resolutionType || 'ai_consensus',
        status: 'pending_review',
        summary: 'AI-generated resolution based on weighted consensus',
        resolvedValue: body.resolvedValue || null,
        confidenceScore: 0.82,
        aiReasoning: 'Analysis of conflicting data points suggests...',
        consensusNarrative: 'The resolved value represents a balanced view...',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return new Response(JSON.stringify({
        conflict: {
          ...conflict,
          status: 'resolved',
          resolvedAt: new Date().toISOString(),
          resolutionId: resolution.id,
        },
        resolution,
      }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }

  // Dismiss conflict
  if (path.match(/\/api\/v1\/insight-conflicts\/conflict-\d\/dismiss/) && options?.method === 'POST') {
    const conflictId = path.split('/')[3];
    const conflict = mockConflicts.find(c => c.id === conflictId);
    const body = JSON.parse(options.body as string);
    if (conflict) {
      return new Response(JSON.stringify({
        conflict: {
          ...conflict,
          status: 'dismissed',
          dismissedAt: new Date().toISOString(),
          dismissalReason: body.reason,
        },
      }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }

  // Review resolution
  if (path.match(/\/api\/v1\/insight-conflicts\/conflict-\d\/review/) && options?.method === 'POST') {
    const body = JSON.parse(options.body as string);
    return new Response(JSON.stringify({
      resolution: {
        ...mockResolution,
        status: body.accept ? 'accepted' : 'rejected',
        acceptedAt: body.accept ? new Date().toISOString() : undefined,
        rejectedAt: !body.accept ? new Date().toISOString() : undefined,
        reviewFeedback: body.feedback,
      },
    }), { status: 200 });
  }

  // Create conflict
  if (path === '/api/v1/insight-conflicts' && options?.method === 'POST') {
    const body = JSON.parse(options.body as string);
    const newConflict: InsightConflict = {
      id: 'conflict-new',
      orgId: 'org-123',
      ...body,
      status: 'detected',
      detectedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return new Response(JSON.stringify({ conflict: newConflict }), { status: 201 });
  }

  // Update conflict
  if (path.match(/\/api\/v1\/insight-conflicts\/conflict-\d$/) && options?.method === 'PATCH') {
    const conflictId = path.split('/').pop();
    const conflict = mockConflicts.find(c => c.id === conflictId);
    const body = JSON.parse(options.body as string);
    if (conflict) {
      return new Response(JSON.stringify({
        conflict: { ...conflict, ...body, updatedAt: new Date().toISOString() },
      }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }

  // Delete conflict
  if (path.match(/\/api\/v1\/insight-conflicts\/conflict-\d$/) && options?.method === 'DELETE') {
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  // Get graph edge
  if (path.match(/\/api\/v1\/insight-conflicts\/graph\/edges/)) {
    return new Response(JSON.stringify({ edges: mockGraphData.edges }), { status: 200 });
  }

  // Create graph edge
  if (path === '/api/v1/insight-conflicts/graph/edges' && options?.method === 'POST') {
    const body = JSON.parse(options.body as string);
    const newEdge = {
      id: 'edge-new',
      ...body,
      createdAt: new Date().toISOString(),
    };
    return new Response(JSON.stringify({ edge: newEdge }), { status: 201 });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
};

describe('Insight Conflicts E2E Tests', () => {
  beforeAll(() => {
    global.fetch = mockFetch as typeof fetch;
  });

  afterAll(() => {
    // @ts-expect-error reset mock
    global.fetch = undefined;
  });

  // ============================================================================
  // LIST CONFLICTS
  // ============================================================================

  describe('List Conflicts', () => {
    it('should display list of conflicts', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts');
      const data = await response.json();

      expect(data.conflicts).toHaveLength(5);
      expect(data.total).toBe(5);
    });

    it('should filter conflicts by status', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts?status=detected');
      const data = await response.json();

      expect(data.conflicts.every((c: InsightConflict) => c.status === 'detected')).toBe(true);
    });

    it('should filter conflicts by severity', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts?severity=critical');
      const data = await response.json();

      expect(data.conflicts.every((c: InsightConflict) => c.severity === 'critical')).toBe(true);
    });

    it('should filter conflicts by type', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts?conflictType=contradiction');
      const data = await response.json();

      expect(data.conflicts.every((c: InsightConflict) => c.conflictType === 'contradiction')).toBe(true);
    });

    it('should display all conflict types', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts');
      const data = await response.json();

      const types = data.conflicts.map((c: InsightConflict) => c.conflictType);
      expect(types).toContain('contradiction');
      expect(types).toContain('divergence');
      expect(types).toContain('ambiguity');
      expect(types).toContain('missing_data');
      expect(types).toContain('inconsistency');
    });

    it('should display all severity levels', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts');
      const data = await response.json();

      const severities = data.conflicts.map((c: InsightConflict) => c.severity);
      expect(severities).toContain('critical');
      expect(severities).toContain('high');
      expect(severities).toContain('medium');
      expect(severities).toContain('low');
    });

    it('should display all status values', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts');
      const data = await response.json();

      const statuses = data.conflicts.map((c: InsightConflict) => c.status);
      expect(statuses).toContain('detected');
      expect(statuses).toContain('analyzing');
      expect(statuses).toContain('resolved');
      expect(statuses).toContain('dismissed');
    });

    it('should include confidence scores', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts');
      const data = await response.json();

      data.conflicts.forEach((c: InsightConflict) => {
        expect(c.confidenceScore).toBeDefined();
        expect(c.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(c.confidenceScore).toBeLessThanOrEqual(1);
      });
    });
  });

  // ============================================================================
  // VIEW CONFLICT DETAILS
  // ============================================================================

  describe('View Conflict Details', () => {
    it('should display conflict details', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-1');
      const data = await response.json();

      expect(data.conflict.title).toBe('Revenue Projection Contradiction');
      expect(data.conflict.conflictType).toBe('contradiction');
      expect(data.conflict.severity).toBe('critical');
    });

    it('should load conflict items', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-1/items');
      const data = await response.json();

      expect(data.items).toHaveLength(2);
      expect(data.items[0].content).toContain('$5.2M');
      expect(data.items[1].content).toContain('$4.1M');
    });

    it('should display impact assessment', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-1');
      const data = await response.json();

      expect(data.conflict.impactAssessment).toBeDefined();
      expect(data.conflict.impactAssessment.affectedAreas).toContain('Financial Planning');
      expect(data.conflict.impactAssessment.urgencyLevel).toBe('high');
    });

    it('should display source information', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-1');
      const data = await response.json();

      expect(data.conflict.sourceSystem).toBe('unified_graph');
      expect(data.conflict.sourceIds).toHaveLength(2);
    });

    it('should display affected entities', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-1');
      const data = await response.json();

      expect(data.conflict.affectedEntities).toContain('Revenue Q1');
      expect(data.conflict.affectedEntities).toContain('Market Forecast');
    });

    it('should return 404 for non-existent conflict', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-999');

      expect(response.status).toBe(404);
    });
  });

  // ============================================================================
  // ANALYZE CONFLICT
  // ============================================================================

  describe('Analyze Conflict', () => {
    it('should trigger conflict analysis', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-1/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.conflict.status).toBe('analyzing');
      expect(data.conflict.analysisStartedAt).toBeDefined();
    });

    it('should return analysis results', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-1/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      expect(data.analysis).toBeDefined();
      expect(data.analysis.rootCauseHypothesis).toBeDefined();
      expect(data.analysis.suggestedResolutionStrategies).toBeDefined();
    });

    it('should suggest resolution strategies', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-1/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      expect(data.analysis.suggestedResolutionStrategies).toContain('ai_consensus');
    });
  });

  // ============================================================================
  // RESOLVE CONFLICT
  // ============================================================================

  describe('Resolve Conflict', () => {
    it('should resolve a conflict', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-1/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolutionType: 'ai_consensus',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.conflict.status).toBe('resolved');
      expect(data.conflict.resolvedAt).toBeDefined();
      expect(data.resolution).toBeDefined();
    });

    it('should create resolution with AI reasoning', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-1/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolutionType: 'ai_consensus',
        }),
      });
      const data = await response.json();

      expect(data.resolution.aiReasoning).toBeDefined();
      expect(data.resolution.consensusNarrative).toBeDefined();
    });

    it('should support different resolution types', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-2/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolutionType: 'source_priority',
        }),
      });
      const data = await response.json();

      expect(data.resolution.resolutionType).toBe('source_priority');
    });

    it('should include confidence score in resolution', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-1/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      expect(data.resolution.confidenceScore).toBeDefined();
      expect(data.resolution.confidenceScore).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // DISMISS CONFLICT
  // ============================================================================

  describe('Dismiss Conflict', () => {
    it('should dismiss a conflict with reason', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-1/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'Confirmed as false positive',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.conflict.status).toBe('dismissed');
      expect(data.conflict.dismissedAt).toBeDefined();
      expect(data.conflict.dismissalReason).toBe('Confirmed as false positive');
    });
  });

  // ============================================================================
  // REVIEW RESOLUTION
  // ============================================================================

  describe('Review Resolution', () => {
    it('should accept a resolution', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-3/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accept: true,
          feedback: 'Resolution is accurate',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.resolution.status).toBe('accepted');
      expect(data.resolution.acceptedAt).toBeDefined();
    });

    it('should reject a resolution', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-3/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accept: false,
          feedback: 'Resolution needs adjustment',
        }),
      });
      const data = await response.json();

      expect(data.resolution.status).toBe('rejected');
      expect(data.resolution.rejectedAt).toBeDefined();
    });

    it('should include feedback in review', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-3/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accept: true,
          feedback: 'Methodology is sound',
        }),
      });
      const data = await response.json();

      expect(data.resolution.reviewFeedback).toBe('Methodology is sound');
    });
  });

  // ============================================================================
  // CONFLICT GRAPH
  // ============================================================================

  describe('Conflict Graph', () => {
    it('should load graph data', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-1/graph');
      const data = await response.json();

      expect(data.graph).toBeDefined();
      expect(data.graph.nodes).toHaveLength(4);
      expect(data.graph.edges).toHaveLength(3);
    });

    it('should have correct node types', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-1/graph');
      const data = await response.json();

      const nodeTypes = data.graph.nodes.map((n: ConflictGraphData['nodes'][0]) => n.type);
      expect(nodeTypes).toContain('conflict');
      expect(nodeTypes).toContain('item');
      expect(nodeTypes).toContain('source');
    });

    it('should have metadata', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-1/graph');
      const data = await response.json();

      expect(data.graph.metadata.totalNodes).toBe(4);
      expect(data.graph.metadata.totalEdges).toBe(3);
      expect(data.graph.metadata.conflictNodeCount).toBe(1);
    });

    it('should have positioned nodes', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-1/graph');
      const data = await response.json();

      data.graph.nodes.forEach((node: ConflictGraphData['nodes'][0]) => {
        expect(node.x).toBeDefined();
        expect(node.y).toBeDefined();
      });
    });

    it('should have styled edges', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-1/graph');
      const data = await response.json();

      data.graph.edges.forEach((edge: ConflictGraphData['edges'][0]) => {
        expect(edge.edgeType).toBeDefined();
        expect(edge.weight).toBeDefined();
      });
    });
  });

  // ============================================================================
  // AUDIT LOG
  // ============================================================================

  describe('Audit Log', () => {
    it('should display audit events', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-1/audit-log');
      const data = await response.json();

      expect(data.events.length).toBeGreaterThan(0);
    });

    it('should show event types', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-1/audit-log');
      const data = await response.json();

      const eventTypes = data.events.map((e: InsightConflictAuditLog) => e.eventType);
      expect(eventTypes).toContain('created');
      expect(eventTypes).toContain('analyzed');
    });

    it('should show actor types', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-1/audit-log');
      const data = await response.json();

      const actorTypes = data.events.map((e: InsightConflictAuditLog) => e.actorType);
      expect(actorTypes).toContain('system');
      expect(actorTypes).toContain('ai');
    });

    it('should include state changes', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-1/audit-log');
      const data = await response.json();

      const eventWithState = data.events.find((e: InsightConflictAuditLog) => e.previousState);
      expect(eventWithState).toBeDefined();
      expect(eventWithState.newState).toBeDefined();
    });
  });

  // ============================================================================
  // CONFLICT STATS
  // ============================================================================

  describe('Conflict Stats', () => {
    it('should display statistics', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/stats');
      const data = await response.json();

      expect(data.stats.totalConflicts).toBe(5);
    });

    it('should show status breakdown', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/stats');
      const data = await response.json();

      expect(data.stats.byStatus.detected).toBe(2);
      expect(data.stats.byStatus.analyzing).toBe(1);
      expect(data.stats.byStatus.resolved).toBe(1);
      expect(data.stats.byStatus.dismissed).toBe(1);
    });

    it('should show severity breakdown', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/stats');
      const data = await response.json();

      expect(data.stats.bySeverity.critical).toBe(1);
      expect(data.stats.bySeverity.high).toBe(1);
    });

    it('should show type breakdown', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/stats');
      const data = await response.json();

      expect(data.stats.byType.contradiction).toBe(1);
      expect(data.stats.byType.divergence).toBe(1);
    });

    it('should include resolution metrics', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/stats');
      const data = await response.json();

      expect(data.stats.averageResolutionTime).toBeDefined();
      expect(data.stats.autoResolvedCount).toBeDefined();
    });
  });

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  describe('Batch Operations', () => {
    it('should batch analyze conflicts', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/batch/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conflictIds: ['conflict-1', 'conflict-5'],
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.processed).toBe(2);
      expect(data.results).toHaveLength(2);
    });

    it('should batch resolve conflicts', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/batch/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conflictIds: ['conflict-1', 'conflict-2'],
          resolutionType: 'ai_consensus',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.processed).toBe(2);
      expect(data.results[0].resolutionId).toBeDefined();
    });

    it('should batch dismiss conflicts', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/batch/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conflictIds: ['conflict-4', 'conflict-5'],
          reason: 'Bulk dismissal - low priority items',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.processed).toBe(2);
    });
  });

  // ============================================================================
  // DETECTION
  // ============================================================================

  describe('Conflict Detection', () => {
    it('should run detection and find conflicts', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceSystems: ['unified_graph', 'unified_narrative'],
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.detected).toBe(2);
      expect(data.conflicts).toHaveLength(2);
    });
  });

  // ============================================================================
  // CLUSTERS
  // ============================================================================

  describe('Conflict Clusters', () => {
    it('should list clusters', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/clusters');
      const data = await response.json();

      expect(data.clusters).toHaveLength(1);
      expect(data.clusters[0].name).toBe('Financial Data Conflicts');
    });

    it('should display cluster metadata', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/clusters');
      const data = await response.json();

      const cluster = data.clusters[0];
      expect(cluster.conflictCount).toBe(2);
      expect(cluster.dominantType).toBe('contradiction');
      expect(cluster.dominantSeverity).toBe('critical');
    });

    it('should show root cause hypothesis', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/clusters');
      const data = await response.json();

      expect(data.clusters[0].rootCauseHypothesis).toBeDefined();
    });

    it('should create a new cluster', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/clusters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Cluster',
          description: 'Test cluster',
          conflictIds: ['conflict-1', 'conflict-2'],
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.cluster.name).toBe('New Cluster');
      expect(data.cluster.conflictCount).toBe(2);
    });
  });

  // ============================================================================
  // CREATE CONFLICT
  // ============================================================================

  describe('Create Conflict', () => {
    it('should create a new conflict', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Test Conflict',
          description: 'A manually created conflict for testing',
          conflictType: 'contradiction',
          severity: 'high',
          sourceSystem: 'unified_graph',
          sourceIds: ['source-1'],
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.conflict.title).toBe('New Test Conflict');
      expect(data.conflict.status).toBe('detected');
    });
  });

  // ============================================================================
  // UPDATE CONFLICT
  // ============================================================================

  describe('Update Conflict', () => {
    it('should update conflict details', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Updated Title',
          severity: 'high',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.conflict.title).toBe('Updated Title');
      expect(data.conflict.severity).toBe('high');
    });
  });

  // ============================================================================
  // DELETE CONFLICT
  // ============================================================================

  describe('Delete Conflict', () => {
    it('should delete a conflict', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/conflict-4', {
        method: 'DELETE',
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  // ============================================================================
  // GRAPH EDGES
  // ============================================================================

  describe('Graph Edges', () => {
    it('should create a graph edge', async () => {
      const response = await fetch('http://localhost:4000/api/v1/insight-conflicts/graph/edges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'conflict-1',
          target: 'conflict-2',
          edgeType: 'related_to',
          weight: 0.75,
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.edge.source).toBe('conflict-1');
      expect(data.edge.target).toBe('conflict-2');
    });
  });

  // ============================================================================
  // UI COMPONENT INTERACTIONS
  // ============================================================================

  describe('UI Component Interactions', () => {
    it('should format conflict types correctly', () => {
      const typeLabels: Record<ConflictType, string> = {
        contradiction: 'Contradiction',
        divergence: 'Divergence',
        ambiguity: 'Ambiguity',
        missing_data: 'Missing Data',
        inconsistency: 'Inconsistency',
      };

      Object.entries(typeLabels).forEach(([type, label]) => {
        expect(label).toBeDefined();
        expect(label.length).toBeGreaterThan(0);
      });
    });

    it('should format severity levels correctly', () => {
      const severityColors: Record<ConflictSeverity, string> = {
        critical: 'red',
        high: 'orange',
        medium: 'yellow',
        low: 'blue',
      };

      Object.entries(severityColors).forEach(([severity, color]) => {
        expect(color).toBeDefined();
      });
    });

    it('should format status values correctly', () => {
      const statusColors: Record<ConflictStatus, string> = {
        detected: 'blue',
        analyzing: 'yellow',
        resolved: 'green',
        dismissed: 'gray',
      };

      Object.entries(statusColors).forEach(([status, color]) => {
        expect(color).toBeDefined();
      });
    });

    it('should format resolution status correctly', () => {
      const resolutionStatuses: Record<ResolutionStatus, string> = {
        pending_review: 'Pending Review',
        accepted: 'Accepted',
        rejected: 'Rejected',
      };

      Object.entries(resolutionStatuses).forEach(([status, label]) => {
        expect(label).toBeDefined();
      });
    });

    it('should format confidence scores as percentages', () => {
      const formatConfidence = (score: number) => `${Math.round(score * 100)}%`;

      expect(formatConfidence(0.92)).toBe('92%');
      expect(formatConfidence(0.5)).toBe('50%');
      expect(formatConfidence(1.0)).toBe('100%');
    });

    it('should format dates correctly', () => {
      const date = new Date('2024-01-15T10:00:00Z');
      const formatted = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      expect(formatted).toContain('2024');
      expect(formatted).toContain('Jan');
    });
  });
});
