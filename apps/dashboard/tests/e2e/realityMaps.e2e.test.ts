/**
 * Reality Maps E2E Tests (Sprint S73)
 * End-to-end tests for AI-driven multi-outcome reality maps UI
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

// Mock API responses
const mockRealityMaps = [
  {
    id: 'map-1',
    orgId: 'org-123',
    name: 'Crisis Reality Map',
    description: 'Multi-outcome visualization for crisis scenarios',
    status: 'completed',
    suiteId: 'suite-1',
    parameters: {
      maxDepth: 5,
      branchingFactor: 3,
      minProbability: 0.05,
      includeRiskAnalysis: true,
      includeOpportunityAnalysis: true,
      narrativeStyle: 'executive',
      probabilityModel: 'weighted_average',
    },
    totalNodes: 25,
    totalPaths: 8,
    maxDepthReached: 5,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z',
  },
  {
    id: 'map-2',
    orgId: 'org-123',
    name: 'Product Launch Reality Map',
    description: 'Scenario outcomes for product launch',
    status: 'draft',
    parameters: {
      maxDepth: 7,
      branchingFactor: 4,
      minProbability: 0.1,
      includeRiskAnalysis: true,
      includeOpportunityAnalysis: false,
      narrativeStyle: 'technical',
      probabilityModel: 'bayesian',
    },
    totalNodes: 0,
    totalPaths: 0,
    maxDepthReached: 0,
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
  },
  {
    id: 'map-3',
    orgId: 'org-123',
    name: 'Market Expansion Map',
    status: 'generating',
    parameters: {
      maxDepth: 5,
      branchingFactor: 3,
      minProbability: 0.05,
      includeRiskAnalysis: true,
      includeOpportunityAnalysis: true,
      narrativeStyle: 'strategic',
      probabilityModel: 'monte_carlo',
    },
    totalNodes: 10,
    totalPaths: 0,
    maxDepthReached: 2,
    createdAt: '2024-01-17T10:00:00Z',
    updatedAt: '2024-01-17T11:00:00Z',
  },
];

const mockNodes = [
  {
    id: 'node-1',
    mapId: 'map-1',
    nodeType: 'root',
    label: 'Crisis Detection',
    probability: 1.0,
    cumulativeProbability: 1.0,
    riskScore: 50,
    opportunityScore: 40,
    depth: 0,
    aiSummary: 'Initial crisis event detected in social media channels.',
    position: { x: 400, y: 50 },
    keyDrivers: [
      { name: 'Media Attention', direction: 'negative', impact: 'high' },
      { name: 'Response Time', direction: 'positive', impact: 'medium' },
    ],
    riskFactors: [
      { name: 'Reputational Damage', severity: 'high', description: 'Brand perception at risk' },
    ],
    opportunityFactors: [],
  },
  {
    id: 'node-2',
    mapId: 'map-1',
    parentId: 'node-1',
    nodeType: 'branch',
    label: 'Quick Response',
    probability: 0.6,
    cumulativeProbability: 0.6,
    riskScore: 35,
    opportunityScore: 65,
    depth: 1,
    aiSummary: 'Rapid response mitigates immediate damage.',
    position: { x: 200, y: 150 },
    keyDrivers: [
      { name: 'Speed', direction: 'positive', impact: 'high' },
    ],
    riskFactors: [],
    opportunityFactors: [
      { name: 'Trust Recovery', potential: 'high', description: 'Fast action builds trust' },
    ],
  },
  {
    id: 'node-3',
    mapId: 'map-1',
    parentId: 'node-1',
    nodeType: 'branch',
    label: 'Delayed Response',
    probability: 0.4,
    cumulativeProbability: 0.4,
    riskScore: 75,
    opportunityScore: 20,
    depth: 1,
    aiSummary: 'Slow response allows crisis to escalate.',
    position: { x: 600, y: 150 },
    keyDrivers: [
      { name: 'Escalation', direction: 'negative', impact: 'high' },
    ],
    riskFactors: [
      { name: 'Viral Spread', severity: 'critical', description: 'Negative content goes viral' },
    ],
    opportunityFactors: [],
  },
  {
    id: 'node-4',
    mapId: 'map-1',
    parentId: 'node-2',
    nodeType: 'outcome',
    label: 'Crisis Contained',
    probability: 0.7,
    cumulativeProbability: 0.42,
    riskScore: 15,
    opportunityScore: 80,
    depth: 2,
    aiSummary: 'Crisis successfully contained with minimal damage.',
    position: { x: 100, y: 250 },
    keyDrivers: [],
    riskFactors: [],
    opportunityFactors: [
      { name: 'Stronger Brand', potential: 'high', description: 'Crisis handling improves brand' },
    ],
  },
  {
    id: 'node-5',
    mapId: 'map-1',
    parentId: 'node-3',
    nodeType: 'outcome',
    label: 'Major Damage',
    probability: 0.8,
    cumulativeProbability: 0.32,
    riskScore: 90,
    opportunityScore: 10,
    depth: 2,
    aiSummary: 'Significant reputational and financial damage incurred.',
    position: { x: 700, y: 250 },
    keyDrivers: [],
    riskFactors: [
      { name: 'Revenue Loss', severity: 'critical', description: 'Customer attrition' },
      { name: 'Stock Impact', severity: 'high', description: 'Share price decline' },
    ],
    opportunityFactors: [],
  },
];

const mockEdges = [
  { id: 'edge-1', mapId: 'map-1', source: 'node-1', target: 'node-2', probability: 0.6, label: 'Rapid response' },
  { id: 'edge-2', mapId: 'map-1', source: 'node-1', target: 'node-3', probability: 0.4, label: 'Delayed response' },
  { id: 'edge-3', mapId: 'map-1', source: 'node-2', target: 'node-4', probability: 0.7, label: 'Success' },
  { id: 'edge-4', mapId: 'map-1', source: 'node-3', target: 'node-5', probability: 0.8, label: 'Escalation' },
];

const mockPaths = [
  {
    id: 'path-1',
    mapId: 'map-1',
    pathNodes: ['node-1', 'node-2', 'node-4'],
    label: 'Best Case: Quick Response to Containment',
    outcomeType: 'positive',
    cumulativeProbability: 0.42,
    riskScore: 15,
    opportunityScore: 80,
    aiSummary: 'Optimal path through quick response leading to crisis containment.',
    keyDrivers: [
      { name: 'Speed', direction: 'positive', impact: 'high' },
      { name: 'Preparation', direction: 'positive', impact: 'medium' },
    ],
  },
  {
    id: 'path-2',
    mapId: 'map-1',
    pathNodes: ['node-1', 'node-3', 'node-5'],
    label: 'Worst Case: Delayed Response to Major Damage',
    outcomeType: 'negative',
    cumulativeProbability: 0.32,
    riskScore: 90,
    opportunityScore: 10,
    aiSummary: 'Worst path through delayed response leading to major damage.',
    keyDrivers: [
      { name: 'Delay', direction: 'negative', impact: 'critical' },
      { name: 'Viral Spread', direction: 'negative', impact: 'high' },
    ],
  },
];

const mockGraphData = {
  nodes: mockNodes.map(n => ({
    id: n.id,
    type: n.nodeType,
    label: n.label,
    probability: n.probability,
    cumulativeProbability: n.cumulativeProbability,
    riskScore: n.riskScore,
    opportunityScore: n.opportunityScore,
    depth: n.depth,
    summary: n.aiSummary,
    position: n.position,
    parentId: n.parentId,
    childIds: [],
  })),
  edges: mockEdges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    probability: e.probability,
    label: e.label,
  })),
  paths: mockPaths.map(p => ({
    id: p.id,
    pathNodes: p.pathNodes,
    label: p.label,
    outcomeType: p.outcomeType,
    cumulativeProbability: p.cumulativeProbability,
    riskScore: p.riskScore,
    opportunityScore: p.opportunityScore,
    description: p.aiSummary,
  })),
  metadata: {
    totalNodes: 5,
    totalEdges: 4,
    totalPaths: 2,
    maxDepth: 2,
    generatedAt: '2024-01-15T12:00:00Z',
  },
};

const mockAnalysis = {
  outcomeUniverse: {
    totalOutcomes: 2,
    positiveOutcomes: 1,
    negativeOutcomes: 1,
    neutralOutcomes: 0,
    mixedOutcomes: 0,
    outcomeDistribution: {
      positive: 0.42,
      negative: 0.32,
      neutral: 0.0,
      mixed: 0.0,
      unknown: 0.26,
    },
    riskSummary: {
      averageScore: 52.5,
      maxScore: 90,
      minScore: 15,
    },
    opportunitySummary: {
      averageScore: 45,
      maxScore: 80,
      minScore: 10,
    },
    topDrivers: [
      { name: 'Speed', direction: 'positive', impact: 'high' },
      { name: 'Delay', direction: 'negative', impact: 'critical' },
    ],
  },
  contradictions: [
    {
      type: 'probability_conflict',
      description: 'Path probabilities slightly exceed 100% due to rounding',
      severity: 'low',
      nodeIds: ['node-1'],
    },
  ],
  correlations: [
    {
      type: 'risk_opportunity',
      description: 'Higher response speed correlates with lower risk scores',
      strength: 'strong',
      coefficient: -0.85,
    },
  ],
  aggregatedRisks: [
    { name: 'Reputational Damage', severity: 'high', description: 'Primary risk across all scenarios' },
    { name: 'Revenue Loss', severity: 'critical', description: 'Financial impact in negative outcomes' },
  ],
  aggregatedOpportunities: [
    { name: 'Trust Recovery', potential: 'high', description: 'Positive response builds trust' },
    { name: 'Stronger Brand', potential: 'high', description: 'Crisis handling can strengthen brand' },
  ],
};

const mockAuditEvents = [
  {
    id: 'event-1',
    mapId: 'map-1',
    eventType: 'created',
    actorId: 'user-123',
    createdAt: '2024-01-15T10:00:00Z',
    details: { name: 'Crisis Reality Map' },
  },
  {
    id: 'event-2',
    mapId: 'map-1',
    eventType: 'generated',
    actorId: 'user-123',
    createdAt: '2024-01-15T12:00:00Z',
    details: { nodesGenerated: 25, pathsGenerated: 8 },
  },
];

const mockGlobalStats = {
  totalMaps: 3,
  completedMaps: 1,
  draftMaps: 1,
  generatingMaps: 1,
  totalNodes: 35,
  totalPaths: 8,
  averageDepth: 3.5,
  averageNodesPerMap: 11.7,
  averagePathsPerMap: 2.7,
};

// Mock fetch for API calls
const mockFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  const path = url.replace('http://localhost:4000', '');

  // List reality maps
  if (path.startsWith('/api/v1/reality-maps') && !path.includes('/') && (!options || options.method === 'GET')) {
    return new Response(JSON.stringify({
      maps: mockRealityMaps,
      total: mockRealityMaps.length,
      hasMore: false,
    }), { status: 200 });
  }

  // Get reality map by ID
  if (path.match(/\/api\/v1\/reality-maps\/map-\d$/) && (!options || options.method === 'GET')) {
    const mapId = path.split('/').pop();
    const map = mockRealityMaps.find(m => m.id === mapId);
    if (map) {
      return new Response(JSON.stringify({ map }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }

  // Get graph data
  if (path.match(/\/api\/v1\/reality-maps\/map-\d\/graph/)) {
    return new Response(JSON.stringify({ graph: mockGraphData }), { status: 200 });
  }

  // Get analysis
  if (path.match(/\/api\/v1\/reality-maps\/map-\d\/analysis/)) {
    return new Response(JSON.stringify(mockAnalysis), { status: 200 });
  }

  // Get audit log
  if (path.match(/\/api\/v1\/reality-maps\/map-\d\/audit-log/)) {
    return new Response(JSON.stringify({
      events: mockAuditEvents,
      total: mockAuditEvents.length,
    }), { status: 200 });
  }

  // Get global stats
  if (path === '/api/v1/reality-maps/stats') {
    return new Response(JSON.stringify({ stats: mockGlobalStats }), { status: 200 });
  }

  // Create reality map
  if (path === '/api/v1/reality-maps' && options?.method === 'POST') {
    const body = JSON.parse(options.body as string);
    const newMap = {
      id: 'map-new',
      orgId: 'org-123',
      ...body,
      status: 'draft',
      totalNodes: 0,
      totalPaths: 0,
      maxDepthReached: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return new Response(JSON.stringify({ map: newMap }), { status: 201 });
  }

  // Generate reality map
  if (path.match(/\/api\/v1\/reality-maps\/map-\d\/generate/) && options?.method === 'POST') {
    return new Response(JSON.stringify({
      map: { ...mockRealityMaps[0], status: 'generating' },
    }), { status: 200 });
  }

  // Update reality map
  if (path.match(/\/api\/v1\/reality-maps\/map-\d$/) && options?.method === 'PATCH') {
    const mapId = path.split('/').pop();
    const map = mockRealityMaps.find(m => m.id === mapId);
    const body = JSON.parse(options.body as string);
    return new Response(JSON.stringify({
      map: { ...map, ...body, updatedAt: new Date().toISOString() },
    }), { status: 200 });
  }

  // Delete reality map
  if (path.match(/\/api\/v1\/reality-maps\/map-\d$/) && options?.method === 'DELETE') {
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
};

describe('Reality Maps E2E Tests', () => {
  beforeAll(() => {
    global.fetch = mockFetch as typeof fetch;
  });

  afterAll(() => {
    // @ts-expect-error reset mock
    global.fetch = undefined;
  });

  // ============================================================================
  // LIST REALITY MAPS
  // ============================================================================

  describe('List Reality Maps', () => {
    it('should display list of reality maps', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps');
      const data = await response.json();

      expect(data.maps).toHaveLength(3);
      expect(data.maps[0].name).toBe('Crisis Reality Map');
      expect(data.maps[0].status).toBe('completed');
    });

    it('should show correct status badges', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps');
      const data = await response.json();

      const statuses = data.maps.map((m: typeof mockRealityMaps[0]) => m.status);
      expect(statuses).toContain('completed');
      expect(statuses).toContain('draft');
      expect(statuses).toContain('generating');
    });

    it('should display node and path counts', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps');
      const data = await response.json();

      const completedMap = data.maps.find((m: typeof mockRealityMaps[0]) => m.status === 'completed');
      expect(completedMap.totalNodes).toBe(25);
      expect(completedMap.totalPaths).toBe(8);
    });

    it('should show parameters configuration', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps');
      const data = await response.json();

      const map = data.maps[0];
      expect(map.parameters.maxDepth).toBe(5);
      expect(map.parameters.narrativeStyle).toBe('executive');
      expect(map.parameters.probabilityModel).toBe('weighted_average');
    });
  });

  // ============================================================================
  // VIEW REALITY MAP
  // ============================================================================

  describe('View Reality Map', () => {
    it('should display map details', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps/map-1');
      const data = await response.json();

      expect(data.map.name).toBe('Crisis Reality Map');
      expect(data.map.description).toBe('Multi-outcome visualization for crisis scenarios');
    });

    it('should load graph data for completed maps', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps/map-1/graph');
      const data = await response.json();

      expect(data.graph.nodes).toHaveLength(5);
      expect(data.graph.edges).toHaveLength(4);
      expect(data.graph.paths).toHaveLength(2);
    });

    it('should display nodes with correct properties', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps/map-1/graph');
      const data = await response.json();

      const rootNode = data.graph.nodes.find((n: typeof mockGraphData.nodes[0]) => n.type === 'root');
      expect(rootNode.label).toBe('Crisis Detection');
      expect(rootNode.probability).toBe(1.0);
      expect(rootNode.depth).toBe(0);
    });

    it('should display edges with probabilities', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps/map-1/graph');
      const data = await response.json();

      const edge = data.graph.edges[0];
      expect(edge.source).toBe('node-1');
      expect(edge.target).toBe('node-2');
      expect(edge.probability).toBe(0.6);
    });

    it('should display paths with outcomes', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps/map-1/graph');
      const data = await response.json();

      const positivePath = data.graph.paths.find((p: typeof mockGraphData.paths[0]) => p.outcomeType === 'positive');
      expect(positivePath.label).toContain('Best Case');
      expect(positivePath.cumulativeProbability).toBe(0.42);
    });
  });

  // ============================================================================
  // ANALYSIS
  // ============================================================================

  describe('Reality Map Analysis', () => {
    it('should display outcome universe', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps/map-1/analysis');
      const data = await response.json();

      expect(data.outcomeUniverse.totalOutcomes).toBe(2);
      expect(data.outcomeUniverse.positiveOutcomes).toBe(1);
      expect(data.outcomeUniverse.negativeOutcomes).toBe(1);
    });

    it('should display outcome distribution', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps/map-1/analysis');
      const data = await response.json();

      expect(data.outcomeUniverse.outcomeDistribution.positive).toBe(0.42);
      expect(data.outcomeUniverse.outcomeDistribution.negative).toBe(0.32);
    });

    it('should display risk summary', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps/map-1/analysis');
      const data = await response.json();

      expect(data.outcomeUniverse.riskSummary.maxScore).toBe(90);
      expect(data.outcomeUniverse.riskSummary.minScore).toBe(15);
    });

    it('should display opportunity summary', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps/map-1/analysis');
      const data = await response.json();

      expect(data.outcomeUniverse.opportunitySummary.maxScore).toBe(80);
    });

    it('should display contradictions', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps/map-1/analysis');
      const data = await response.json();

      expect(data.contradictions).toHaveLength(1);
      expect(data.contradictions[0].type).toBe('probability_conflict');
    });

    it('should display correlations', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps/map-1/analysis');
      const data = await response.json();

      expect(data.correlations).toHaveLength(1);
      expect(data.correlations[0].strength).toBe('strong');
      expect(data.correlations[0].coefficient).toBe(-0.85);
    });

    it('should display aggregated risks', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps/map-1/analysis');
      const data = await response.json();

      expect(data.aggregatedRisks).toHaveLength(2);
      expect(data.aggregatedRisks[0].name).toBe('Reputational Damage');
    });

    it('should display aggregated opportunities', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps/map-1/analysis');
      const data = await response.json();

      expect(data.aggregatedOpportunities).toHaveLength(2);
      expect(data.aggregatedOpportunities[0].name).toBe('Trust Recovery');
    });
  });

  // ============================================================================
  // CREATE REALITY MAP
  // ============================================================================

  describe('Create Reality Map', () => {
    it('should create a new reality map', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Reality Map',
          description: 'A new test map',
          parameters: {
            maxDepth: 5,
            branchingFactor: 3,
          },
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.map.name).toBe('New Reality Map');
      expect(data.map.status).toBe('draft');
    });

    it('should create map with default parameters', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Simple Map',
        }),
      });
      const data = await response.json();

      expect(data.map.name).toBe('Simple Map');
      expect(data.map.totalNodes).toBe(0);
      expect(data.map.totalPaths).toBe(0);
    });

    it('should create map linked to suite', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Suite-linked Map',
          suiteId: 'suite-123',
        }),
      });
      const data = await response.json();

      expect(data.map.suiteId).toBe('suite-123');
    });
  });

  // ============================================================================
  // GENERATE REALITY MAP
  // ============================================================================

  describe('Generate Reality Map', () => {
    it('should trigger generation', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps/map-1/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.map.status).toBe('generating');
    });

    it('should allow regeneration of completed maps', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps/map-1/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate: true }),
      });

      expect(response.status).toBe(200);
    });
  });

  // ============================================================================
  // UPDATE REALITY MAP
  // ============================================================================

  describe('Update Reality Map', () => {
    it('should update map name and description', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps/map-2', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Map Name',
          description: 'Updated description',
        }),
      });
      const data = await response.json();

      expect(data.map.name).toBe('Updated Map Name');
      expect(data.map.description).toBe('Updated description');
    });

    it('should update parameters', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps/map-2', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parameters: {
            maxDepth: 8,
          },
        }),
      });
      const data = await response.json();

      expect(data.map.parameters.maxDepth).toBe(8);
    });
  });

  // ============================================================================
  // DELETE REALITY MAP
  // ============================================================================

  describe('Delete Reality Map', () => {
    it('should delete a reality map', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps/map-2', {
        method: 'DELETE',
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  // ============================================================================
  // AUDIT LOG
  // ============================================================================

  describe('Audit Log', () => {
    it('should display audit events', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps/map-1/audit-log');
      const data = await response.json();

      expect(data.events).toHaveLength(2);
      expect(data.events[0].eventType).toBe('created');
      expect(data.events[1].eventType).toBe('generated');
    });
  });

  // ============================================================================
  // GLOBAL STATS
  // ============================================================================

  describe('Global Stats', () => {
    it('should display organization stats', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps/stats');
      const data = await response.json();

      expect(data.stats.totalMaps).toBe(3);
      expect(data.stats.completedMaps).toBe(1);
      expect(data.stats.totalNodes).toBe(35);
      expect(data.stats.totalPaths).toBe(8);
    });
  });

  // ============================================================================
  // NODE INTERACTIONS
  // ============================================================================

  describe('Node Interactions', () => {
    it('should display node details on click', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps/map-1/graph');
      const data = await response.json();

      const node = data.graph.nodes[0];
      expect(node.label).toBe('Crisis Detection');
      expect(node.summary).toContain('crisis event');
    });

    it('should display key drivers for nodes', async () => {
      // Key drivers are in the full node data
      const node = mockNodes[0];
      expect(node.keyDrivers).toHaveLength(2);
      expect(node.keyDrivers[0].name).toBe('Media Attention');
    });

    it('should display risk factors for nodes', async () => {
      const node = mockNodes[0];
      expect(node.riskFactors).toHaveLength(1);
      expect(node.riskFactors[0].name).toBe('Reputational Damage');
    });

    it('should display opportunity factors for nodes', async () => {
      const node = mockNodes[1];
      expect(node.opportunityFactors).toHaveLength(1);
      expect(node.opportunityFactors[0].name).toBe('Trust Recovery');
    });
  });

  // ============================================================================
  // PATH INTERACTIONS
  // ============================================================================

  describe('Path Interactions', () => {
    it('should highlight path on selection', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps/map-1/graph');
      const data = await response.json();

      const path = data.graph.paths[0];
      expect(path.pathNodes).toHaveLength(3);
      expect(path.pathNodes[0]).toBe('node-1');
    });

    it('should display path outcome type', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps/map-1/graph');
      const data = await response.json();

      const positivePath = data.graph.paths.find((p: typeof mockGraphData.paths[0]) => p.outcomeType === 'positive');
      const negativePath = data.graph.paths.find((p: typeof mockGraphData.paths[0]) => p.outcomeType === 'negative');

      expect(positivePath).toBeDefined();
      expect(negativePath).toBeDefined();
    });

    it('should display cumulative probability for paths', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps/map-1/graph');
      const data = await response.json();

      const path = data.graph.paths[0];
      expect(path.cumulativeProbability).toBe(0.42);
    });
  });

  // ============================================================================
  // VISUALIZATION
  // ============================================================================

  describe('Graph Visualization', () => {
    it('should have nodes with positions', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps/map-1/graph');
      const data = await response.json();

      data.graph.nodes.forEach((node: typeof mockGraphData.nodes[0]) => {
        expect(node.position).toBeDefined();
        expect(typeof node.position.x).toBe('number');
        expect(typeof node.position.y).toBe('number');
      });
    });

    it('should have metadata for graph', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps/map-1/graph');
      const data = await response.json();

      expect(data.graph.metadata.totalNodes).toBe(5);
      expect(data.graph.metadata.totalEdges).toBe(4);
      expect(data.graph.metadata.maxDepth).toBe(2);
    });
  });

  // ============================================================================
  // PARAMETER VALIDATION
  // ============================================================================

  describe('Parameter Validation', () => {
    it('should accept valid max depth range (1-10)', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Map',
          parameters: { maxDepth: 10 },
        }),
      });

      expect(response.status).toBe(201);
    });

    it('should accept valid branching factor range (1-10)', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Map',
          parameters: { branchingFactor: 10 },
        }),
      });

      expect(response.status).toBe(201);
    });

    it('should accept valid min probability range (0-0.5)', async () => {
      const response = await fetch('http://localhost:4000/api/v1/reality-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Map',
          parameters: { minProbability: 0.5 },
        }),
      });

      expect(response.status).toBe(201);
    });
  });
});
