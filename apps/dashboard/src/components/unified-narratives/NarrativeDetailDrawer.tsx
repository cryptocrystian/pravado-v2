/**
 * NarrativeDetailDrawer Component (Sprint S70)
 *
 * Full-screen drawer for viewing and editing a unified narrative
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Database,
  FileText,
  ChevronRight,
  Lightbulb,
  GitCompare,
} from 'lucide-react';
import type {
  UnifiedNarrative,
  UnifiedNarrativeSection,
  NarrativeInsight,
} from '@pravado/types';
import { formatNarrativePeriod, formatNarrativeDate } from '@/lib/unifiedNarrativeApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import NarrativeStatusBadge from './NarrativeStatusBadge';
import NarrativeTypeBadge from './NarrativeTypeBadge';
import NarrativeSectionTypeBadge from './NarrativeSectionTypeBadge';
import NarrativeSectionCard from './NarrativeSectionCard';
import NarrativeWorkflowActions from './NarrativeWorkflowActions';
import NarrativeInsightPanel from './NarrativeInsightPanel';

interface NarrativeDetailDrawerProps {
  narrative: UnifiedNarrative | null;
  sections: UnifiedNarrativeSection[];
  insights?: NarrativeInsight[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateSection?: (sectionId: string, content: string) => Promise<void>;
  onRegenerateSection?: (sectionId: string) => Promise<void>;
  onApprove?: (comments?: string) => Promise<void>;
  onPublish?: (channels?: string[]) => Promise<void>;
  onArchive?: (reason?: string) => Promise<void>;
  onRegenerate?: () => Promise<void>;
  onExport?: (format: 'pdf' | 'docx' | 'pptx' | 'html' | 'md' | 'json') => Promise<void>;
  onComputeDelta?: () => Promise<void>;
  isLoading?: boolean;
}

export default function NarrativeDetailDrawer({
  narrative,
  sections,
  insights = [],
  isOpen,
  onClose,
  onUpdateSection,
  onRegenerateSection,
  onApprove,
  onPublish,
  onArchive,
  onRegenerate,
  onExport,
  onComputeDelta,
  isLoading = false,
}: NarrativeDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState('content');

  // Reset to content tab when narrative changes
  useEffect(() => {
    setActiveTab('content');
  }, [narrative?.id]);

  if (!narrative) return null;

  const periodLabel = formatNarrativePeriod(narrative.periodStart, narrative.periodEnd);
  const isEditable = narrative.status === 'draft' || narrative.status === 'review';

  // Group sections by sectionType
  const sectionsBySectionType = sections.reduce(
    (acc, section) => {
      const type = section.sectionType;
      if (!acc[type]) acc[type] = [];
      acc[type].push(section);
      return acc;
    },
    {} as Record<string, UnifiedNarrativeSection[]>
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-3xl p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <SheetTitle className="text-xl truncate">
                    {narrative.title}
                  </SheetTitle>
                  <NarrativeStatusBadge status={narrative.status} />
                </div>
                {narrative.subtitle && (
                  <p className="text-sm text-muted-foreground">
                    {narrative.subtitle}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Info */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
              <NarrativeTypeBadge type={narrative.narrativeType} />
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {periodLabel}
              </div>
              {narrative.createdBy && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <User className="h-4 w-4" />
                  {narrative.createdBy}
                </div>
              )}
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                Updated {formatNarrativeDate(narrative.updatedAt)}
              </div>
            </div>

            {/* Workflow Actions */}
            <div className="mt-4">
              <NarrativeWorkflowActions
                narrative={narrative}
                onApprove={onApprove}
                onPublish={onPublish}
                onArchive={onArchive}
                onRegenerate={onRegenerate}
                onExport={onExport}
              />
            </div>
          </SheetHeader>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className="px-6 pt-2 shrink-0">
              <TabsTrigger value="content" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Content
                <Badge variant="secondary" className="ml-1">
                  {sections.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-1">
                <Lightbulb className="h-4 w-4" />
                Insights
                <Badge variant="secondary" className="ml-1">
                  {insights.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="sources" className="flex items-center gap-1">
                <Database className="h-4 w-4" />
                Sources
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              {/* Content Tab */}
              <TabsContent value="content" className="p-6 m-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : sections.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No content yet</p>
                    <p className="text-sm mt-1">
                      Generate the narrative to create content sections.
                    </p>
                    {onRegenerate && (
                      <Button className="mt-4" onClick={onRegenerate}>
                        Generate Narrative
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(sectionsBySectionType).map(([sectionType, typeSections]) => (
                      <div key={sectionType}>
                        <div className="flex items-center gap-2 mb-3">
                          <NarrativeSectionTypeBadge
                            sectionType={sectionType as UnifiedNarrativeSection['sectionType']}
                          />
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {typeSections.length} section(s)
                          </span>
                        </div>
                        <div className="space-y-4">
                          {typeSections
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map((section) => (
                              <NarrativeSectionCard
                                key={section.id}
                                section={section}
                                isEditable={isEditable}
                                onUpdate={onUpdateSection}
                                onRegenerate={onRegenerateSection}
                              />
                            ))}
                        </div>
                      </div>
                    ))}

                    {/* Delta Comparison */}
                    {onComputeDelta && narrative.previousNarrativeId && (
                      <div className="mt-6 pt-6 border-t">
                        <Button
                          variant="outline"
                          onClick={onComputeDelta}
                          className="w-full"
                        >
                          <GitCompare className="h-4 w-4 mr-2" />
                          Compare with Previous Version
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Insights Tab */}
              <TabsContent value="insights" className="p-6 m-0">
                <NarrativeInsightPanel insights={insights} />
              </TabsContent>

              {/* Sources Tab */}
              <TabsContent value="sources" className="p-6 m-0">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Data Sources
                  </h3>
                  {narrative.sourceSystems && narrative.sourceSystems.length > 0 ? (
                    <div className="grid gap-3">
                      {narrative.sourceSystems.map((system) => (
                        <div
                          key={system}
                          className="p-4 bg-gray-50 rounded-lg border flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium">
                              {system.replace(/_/g, ' ')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Intelligence system
                            </p>
                          </div>
                          <Badge variant="secondary">Active</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No source systems configured.
                    </p>
                  )}

                  {/* Statistics */}
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                      Statistics
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold">{sections.length}</p>
                        <p className="text-sm text-muted-foreground">Sections</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold">
                          {narrative.keyInsights?.length || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Insights</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold">
                          {narrative.confidenceScore
                            ? `${Math.round(narrative.confidenceScore * 100)}%`
                            : 'N/A'}
                        </p>
                        <p className="text-sm text-muted-foreground">Confidence</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold">
                          {narrative.totalTokensUsed || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Tokens Used</p>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {narrative.tags && narrative.tags.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-2">
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {narrative.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-2">
                      Timeline
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{formatNarrativeDate(narrative.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Updated:</span>
                        <span>{formatNarrativeDate(narrative.updatedAt)}</span>
                      </div>
                      {narrative.generatedAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Generated:</span>
                          <span>{formatNarrativeDate(narrative.generatedAt)}</span>
                        </div>
                      )}
                      {narrative.approvedAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Approved:</span>
                          <span>{formatNarrativeDate(narrative.approvedAt)}</span>
                        </div>
                      )}
                      {narrative.publishedAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Published:</span>
                          <span>{formatNarrativeDate(narrative.publishedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
