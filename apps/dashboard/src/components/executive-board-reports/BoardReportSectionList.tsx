/**
 * Board Report Section List Component (Sprint S63)
 * Displays and manages report sections with collapsible content
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  type ExecBoardReportSection,
  getSectionTypeLabel,
  getSectionTypeIcon,
  getSectionStatusLabel,
  getSectionStatusColor,
  formatRelativeTime,
} from '@/lib/executiveBoardReportApi';
import { cn } from '@/lib/utils';
import {
  FileText,
  BarChart2,
  Star,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Heart,
  Newspaper,
  Settings,
  Users,
  Cpu,
  Leaf,
  Compass,
  CheckSquare,
  Folder,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Eye,
  EyeOff,
  Clock,
  Edit,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'file-text': FileText,
  'bar-chart-2': BarChart2,
  star: Star,
  'dollar-sign': DollarSign,
  'trending-up': TrendingUp,
  'alert-triangle': AlertTriangle,
  heart: Heart,
  newspaper: Newspaper,
  settings: Settings,
  users: Users,
  cpu: Cpu,
  leaf: Leaf,
  compass: Compass,
  'check-square': CheckSquare,
  folder: Folder,
  file: FileText,
};

interface BoardReportSectionListProps {
  sections: ExecBoardReportSection[];
  onEditSection?: (section: ExecBoardReportSection) => void;
  onToggleVisibility?: (sectionId: string, isVisible: boolean) => void;
  className?: string;
}

export function BoardReportSectionList({
  sections,
  onEditSection,
  onToggleVisibility,
  className,
}: BoardReportSectionListProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.slice(0, 3).map((s) => s.id))
  );

  const toggleExpanded = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const expandAll = () => {
    setExpandedSections(new Set(sections.map((s) => s.id)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  if (sections.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No sections generated yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Click &quot;Generate&quot; to create report content.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          Report Sections ({sections.length})
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
        </div>
      </div>

      {/* Section List */}
      <div className="space-y-2">
        {sections.map((section, index) => {
          const iconName = getSectionTypeIcon(section.sectionType);
          const Icon = ICON_MAP[iconName] || FileText;
          const isExpanded = expandedSections.has(section.id);
          const statusColor = getSectionStatusColor(section.status);

          return (
            <Collapsible
              key={section.id}
              open={isExpanded}
              onOpenChange={() => toggleExpanded(section.id)}
            >
              <Card className={cn(!section.isVisible && 'opacity-60')}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="p-3 cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-gray-400 cursor-grab">
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <span className="text-sm text-gray-500 font-mono w-6">
                          {index + 1}
                        </span>
                        <Icon className="h-4 w-4 text-indigo-600" />
                        <div>
                          <span className="font-medium text-gray-900">
                            {section.title}
                          </span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {getSectionTypeLabel(section.sectionType)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            statusColor === 'green' && 'border-green-300 text-green-600',
                            statusColor === 'yellow' && 'border-yellow-300 text-yellow-600',
                            statusColor === 'blue' && 'border-blue-300 text-blue-600',
                            statusColor === 'red' && 'border-red-300 text-red-600',
                            statusColor === 'indigo' && 'border-indigo-300 text-indigo-600',
                            statusColor === 'gray' && 'border-gray-300 text-gray-600'
                          )}
                        >
                          {getSectionStatusLabel(section.status)}
                        </Badge>
                        {section.tokensUsed && (
                          <Badge variant="outline" className="text-xs">
                            <Cpu className="h-3 w-3 mr-1" />
                            {section.tokensUsed}
                          </Badge>
                        )}
                        {onEditSection && section.isEditable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditSection(section);
                            }}
                          >
                            <Edit className="h-4 w-4 text-gray-500" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleVisibility?.(section.id, !section.isVisible);
                          }}
                        >
                          {section.isVisible ? (
                            <Eye className="h-4 w-4 text-gray-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="p-4 pt-0 border-t">
                    {section.summary && (
                      <div className="text-sm text-gray-600 italic mb-3 pb-3 border-b">
                        {section.summary}
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                      {section.content || 'No content available.'}
                    </div>
                    <div className="flex items-center gap-4 mt-4 pt-3 border-t text-xs text-gray-500">
                      <span>
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatRelativeTime(section.createdAt)}
                      </span>
                      {section.modelName && <span>Model: {section.modelName}</span>}
                      {section.generationDurationMs && (
                        <span>
                          Duration: {(section.generationDurationMs / 1000).toFixed(1)}s
                        </span>
                      )}
                      {section.editedAt && (
                        <span className="text-yellow-600">
                          Edited {formatRelativeTime(section.editedAt)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
