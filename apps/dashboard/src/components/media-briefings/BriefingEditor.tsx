/**
 * BriefingEditor Component (Sprint S54)
 *
 * Central editor for viewing and editing a complete media briefing
 * with sections and talking points management
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  RefreshCw,
  Copy,
  Check,
  Download,
  FileText,
  MessageSquare,
  Layers,
  PlusCircle,
  Settings,
  Save,
  CheckCircle2,
  Archive,
  Sparkles,
} from 'lucide-react';
import type {
  MediaBriefing,
  TalkingPoint,
  TalkingPointCategory,
} from '@pravado/types';
import {
  getFormatLabel,
  getFormatIcon,
  getStatusLabel,
  getStatusColor,
  getStatusBgColor,
  getConfidenceScoreColor,
  formatRelativeTime,
  formatDate,
  formatTokens,
  getTalkingPointCategoryLabel,
} from '@/lib/mediaBriefingApi';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import BriefingSection from './BriefingSection';
import TalkingPointCard from './TalkingPointCard';

interface BriefingEditorProps {
  briefing: MediaBriefing;
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
  onExport?: (format: 'pdf' | 'docx' | 'txt') => Promise<void>;
  regeneratingSectionId?: string | null;
  isGenerating?: boolean;
  isSaving?: boolean;
  className?: string;
}

export default function BriefingEditor({
  briefing,
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
  onExport,
  regeneratingSectionId,
  isGenerating = false,
  isSaving = false,
  className = '',
}: BriefingEditorProps) {
  const [activeTab, setActiveTab] = useState<'sections' | 'talking-points' | 'settings'>('sections');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(briefing.title);
  const [editSubtitle, setEditSubtitle] = useState(briefing.subtitle || '');
  const [isCopied, setIsCopied] = useState(false);

  const sections = briefing.sections || [];
  const talkingPoints = briefing.talkingPoints || [];

  // Group talking points by category
  const groupedTalkingPoints = talkingPoints.reduce(
    (acc, tp) => {
      const category = tp.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(tp);
      return acc;
    },
    {} as Record<TalkingPointCategory, TalkingPoint[]>
  );

  const handleCopyAll = useCallback(async () => {
    const content = [
      `# ${briefing.title}`,
      briefing.subtitle ? `*${briefing.subtitle}*` : '',
      '',
      '## Sections',
      ...sections.map((s) => `### ${s.title}\n${s.content || 'No content'}\n`),
      '',
      '## Talking Points',
      ...talkingPoints.map((tp) => `- **${tp.headline}**: ${tp.content}`),
    ]
      .filter(Boolean)
      .join('\n');

    await navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [briefing, sections, talkingPoints]);

  const handleSaveTitle = async () => {
    if (onUpdateBriefing && (editTitle !== briefing.title || editSubtitle !== briefing.subtitle)) {
      await onUpdateBriefing({ title: editTitle, subtitle: editSubtitle || undefined });
    }
    setIsEditingTitle(false);
  };

  const handleCancelEditTitle = () => {
    setEditTitle(briefing.title);
    setEditSubtitle(briefing.subtitle || '');
    setIsEditingTitle(false);
  };

  const approvedTalkingPoints = talkingPoints.filter((tp) => tp.isApproved).length;
  const totalTokensUsed =
    sections.reduce((acc, s) => acc + (s.tokensUsed || 0), 0) + (briefing.totalTokensUsed || 0);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 min-w-0">
          {isEditingTitle ? (
            <div className="space-y-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Briefing title"
                className="text-xl font-semibold"
              />
              <Input
                value={editSubtitle}
                onChange={(e) => setEditSubtitle(e.target.value)}
                placeholder="Subtitle (optional)"
                className="text-sm text-muted-foreground"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveTitle} disabled={!editTitle.trim()}>
                  <Save className="h-3 w-3 mr-1" /> Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEditTitle}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="cursor-pointer hover:bg-gray-50 p-2 rounded -m-2"
              onClick={() => onUpdateBriefing && setIsEditingTitle(true)}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{getFormatIcon(briefing.format)}</span>
                <h1 className="text-2xl font-bold truncate">{briefing.title}</h1>
              </div>
              {briefing.subtitle && (
                <p className="text-muted-foreground truncate">{briefing.subtitle}</p>
              )}
            </div>
          )}
        </div>

        {/* Status & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn('text-sm', getStatusBgColor(briefing.status), getStatusColor(briefing.status))}
          >
            {getStatusLabel(briefing.status)}
          </Badge>

          <Button variant="outline" size="sm" onClick={handleCopyAll} disabled={isGenerating}>
            {isCopied ? (
              <>
                <Check className="h-4 w-4 mr-1 text-green-600" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" /> Copy All
              </>
            )}
          </Button>

          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport('pdf')}
              disabled={isGenerating}
            >
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          )}

          {briefing.status === 'draft' && onGenerateBriefing && (
            <Button onClick={onGenerateBriefing} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" /> Generate
                </>
              )}
            </Button>
          )}

          {briefing.status === 'generated' && onReviewBriefing && (
            <Button onClick={onReviewBriefing} disabled={isSaving}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Reviewed
            </Button>
          )}

          {briefing.status === 'reviewed' && onApproveBriefing && (
            <Button onClick={onApproveBriefing} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
              <Check className="h-4 w-4 mr-2" /> Approve
            </Button>
          )}

          {briefing.status !== 'archived' && onArchiveBriefing && (
            <Button variant="ghost" size="sm" onClick={onArchiveBriefing} disabled={isSaving}>
              <Archive className="h-4 w-4 mr-1" /> Archive
            </Button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Layers className="h-4 w-4" />
              <span className="text-xs">Sections</span>
            </div>
            <div className="text-2xl font-bold">{sections.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs">Talking Points</span>
            </div>
            <div className="text-2xl font-bold">
              {talkingPoints.length}
              <span className="text-sm font-normal text-green-600 ml-1">
                ({approvedTalkingPoints} approved)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FileText className="h-4 w-4" />
              <span className="text-xs">Confidence</span>
            </div>
            <div className={cn('text-2xl font-bold', getConfidenceScoreColor(briefing.confidenceScore))}>
              {briefing.confidenceScore ? `${briefing.confidenceScore.toFixed(0)}%` : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs">Tokens Used</span>
            </div>
            <div className="text-2xl font-bold">{formatTokens(totalTokensUsed)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Metadata Row */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span>Format: {getFormatLabel(briefing.format)}</span>
        <span className="text-gray-300">|</span>
        <span>Tone: <span className="capitalize">{briefing.tone}</span></span>
        <span className="text-gray-300">|</span>
        <span>Updated: {formatRelativeTime(briefing.updatedAt)}</span>
        {briefing.generatedAt && (
          <>
            <span className="text-gray-300">|</span>
            <span>Generated: {formatDate(briefing.generatedAt)}</span>
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sections" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Sections ({sections.length})
          </TabsTrigger>
          <TabsTrigger value="talking-points" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Talking Points ({talkingPoints.length})
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Sections Tab */}
        <TabsContent value="sections" className="space-y-4 mt-4">
          {sections.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No sections generated yet.
                {briefing.status === 'draft' && onGenerateBriefing && (
                  <Button variant="link" onClick={onGenerateBriefing} className="ml-1">
                    Generate briefing
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            sections.map((section) => (
              <BriefingSection
                key={section.id}
                section={section}
                onRegenerate={onRegenerateSection}
                onUpdate={onUpdateSection}
                isRegenerating={regeneratingSectionId === section.id}
              />
            ))
          )}
        </TabsContent>

        {/* Talking Points Tab */}
        <TabsContent value="talking-points" className="space-y-6 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Talking Points</h3>
            {onGenerateTalkingPoints && (
              <Button variant="outline" onClick={() => onGenerateTalkingPoints()} disabled={isGenerating}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Generate More
              </Button>
            )}
          </div>

          {talkingPoints.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No talking points generated yet.
                {onGenerateTalkingPoints && (
                  <Button variant="link" onClick={() => onGenerateTalkingPoints()} className="ml-1">
                    Generate talking points
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedTalkingPoints).map(([category, points]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {getTalkingPointCategoryLabel(category as TalkingPointCategory)}
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    {points.length}
                  </Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {points
                    .sort((a, b) => b.priorityScore - a.priorityScore)
                    .map((tp) => (
                      <TalkingPointCard
                        key={tp.id}
                        talkingPoint={tp}
                        onApprove={onApproveTalkingPoint}
                        onDelete={onDeleteTalkingPoint}
                      />
                    ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Briefing Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Focus Areas */}
              <div>
                <h4 className="text-sm font-medium mb-2">Focus Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {briefing.focusAreas.length > 0 ? (
                    briefing.focusAreas.map((area, idx) => (
                      <Badge key={idx} variant="outline">
                        {area}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No focus areas specified</span>
                  )}
                </div>
              </div>

              {/* Key Messages */}
              <div>
                <h4 className="text-sm font-medium mb-2">Key Messages</h4>
                {briefing.keyMessages && briefing.keyMessages.length > 0 ? (
                  <ul className="space-y-1">
                    {briefing.keyMessages.map((msg, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-blue-500">•</span>
                        <span>{msg}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-sm text-muted-foreground">No key messages specified</span>
                )}
              </div>

              {/* Exclusions */}
              <div>
                <h4 className="text-sm font-medium mb-2">Topics to Avoid</h4>
                <div className="flex flex-wrap gap-2">
                  {briefing.exclusions && briefing.exclusions.length > 0 ? (
                    briefing.exclusions.map((topic, idx) => (
                      <Badge key={idx} variant="outline" className="bg-red-50 text-red-700">
                        {topic}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No exclusions specified</span>
                  )}
                </div>
              </div>

              {/* Target Context */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Journalists</h4>
                  <span className="text-sm text-muted-foreground">
                    {briefing.journalistIds.length} linked
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Personas</h4>
                  <span className="text-sm text-muted-foreground">
                    {briefing.personaIds.length} linked
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Competitors</h4>
                  <span className="text-sm text-muted-foreground">
                    {briefing.competitorIds.length} linked
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Press Releases</h4>
                  <span className="text-sm text-muted-foreground">
                    {briefing.pressReleaseIds.length} linked
                  </span>
                </div>
              </div>

              {/* Custom Instructions */}
              {briefing.customInstructions && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Custom Instructions</h4>
                  <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                    {briefing.customInstructions}
                  </p>
                </div>
              )}

              {/* Generation Info */}
              {briefing.llmModel && (
                <div className="pt-4 border-t text-xs text-muted-foreground">
                  <span>Model: {briefing.llmModel}</span>
                  {briefing.llmTemperature && (
                    <span className="ml-4">Temperature: {briefing.llmTemperature}</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
