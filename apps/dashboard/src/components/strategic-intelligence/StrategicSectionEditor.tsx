/**
 * Strategic Section Editor Component (Sprint S65)
 * Editable section component with markdown preview
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  type StrategicSection,
  getSectionTypeLabel,
  getSectionIcon,
  formatRelativeTime,
} from '@/lib/strategicIntelligenceApi';
import {
  Edit,
  Eye,
  RefreshCw,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  GripVertical,
  FileText,
  Compass,
  TrendingUp,
  Target,
  Grid,
  MessageSquare,
  Mic,
  ArrowLeftRight,
  BarChart,
  ListOrdered,
  Heart,
  AlertTriangle,
  Shield,
  Users,
  Activity,
  Lightbulb,
  Paperclip,
} from 'lucide-react';

interface StrategicSectionEditorProps {
  section: StrategicSection;
  onUpdate?: (sectionId: string, content: string) => Promise<void>;
  onRegenerate?: (sectionId: string) => Promise<void>;
  isUpdating?: boolean;
  isRegenerating?: boolean;
  isDraggable?: boolean;
}

const SECTION_ICONS: Record<string, typeof FileText> = {
  FileText,
  Compass,
  TrendingUp,
  Target,
  Grid,
  MessageSquare,
  Mic,
  ArrowLeftRight,
  BarChart,
  ListOrdered,
  Heart,
  AlertTriangle,
  Shield,
  Users,
  Activity,
  Lightbulb,
  Paperclip,
};

export function StrategicSectionEditor({
  section,
  onUpdate,
  onRegenerate,
  isUpdating = false,
  isRegenerating = false,
  isDraggable = false,
}: StrategicSectionEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(section.contentMd || '');
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');

  const iconName = getSectionIcon(section.sectionType);
  const IconComponent = SECTION_ICONS[iconName] || FileText;

  const handleSave = async () => {
    if (onUpdate) {
      await onUpdate(section.id, editContent);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditContent(section.contentMd || '');
    setIsEditing(false);
    setActiveTab('preview');
  };

  const handleRegenerate = async () => {
    if (onRegenerate) {
      await onRegenerate(section.id);
    }
  };

  const getStatusBadgeVariant = (): 'default' | 'secondary' | 'outline' => {
    switch (section.status) {
      case 'approved':
        return 'default';
      case 'generated':
        return 'secondary';
      case 'edited':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className={`${!section.isVisible ? 'opacity-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDraggable && (
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
            )}
            <IconComponent className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">
              {section.title || getSectionTypeLabel(section.sectionType)}
            </CardTitle>
            <Badge variant={getStatusBadgeVariant()}>
              {section.status}
            </Badge>
            {section.isEdited && (
              <Badge variant="outline" className="text-xs">
                Edited
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {section.regenerationCount > 0 && (
              <span className="text-xs text-muted-foreground">
                Regenerated {section.regenerationCount}x
              </span>
            )}
            {onRegenerate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerate}
                disabled={isRegenerating}
              >
                {isRegenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            )}
            {!isEditing && onUpdate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(true);
                  setActiveTab('edit');
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'preview' | 'edit')}>
                <TabsList>
                  <TabsTrigger value="edit">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </TabsTrigger>
                  <TabsTrigger value="preview">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="edit" className="mt-4">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                    placeholder="Enter section content in Markdown..."
                  />
                </TabsContent>

                <TabsContent value="preview" className="mt-4">
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert min-h-[300px] p-4 border rounded-md"
                    dangerouslySetInnerHTML={{
                      __html: section.contentHtml || '<p class="text-muted-foreground">No content yet</p>',
                    }}
                  />
                </TabsContent>
              </Tabs>

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={handleCancel} disabled={isUpdating}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{
                __html: section.contentHtml || '<p class="text-muted-foreground">No content generated yet. Click Generate to create content for this section.</p>',
              }}
            />
          )}

          {/* Section metadata */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
            {section.tokensUsed > 0 && (
              <span>{section.tokensUsed.toLocaleString()} tokens</span>
            )}
            {section.generationDurationMs && (
              <span>{(section.generationDurationMs / 1000).toFixed(1)}s generation time</span>
            )}
            {section.lastRegeneratedAt && (
              <span>Last regenerated {formatRelativeTime(section.lastRegeneratedAt)}</span>
            )}
            {section.editedAt && section.editedBy && (
              <span>Edited {formatRelativeTime(section.editedAt)}</span>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
