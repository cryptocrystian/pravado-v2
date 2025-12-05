/**
 * Graph Node Card Component (Sprint S66)
 * Displays node information in card format
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  IntelligenceNode,
  getNodeTypeLabel,
  getNodeTypeColor,
  formatCentrality,
} from '@/lib/unifiedGraphApi';
import {
  CircleDot,
  Tag,
  Calendar,
  BarChart3,
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

interface GraphNodeCardProps {
  node: IntelligenceNode;
  onView?: (node: IntelligenceNode) => void;
  onEdit?: (node: IntelligenceNode) => void;
  onDelete?: (nodeId: string) => void;
  isSelected?: boolean;
  compact?: boolean;
}

export function GraphNodeCard({
  node,
  onView,
  onEdit,
  onDelete,
  isSelected,
  compact,
}: GraphNodeCardProps) {
  const typeColor = getNodeTypeColor(node.nodeType);

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
          isSelected ? 'ring-2 ring-primary' : ''
        }`}
        onClick={() => onView?.(node)}
      >
        <div className={`p-2 rounded-full ${typeColor}`}>
          <CircleDot className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{node.label}</p>
          <p className="text-xs text-muted-foreground">
            {getNodeTypeLabel(node.nodeType)}
          </p>
        </div>
        {node.pagerankScore !== null && (
          <Badge variant="outline" className="text-xs">
            {formatCentrality(node.pagerankScore)}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={isSelected ? 'ring-2 ring-primary' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${typeColor}`}>
              <CircleDot className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{node.label}</CardTitle>
              <Badge variant="secondary" className="mt-1">
                {getNodeTypeLabel(node.nodeType)}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(node)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(node)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(node.id)}
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
        {node.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {node.description}
          </p>
        )}

        {node.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-3 w-3 text-muted-foreground" />
            {node.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {node.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{node.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          {node.degreeCentrality !== null && (
            <div className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Degree:</span>
              <span>{formatCentrality(node.degreeCentrality)}</span>
            </div>
          )}
          {node.pagerankScore !== null && (
            <div className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">PageRank:</span>
              <span>{formatCentrality(node.pagerankScore)}</span>
            </div>
          )}
        </div>

        {(node.sourceSystem || node.createdAt) && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            {node.sourceSystem && (
              <span>Source: {node.sourceSystem}</span>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(node.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
