/**
 * Edge Inspector Drawer Component (Sprint S66)
 * Detailed edge inspection and editing
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
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import {
  EdgeWithNodes,
  getEdgeTypeLabel,
  getEdgeTypeColor,
  getNodeTypeLabel,
  formatWeight,
  getEdgeWithNodes,
  updateEdge,
} from '@/lib/unifiedGraphApi';
import {
  ArrowRight,
  ArrowLeftRight,
  Save,
  X,
  Scale,
  Loader2,
} from 'lucide-react';

interface EdgeInspectorDrawerProps {
  edgeId: string | null;
  onClose: () => void;
  onUpdate?: () => void;
  onNavigateToNode?: (nodeId: string) => void;
}

export function EdgeInspectorDrawer({
  edgeId,
  onClose,
  onUpdate,
  onNavigateToNode,
}: EdgeInspectorDrawerProps) {
  const [data, setData] = useState<EdgeWithNodes | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    description: '',
    weight: 1,
    isBidirectional: false,
  });

  useEffect(() => {
    if (!edgeId) {
      setData(null);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await getEdgeWithNodes(edgeId);
        setData(result);
        setFormData({
          label: result.edge.label || '',
          description: result.edge.description || '',
          weight: result.edge.weight,
          isBidirectional: result.edge.isBidirectional,
        });
      } catch (error) {
        console.error('Failed to fetch edge:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [edgeId]);

  const handleSave = async () => {
    if (!edgeId) return;

    setIsSaving(true);
    try {
      await updateEdge(edgeId, {
        label: formData.label || undefined,
        description: formData.description || undefined,
        weight: formData.weight,
        isBidirectional: formData.isBidirectional,
      });
      setEditMode(false);
      onUpdate?.();

      // Refresh data
      const result = await getEdgeWithNodes(edgeId);
      setData(result);
    } catch (error) {
      console.error('Failed to update edge:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const DirectionIcon = data?.edge.isBidirectional ? ArrowLeftRight : ArrowRight;

  return (
    <Sheet open={!!edgeId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <DirectionIcon className="h-5 w-5" />
              Edge Inspector
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
            {/* Edge Header */}
            <div className="flex items-start justify-between">
              <div>
                <Badge className={getEdgeTypeColor(data.edge.edgeType).replace('text-', 'bg-').replace('-600', '-100')}>
                  {getEdgeTypeLabel(data.edge.edgeType)}
                </Badge>
                {data.edge.isBidirectional && (
                  <Badge variant="outline" className="ml-2">
                    <ArrowLeftRight className="h-3 w-3 mr-1" />
                    Bidirectional
                  </Badge>
                )}
                {editMode ? (
                  <Input
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="Edge label (optional)"
                    className="mt-2"
                  />
                ) : data.edge.label ? (
                  <h3 className="text-lg font-semibold mt-2">{data.edge.label}</h3>
                ) : null}
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

            {/* Connection Visualization */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div
                    className="flex-1 p-4 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => onNavigateToNode?.(data.sourceNode.id)}
                  >
                    <p className="font-medium truncate">{data.sourceNode.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {getNodeTypeLabel(data.sourceNode.nodeType)}
                    </p>
                  </div>
                  <DirectionIcon className={`h-6 w-6 flex-shrink-0 ${getEdgeTypeColor(data.edge.edgeType)}`} />
                  <div
                    className="flex-1 p-4 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => onNavigateToNode?.(data.targetNode.id)}
                  >
                    <p className="font-medium truncate">{data.targetNode.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {getNodeTypeLabel(data.targetNode.nodeType)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <div>
              <Label className="text-sm text-muted-foreground">Description</Label>
              {editMode ? (
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1"
                  rows={3}
                  placeholder="Edge description (optional)"
                />
              ) : (
                <p className="text-sm mt-1">
                  {data.edge.description || 'No description'}
                </p>
              )}
            </div>

            {/* Weight */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-1">
                  <Scale className="h-3 w-3" />
                  Weight
                </Label>
                <span className="text-sm font-medium">
                  {formatWeight(editMode ? formData.weight : data.edge.weight)}
                </span>
              </div>
              {editMode ? (
                <Slider
                  value={[formData.weight]}
                  min={0}
                  max={10}
                  step={0.1}
                  onValueChange={([v]) => setFormData({ ...formData, weight: v })}
                />
              ) : (
                <div className="h-2 bg-muted rounded-full">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.min((data.edge.weight / 10) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Bidirectional Toggle */}
            {editMode && (
              <div className="flex items-center justify-between">
                <Label htmlFor="bidirectional">Bidirectional</Label>
                <Switch
                  id="bidirectional"
                  checked={formData.isBidirectional}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isBidirectional: checked })
                  }
                />
              </div>
            )}

            {/* Metadata */}
            <div className="space-y-4 pt-4 border-t">
              {data.edge.sourceSystem && (
                <div>
                  <Label className="text-sm text-muted-foreground">Source System</Label>
                  <p className="text-sm mt-1">
                    {data.edge.sourceSystem}
                    {data.edge.inferenceMethod && ` (${data.edge.inferenceMethod})`}
                  </p>
                </div>
              )}

              {data.edge.confidenceScore != null && (
                <div>
                  <Label className="text-sm text-muted-foreground">Confidence Score</Label>
                  <p className="text-sm mt-1">
                    {((data.edge.confidenceScore ?? 0) * 100).toFixed(1)}%
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p>{new Date(data.edge.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Updated</Label>
                  <p>{new Date(data.edge.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Edge not found</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
