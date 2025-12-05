/**
 * CrisisDetectionPanel Component (Sprint S55)
 *
 * Panel for triggering crisis detection scans and viewing
 * detection results and last run information
 */

'use client';

import React, { useState } from 'react';
import {
  Radar,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Zap,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { CrisisSourceSystem, DetectionResultResponse } from '@pravado/types';
import { formatTimeAgo, formatDuration } from '@/lib/crisisApi';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface CrisisDetectionPanelProps {
  onRunDetection: (options?: DetectionOptions) => Promise<DetectionResultResponse | void>;
  isRunning?: boolean;
  lastRunAt?: string | Date;
  lastResults?: DetectionResultResponse | null;
  className?: string;
}

interface DetectionOptions {
  timeWindowMinutes?: number;
  sourceSystems?: CrisisSourceSystem[];
  forceRefresh?: boolean;
}

const SOURCE_SYSTEM_OPTIONS: { value: CrisisSourceSystem; label: string }[] = [
  { value: 'media_monitoring', label: 'Media Monitoring' },
  { value: 'media_crawling', label: 'Media Crawling' },
  { value: 'media_alerts', label: 'Media Alerts' },
  { value: 'journalist_timeline', label: 'Journalist Timeline' },
  { value: 'media_performance', label: 'Media Performance' },
  { value: 'competitive_intel', label: 'Competitive Intel' },
  { value: 'social_listening', label: 'Social Listening' },
];

const TIME_WINDOW_OPTIONS = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
  { value: '180', label: '3 hours' },
  { value: '360', label: '6 hours' },
  { value: '720', label: '12 hours' },
  { value: '1440', label: '24 hours' },
];

export default function CrisisDetectionPanel({
  onRunDetection,
  isRunning = false,
  lastRunAt,
  lastResults = null,
  className = '',
}: CrisisDetectionPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [timeWindow, setTimeWindow] = useState('60');
  const [forceRefresh, setForceRefresh] = useState(false);
  const [selectedSources, setSelectedSources] = useState<CrisisSourceSystem[]>([]);
  const [localResults, setLocalResults] = useState<DetectionResultResponse | null>(
    lastResults
  );

  const handleRunDetection = async () => {
    const options: DetectionOptions = {
      timeWindowMinutes: parseInt(timeWindow, 10),
      forceRefresh,
    };

    if (selectedSources.length > 0) {
      options.sourceSystems = selectedSources;
    }

    const result = await onRunDetection(options);
    if (result) {
      setLocalResults(result);
    }
  };

  const toggleSource = (source: CrisisSourceSystem) => {
    setSelectedSources((prev) =>
      prev.includes(source)
        ? prev.filter((s) => s !== source)
        : [...prev, source]
    );
  };

  const displayResults = localResults || lastResults;

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radar className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Crisis Detection</CardTitle>
          </div>
          {lastRunAt && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Last run: {formatTimeAgo(lastRunAt)}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Detection Button */}
        <Button
          onClick={handleRunDetection}
          disabled={isRunning}
          className="w-full"
          size="lg"
        >
          {isRunning ? (
            <>
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              Scanning for Threats...
            </>
          ) : (
            <>
              <Radar className="h-5 w-5 mr-2" />
              Run Detection Now
            </>
          )}
        </Button>

        {/* Advanced Options */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Advanced Options
              </span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            {/* Time Window */}
            <div className="space-y-2">
              <Label htmlFor="timeWindow">Time Window</Label>
              <Select value={timeWindow} onValueChange={setTimeWindow}>
                <SelectTrigger id="timeWindow">
                  <SelectValue placeholder="Select time window" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_WINDOW_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Source Systems */}
            <div className="space-y-2">
              <Label>Source Systems</Label>
              <div className="flex flex-wrap gap-2">
                {SOURCE_SYSTEM_OPTIONS.map((source) => (
                  <Badge
                    key={source.value}
                    variant={selectedSources.includes(source.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleSource(source.value)}
                  >
                    {source.label}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to scan all sources
              </p>
            </div>

            {/* Force Refresh */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="forceRefresh">Force Refresh</Label>
                <p className="text-xs text-muted-foreground">
                  Re-process already scanned events
                </p>
              </div>
              <Switch
                id="forceRefresh"
                checked={forceRefresh}
                onCheckedChange={setForceRefresh}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Detection Results */}
        {displayResults && (
          <div className="pt-4 border-t space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" />
              Last Detection Results
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-700">
                  {displayResults.eventsProcessed}
                </div>
                <div className="text-xs text-muted-foreground">Events Processed</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {displayResults.signalsGenerated}
                </div>
                <div className="text-xs text-muted-foreground">Signals Generated</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">
                  {displayResults.incidentsCreated}
                </div>
                <div className="text-xs text-muted-foreground">Incidents Created</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {displayResults.escalationsTriggered}
                </div>
                <div className="text-xs text-muted-foreground">Escalations</div>
              </div>
            </div>

            {/* Processing Time */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Processing time
              </span>
              <span>{formatDuration(displayResults.processingTimeMs)}</span>
            </div>

            {/* Status Message */}
            {displayResults.signalsGenerated === 0 &&
              displayResults.incidentsCreated === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    All Clear
                  </p>
                  <p className="text-xs text-green-600">
                    No new crisis signals detected
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    Activity Detected
                  </p>
                  <p className="text-xs text-orange-600">
                    Review new signals and incidents
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Previous Results */}
        {!displayResults && !isRunning && (
          <div className="text-center py-6 text-muted-foreground">
            <Radar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No detection runs yet</p>
            <p className="text-xs mt-1">
              Click the button above to scan for crisis signals
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
