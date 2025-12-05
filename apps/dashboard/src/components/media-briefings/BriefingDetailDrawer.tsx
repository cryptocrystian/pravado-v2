/**
 * BriefingDetailDrawer Component (Sprint S54)
 *
 * Slide-out drawer for viewing detailed briefing information
 * including full editor, insights panel, and actions
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  X,
  ExternalLink,
  Maximize2,
  Minimize2,
  RefreshCw,
  Copy,
  Check,
  Download,
  Trash2,
  Archive,
} from 'lucide-react';
import type {
  MediaBriefing,
  BriefingInsight,
  TalkingPointCategory,
  BriefingSourceType,
} from '@pravado/types';
import {
  getFormatLabel,
  getFormatIcon,
  getStatusLabel,
  getStatusColor,
  getStatusBgColor,
  formatRelativeTime,
} from '@/lib/mediaBriefingApi';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import BriefingEditor from './BriefingEditor';
import InsightPanel from './InsightPanel';

interface BriefingDetailDrawerProps {
  briefing: MediaBriefing | null;
  insights?: BriefingInsight[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateBriefing?: (data: Partial<MediaBriefing>) => Promise<void>;
  onRegenerateSection?: (sectionId: string, customInstructions?: string) => Promise<void>;
  onUpdateSection?: (sectionId: string, content: string) => Promise<void>;
  onApproveTalkingPoint?: (id: string) => Promise<void>;
  onDeleteTalkingPoint?: (id: string) => Promise<void>;
  onGenerateTalkingPoints?: (category?: TalkingPointCategory) => Promise<void>;
  onReviewBriefing?: () => Promise<void>;
  onApproveBriefing?: () => Promise<void>;
  onArchiveBriefing?: () => Promise<void>;
  onGenerateBriefing?: () => Promise<void>;
  onDeleteBriefing?: () => Promise<void>;
  onExport?: (format: 'pdf' | 'docx' | 'txt') => Promise<void>;
  onOpenFullPage?: (briefingId: string) => void;
  onViewSource?: (sourceType: BriefingSourceType, sourceId: string) => void;
  regeneratingSectionId?: string | null;
  isGenerating?: boolean;
  isSaving?: boolean;
  isDeleting?: boolean;
}

export default function BriefingDetailDrawer({
  briefing,
  insights = [],
  isOpen,
  onClose,
  onUpdateBriefing,
  onRegenerateSection,
  onUpdateSection,
  onApproveTalkingPoint,
  onDeleteTalkingPoint,
  onGenerateTalkingPoints,
  onReviewBriefing,
  onApproveBriefing,
  onArchiveBriefing,
  onGenerateBriefing,
  onDeleteBriefing,
  onExport,
  onOpenFullPage,
  onViewSource,
  regeneratingSectionId,
  isGenerating = false,
  isSaving = false,
  isDeleting = false,
}: BriefingDetailDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showInsights, setShowInsights] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleCopyLink = useCallback(async () => {
    if (!briefing) return;
    const url = `${window.location.origin}/app/media-briefings/${briefing.id}`;
    await navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [briefing]);

  const handleDelete = useCallback(async () => {
    if (!onDeleteBriefing) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    await onDeleteBriefing();
    setConfirmDelete(false);
    onClose();
  }, [onDeleteBriefing, confirmDelete, onClose]);

  if (!briefing) return null;

  const sheetSize = isExpanded ? 'w-[95vw] max-w-[1600px]' : 'w-[800px] max-w-[90vw]';

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className={cn('p-0 flex flex-col', sheetSize)} side="right">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{getFormatIcon(briefing.format)}</span>
                <SheetTitle className="text-lg truncate">{briefing.title}</SheetTitle>
              </div>
              {briefing.subtitle && (
                <SheetDescription className="truncate">{briefing.subtitle}</SheetDescription>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant="outline"
                className={cn('text-sm', getStatusBgColor(briefing.status), getStatusColor(briefing.status))}
              >
                {getStatusLabel(briefing.status)}
              </Badge>

              {/* Copy Link */}
              <Button variant="ghost" size="icon" onClick={handleCopyLink}>
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>

              {/* Open Full Page */}
              {onOpenFullPage && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenFullPage(briefing.id)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}

              {/* Expand/Collapse */}
              <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>

              {/* Close */}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>Format: {getFormatLabel(briefing.format)}</span>
            <span className="text-gray-300">|</span>
            <span>Sections: {briefing.sections?.length || 0}</span>
            <span className="text-gray-300">|</span>
            <span>Talking Points: {briefing.talkingPoints?.length || 0}</span>
            <span className="text-gray-300">|</span>
            <span>Updated: {formatRelativeTime(briefing.updatedAt)}</span>
          </div>
        </SheetHeader>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor Area */}
          <ScrollArea className={cn('flex-1', showInsights && isExpanded ? 'max-w-[calc(100%-320px)]' : '')}>
            <div className="p-6">
              <BriefingEditor
                briefing={briefing}
                onUpdateBriefing={onUpdateBriefing}
                onRegenerateSection={onRegenerateSection}
                onUpdateSection={onUpdateSection}
                onApproveTalkingPoint={onApproveTalkingPoint}
                onDeleteTalkingPoint={onDeleteTalkingPoint}
                onGenerateTalkingPoints={onGenerateTalkingPoints}
                onReviewBriefing={onReviewBriefing}
                onApproveBriefing={onApproveBriefing}
                onArchiveBriefing={onArchiveBriefing}
                onGenerateBriefing={onGenerateBriefing}
                onExport={onExport}
                regeneratingSectionId={regeneratingSectionId}
                isGenerating={isGenerating}
                isSaving={isSaving}
              />
            </div>
          </ScrollArea>

          {/* Insights Sidebar (expanded view only) */}
          {isExpanded && showInsights && insights.length > 0 && (
            <>
              <Separator orientation="vertical" />
              <div className="w-[320px] shrink-0">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <InsightPanel
                      insights={insights}
                      onViewSource={onViewSource}
                      maxHeight="calc(100vh - 200px)"
                    />
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t bg-gray-50 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Toggle Insights */}
              {isExpanded && insights.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInsights(!showInsights)}
                >
                  {showInsights ? 'Hide' : 'Show'} Insights ({insights.length})
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Export */}
              {onExport && (
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onExport('pdf')}
                    disabled={isGenerating || isSaving}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onExport('docx')}
                    disabled={isGenerating || isSaving}
                  >
                    DOCX
                  </Button>
                </div>
              )}

              {/* Archive */}
              {briefing.status !== 'archived' && onArchiveBriefing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onArchiveBriefing}
                  disabled={isGenerating || isSaving}
                >
                  <Archive className="h-4 w-4 mr-1" />
                  Archive
                </Button>
              )}

              {/* Delete */}
              {onDeleteBriefing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={cn(
                    'text-red-600 hover:text-red-700 hover:bg-red-50',
                    confirmDelete && 'bg-red-100'
                  )}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {confirmDelete ? 'Confirm Delete?' : 'Delete'}
                </Button>
              )}

              {/* Regenerate */}
              {briefing.status !== 'draft' && onGenerateBriefing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGenerateBriefing}
                  disabled={isGenerating}
                >
                  <RefreshCw className={cn('h-4 w-4 mr-1', isGenerating && 'animate-spin')} />
                  Regenerate
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
