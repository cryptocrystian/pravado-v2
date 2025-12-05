/**
 * Snapshot Detail Drawer Component (Sprint S60)
 * Slide-out drawer with full snapshot details and tabs
 */

'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RiskLevelBadge } from './RiskLevelBadge';
import { RiskIndicatorPanel } from './RiskIndicatorPanel';
import { ForecastPanel } from './ForecastPanel';
import { RiskDriverList } from './RiskDriverList';
import { RiskNotesPanel } from './RiskNotesPanel';
import type {
  RiskRadarSnapshot,
  RiskRadarIndicator,
  RiskRadarForecast,
  RiskRadarDriver,
  RiskRadarNote,
  RiskRadarNoteType,
} from '@/lib/riskRadarApi';
import { formatRelativeTime } from '@/lib/riskRadarApi';
import {
  Radar,
  Activity,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  Clock,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

interface SnapshotDetailDrawerProps {
  snapshot: RiskRadarSnapshot | null;
  indicators: RiskRadarIndicator[];
  forecasts: RiskRadarForecast[];
  drivers: RiskRadarDriver[];
  notes: RiskRadarNote[];
  open: boolean;
  onClose: () => void;
  loading?: boolean;
  onRebuildIndicators?: () => void;
  onGenerateForecast?: () => void;
  onRegenerateForecast?: (forecastId: string) => void;
  onAddNote?: (content: string, noteType: RiskRadarNoteType) => Promise<void>;
  regenerating?: boolean;
  rebuilding?: boolean;
}

export function SnapshotDetailDrawer({
  snapshot,
  indicators,
  forecasts,
  drivers,
  notes,
  open,
  onClose,
  loading,
  onRebuildIndicators,
  onGenerateForecast,
  onRegenerateForecast,
  onAddNote,
  regenerating,
  rebuilding,
}: SnapshotDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const currentForecast = forecasts.find((f) => f.isCurrent);

  if (!snapshot) return null;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-3 rounded-full',
                snapshot.riskLevel === 'critical' ? 'bg-red-100' :
                snapshot.riskLevel === 'high' ? 'bg-orange-100' :
                snapshot.riskLevel === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
              )}>
                <Radar className={cn(
                  'h-6 w-6',
                  snapshot.riskLevel === 'critical' ? 'text-red-600' :
                  snapshot.riskLevel === 'high' ? 'text-orange-600' :
                  snapshot.riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
                )} />
              </div>
              <div>
                <SheetTitle className="text-lg">
                  {snapshot.title || `Risk Snapshot`}
                </SheetTitle>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(snapshot.snapshotDate)}
                  {snapshot.isActive && (
                    <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Risk Score Summary */}
          <div className="flex items-center justify-between mt-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm text-gray-500">Overall Risk Index</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  'text-4xl font-bold',
                  snapshot.riskLevel === 'critical' ? 'text-red-600' :
                  snapshot.riskLevel === 'high' ? 'text-orange-600' :
                  snapshot.riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
                )}>
                  {snapshot.overallRiskIndex}
                </span>
                <span className="text-gray-400">/100</span>
                <RiskLevelBadge level={snapshot.riskLevel} />
              </div>
            </div>
            {snapshot.confidenceScore !== undefined && (
              <div className="text-right">
                <div className="text-sm text-gray-500">Confidence</div>
                <div className="text-2xl font-semibold text-gray-700">
                  {Math.round(snapshot.confidenceScore * 100)}%
                </div>
              </div>
            )}
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="text-xs">
              <Radar className="h-3 w-3 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="indicators" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Indicators
            </TabsTrigger>
            <TabsTrigger value="forecast" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Forecast
            </TabsTrigger>
            <TabsTrigger value="drivers" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Drivers
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">
              <MessageSquare className="h-3 w-3 mr-1" />
              Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Component Scores */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Sentiment', value: snapshot.sentimentScore },
                { label: 'Velocity', value: snapshot.velocityScore },
                { label: 'Alerts', value: snapshot.alertScore },
                { label: 'Competitive', value: snapshot.competitiveScore },
                { label: 'Governance', value: snapshot.governanceScore },
                { label: 'Persona', value: snapshot.personaScore },
              ].filter((s) => s.value !== undefined).map((score) => (
                <div key={score.label} className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-xs text-gray-500">{score.label}</div>
                  <div className={cn(
                    'text-xl font-bold',
                    (score.value || 0) >= 70 ? 'text-red-600' :
                    (score.value || 0) >= 50 ? 'text-orange-600' :
                    (score.value || 0) >= 30 ? 'text-yellow-600' : 'text-green-600'
                  )}>
                    {score.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Key Concerns */}
            {snapshot.keyConcerns && snapshot.keyConcerns.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Key Concerns</div>
                <div className="space-y-2">
                  {snapshot.keyConcerns.map((concern) => (
                    <div key={concern.id} className="p-3 bg-red-50 rounded-lg border border-red-100">
                      <div className="flex items-center gap-2">
                        <RiskLevelBadge level={concern.severity} size="sm" />
                        <span className="font-medium text-gray-900">{concern.title}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{concern.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Emerging Risks */}
            {snapshot.emergingRisks && snapshot.emergingRisks.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Emerging Risks</div>
                <div className="space-y-2">
                  {snapshot.emergingRisks.map((risk) => (
                    <div key={risk.id} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{risk.name}</span>
                        <Badge variant="outline">
                          {Math.round(risk.probability * 100)}% probability
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{risk.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Positive Factors */}
            {snapshot.positiveFactors && snapshot.positiveFactors.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Positive Factors</div>
                <div className="space-y-2">
                  {snapshot.positiveFactors.map((factor) => (
                    <div key={factor.id} className="p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{factor.name}</span>
                        <Badge variant="outline" className="bg-green-100 text-green-700">
                          -{factor.impact}% risk
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{factor.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {snapshot.description && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">Description</div>
                <div className="text-sm text-gray-600">{snapshot.description}</div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="indicators" className="mt-4">
            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onRebuildIndicators}
                disabled={rebuilding}
              >
                {rebuilding ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Rebuilding...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Rebuild Indicators
                  </>
                )}
              </Button>
            </div>
            <RiskIndicatorPanel indicators={indicators} loading={loading} />
          </TabsContent>

          <TabsContent value="forecast" className="mt-4">
            <ForecastPanel
              forecast={currentForecast}
              loading={loading}
              onRegenerate={
                currentForecast
                  ? () => onRegenerateForecast?.(currentForecast.id)
                  : onGenerateForecast
              }
              regenerating={regenerating}
            />
          </TabsContent>

          <TabsContent value="drivers" className="mt-4">
            <RiskDriverList drivers={drivers} loading={loading} />
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <RiskNotesPanel
              notes={notes}
              loading={loading}
              onAddNote={onAddNote}
            />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t text-xs text-gray-400">
          <div>Snapshot ID: {snapshot.id}</div>
          <div>Computation: {snapshot.computationMethod} ({snapshot.computationDurationMs}ms)</div>
          <div>Created: {new Date(snapshot.createdAt).toLocaleString()}</div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
