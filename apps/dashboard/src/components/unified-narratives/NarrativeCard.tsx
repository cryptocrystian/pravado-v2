/**
 * NarrativeCard Component (Sprint S70)
 *
 * Displays a unified narrative in card format for list views
 */

'use client';

import React from 'react';
import {
  Calendar,
  Clock,
  Database,
  FileText,
  ChevronRight,
  User,
} from 'lucide-react';
import type { UnifiedNarrative } from '@pravado/types';
import { formatNarrativePeriod, formatNarrativeDate } from '@/lib/unifiedNarrativeApi';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import NarrativeStatusBadge from './NarrativeStatusBadge';
import NarrativeTypeBadge from './NarrativeTypeBadge';

interface NarrativeCardProps {
  narrative: UnifiedNarrative;
  onSelect?: (narrative: UnifiedNarrative) => void;
  onGenerate?: (narrative: UnifiedNarrative) => void;
  isSelected?: boolean;
  className?: string;
}

export default function NarrativeCard({
  narrative,
  onSelect,
  onGenerate,
  isSelected = false,
  className = '',
}: NarrativeCardProps) {
  const periodLabel = formatNarrativePeriod(narrative.periodStart, narrative.periodEnd);

  // Count sources from keyInsights
  const sourceCount = narrative.keyInsights?.length || 0;

  // Estimate word count from summaries
  const wordCount = [
    narrative.executiveSummary,
    narrative.tldrSynthesis,
    narrative.threeSentenceSummary,
  ]
    .filter(Boolean)
    .join(' ')
    .split(/\s+/).length;

  return (
    <Card
      className={cn(
        'transition-all cursor-pointer hover:shadow-md',
        isSelected && 'ring-2 ring-blue-500 bg-blue-50/30',
        className
      )}
      onClick={() => onSelect?.(narrative)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{narrative.title}</CardTitle>
            {narrative.subtitle && (
              <p className="text-sm text-muted-foreground truncate mt-1">
                {narrative.subtitle}
              </p>
            )}
          </div>
          <NarrativeStatusBadge status={narrative.status} className="ml-2 shrink-0" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Type & Period */}
        <div className="flex items-center gap-3">
          <NarrativeTypeBadge type={narrative.narrativeType} />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {periodLabel}
          </div>
        </div>

        {/* Source Systems */}
        {narrative.sourceSystems && narrative.sourceSystems.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {narrative.sourceSystems.slice(0, 4).map((system) => (
              <Badge
                key={system}
                variant="outline"
                className="text-[10px] px-1.5 py-0"
              >
                {system.replace(/_/g, ' ')}
              </Badge>
            ))}
            {narrative.sourceSystems.length > 4 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{narrative.sourceSystems.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 py-2 border-t border-b">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Database className="h-3 w-3" />
              <span className="text-xs">Sources</span>
            </div>
            <div className="text-lg font-semibold">{sourceCount}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span className="text-xs">Words</span>
            </div>
            <div className="text-lg font-semibold">
              {wordCount > 1000 ? `${(wordCount / 1000).toFixed(1)}K` : wordCount}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <span className="text-xs">Confidence</span>
            </div>
            <div className="text-lg font-semibold">
              {narrative.confidenceScore
                ? `${Math.round(narrative.confidenceScore * 100)}%`
                : 'N/A'}
            </div>
          </div>
        </div>

        {/* Tags */}
        {narrative.tags && narrative.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {narrative.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {narrative.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{narrative.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {narrative.createdBy && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{narrative.createdBy}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatNarrativeDate(narrative.updatedAt)}
            </div>
          </div>

          <div className="flex gap-1">
            {narrative.status === 'draft' && !narrative.generatedAt && onGenerate && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onGenerate(narrative);
                }}
              >
                Generate
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(narrative);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
