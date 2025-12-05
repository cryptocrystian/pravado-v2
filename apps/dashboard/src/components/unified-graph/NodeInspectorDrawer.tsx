/**
 * Node Inspector Drawer Component (Sprint S66)
 * Detailed node inspection and editing
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  NodeWithConnections,
  getNodeTypeLabel,
  getNodeTypeColor,
  getEdgeTypeLabel,
  formatCentrality,
  getNodeWithConnections,
  updateNode,
} from '@/lib/unifiedGraphApi';
import {
  CircleDot,
  Save,
  X,
  GitBranch,
  BarChart3,
  Tag,
  Loader2,
} from 'lucide-react';

interface NodeInspectorDrawerProps {
  nodeId: string | null;
  onClose: () => void;
  onUpdate?: () => void;
  onNavigateToNode?: (nodeId: string) => void;
}

export function NodeInspectorDrawer({
  nodeId,
  onClose,
  onUpdate,
  onNavigateToNode,
}: NodeInspectorDrawerProps) {
  const [data, setData] = useState<NodeWithConnections | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    description: '',
    tags: '',
  });

  useEffect(() => {
    if (!nodeId) {
      setData(null);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await getNodeWithConnections(nodeId);
        setData(result);
        setFormData({
          label: result.node.label,
          description: result.node.description || '',
          tags: result.node.tags.join(', '),
        });
      } catch (error) {
        console.error('Failed to fetch node:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [nodeId]);

  const handleSave = async () => {
    if (!nodeId) return;

    setIsSaving(true);
    try {
      await updateNode(nodeId, {
        label: formData.label,
        description: formData.description || undefined,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setEditMode(false);
      onUpdate?.();

      // Refresh data
      const result = await getNodeWithConnections(nodeId);
      setData(result);
    } catch (error) {
      console.error('Failed to update node:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={!!nodeId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <CircleDot className="h-5 w-5" />
              Node Inspector
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <div className="space-y-6 mt-6">
            {/* Node Header */}
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${getNodeTypeColor(data.node.nodeType)}`}>
                <CircleDot className="h-6 w-6" />
              </div>
              <div className="flex-1">
                {editMode ? (
                  <Input
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="text-lg font-semibold"
                  />
                ) : (
                  <h3 className="text-lg font-semibold">{data.node.label}</h3>
                )}
                <Badge variant="secondary" className="mt-1">
                  {getNodeTypeLabel(data.node.nodeType)}
                </Badge>
              </div>
              <div className="flex gap-2">
                {editMode ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                      {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
                    Edit
                  </Button>
                )}
              </div>
            </div>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="connections">
                  Connections ({data.incomingEdges.length + data.outgoingEdges.length})
                </TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                {/* Description */}
                <div>
                  <Label className="text-sm text-muted-foreground">Description</Label>
                  {editMode ? (
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1"
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm mt-1">
                      {data.node.description || 'No description'}
                    </p>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <Label className="text-sm text-muted-foreground flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Tags
                  </Label>
                  {editMode ? (
                    <Input
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="Comma-separated tags"
                      className="mt-1"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {data.node.tags.length > 0 ? (
                        data.node.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No tags</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Source Info */}
                {data.node.sourceSystem && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Source</Label>
                    <p className="text-sm mt-1">
                      {data.node.sourceSystem}
                      {data.node.sourceTable && ` / ${data.node.sourceTable}`}
                    </p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <p>{new Date(data.node.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Updated</Label>
                    <p>{new Date(data.node.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="connections" className="space-y-4 mt-4">
                {/* Incoming Edges */}
                {data.incomingEdges.length > 0 && (
                  <div>
                    <Label className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                      <GitBranch className="h-3 w-3" />
                      Incoming ({data.incomingEdges.length})
                    </Label>
                    <div className="space-y-2">
                      {data.incomingEdges.map((edge) => {
                        const sourceNode = data.neighbors.find((n) => n.id === edge.sourceNodeId);
                        return (
                          <Card key={edge.id} className="cursor-pointer hover:bg-muted/50"
                            onClick={() => onNavigateToNode?.(edge.sourceNodeId)}>
                            <CardContent className="py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate flex-1">
                                  {sourceNode?.label || edge.sourceNodeId.slice(0, 8)}
                                </span>
                                <Badge variant="outline">{getEdgeTypeLabel(edge.edgeType)}</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Outgoing Edges */}
                {data.outgoingEdges.length > 0 && (
                  <div>
                    <Label className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                      <GitBranch className="h-3 w-3 rotate-180" />
                      Outgoing ({data.outgoingEdges.length})
                    </Label>
                    <div className="space-y-2">
                      {data.outgoingEdges.map((edge) => {
                        const targetNode = data.neighbors.find((n) => n.id === edge.targetNodeId);
                        return (
                          <Card key={edge.id} className="cursor-pointer hover:bg-muted/50"
                            onClick={() => onNavigateToNode?.(edge.targetNodeId)}>
                            <CardContent className="py-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{getEdgeTypeLabel(edge.edgeType)}</Badge>
                                <span className="font-medium truncate flex-1">
                                  {targetNode?.label || edge.targetNodeId.slice(0, 8)}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {data.incomingEdges.length === 0 && data.outgoingEdges.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No connections
                  </p>
                )}
              </TabsContent>

              <TabsContent value="metrics" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Degree Centrality</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {formatCentrality(data.node.degreeCentrality)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">PageRank</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {formatCentrality(data.node.pagerankScore)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Betweenness</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {formatCentrality(data.node.betweennessCentrality)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Closeness</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {formatCentrality(data.node.closenessCentrality)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {data.node.clusterId && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Cluster ID</Label>
                    <p className="text-sm font-mono mt-1">{data.node.clusterId}</p>
                  </div>
                )}

                {data.node.confidenceScore != null && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Confidence Score</Label>
                    <p className="text-sm mt-1">
                      {((data.node.confidenceScore ?? 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Node not found</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
