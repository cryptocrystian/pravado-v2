/**
 * Strategic Sources List Component (Sprint S65)
 * Displays data sources used in strategic intelligence reports
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  type StrategicSource,
  getSourceLabel,
  getSourceIcon,
  formatRelativeTime,
} from '@/lib/strategicIntelligenceApi';
import {
  ExternalLink,
  Star,
  FileText,
  Radio,
  Bell,
  BarChart2,
  Target,
  AlertTriangle,
  Heart,
  Shield,
  Radar,
  Monitor,
  Mail,
  Briefcase,
  DollarSign,
  Share2,
  List,
  Send,
  Box,
} from 'lucide-react';

interface StrategicSourcesListProps {
  sources: StrategicSource[];
  onSourceClick?: (source: StrategicSource) => void;
}

const SOURCE_ICONS: Record<string, typeof FileText> = {
  FileText,
  Radio,
  Bell,
  BarChart2,
  Target,
  AlertTriangle,
  Heart,
  Shield,
  Radar,
  Monitor,
  Mail,
  Briefcase,
  DollarSign,
  Share2,
  List,
  Send,
  Box,
};

export function StrategicSourcesList({
  sources,
  onSourceClick,
}: StrategicSourcesListProps) {
  if (sources.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>No data sources linked yet.</p>
          <p className="text-sm">Generate the report to automatically aggregate data sources.</p>
        </CardContent>
      </Card>
    );
  }

  // Group sources by system
  const groupedSources = sources.reduce((acc, source) => {
    if (!acc[source.sourceSystem]) {
      acc[source.sourceSystem] = [];
    }
    acc[source.sourceSystem].push(source);
    return acc;
  }, {} as Record<string, StrategicSource[]>);

  return (
    <div className="space-y-4">
      {Object.entries(groupedSources).map(([system, systemSources]) => {
        const iconName = getSourceIcon(system as StrategicSource['sourceSystem']);
        const IconComponent = SOURCE_ICONS[iconName] || Box;

        return (
          <Card key={system}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <IconComponent className="h-5 w-5 text-muted-foreground" />
                {getSourceLabel(system as StrategicSource['sourceSystem'])}
                <Badge variant="secondary">{systemSources.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemSources.map((source) => (
                  <SourceItem
                    key={source.id}
                    source={source}
                    onClick={() => onSourceClick?.(source)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

interface SourceItemProps {
  source: StrategicSource;
  onClick?: () => void;
}

function SourceItem({ source, onClick }: SourceItemProps) {
  return (
    <div
      className={`p-3 border rounded-lg ${onClick ? 'cursor-pointer hover:bg-muted/50' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {source.isPrimarySource && (
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          )}
          <span className="font-medium">
            {source.sourceTitle || source.sourceType || 'Unknown Source'}
          </span>
        </div>
        {source.sourceUrl && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              window.open(source.sourceUrl!, '_blank');
            }}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-2">
        {source.relevanceScore !== null && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Relevance</p>
            <div className="flex items-center gap-2">
              <Progress value={source.relevanceScore} className="flex-1 h-2" />
              <span className="text-xs text-muted-foreground w-8">
                {Math.round(source.relevanceScore)}%
              </span>
            </div>
          </div>
        )}
        {source.dataQualityScore !== null && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Data Quality</p>
            <div className="flex items-center gap-2">
              <Progress value={source.dataQualityScore} className="flex-1 h-2" />
              <span className="text-xs text-muted-foreground w-8">
                {Math.round(source.dataQualityScore)}%
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Extracted {formatRelativeTime(source.extractionTimestamp)}</span>
        {source.sectionsUsing.length > 0 && (
          <span>Used in {source.sectionsUsing.length} section(s)</span>
        )}
      </div>
    </div>
  );
}

/**
 * Compact version of the sources list for sidebar display
 */
export function StrategicSourcesCompact({
  sources,
}: {
  sources: StrategicSource[];
}) {
  // Count sources by system
  const sourceCounts = sources.reduce((acc, source) => {
    acc[source.sourceSystem] = (acc[source.sourceSystem] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const primaryCount = sources.filter((s) => s.isPrimarySource).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Data Sources</span>
        <Badge variant="secondary">{sources.length}</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(sourceCounts).map(([system, count]) => {
          const iconName = getSourceIcon(system as StrategicSource['sourceSystem']);
          const IconComponent = SOURCE_ICONS[iconName] || Box;

          return (
            <Badge key={system} variant="outline" className="flex items-center gap-1">
              <IconComponent className="h-3 w-3" />
              {count}
            </Badge>
          );
        })}
      </div>

      {primaryCount > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
          <span>{primaryCount} primary source(s)</span>
        </div>
      )}
    </div>
  );
}
