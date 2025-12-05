/**
 * Graph Edge Card Component (Sprint S66)
 * Displays edge information in card format
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  IntelligenceEdge,
  getEdgeTypeLabel,
  getEdgeTypeColor,
  formatWeight,
} from '@/lib/unifiedGraphApi';
import {
  ArrowRight,
  ArrowLeftRight,
  Scale,
  MoreVertical,
  Eye,
  Trash2,
  Edit,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface GraphEdgeCardProps {
  edge: IntelligenceEdge;
  sourceLabel?: string;
  targetLabel?: string;
  onView?: (edge: IntelligenceEdge) => void;
  onEdit?: (edge: IntelligenceEdge) => void;
  onDelete?: (edgeId: string) => void;
  isSelected?: boolean;
  compact?: boolean;
}

export function GraphEdgeCard({
  edge,
  sourceLabel,
  targetLabel,
  onView,
  onEdit,
  onDelete,
  isSelected,
  compact,
}: GraphEdgeCardProps) {
  const typeColor = getEdgeTypeColor(edge.edgeType);
  const DirectionIcon = edge.isBidirectional ? ArrowLeftRight : ArrowRight;

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
          isSelected ? 'ring-2 ring-primary' : ''
        }`}
        onClick={() => onView?.(edge)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 text-sm">
          <span className="truncate font-medium">{sourceLabel || 'Source'}</span>
          <DirectionIcon className={`h-4 w-4 flex-shrink-0 ${typeColor}`} />
          <span className="truncate font-medium">{targetLabel || 'Target'}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {getEdgeTypeLabel(edge.edgeType)}
        </Badge>
      </div>
    );
  }

  return (
    <Card className={isSelected ? 'ring-2 ring-primary' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={typeColor.replace('text-', 'bg-').replace('-600', '-100')}>
                {getEdgeTypeLabel(edge.edgeType)}
              </Badge>
              {edge.isBidirectional && (
                <Badge variant="outline">
                  <ArrowLeftRight className="h-3 w-3 mr-1" />
                  Bidirectional
                </Badge>
              )}
            </div>
            {edge.label && (
              <CardTitle className="text-base">{edge.label}</CardTitle>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(edge)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(edge)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(edge.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <div className="flex-1 text-center">
            <p className="font-medium truncate">{sourceLabel || 'Source Node'}</p>
            <p className="text-xs text-muted-foreground truncate">
              {edge.sourceNodeId.slice(0, 8)}...
            </p>
          </div>
          <DirectionIcon className={`h-5 w-5 flex-shrink-0 ${typeColor}`} />
          <div className="flex-1 text-center">
            <p className="font-medium truncate">{targetLabel || 'Target Node'}</p>
            <p className="text-xs text-muted-foreground truncate">
              {edge.targetNodeId.slice(0, 8)}...
            </p>
          </div>
        </div>

        {edge.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {edge.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Scale className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Weight:</span>
            <span className="font-medium">{formatWeight(edge.weight)}</span>
          </div>
          {edge.confidenceScore != null && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Confidence:</span>
              <span className="font-medium">
                {((edge.confidenceScore ?? 0) * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>

        {edge.sourceSystem && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Source: {edge.sourceSystem}
            {edge.inferenceMethod && ` (${edge.inferenceMethod})`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
