/**
 * Unified Intelligence Graph Dashboard Page (Sprint S66)
 * Global Insight Fabric & Unified Intelligence Graph V1
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  GraphNodeCard,
  GraphEdgeCard,
  GraphVisualizationPanel,
  GraphMetricsPanel,
  NodeInspectorDrawer,
  EdgeInspectorDrawer,
  SnapshotPanel,
  GraphQueryBuilder,
} from '@/components/unified-graph';
import {
  IntelligenceNode,
  IntelligenceEdge,
  GraphMetrics,
  GraphStats,
  GraphQueryResponse,
  NodeType,
  NODE_TYPE_LABELS,
  listNodes,
  listEdges,
  getMetrics,
  getStats,
  computeMetrics,
  deleteNode,
  deleteEdge,
} from '@/lib/unifiedGraphApi';
import {
  Network,
  CircleDot,
  GitBranch,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Zap,
  TrendingUp,
  Layers,
} from 'lucide-react';

export default function UnifiedGraphPage() {
  // State
  const [nodes, setNodes] = useState<IntelligenceNode[]>([]);
  const [edges, setEdges] = useState<IntelligenceEdge[]>([]);
  const [metrics, setMetrics] = useState<GraphMetrics | null>(null);
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isComputingMetrics, setIsComputingMetrics] = useState(false);
  const [nodesTotal, setNodesTotal] = useState(0);
  const [edgesTotal, setEdgesTotal] = useState(0);
  const [nodesOffset, setNodesOffset] = useState(0);
  const [edgesOffset, setEdgesOffset] = useState(0);
  const [nodeSearch, setNodeSearch] = useState('');
  const [nodeTypeFilter, setNodeTypeFilter] = useState<NodeType | 'all'>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [queryResults, setQueryResults] = useState<GraphQueryResponse | null>(null);

  const limit = 20;

  // Fetch functions
  const fetchNodes = useCallback(async () => {
    try {
      const result = await listNodes({
        limit,
        offset: nodesOffset,
        search: nodeSearch || undefined,
        nodeTypes: nodeTypeFilter !== 'all' ? [nodeTypeFilter] : undefined,
        isActive: true,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });
      setNodes(result.nodes);
      setNodesTotal(result.total);
    } catch (error) {
      console.error('Failed to fetch nodes:', error);
    }
  }, [nodesOffset, nodeSearch, nodeTypeFilter]);

  const fetchEdges = useCallback(async () => {
    try {
      const result = await listEdges({
        limit,
        offset: edgesOffset,
        isActive: true,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });
      setEdges(result.edges);
      setEdgesTotal(result.total);
    } catch (error) {
      console.error('Failed to fetch edges:', error);
    }
  }, [edgesOffset]);

  const fetchMetrics = async () => {
    try {
      const result = await getMetrics();
      setMetrics(result);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const result = await getStats();
      setStats(result);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleComputeMetrics = async () => {
    setIsComputingMetrics(true);
    try {
      await computeMetrics({
        computeCentrality: true,
        computeClusters: true,
      });
      await fetchMetrics();
      await fetchNodes();
    } catch (error) {
      console.error('Failed to compute metrics:', error);
    } finally {
      setIsComputingMetrics(false);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm('Are you sure you want to delete this node?')) return;

    try {
      await deleteNode(nodeId);
      fetchNodes();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete node:', error);
    }
  };

  const handleDeleteEdge = async (edgeId: string) => {
    if (!confirm('Are you sure you want to delete this edge?')) return;

    try {
      await deleteEdge(edgeId);
      fetchEdges();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete edge:', error);
    }
  };

  const handleRefresh = () => {
    fetchNodes();
    fetchEdges();
    fetchMetrics();
    fetchStats();
  };

  const handleQueryResults = (results: GraphQueryResponse) => {
    setQueryResults(results);
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchNodes(), fetchEdges(), fetchMetrics(), fetchStats()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Reload nodes when filters change
  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  // Reload edges when offset changes
  useEffect(() => {
    fetchEdges();
  }, [fetchEdges]);

  const nodesTotalPages = Math.ceil(nodesTotal / limit);
  const nodesCurrentPage = Math.floor(nodesOffset / limit) + 1;
  const edgesTotalPages = Math.ceil(edgesTotal / limit);
  const edgesCurrentPage = Math.floor(edgesOffset / limit) + 1;

  // Display nodes - use query results if available
  const displayNodes = queryResults ? queryResults.nodes : nodes;
  const displayEdges = queryResults ? queryResults.edges : edges;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Network className="h-8 w-8" />
            Unified Intelligence Graph
          </h1>
          <p className="text-muted-foreground">
            Cross-system knowledge graph connecting all Pravado intelligence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleComputeMetrics}
            disabled={isComputingMetrics}
          >
            {isComputingMetrics ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Compute Metrics
          </Button>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <CircleDot className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalNodes}</p>
                  <p className="text-sm text-muted-foreground">
                    Total Nodes ({stats.activeNodes} active)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <GitBranch className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalEdges}</p>
                  <p className="text-sm text-muted-foreground">
                    Total Edges ({stats.activeEdges} active)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Layers className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {Object.keys(stats.nodesByType).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Node Types</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {Object.keys(stats.edgesByType).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Edge Types</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Nodes & Edges List */}
        <div className="space-y-6">
          <Tabs defaultValue="nodes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="nodes" className="flex items-center gap-1">
                <CircleDot className="h-3 w-3" />
                Nodes ({nodesTotal})
              </TabsTrigger>
              <TabsTrigger value="edges" className="flex items-center gap-1">
                <GitBranch className="h-3 w-3" />
                Edges ({edgesTotal})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="nodes" className="mt-4 space-y-4">
              {/* Node Filters */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search nodes..."
                    value={nodeSearch}
                    onChange={(e) => {
                      setNodeSearch(e.target.value);
                      setNodesOffset(0);
                    }}
                  />
                </div>
                <Select
                  value={nodeTypeFilter}
                  onValueChange={(v) => {
                    setNodeTypeFilter(v as NodeType | 'all');
                    setNodesOffset(0);
                  }}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(NODE_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {String(label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Node List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : displayNodes.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CircleDot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Nodes Found</h3>
                    <p className="text-muted-foreground">
                      {nodeSearch || nodeTypeFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Start adding nodes to build your knowledge graph'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="space-y-2">
                    {displayNodes.map((node: IntelligenceNode) => (
                      <GraphNodeCard
                        key={node.id}
                        node={node}
                        compact
                        isSelected={selectedNodeId === node.id}
                        onView={(n) => setSelectedNodeId(n.id)}
                        onDelete={handleDeleteNode}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {!queryResults && nodesTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-muted-foreground">
                        Page {nodesCurrentPage} of {nodesTotalPages}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={nodesOffset === 0}
                          onClick={() => setNodesOffset(Math.max(0, nodesOffset - limit))}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={nodesOffset + limit >= nodesTotal}
                          onClick={() => setNodesOffset(nodesOffset + limit)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="edges" className="mt-4 space-y-4">
              {/* Edge List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : displayEdges.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Edges Found</h3>
                    <p className="text-muted-foreground">
                      Edges connect nodes to form relationships
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="space-y-2">
                    {displayEdges.map((edge: IntelligenceEdge) => (
                      <GraphEdgeCard
                        key={edge.id}
                        edge={edge}
                        compact
                        isSelected={selectedEdgeId === edge.id}
                        onView={(e) => setSelectedEdgeId(e.id)}
                        onDelete={handleDeleteEdge}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {!queryResults && edgesTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-muted-foreground">
                        Page {edgesCurrentPage} of {edgesTotalPages}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={edgesOffset === 0}
                          onClick={() => setEdgesOffset(Math.max(0, edgesOffset - limit))}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={edgesOffset + limit >= edgesTotal}
                          onClick={() => setEdgesOffset(edgesOffset + limit)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>

          {/* Query Builder */}
          <GraphQueryBuilder
            onResults={handleQueryResults}
            onSelectNode={setSelectedNodeId}
          />
        </div>

        {/* Center Panel - Visualization */}
        <div className="lg:col-span-1">
          <GraphVisualizationPanel
            nodes={displayNodes}
            edges={displayEdges}
            selectedNodeId={selectedNodeId}
            onNodeSelect={setSelectedNodeId}
            isLoading={isLoading}
          />
        </div>

        {/* Right Panel - Metrics & Snapshots */}
        <div className="space-y-6">
          {metrics && <GraphMetricsPanel metrics={metrics} isLoading={isLoading} />}

          <SnapshotPanel />
        </div>
      </div>

      {/* Drawers */}
      <NodeInspectorDrawer
        nodeId={selectedNodeId}
        onClose={() => setSelectedNodeId(null)}
        onUpdate={handleRefresh}
        onNavigateToNode={setSelectedNodeId}
      />

      <EdgeInspectorDrawer
        edgeId={selectedEdgeId}
        onClose={() => setSelectedEdgeId(null)}
        onUpdate={handleRefresh}
        onNavigateToNode={setSelectedNodeId}
      />
    </div>
  );
}
