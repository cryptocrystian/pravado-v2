/**
 * Graph Query Builder Component (Sprint S66)
 * Build and execute graph queries
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  NodeType,
  EdgeType,
  GraphQueryResponse,
  NODE_TYPE_LABELS,
  EDGE_TYPE_LABELS,
  queryGraph,
  traverseGraph,
  semanticSearch,
  explainPath,
} from '@/lib/unifiedGraphApi';
import {
  Search,
  Network,
  Route,
  Sparkles,
  Play,
  Loader2,
  X,
} from 'lucide-react';

interface GraphQueryBuilderProps {
  onResults?: (results: GraphQueryResponse) => void;
  onSelectNode?: (nodeId: string) => void;
}

export function GraphQueryBuilder({ onResults, onSelectNode: _onSelectNode }: GraphQueryBuilderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [queryType, setQueryType] = useState<'filter' | 'traverse' | 'semantic' | 'path'>('filter');

  // Filter query state
  const [selectedNodeTypes, setSelectedNodeTypes] = useState<NodeType[]>([]);
  const [selectedEdgeTypes, setSelectedEdgeTypes] = useState<EdgeType[]>([]);
  const [searchText, setSearchText] = useState('');

  // Traversal query state
  const [startNodeId, setStartNodeId] = useState('');
  const [traversalDirection, setTraversalDirection] = useState<'outgoing' | 'incoming' | 'both'>('both');
  const [maxDepth, setMaxDepth] = useState(3);

  // Semantic query state
  const [semanticQuery, setSemanticQuery] = useState('');
  const [semanticThreshold, setSemanticThreshold] = useState(0.7);

  // Path query state
  const [pathStartNode, setPathStartNode] = useState('');
  const [pathEndNode, setPathEndNode] = useState('');
  const [includeReasoning, _setIncludeReasoning] = useState(true);

  // Results state
  const [results, setResults] = useState<GraphQueryResponse | null>(null);
  const [pathExplanation, setPathExplanation] = useState<string | null>(null);

  const handleExecuteQuery = async () => {
    setIsLoading(true);
    setResults(null);
    setPathExplanation(null);

    try {
      switch (queryType) {
        case 'filter': {
          const result = await queryGraph({
            nodeTypes: selectedNodeTypes.length > 0 ? selectedNodeTypes : undefined,
            edgeTypes: selectedEdgeTypes.length > 0 ? selectedEdgeTypes : undefined,
            semanticQuery: searchText || undefined,
            limit: 100,
          });
          setResults(result);
          onResults?.(result);
          break;
        }

        case 'traverse': {
          if (!startNodeId) {
            throw new Error('Start node ID is required');
          }
          const traversalResult = await traverseGraph({
            startNodeId,
            direction: traversalDirection,
            maxDepth,
            nodeTypes: selectedNodeTypes.length > 0 ? selectedNodeTypes : undefined,
            edgeTypes: selectedEdgeTypes.length > 0 ? selectedEdgeTypes : undefined,
            limit: 100,
          });
          const queryResult: GraphQueryResponse = {
            nodes: traversalResult.visitedNodes,
            edges: [],
            paths: traversalResult.paths,
            total: traversalResult.totalNodesVisited,
            executionTimeMs: 0,
          };
          setResults(queryResult);
          onResults?.(queryResult);
          break;
        }

        case 'semantic': {
          if (!semanticQuery.trim()) {
            throw new Error('Search query is required');
          }
          const searchResults = await semanticSearch({
            query: semanticQuery,
            nodeTypes: selectedNodeTypes.length > 0 ? selectedNodeTypes : undefined,
            threshold: semanticThreshold,
            limit: 50,
          });
          const queryResult: GraphQueryResponse = {
            nodes: searchResults.results.map((r) => r.node),
            edges: [],
            total: searchResults.results.length,
            executionTimeMs: 0,
          };
          setResults(queryResult);
          onResults?.(queryResult);
          break;
        }

        case 'path': {
          if (!pathStartNode || !pathEndNode) {
            throw new Error('Both start and end nodes are required');
          }
          const pathResult = await explainPath({
            startNodeId: pathStartNode,
            endNodeId: pathEndNode,
            maxDepth: 6,
            includeReasoning,
          });
          if (pathResult) {
            const queryResult: GraphQueryResponse = {
              nodes: pathResult.path.nodes,
              edges: pathResult.path.edges,
              paths: [pathResult.path],
              total: pathResult.path.nodes.length,
              executionTimeMs: 0,
            };
            setResults(queryResult);
            setPathExplanation(pathResult.explanation);
            onResults?.(queryResult);
          }
          break;
        }
      }
    } catch (error) {
      console.error('Query failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveNodeType = (type: NodeType) => {
    setSelectedNodeTypes((prev) => prev.filter((t) => t !== type));
  };

  const handleRemoveEdgeType = (type: EdgeType) => {
    setSelectedEdgeTypes((prev) => prev.filter((t) => t !== type));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Query Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={queryType} onValueChange={(v) => setQueryType(v as typeof queryType)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="filter" className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              Filter
            </TabsTrigger>
            <TabsTrigger value="traverse" className="flex items-center gap-1">
              <Network className="h-3 w-3" />
              Traverse
            </TabsTrigger>
            <TabsTrigger value="semantic" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Semantic
            </TabsTrigger>
            <TabsTrigger value="path" className="flex items-center gap-1">
              <Route className="h-3 w-3" />
              Path
            </TabsTrigger>
          </TabsList>

          <TabsContent value="filter" className="space-y-4 mt-4">
            <div>
              <Label className="text-sm">Text Search</Label>
              <Input
                placeholder="Search in labels and descriptions..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="mt-1"
              />
            </div>
          </TabsContent>

          <TabsContent value="traverse" className="space-y-4 mt-4">
            <div>
              <Label className="text-sm">Start Node ID</Label>
              <Input
                placeholder="Enter node ID to start traversal..."
                value={startNodeId}
                onChange={(e) => setStartNodeId(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Direction</Label>
              <Select value={traversalDirection} onValueChange={(v) => setTraversalDirection(v as typeof traversalDirection)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Both</SelectItem>
                  <SelectItem value="outgoing">Outgoing</SelectItem>
                  <SelectItem value="incoming">Incoming</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm">Max Depth</Label>
                <span className="text-sm font-medium">{maxDepth}</span>
              </div>
              <Slider
                value={[maxDepth]}
                min={1}
                max={10}
                step={1}
                onValueChange={([v]) => setMaxDepth(v)}
              />
            </div>
          </TabsContent>

          <TabsContent value="semantic" className="space-y-4 mt-4">
            <div>
              <Label className="text-sm">Natural Language Query</Label>
              <Input
                placeholder="Describe what you're looking for..."
                value={semanticQuery}
                onChange={(e) => setSemanticQuery(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm">Similarity Threshold</Label>
                <span className="text-sm font-medium">{(semanticThreshold * 100).toFixed(0)}%</span>
              </div>
              <Slider
                value={[semanticThreshold * 100]}
                min={50}
                max={100}
                step={5}
                onValueChange={([v]) => setSemanticThreshold(v / 100)}
              />
            </div>
          </TabsContent>

          <TabsContent value="path" className="space-y-4 mt-4">
            <div>
              <Label className="text-sm">Start Node ID</Label>
              <Input
                placeholder="Enter start node ID..."
                value={pathStartNode}
                onChange={(e) => setPathStartNode(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">End Node ID</Label>
              <Input
                placeholder="Enter end node ID..."
                value={pathEndNode}
                onChange={(e) => setPathEndNode(e.target.value)}
                className="mt-1"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Type Filters (shared across query types) */}
        <div className="space-y-3 pt-4 border-t">
          <div>
            <Label className="text-sm">Filter by Node Type</Label>
            <Select
              onValueChange={(v) => {
                const type = v as NodeType;
                if (!selectedNodeTypes.includes(type)) {
                  setSelectedNodeTypes([...selectedNodeTypes, type]);
                }
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Add node type filter..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(NODE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value} disabled={selectedNodeTypes.includes(value as NodeType)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedNodeTypes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedNodeTypes.map((type) => (
                  <Badge key={type} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveNodeType(type)}>
                    {NODE_TYPE_LABELS[type]}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm">Filter by Edge Type</Label>
            <Select
              onValueChange={(v) => {
                const type = v as EdgeType;
                if (!selectedEdgeTypes.includes(type)) {
                  setSelectedEdgeTypes([...selectedEdgeTypes, type]);
                }
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Add edge type filter..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EDGE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value} disabled={selectedEdgeTypes.includes(value as EdgeType)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedEdgeTypes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedEdgeTypes.map((type) => (
                  <Badge key={type} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveEdgeType(type)}>
                    {EDGE_TYPE_LABELS[type]}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Execute Button */}
        <Button className="w-full" onClick={handleExecuteQuery} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          Execute Query
        </Button>

        {/* Results Summary */}
        {results && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Results</span>
              <span className="font-medium">{results.total} nodes found</span>
            </div>
            {results.paths && results.paths.length > 0 && (
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Paths</span>
                <span className="font-medium">{results.paths.length} paths</span>
              </div>
            )}
            {pathExplanation && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm font-medium mb-1">Path Explanation</p>
                <p className="text-sm text-muted-foreground">{pathExplanation}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
