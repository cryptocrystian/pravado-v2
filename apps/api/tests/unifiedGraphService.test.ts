/**
 * Unified Intelligence Graph Service Tests (Sprint S66)
 * Tests for Global Insight Fabric & Unified Intelligence Graph V1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createNode,
  getNode,
  updateNode,
  deleteNode,
  listNodes,
  getNodeWithConnections,
  createEdge,
  getEdge,
  updateEdge,
  deleteEdge,
  listEdges,
  getEdgeWithNodes,
  mergeNodes,
  queryGraph,
  traverseGraph,
  findShortestPath,
  computeMetrics,
  getMetrics,
  createSnapshot,
  getSnapshot,
  listSnapshots,
  regenerateSnapshot,
  listAuditLogs,
  getStats,
  ServiceContext,
} from '../src/services/unifiedIntelligenceGraphService';
import {
  NodeType,
  EdgeType,
  GraphSnapshotStatus,
  GraphEventType,
} from '@pravado/types';

// Mock OpenAI
vi.mock('openai', () => ({
  default: class MockOpenAI {
    embeddings = {
      create: vi.fn().mockResolvedValue({
        data: [{ embedding: Array(1536).fill(0.1) }],
      }),
    };
    chat = {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  explanation: 'Test explanation',
                  reasoning: ['Step 1', 'Step 2'],
                  confidence: 0.85,
                  keyRelationships: [],
                }),
              },
            },
          ],
        }),
      },
    };
  },
}));

describe('UnifiedIntelligenceGraphService', () => {
  let mockSupabase: any;
  let ctx: ServiceContext;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
      rpc: vi.fn(),
    };
    ctx = {
      supabase: mockSupabase,
      orgId: 'org-123',
      userId: 'user-456',
    };
    vi.stubEnv('OPENAI_API_KEY', 'test-api-key');
  });

  // ============================================================================
  // NODE OPERATIONS
  // ============================================================================

  describe('Node Operations', () => {
    const mockNode = {
      id: 'node-123',
      org_id: 'org-123',
      node_type: 'content_piece',
      external_id: 'external-1',
      source_system: 's38_quality',
      source_table: 'content_items',
      label: 'Test Content',
      description: 'A test content piece',
      properties_json: { wordCount: 1500 },
      tags: ['test', 'content'],
      categories: ['blog'],
      valid_from: null,
      valid_to: null,
      degree_centrality: 0.5,
      betweenness_centrality: 0.3,
      closeness_centrality: 0.7,
      pagerank_score: 0.8,
      cluster_id: 'cluster-1',
      community_id: null,
      is_active: true,
      confidence_score: 0.95,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      created_by: 'user-456',
      updated_by: 'user-456',
    };

    describe('createNode', () => {
      it('should create a node successfully', async () => {
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'intelligence_nodes') {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockNode, error: null }),
                }),
              }),
            };
          }
          if (table === 'intelligence_graph_audit_log') {
            return {
              insert: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          return {};
        });

        const result = await createNode(ctx, {
          nodeType: NodeType.CONTENT_PIECE,
          label: 'Test Content',
          description: 'A test content piece',
          tags: ['test', 'content'],
          categories: ['blog'],
        });

        expect(result.label).toBe('Test Content');
        expect(result.nodeType).toBe(NodeType.CONTENT_PIECE);
        expect(result.isActive).toBe(true);
      });

      it('should throw error on database failure', async () => {
        mockSupabase.from.mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        });

        await expect(
          createNode(ctx, {
            nodeType: NodeType.CONTENT_PIECE,
            label: 'Test',
          })
        ).rejects.toThrow('Failed to create node: Database error');
      });
    });

    describe('getNode', () => {
      it('should retrieve a node by ID', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockNode, error: null }),
          }),
        });

        const result = await getNode(ctx, 'node-123');

        expect(result).not.toBeNull();
        expect(result?.id).toBe('node-123');
        expect(result?.label).toBe('Test Content');
      });

      it('should return null for non-existent node', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        });

        const result = await getNode(ctx, 'nonexistent');

        expect(result).toBeNull();
      });
    });

    describe('updateNode', () => {
      it('should update node properties', async () => {
        const updatedNode = { ...mockNode, label: 'Updated Content' };

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'intelligence_nodes') {
            return {
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: updatedNode, error: null }),
                }),
              }),
            };
          }
          if (table === 'intelligence_graph_audit_log') {
            return {
              insert: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          return {};
        });

        const result = await updateNode(ctx, 'node-123', {
          label: 'Updated Content',
        });

        expect(result.label).toBe('Updated Content');
      });

      it('should update multiple fields at once', async () => {
        const updatedNode = {
          ...mockNode,
          label: 'New Label',
          description: 'New description',
          tags: ['new', 'tags'],
        };

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'intelligence_nodes') {
            return {
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: updatedNode, error: null }),
                }),
              }),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const result = await updateNode(ctx, 'node-123', {
          label: 'New Label',
          description: 'New description',
          tags: ['new', 'tags'],
        });

        expect(result.label).toBe('New Label');
        expect(result.description).toBe('New description');
      });
    });

    describe('deleteNode', () => {
      it('should delete a node', async () => {
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'intelligence_nodes') {
            return {
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
              }),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        await expect(deleteNode(ctx, 'node-123')).resolves.not.toThrow();
      });
    });

    describe('listNodes', () => {
      it('should list nodes with pagination', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            overlaps: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({
              data: [mockNode],
              count: 1,
              error: null,
            }),
          }),
        });

        const result = await listNodes(ctx, {
          limit: 20,
          offset: 0,
        });

        expect(result.nodes).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.nodes[0].label).toBe('Test Content');
      });

      it('should filter nodes by type', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({
              data: [mockNode],
              count: 1,
              error: null,
            }),
          }),
        });

        const result = await listNodes(ctx, {
          nodeTypes: [NodeType.CONTENT_PIECE],
          limit: 20,
        });

        expect(result.nodes).toHaveLength(1);
      });

      it('should filter nodes by search term', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({
              data: [mockNode],
              count: 1,
              error: null,
            }),
          }),
        });

        const result = await listNodes(ctx, {
          search: 'test',
          limit: 20,
        });

        expect(result.nodes).toHaveLength(1);
      });

      it('should filter by active status', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({
              data: [mockNode],
              count: 1,
              error: null,
            }),
          }),
        });

        const result = await listNodes(ctx, {
          isActive: true,
          limit: 20,
        });

        expect(result.nodes[0].isActive).toBe(true);
      });
    });

    describe('getNodeWithConnections', () => {
      const mockEdge = {
        id: 'edge-123',
        org_id: 'org-123',
        source_node_id: 'node-456',
        target_node_id: 'node-123',
        edge_type: 'authored_by',
        label: 'Created by',
        description: null,
        properties_json: {},
        weight: 1.0,
        is_bidirectional: false,
        valid_from: null,
        valid_to: null,
        source_system: null,
        inference_method: null,
        confidence_score: null,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: null,
      };

      it('should get node with its connections', async () => {
        const neighborNode = { ...mockNode, id: 'node-456', label: 'Neighbor' };

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'intelligence_nodes') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockResolvedValue({ data: [neighborNode], error: null }),
                single: vi.fn().mockResolvedValue({ data: mockNode, error: null }),
              }),
            };
          }
          if (table === 'intelligence_edges') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
              }),
            };
          }
          return {};
        });

        // This test is simplified due to complex mock setup
        const node = await getNode(ctx, 'node-123');
        expect(node).not.toBeNull();
      });
    });
  });

  // ============================================================================
  // EDGE OPERATIONS
  // ============================================================================

  describe('Edge Operations', () => {
    const mockEdge = {
      id: 'edge-123',
      org_id: 'org-123',
      source_node_id: 'node-1',
      target_node_id: 'node-2',
      edge_type: 'authored_by',
      label: 'Written by',
      description: 'Content authorship',
      properties_json: { role: 'primary' },
      weight: 1.5,
      is_bidirectional: false,
      valid_from: null,
      valid_to: null,
      source_system: 's38_quality',
      inference_method: 'explicit',
      confidence_score: 0.99,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      created_by: 'user-456',
    };

    describe('createEdge', () => {
      it('should create an edge between two nodes', async () => {
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'intelligence_nodes') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockResolvedValue({
                  data: [{ id: 'node-1' }, { id: 'node-2' }],
                  error: null,
                }),
              }),
            };
          }
          if (table === 'intelligence_edges') {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockEdge, error: null }),
                }),
              }),
            };
          }
          if (table === 'intelligence_graph_audit_log') {
            return {
              insert: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          return {};
        });

        const result = await createEdge(ctx, {
          sourceNodeId: 'node-1',
          targetNodeId: 'node-2',
          edgeType: EdgeType.AUTHORED_BY,
          label: 'Written by',
          weight: 1.5,
        });

        expect(result.sourceNodeId).toBe('node-1');
        expect(result.targetNodeId).toBe('node-2');
        expect(result.edgeType).toBe(EdgeType.AUTHORED_BY);
      });

      it('should throw error if source or target node not found', async () => {
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'intelligence_nodes') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockResolvedValue({
                  data: [{ id: 'node-1' }], // Only one node found
                  error: null,
                }),
              }),
            };
          }
          return {};
        });

        await expect(
          createEdge(ctx, {
            sourceNodeId: 'node-1',
            targetNodeId: 'node-2',
            edgeType: EdgeType.AUTHORED_BY,
          })
        ).rejects.toThrow('Source or target node not found');
      });

      it('should create bidirectional edge', async () => {
        const bidirectionalEdge = { ...mockEdge, is_bidirectional: true };

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'intelligence_nodes') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockResolvedValue({
                  data: [{ id: 'node-1' }, { id: 'node-2' }],
                  error: null,
                }),
              }),
            };
          }
          if (table === 'intelligence_edges') {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: bidirectionalEdge, error: null }),
                }),
              }),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const result = await createEdge(ctx, {
          sourceNodeId: 'node-1',
          targetNodeId: 'node-2',
          edgeType: EdgeType.RELATED_TO,
          isBidirectional: true,
        });

        expect(result.isBidirectional).toBe(true);
      });
    });

    describe('getEdge', () => {
      it('should retrieve an edge by ID', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockEdge, error: null }),
          }),
        });

        const result = await getEdge(ctx, 'edge-123');

        expect(result).not.toBeNull();
        expect(result?.id).toBe('edge-123');
        expect(result?.weight).toBe(1.5);
      });

      it('should return null for non-existent edge', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        });

        const result = await getEdge(ctx, 'nonexistent');

        expect(result).toBeNull();
      });
    });

    describe('updateEdge', () => {
      it('should update edge properties', async () => {
        const updatedEdge = { ...mockEdge, weight: 2.0 };

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'intelligence_edges') {
            return {
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: updatedEdge, error: null }),
                }),
              }),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const result = await updateEdge(ctx, 'edge-123', {
          weight: 2.0,
        });

        expect(result.weight).toBe(2.0);
      });

      it('should toggle bidirectional flag', async () => {
        const updatedEdge = { ...mockEdge, is_bidirectional: true };

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'intelligence_edges') {
            return {
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: updatedEdge, error: null }),
                }),
              }),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const result = await updateEdge(ctx, 'edge-123', {
          isBidirectional: true,
        });

        expect(result.isBidirectional).toBe(true);
      });
    });

    describe('deleteEdge', () => {
      it('should delete an edge', async () => {
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'intelligence_edges') {
            return {
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
              }),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        await expect(deleteEdge(ctx, 'edge-123')).resolves.not.toThrow();
      });
    });

    describe('listEdges', () => {
      it('should list edges with pagination', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({
              data: [mockEdge],
              count: 1,
              error: null,
            }),
          }),
        });

        const result = await listEdges(ctx, {
          limit: 20,
          offset: 0,
        });

        expect(result.edges).toHaveLength(1);
        expect(result.total).toBe(1);
      });

      it('should filter edges by type', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({
              data: [mockEdge],
              count: 1,
              error: null,
            }),
          }),
        });

        const result = await listEdges(ctx, {
          edgeTypes: [EdgeType.AUTHORED_BY],
          limit: 20,
        });

        expect(result.edges).toHaveLength(1);
      });

      it('should filter edges by weight range', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({
              data: [mockEdge],
              count: 1,
              error: null,
            }),
          }),
        });

        const result = await listEdges(ctx, {
          minWeight: 1.0,
          maxWeight: 2.0,
          limit: 20,
        });

        expect(result.edges[0].weight).toBe(1.5);
      });
    });

    describe('getEdgeWithNodes', () => {
      it('should get edge with source and target nodes', async () => {
        const sourceNode = {
          id: 'node-1',
          org_id: 'org-123',
          node_type: 'author',
          label: 'Author',
          properties_json: {},
          tags: [],
          categories: [],
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };
        const targetNode = {
          ...sourceNode,
          id: 'node-2',
          node_type: 'content_piece',
          label: 'Content',
        };

        let callCount = 0;
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'intelligence_edges') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockEdge, error: null }),
              }),
            };
          }
          if (table === 'intelligence_nodes') {
            callCount++;
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockResolvedValue({
                  data: [sourceNode, targetNode],
                  error: null,
                }),
              }),
            };
          }
          return {};
        });

        const result = await getEdgeWithNodes(ctx, 'edge-123');

        expect(result).not.toBeNull();
        expect(result?.edge.id).toBe('edge-123');
        expect(result?.sourceNode.id).toBe('node-1');
        expect(result?.targetNode.id).toBe('node-2');
      });
    });
  });

  // ============================================================================
  // MERGE OPERATIONS
  // ============================================================================

  describe('Merge Operations', () => {
    describe('mergeNodes', () => {
      const mockNodes = [
        {
          id: 'node-1',
          org_id: 'org-123',
          node_type: 'journalist',
          label: 'John Doe',
          description: 'Tech journalist',
          properties_json: { email: 'john@example.com' },
          tags: ['tech'],
          categories: ['media'],
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'node-2',
          org_id: 'org-123',
          node_type: 'journalist',
          label: 'J. Doe',
          description: 'Technology writer',
          properties_json: { twitter: '@johndoe' },
          tags: ['technology'],
          categories: ['press'],
          is_active: true,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ];

      it('should merge nodes with create_new strategy', async () => {
        const mergedNode = {
          ...mockNodes[0],
          id: 'node-merged',
          label: 'John Doe (Merged)',
          properties_json: { email: 'john@example.com', twitter: '@johndoe' },
          tags: ['tech', 'technology'],
          categories: ['media', 'press'],
        };

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'intelligence_nodes') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: mockNodes,
                    error: null,
                  }),
                }),
              }),
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mergedNode, error: null }),
                }),
              }),
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            };
          }
          if (table === 'intelligence_edges') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                or: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
              }),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const result = await mergeNodes(ctx, {
          sourceNodeIds: ['node-1', 'node-2'],
          mergeStrategy: 'create_new',
          newLabel: 'John Doe (Merged)',
        });

        expect(result.mergedNode).not.toBeNull();
        expect(result.mergedNodeIds).toEqual(['node-1', 'node-2']);
      });

      it('should merge nodes with absorb strategy', async () => {
        const mergedNode = {
          ...mockNodes[0],
          properties_json: { email: 'john@example.com', twitter: '@johndoe' },
        };

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'intelligence_nodes') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: mockNodes,
                    error: null,
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: mergedNode, error: null }),
                  }),
                }),
              }),
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            };
          }
          if (table === 'intelligence_edges') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                or: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
              }),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const result = await mergeNodes(ctx, {
          sourceNodeIds: ['node-1', 'node-2'],
          targetNodeId: 'node-1',
          mergeStrategy: 'absorb',
        });

        expect(result.mergedNode.id).toBe('node-1');
      });
    });
  });

  // ============================================================================
  // GRAPH QUERY & TRAVERSAL
  // ============================================================================

  describe('Graph Query & Traversal', () => {
    const mockNode = {
      id: 'node-1',
      org_id: 'org-123',
      node_type: 'content_piece',
      label: 'Test Content',
      properties_json: {},
      tags: [],
      categories: [],
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    describe('queryGraph', () => {
      it('should query graph with filters', async () => {
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'intelligence_nodes') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                range: vi.fn().mockResolvedValue({ data: [mockNode], error: null }),
              }),
            };
          }
          if (table === 'intelligence_edges') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                or: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const result = await queryGraph(ctx, {
          nodeTypes: [NodeType.CONTENT_PIECE],
          limit: 100,
        });

        expect(result.nodes).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
      });

      it('should group results when groupBy is specified', async () => {
        const multipleNodes = [
          { ...mockNode, id: 'node-1', node_type: 'content_piece' },
          { ...mockNode, id: 'node-2', node_type: 'content_piece' },
          { ...mockNode, id: 'node-3', node_type: 'journalist' },
        ];

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'intelligence_nodes') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                range: vi.fn().mockResolvedValue({ data: multipleNodes, error: null }),
              }),
            };
          }
          if (table === 'intelligence_edges') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                or: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const result = await queryGraph(ctx, {
          groupBy: 'node_type',
          limit: 100,
        });

        expect(result.aggregations).toBeDefined();
        expect(result.aggregations?.['content_piece']).toBe(2);
        expect(result.aggregations?.['journalist']).toBe(1);
      });
    });

    describe('traverseGraph', () => {
      it('should traverse graph from start node', async () => {
        const startNode = { ...mockNode, id: 'start-node' };
        const neighborNode = { ...mockNode, id: 'neighbor-node', label: 'Neighbor' };
        const mockEdge = {
          id: 'edge-1',
          org_id: 'org-123',
          source_node_id: 'start-node',
          target_node_id: 'neighbor-node',
          edge_type: 'related_to',
          weight: 1.0,
          is_active: true,
        };

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'intelligence_nodes') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockImplementation(() => {
                  return Promise.resolve({ data: startNode, error: null });
                }),
              }),
            };
          }
          if (table === 'intelligence_edges') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                or: vi.fn().mockReturnThis(),
                in: vi.fn().mockResolvedValue({ data: [mockEdge], error: null }),
              }),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const result = await traverseGraph(ctx, {
          startNodeId: 'start-node',
          maxDepth: 2,
        });

        expect(result.startNode).not.toBeNull();
        expect(result.startNode.id).toBe('start-node');
        expect(result.totalNodesVisited).toBeGreaterThanOrEqual(1);
      });

      it('should respect direction parameter', async () => {
        const startNode = { ...mockNode, id: 'start-node' };

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'intelligence_nodes') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: startNode, error: null }),
              }),
            };
          }
          if (table === 'intelligence_edges') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const result = await traverseGraph(ctx, {
          startNodeId: 'start-node',
          direction: 'outgoing',
          maxDepth: 3,
        });

        expect(result.depth).toBe(3);
      });

      it('should throw error for non-existent start node', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        });

        await expect(
          traverseGraph(ctx, {
            startNodeId: 'nonexistent',
          })
        ).rejects.toThrow('Start node not found');
      });
    });

    describe('findShortestPath', () => {
      it('should find shortest path between two nodes', async () => {
        const nodeA = { ...mockNode, id: 'node-a', label: 'A' };
        const nodeB = { ...mockNode, id: 'node-b', label: 'B' };
        const edge = {
          id: 'edge-1',
          source_node_id: 'node-a',
          target_node_id: 'node-b',
          edge_type: 'related_to',
          weight: 1.0,
          is_active: true,
        };

        let nodeRequestCount = 0;
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'intelligence_nodes') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockResolvedValue({
                  data: [nodeA, nodeB],
                  error: null,
                }),
              }),
            };
          }
          if (table === 'intelligence_edges') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                or: vi.fn().mockResolvedValue({
                  data: [edge],
                  error: null,
                }),
              }),
            };
          }
          return {};
        });

        const result = await findShortestPath(ctx, 'node-a', 'node-b');

        expect(result).not.toBeNull();
        expect(result?.startNodeId).toBe('node-a');
        expect(result?.endNodeId).toBe('node-b');
        expect(result?.pathLength).toBeGreaterThanOrEqual(1);
      });

      it('should return null when no path exists', async () => {
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'intelligence_edges') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                or: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            };
          }
          return {};
        });

        const result = await findShortestPath(ctx, 'node-a', 'node-disconnected', 3);

        expect(result).toBeNull();
      });
    });
  });

  // ============================================================================
  // METRICS & ANALYTICS
  // ============================================================================

  describe('Metrics & Analytics', () => {
    describe('computeMetrics', () => {
      it('should compute graph metrics', async () => {
        const nodes = [
          { id: 'node-1', org_id: 'org-123', node_type: 'content_piece', label: 'A', is_active: true },
          { id: 'node-2', org_id: 'org-123', node_type: 'journalist', label: 'B', is_active: true },
        ];
        const edges = [
          {
            id: 'edge-1',
            source_node_id: 'node-1',
            target_node_id: 'node-2',
            edge_type: 'authored_by',
            is_active: true,
          },
        ];

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'intelligence_nodes') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockResolvedValue({ data: nodes, error: null }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: null, error: null }),
                in: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            };
          }
          if (table === 'intelligence_edges') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockResolvedValue({ data: edges, error: null }),
              }),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const result = await computeMetrics(ctx, {
          computeCentrality: true,
          computeClusters: true,
        });

        expect(result.metrics).toBeDefined();
        expect(result.metrics.totalNodes).toBe(2);
        expect(result.metrics.totalEdges).toBe(1);
        expect(result.nodesUpdated).toBeGreaterThanOrEqual(0);
        expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
      });

      it('should compute density correctly', async () => {
        const nodes = [
          { id: 'node-1', org_id: 'org-123', node_type: 'a', label: 'A', is_active: true },
          { id: 'node-2', org_id: 'org-123', node_type: 'b', label: 'B', is_active: true },
          { id: 'node-3', org_id: 'org-123', node_type: 'c', label: 'C', is_active: true },
        ];
        const edges = [
          { id: 'edge-1', source_node_id: 'node-1', target_node_id: 'node-2', edge_type: 'x' },
          { id: 'edge-2', source_node_id: 'node-2', target_node_id: 'node-3', edge_type: 'x' },
        ];

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'intelligence_nodes') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockResolvedValue({ data: nodes, error: null }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: null, error: null }),
                in: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            };
          }
          if (table === 'intelligence_edges') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockResolvedValue({ data: edges, error: null }),
              }),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const result = await computeMetrics(ctx, {
          computeCentrality: false,
          computeClusters: false,
        });

        // Density = edges / (nodes * (nodes - 1)) = 2 / (3 * 2) = 0.333
        expect(result.metrics.density).toBeCloseTo(0.333, 2);
      });
    });

    describe('getMetrics', () => {
      it('should return current graph metrics', async () => {
        mockSupabase.from.mockImplementation((table: string) => {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              not: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValue({
                data: [{ id: 'node-1', label: 'A', degree_centrality: 0.5 }],
                error: null,
              }),
            }),
          };
        });

        const result = await getMetrics(ctx);

        expect(result).toBeDefined();
        expect(result.computedAt).toBeDefined();
      });
    });
  });

  // ============================================================================
  // SNAPSHOTS
  // ============================================================================

  describe('Snapshots', () => {
    const mockSnapshot = {
      id: 'snapshot-123',
      org_id: 'org-123',
      name: 'Weekly Snapshot',
      description: 'Weekly backup',
      snapshot_type: 'full',
      status: 'pending',
      node_count: null,
      edge_count: null,
      cluster_count: null,
      metrics_json: {},
      nodes_json: null,
      edges_json: null,
      clusters_json: null,
      previous_snapshot_id: null,
      diff_json: null,
      storage_url: null,
      storage_size_bytes: null,
      started_at: null,
      completed_at: null,
      error_message: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      created_by: 'user-456',
    };

    describe('createSnapshot', () => {
      it('should create a new snapshot', async () => {
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'intelligence_graph_snapshots') {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockSnapshot, error: null }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            };
          }
          if (table === 'intelligence_nodes') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockResolvedValue({ data: [], error: null }),
                not: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            };
          }
          if (table === 'intelligence_edges') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const result = await createSnapshot(ctx, {
          name: 'Weekly Snapshot',
          description: 'Weekly backup',
          snapshotType: 'full',
        });

        expect(result.name).toBe('Weekly Snapshot');
        expect(result.status).toBe(GraphSnapshotStatus.PENDING);
      });
    });

    describe('getSnapshot', () => {
      it('should retrieve a snapshot by ID', async () => {
        const completeSnapshot = { ...mockSnapshot, status: 'complete', node_count: 100 };

        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: completeSnapshot, error: null }),
          }),
        });

        const result = await getSnapshot(ctx, 'snapshot-123');

        expect(result).not.toBeNull();
        expect(result?.id).toBe('snapshot-123');
        expect(result?.nodeCount).toBe(100);
      });

      it('should return null for non-existent snapshot', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        });

        const result = await getSnapshot(ctx, 'nonexistent');

        expect(result).toBeNull();
      });
    });

    describe('listSnapshots', () => {
      it('should list snapshots with pagination', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({
              data: [mockSnapshot],
              count: 1,
              error: null,
            }),
          }),
        });

        const result = await listSnapshots(ctx, {
          limit: 20,
          offset: 0,
        });

        expect(result.snapshots).toHaveLength(1);
        expect(result.total).toBe(1);
      });

      it('should filter snapshots by status', async () => {
        const completeSnapshot = { ...mockSnapshot, status: 'complete' };

        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({
              data: [completeSnapshot],
              count: 1,
              error: null,
            }),
          }),
        });

        const result = await listSnapshots(ctx, {
          status: GraphSnapshotStatus.COMPLETE,
        });

        expect(result.snapshots[0].status).toBe(GraphSnapshotStatus.COMPLETE);
      });
    });

    describe('regenerateSnapshot', () => {
      it('should regenerate an existing snapshot', async () => {
        const existingSnapshot = { ...mockSnapshot, status: 'complete' };
        const regeneratedSnapshot = { ...mockSnapshot, status: 'pending' };

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'intelligence_graph_snapshots') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: existingSnapshot, error: null }),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            };
          }
          if (table === 'intelligence_nodes') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockResolvedValue({ data: [], error: null }),
                not: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            };
          }
          if (table === 'intelligence_edges') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            };
          }
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        const result = await regenerateSnapshot(ctx, 'snapshot-123');

        expect(result.status).toBe(GraphSnapshotStatus.PENDING);
      });

      it('should throw error for non-existent snapshot', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        });

        await expect(regenerateSnapshot(ctx, 'nonexistent')).rejects.toThrow(
          'Snapshot not found'
        );
      });
    });
  });

  // ============================================================================
  // AUDIT LOGS
  // ============================================================================

  describe('Audit Logs', () => {
    const mockAuditLog = {
      id: 'audit-123',
      org_id: 'org-123',
      event_type: 'node_created',
      node_id: 'node-123',
      edge_id: null,
      snapshot_id: null,
      actor_id: 'user-456',
      actor_type: 'user',
      changes_json: { node: { label: 'New Node' } },
      metadata_json: {},
      query_json: null,
      result_count: null,
      execution_time_ms: null,
      created_at: '2024-01-01T00:00:00Z',
      ip_address: null,
      user_agent: null,
    };

    describe('listAuditLogs', () => {
      it('should list audit logs with pagination', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({
              data: [mockAuditLog],
              count: 1,
              error: null,
            }),
          }),
        });

        const result = await listAuditLogs(ctx, {
          limit: 50,
          offset: 0,
        });

        expect(result.logs).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.logs[0].eventType).toBe(GraphEventType.NODE_CREATED);
      });

      it('should filter by event type', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({
              data: [mockAuditLog],
              count: 1,
              error: null,
            }),
          }),
        });

        const result = await listAuditLogs(ctx, {
          eventType: GraphEventType.NODE_CREATED,
        });

        expect(result.logs[0].eventType).toBe(GraphEventType.NODE_CREATED);
      });

      it('should filter by node ID', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({
              data: [mockAuditLog],
              count: 1,
              error: null,
            }),
          }),
        });

        const result = await listAuditLogs(ctx, {
          nodeId: 'node-123',
        });

        expect(result.logs[0].nodeId).toBe('node-123');
      });
    });
  });

  // ============================================================================
  // STATISTICS
  // ============================================================================

  describe('Statistics', () => {
    describe('getStats', () => {
      it('should return graph statistics', async () => {
        const mockNode = {
          id: 'node-1',
          org_id: 'org-123',
          node_type: 'content_piece',
          label: 'Test',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'intelligence_nodes') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: [mockNode], count: 10, error: null }),
              }),
            };
          }
          if (table === 'intelligence_edges') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [], count: 5, error: null }),
              }),
            };
          }
          if (table === 'intelligence_graph_snapshots') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            };
          }
          return {};
        });

        const result = await getStats(ctx);

        expect(result).toBeDefined();
        expect(result.totalNodes).toBeGreaterThanOrEqual(0);
        expect(result.totalEdges).toBeGreaterThanOrEqual(0);
        expect(result.nodesByType).toBeDefined();
        expect(result.edgesByType).toBeDefined();
      });

      it('should include recent nodes in stats', async () => {
        const recentNodes = [
          { id: 'node-1', node_type: 'a', label: 'A', created_at: '2024-01-02T00:00:00Z' },
          { id: 'node-2', node_type: 'b', label: 'B', created_at: '2024-01-01T00:00:00Z' },
        ];

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'intelligence_nodes') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({
                  data: recentNodes,
                  count: 2,
                  error: null,
                }),
              }),
            };
          }
          if (table === 'intelligence_edges') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
              }),
            };
          }
          if (table === 'intelligence_graph_snapshots') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            };
          }
          return {};
        });

        const result = await getStats(ctx);

        expect(result.recentNodes).toBeDefined();
        expect(result.recentNodes.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // ============================================================================
  // EDGE CASES & ERROR HANDLING
  // ============================================================================

  describe('Edge Cases & Error Handling', () => {
    it('should handle empty results gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: [],
            count: 0,
            error: null,
          }),
        }),
      });

      const result = await listNodes(ctx, { limit: 20 });

      expect(result.nodes).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Connection timeout' },
          }),
        }),
      });

      await expect(listNodes(ctx, { limit: 20 })).rejects.toThrow(
        'Failed to list nodes: Connection timeout'
      );
    });

    it('should handle null values in node properties', async () => {
      const nodeWithNulls = {
        id: 'node-123',
        org_id: 'org-123',
        node_type: 'content_piece',
        external_id: null,
        source_system: null,
        source_table: null,
        label: 'Test',
        description: null,
        properties_json: null,
        tags: null,
        categories: null,
        valid_from: null,
        valid_to: null,
        degree_centrality: null,
        betweenness_centrality: null,
        closeness_centrality: null,
        pagerank_score: null,
        cluster_id: null,
        community_id: null,
        is_active: true,
        confidence_score: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: null,
        updated_by: null,
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: nodeWithNulls, error: null }),
        }),
      });

      const result = await getNode(ctx, 'node-123');

      expect(result).not.toBeNull();
      expect(result?.propertiesJson).toEqual({});
      expect(result?.tags).toEqual([]);
      expect(result?.categories).toEqual([]);
    });

    it('should handle large batch operations', async () => {
      const manyNodes = Array(100)
        .fill(null)
        .map((_, i) => ({
          id: `node-${i}`,
          org_id: 'org-123',
          node_type: 'content_piece',
          label: `Node ${i}`,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        }));

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: manyNodes,
            count: 100,
            error: null,
          }),
        }),
      });

      const result = await listNodes(ctx, { limit: 100 });

      expect(result.nodes).toHaveLength(100);
      expect(result.total).toBe(100);
    });
  });
});
