/**
 * CrisisIncidentDetailDrawer Component (Sprint S55)
 *
 * Slide-out drawer for viewing detailed incident information,
 * including signals, actions, briefs, and timeline
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
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Users,
  Clock,
  Radio,
  FileText,
  ArrowUpRight,
  Plus,
} from 'lucide-react';
import type {
  CrisisIncident,
  CrisisSignal,
  CrisisAction,
  CrisisBrief,
} from '@pravado/types';
import {
  SEVERITY_COLORS,
  TRAJECTORY_COLORS,
  PROPAGATION_COLORS,
  STATUS_COLORS,
  formatTimeAgo,
} from '@/lib/crisisApi';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CrisisSignalList from './CrisisSignalList';
import CrisisActionList from './CrisisActionList';
import CrisisBriefPanel from './CrisisBriefPanel';

interface CrisisIncidentDetailDrawerProps {
  incident: CrisisIncident | null;
  signals?: CrisisSignal[];
  actions?: CrisisAction[];
  brief?: CrisisBrief | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateIncident?: (data: Partial<CrisisIncident>) => Promise<void>;
  onEscalate?: (level: number) => Promise<void>;
  onContain?: () => Promise<void>;
  onResolve?: (notes?: string) => Promise<void>;
  onGenerateBrief?: () => Promise<void>;
  onGenerateRecommendations?: () => Promise<void>;
  onAcknowledgeSignal?: (signal: CrisisSignal) => Promise<void>;
  onApproveAction?: (action: CrisisAction) => Promise<void>;
  onStartAction?: (action: CrisisAction) => Promise<void>;
  onCompleteAction?: (action: CrisisAction) => Promise<void>;
  onOpenFullPage?: (incidentId: string) => void;
  isGeneratingBrief?: boolean;
  isGeneratingRecommendations?: boolean;
  isSaving?: boolean;
}

export default function CrisisIncidentDetailDrawer({
  incident,
  signals = [],
  actions = [],
  brief = null,
  isOpen,
  onClose,
  onUpdateIncident: _onUpdateIncident,
  onEscalate,
  onContain,
  onResolve,
  onGenerateBrief,
  onGenerateRecommendations,
  onAcknowledgeSignal,
  onApproveAction,
  onStartAction,
  onCompleteAction,
  onOpenFullPage,
  isGeneratingBrief = false,
  isGeneratingRecommendations = false,
  isSaving = false,
}: CrisisIncidentDetailDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEscalating, setIsEscalating] = useState(false);

  const handleCopyLink = useCallback(async () => {
    if (!incident) return;
    const url = `${window.location.origin}/app/crisis/${incident.id}`;
    await navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [incident]);

  const handleEscalate = useCallback(async () => {
    if (!onEscalate || !incident) return;
    setIsEscalating(true);
    try {
      await onEscalate(incident.escalationLevel + 1);
    } finally {
      setIsEscalating(false);
    }
  }, [onEscalate, incident]);

  if (!incident) return null;

  const severityColors = SEVERITY_COLORS[incident.severity];
  const trajectoryColors = TRAJECTORY_COLORS[incident.trajectory];
  const propagationColors = PROPAGATION_COLORS[incident.propagationLevel];
  const statusColors = STATUS_COLORS[incident.status];

  const getTrajectoryIcon = () => {
    switch (incident.trajectory) {
      case 'improving':
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      case 'worsening':
      case 'critical':
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatReach = (reach: number): string => {
    if (reach >= 1_000_000) return `${(reach / 1_000_000).toFixed(1)}M`;
    if (reach >= 1_000) return `${(reach / 1_000).toFixed(1)}K`;
    return reach.toString();
  };

  const sheetSize = isExpanded ? 'w-[95vw] max-w-[1600px]' : 'w-[900px] max-w-[90vw]';

  const linkedSignals = signals.filter((s) =>
    incident.linkedSignalIds.includes(s.id)
  );
  const incidentActions = actions.filter((a) => a.incidentId === incident.id);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className={cn('p-0 flex flex-col', sheetSize)} side="right">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {incident.isEscalated && (
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                )}
                <SheetTitle className="text-lg truncate">{incident.title}</SheetTitle>
              </div>
              {incident.incidentCode && (
                <SheetDescription className="font-mono text-xs">
                  {incident.incidentCode}
                </SheetDescription>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant="outline"
                className={cn(
                  'font-semibold uppercase',
                  severityColors.bg,
                  severityColors.text
                )}
              >
                {incident.severity}
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
                  onClick={() => onOpenFullPage(incident.id)}
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

          {/* Quick Stats Row */}
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn('capitalize', statusColors.bg, statusColors.text)}
            >
              {incident.status}
            </Badge>
            <div className="flex items-center gap-1">
              {getTrajectoryIcon()}
              <span
                className={cn('text-sm capitalize', trajectoryColors.text)}
              >
                {incident.trajectory}
              </span>
            </div>
            <Badge
              variant="outline"
              className={cn(propagationColors.bg, propagationColors.text)}
            >
              <Radio className="h-3 w-3 mr-1" />
              {incident.propagationLevel}
            </Badge>
            <span className="text-sm text-muted-foreground">
              <Activity className="h-3 w-3 inline mr-1" />
              {incident.mentionCount} mentions
            </span>
            <span className="text-sm text-muted-foreground">
              <Users className="h-3 w-3 inline mr-1" />
              {formatReach(incident.estimatedReach)} reach
            </span>
          </div>
        </SheetHeader>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="px-6 shrink-0 justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="signals">
              Signals ({linkedSignals.length})
            </TabsTrigger>
            <TabsTrigger value="actions">
              Actions ({incidentActions.length})
            </TabsTrigger>
            <TabsTrigger value="brief">Brief</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            {/* Overview Tab */}
            <TabsContent value="overview" className="h-full mt-0 p-0">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  {/* Description */}
                  {incident.description && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Description</h3>
                      <p className="text-sm text-muted-foreground">
                        {incident.description}
                      </p>
                    </div>
                  )}

                  {/* AI Summary */}
                  {incident.llmGeneratedSummary && (
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-600" />
                        AI Summary
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {incident.llmGeneratedSummary}
                      </p>
                    </div>
                  )}

                  {/* Risk Assessment */}
                  {incident.llmRiskAssessment && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">Risk Assessment</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 bg-gray-50 rounded text-center">
                          <div className="text-xs text-muted-foreground mb-1">
                            Overall
                          </div>
                          <div className="text-xl font-bold">
                            {(incident.llmRiskAssessment.overallRisk * 100).toFixed(0)}%
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded text-center">
                          <div className="text-xs text-muted-foreground mb-1">
                            Reputation
                          </div>
                          <div className="text-xl font-bold">
                            {(incident.llmRiskAssessment.reputationRisk * 100).toFixed(0)}%
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded text-center">
                          <div className="text-xs text-muted-foreground mb-1">
                            Financial
                          </div>
                          <div className="text-xl font-bold">
                            {(incident.llmRiskAssessment.financialRisk * 100).toFixed(0)}%
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded text-center">
                          <div className="text-xs text-muted-foreground mb-1">
                            Legal
                          </div>
                          <div className="text-xl font-bold">
                            {(incident.llmRiskAssessment.legalRisk * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Affected Areas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {incident.affectedProducts.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">Affected Products</h3>
                        <div className="flex flex-wrap gap-1">
                          {incident.affectedProducts.map((p, i) => (
                            <Badge key={i} variant="secondary" className="bg-blue-100">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {incident.affectedRegions.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">Affected Regions</h3>
                        <div className="flex flex-wrap gap-1">
                          {incident.affectedRegions.map((r, i) => (
                            <Badge key={i} variant="secondary" className="bg-purple-100">
                              {r}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Keywords & Topics */}
                  {(incident.keywords.length > 0 || incident.topics.length > 0) && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Keywords & Topics</h3>
                      <div className="flex flex-wrap gap-1">
                        {incident.keywords.map((k, i) => (
                          <Badge key={`k-${i}`} variant="outline">
                            {k}
                          </Badge>
                        ))}
                        {incident.topics.map((t, i) => (
                          <Badge key={`t-${i}`} variant="outline" className="bg-gray-100">
                            #{t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Timeline</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>First Detected:</span>
                        <span className="text-foreground">
                          {formatTimeAgo(incident.firstDetectedAt)}
                        </span>
                      </div>
                      {incident.escalatedAt && (
                        <div className="flex items-center gap-2 text-orange-600">
                          <ArrowUpRight className="h-4 w-4" />
                          <span>Escalated:</span>
                          <span>{formatTimeAgo(incident.escalatedAt)}</span>
                        </div>
                      )}
                      {incident.containedAt && (
                        <div className="flex items-center gap-2 text-yellow-600">
                          <Activity className="h-4 w-4" />
                          <span>Contained:</span>
                          <span>{formatTimeAgo(incident.containedAt)}</span>
                        </div>
                      )}
                      {incident.resolvedAt && (
                        <div className="flex items-center gap-2 text-green-600">
                          <Check className="h-4 w-4" />
                          <span>Resolved:</span>
                          <span>{formatTimeAgo(incident.resolvedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Signals Tab */}
            <TabsContent value="signals" className="h-full mt-0 p-4">
              <CrisisSignalList
                signals={linkedSignals}
                onAcknowledge={onAcknowledgeSignal}
                maxHeight="calc(100vh - 300px)"
              />
            </TabsContent>

            {/* Actions Tab */}
            <TabsContent value="actions" className="h-full mt-0 p-4">
              <CrisisActionList
                actions={incidentActions}
                onApprove={onApproveAction}
                onStart={onStartAction}
                onComplete={onCompleteAction}
                maxHeight="calc(100vh - 300px)"
              />
            </TabsContent>

            {/* Brief Tab */}
            <TabsContent value="brief" className="h-full mt-0 p-4">
              <CrisisBriefPanel
                brief={brief}
                onGenerate={onGenerateBrief}
                isGenerating={isGeneratingBrief}
                maxHeight="calc(100vh - 300px)"
              />
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t bg-gray-50 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Updated {formatTimeAgo(incident.updatedAt)}
            </div>

            <div className="flex items-center gap-2">
              {/* Generate Recommendations */}
              {onGenerateRecommendations && incident.status === 'active' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGenerateRecommendations}
                  disabled={isGeneratingRecommendations}
                >
                  {isGeneratingRecommendations ? (
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-1" />
                  )}
                  AI Recommendations
                </Button>
              )}

              {/* Contain */}
              {onContain && incident.status === 'active' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onContain}
                  disabled={isSaving}
                >
                  Contain
                </Button>
              )}

              {/* Resolve */}
              {onResolve && ['active', 'contained'].includes(incident.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-600 border-green-300"
                  onClick={() => onResolve()}
                  disabled={isSaving}
                >
                  Resolve
                </Button>
              )}

              {/* Escalate */}
              {onEscalate && incident.status === 'active' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleEscalate}
                  disabled={isEscalating}
                >
                  {isEscalating ? (
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                  )}
                  Escalate to L{incident.escalationLevel + 1}
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
