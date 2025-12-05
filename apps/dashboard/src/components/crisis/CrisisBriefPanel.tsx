/**
 * CrisisBriefPanel Component (Sprint S55)
 *
 * Displays a crisis brief with sections, key takeaways,
 * and regeneration options for individual sections
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  Copy,
  Download,
  Edit2,
  Sparkles,
} from 'lucide-react';
import type {
  CrisisBrief,
  CrisisBriefSectionType,
} from '@pravado/types';
import { BRIEF_FORMAT_LABELS, formatTimeAgo } from '@/lib/crisisApi';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface CrisisBriefPanelProps {
  brief: CrisisBrief | null;
  onGenerate?: () => Promise<void>;
  onRegenerateSection?: (sectionId: string, instructions?: string) => Promise<void>;
  onUpdateSection?: (sectionId: string, content: string) => Promise<void>;
  onExport?: (format: 'pdf' | 'docx' | 'txt') => Promise<void>;
  onApprove?: () => Promise<void>;
  isGenerating?: boolean;
  regeneratingSectionId?: string | null;
  isSaving?: boolean;
  maxHeight?: string;
  className?: string;
}

const SECTION_ICONS: Record<CrisisBriefSectionType, string> = {
  situation_overview: '🎯',
  timeline_of_events: '📅',
  media_landscape: '📰',
  key_stakeholders: '👥',
  sentiment_analysis: '📊',
  propagation_analysis: '🌐',
  recommended_actions: '✅',
  talking_points: '💬',
  qa_preparation: '❓',
  risk_assessment: '⚠️',
  mitigation_status: '🛡️',
  next_steps: '➡️',
};

const SECTION_LABELS: Record<CrisisBriefSectionType, string> = {
  situation_overview: 'Situation Overview',
  timeline_of_events: 'Timeline',
  media_landscape: 'Media Landscape',
  key_stakeholders: 'Key Stakeholders',
  sentiment_analysis: 'Sentiment Analysis',
  propagation_analysis: 'Propagation Analysis',
  recommended_actions: 'Recommended Actions',
  talking_points: 'Talking Points',
  qa_preparation: 'Q&A Preparation',
  risk_assessment: 'Risk Assessment',
  mitigation_status: 'Mitigation Status',
  next_steps: 'Next Steps',
};

const STATUS_COLORS = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
  generated: { bg: 'bg-blue-100', text: 'text-blue-700' },
  reviewed: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  approved: { bg: 'bg-green-100', text: 'text-green-700' },
};

export default function CrisisBriefPanel({
  brief,
  onGenerate,
  onRegenerateSection,
  onUpdateSection: _onUpdateSection,
  onExport,
  onApprove,
  isGenerating = false,
  regeneratingSectionId = null,
  isSaving = false,
  maxHeight = '600px',
  className = '',
}: CrisisBriefPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['situation_overview', 'talking_points', 'recommended_actions'])
  );
  const [isCopied, setIsCopied] = useState(false);

  const toggleSection = (sectionType: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionType)) {
        next.delete(sectionType);
      } else {
        next.add(sectionType);
      }
      return next;
    });
  };

  const handleCopyBrief = useCallback(async () => {
    if (!brief) return;
    const text = [
      brief.title,
      brief.subtitle,
      '',
      brief.executiveSummary,
      '',
      ...brief.keyTakeaways.map((t) => `• ${t.title}: ${t.content}`),
      '',
      ...(brief.sections || []).map(
        (s) =>
          `## ${SECTION_LABELS[s.sectionType]}\n${s.content || s.summary || s.bulletPoints.map((b) => `• ${b.text}`).join('\n')}`
      ),
    ].join('\n');

    await navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [brief]);

  // Empty state
  if (!brief) {
    return (
      <Card className={cn('flex flex-col', className)}>
        <CardHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Crisis Brief</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-orange-400" />
            <p className="text-sm text-muted-foreground mb-4">
              No crisis brief has been generated yet
            </p>
            {onGenerate && (
              <Button onClick={onGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Brief
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusColors = STATUS_COLORS[brief.status] || STATUS_COLORS.draft;
  const sections = brief.sections || [];

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="shrink-0 pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-5 w-5 text-blue-600 shrink-0" />
              <CardTitle className="text-lg truncate">{brief.title}</CardTitle>
            </div>
            {brief.subtitle && (
              <p className="text-sm text-muted-foreground truncate">
                {brief.subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant="outline"
              className={cn('capitalize', statusColors.bg, statusColors.text)}
            >
              {brief.status}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              v{brief.version}
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span>{BRIEF_FORMAT_LABELS[brief.format]}</span>
          <span className="text-gray-300">|</span>
          <span>{sections.length} sections</span>
          <span className="text-gray-300">|</span>
          <span>{brief.keyTakeaways.length} takeaways</span>
          <span className="text-gray-300">|</span>
          <span>{formatTimeAgo(brief.updatedAt)}</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea style={{ maxHeight }} className="px-4 pb-4">
          <div className="space-y-4">
            {/* Executive Summary */}
            {brief.executiveSummary && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  Executive Summary
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {brief.executiveSummary}
                </p>
              </div>
            )}

            {/* Key Takeaways */}
            {brief.keyTakeaways.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Key Takeaways</h3>
                <div className="space-y-2">
                  {brief.keyTakeaways.map((takeaway, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'p-3 rounded-lg border-l-4',
                        takeaway.priority === 1
                          ? 'bg-red-50 border-red-400'
                          : takeaway.priority === 2
                            ? 'bg-orange-50 border-orange-400'
                            : 'bg-gray-50 border-gray-300'
                      )}
                    >
                      <div className="font-medium text-sm">{takeaway.title}</div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {takeaway.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Sections */}
            <div className="space-y-2">
              {sections.map((section) => {
                const isExpanded = expandedSections.has(section.sectionType);
                const isRegenerating = regeneratingSectionId === section.id;
                const icon = SECTION_ICONS[section.sectionType] || '📄';
                const label = SECTION_LABELS[section.sectionType] || section.sectionType;

                return (
                  <div
                    key={section.id}
                    className={cn(
                      'border rounded-lg overflow-hidden',
                      section.isManuallyEdited && 'border-yellow-300'
                    )}
                  >
                    {/* Section Header */}
                    <button
                      className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      onClick={() => toggleSection(section.sectionType)}
                    >
                      <div className="flex items-center gap-2">
                        <span>{icon}</span>
                        <span className="font-medium text-sm">{label}</span>
                        {section.isManuallyEdited && (
                          <Badge variant="outline" className="text-xs bg-yellow-50">
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edited
                          </Badge>
                        )}
                        {section.isGenerated && !section.isManuallyEdited && (
                          <Sparkles className="h-3 w-3 text-purple-500" />
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {/* Section Content */}
                    {isExpanded && (
                      <div className="p-4 pt-0 border-t">
                        {/* Summary */}
                        {section.summary && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {section.summary}
                          </p>
                        )}

                        {/* Content */}
                        {section.content && (
                          <div className="text-sm whitespace-pre-line mb-3">
                            {section.content}
                          </div>
                        )}

                        {/* Bullet Points */}
                        {section.bulletPoints.length > 0 && (
                          <ul className="space-y-2 text-sm">
                            {section.bulletPoints.map((bp, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span
                                  className={cn(
                                    'mt-1.5 h-1.5 w-1.5 rounded-full shrink-0',
                                    bp.importance === 'high'
                                      ? 'bg-red-500'
                                      : bp.importance === 'medium'
                                        ? 'bg-yellow-500'
                                        : 'bg-gray-400'
                                  )}
                                />
                                <div>
                                  <span>{bp.text}</span>
                                  {bp.subPoints && bp.subPoints.length > 0 && (
                                    <ul className="mt-1 ml-4 space-y-1 text-muted-foreground">
                                      {bp.subPoints.map((sp, spIdx) => (
                                        <li key={spIdx}>- {sp}</li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Section Actions */}
                        {onRegenerateSection && (
                          <div className="flex justify-end mt-4 pt-3 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRegenerateSection(section.id)}
                              disabled={isRegenerating}
                            >
                              {isRegenerating ? (
                                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4 mr-1" />
                              )}
                              Regenerate
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </CardContent>

      {/* Footer Actions */}
      <div className="px-4 py-3 border-t bg-gray-50 shrink-0">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {brief.totalTokensUsed.toLocaleString()} tokens used
            {brief.generationDurationMs &&
              ` · ${(brief.generationDurationMs / 1000).toFixed(1)}s`}
          </div>

          <div className="flex items-center gap-2">
            {/* Copy */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyBrief}
              disabled={isCopied}
            >
              {isCopied ? (
                <Check className="h-4 w-4 mr-1 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 mr-1" />
              )}
              Copy
            </Button>

            {/* Export */}
            {onExport && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onExport('pdf')}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}

            {/* Regenerate All */}
            {onGenerate && (
              <Button
                variant="outline"
                size="sm"
                onClick={onGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Regenerate
              </Button>
            )}

            {/* Approve */}
            {onApprove && brief.status !== 'approved' && (
              <Button
                variant="default"
                size="sm"
                onClick={onApprove}
                disabled={isSaving}
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
