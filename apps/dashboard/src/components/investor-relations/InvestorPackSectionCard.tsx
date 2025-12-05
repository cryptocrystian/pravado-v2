/**
 * Investor Pack Section Card Component (Sprint S64)
 * Displays a single section with content and actions
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  type InvestorPackSection,
  getSectionTypeLabel,
  formatRelativeTime,
} from '@/lib/investorRelationsApi';
import { cn } from '@/lib/utils';
import {
  FileText,
  Star,
  AlertTriangle,
  BarChart,
  Globe,
  Users,
  Package,
  Target,
  MessageCircle,
  Shield,
  Scale,
  Leaf,
  TrendingUp,
  Paperclip,
  RefreshCw,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { InvestorSectionType } from '@pravado/types';

interface InvestorPackSectionCardProps {
  section: InvestorPackSection;
  onUpdate?: (content: string) => Promise<void>;
  onRegenerate?: () => Promise<void>;
  onToggleVisibility?: () => Promise<void>;
  className?: string;
}

const SECTION_ICONS: Record<InvestorSectionType, typeof FileText> = {
  executive_summary: FileText,
  highlights: Star,
  lowlights: AlertTriangle,
  kpi_overview: BarChart,
  market_context: Globe,
  competition: Users,
  product_updates: Package,
  go_to_market: Target,
  customer_stories: MessageCircle,
  risk_and_mitigations: Shield,
  governance: Scale,
  esg: Leaf,
  outlook: TrendingUp,
  appendix: Paperclip,
};

export function InvestorPackSectionCard({
  section,
  onUpdate,
  onRegenerate,
  onToggleVisibility,
  className,
}: InvestorPackSectionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editContent, setEditContent] = useState(section.contentMd || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const Icon = SECTION_ICONS[section.sectionType] || FileText;

  const handleSave = async () => {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      await onUpdate(editContent);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!onRegenerate) return;
    setIsRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCancel = () => {
    setEditContent(section.contentMd || '');
    setIsEditing(false);
  };

  const getStatusColor = () => {
    switch (section.status) {
      case 'generated':
        return 'bg-green-100 text-green-700';
      case 'edited':
        return 'bg-blue-100 text-blue-700';
      case 'approved':
        return 'bg-indigo-100 text-indigo-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className={cn(!section.isVisible && 'opacity-50', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon className="h-4 w-4 text-indigo-600" />
            {section.title || getSectionTypeLabel(section.sectionType)}
          </CardTitle>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={cn('text-xs', getStatusColor())}>
              {section.status}
            </Badge>

            {!isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleVisibility}
                  title={section.isVisible ? 'Hide section' : 'Show section'}
                >
                  {section.isVisible ? (
                    <Eye className="h-4 w-4 text-gray-400" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  disabled={!section.contentMd}
                >
                  <Edit className="h-4 w-4 text-gray-400" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                >
                  {isRegenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={10}
              className="font-mono text-sm"
              placeholder="Enter section content in Markdown..."
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save
              </Button>
            </div>
          </div>
        ) : section.contentMd ? (
          <div>
            <div
              className={cn(
                'prose prose-sm max-w-none text-gray-700',
                !isExpanded && 'line-clamp-5'
              )}
            >
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {section.contentMd}
              </pre>
            </div>
            {section.contentMd.split('\n').length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-indigo-600"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show more
                  </>
                )}
              </Button>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-400">
            <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No content generated yet</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleRegenerate}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Generate Content
            </Button>
          </div>
        )}

        {/* Meta info */}
        {section.editedAt && (
          <div className="mt-3 pt-3 border-t text-xs text-gray-400">
            Last edited {formatRelativeTime(section.editedAt)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
