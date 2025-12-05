/**
 * BriefingCard Component (Sprint S54)
 *
 * Displays a media briefing card with format, status, and quick stats
 */

'use client';

import React from 'react';
import { FileText, Clock, Users, MessageSquare, Layers } from 'lucide-react';
import type { MediaBriefing } from '@pravado/types';
import {
  getFormatLabel,
  getFormatIcon,
  getStatusLabel,
  getStatusColor,
  getStatusBgColor,
  formatRelativeTime,
  getConfidenceScoreColor,
} from '@/lib/mediaBriefingApi';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface BriefingCardProps {
  briefing: MediaBriefing;
  onSelect?: (briefing: MediaBriefing) => void;
  onEdit?: (briefing: MediaBriefing) => void;
  onDelete?: (briefing: MediaBriefing) => void;
  onGenerate?: (briefing: MediaBriefing) => void;
  isSelected?: boolean;
  className?: string;
}

export default function BriefingCard({
  briefing,
  onSelect,
  onEdit,
  onDelete,
  onGenerate,
  isSelected = false,
  className = '',
}: BriefingCardProps) {
  const sectionsCount = briefing.sections?.length || 0;
  const talkingPointsCount = briefing.talkingPoints?.length || 0;
  const hasJournalists = briefing.journalistIds.length > 0;
  const hasPersonas = briefing.personaIds.length > 0;
  const hasCompetitors = briefing.competitorIds.length > 0;

  return (
    <Card
      className={cn(
        'transition-all cursor-pointer hover:shadow-md',
        isSelected && 'ring-2 ring-blue-500 bg-blue-50/50',
        className
      )}
      onClick={() => onSelect?.(briefing)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{getFormatIcon(briefing.format)}</span>
              <CardTitle className="text-lg truncate">{briefing.title}</CardTitle>
            </div>
            {briefing.subtitle && (
              <p className="text-sm text-muted-foreground truncate">{briefing.subtitle}</p>
            )}
          </div>

          {/* Status Badge */}
          <Badge
            variant="outline"
            className={cn(
              'ml-2 shrink-0',
              getStatusBgColor(briefing.status),
              getStatusColor(briefing.status)
            )}
          >
            {getStatusLabel(briefing.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Format & Tone */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            {getFormatLabel(briefing.format)}
          </span>
          <span className="text-gray-300">|</span>
          <span className="capitalize">{briefing.tone}</span>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 py-2 border-t border-b">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Layers className="h-3 w-3" />
              <span className="text-xs">Sections</span>
            </div>
            <div className="text-lg font-semibold">{sectionsCount}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span className="text-xs">Points</span>
            </div>
            <div className="text-lg font-semibold">{talkingPointsCount}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Confidence</div>
            <div className={cn('text-sm font-semibold', getConfidenceScoreColor(briefing.confidenceScore))}>
              {briefing.confidenceScore ? `${briefing.confidenceScore.toFixed(0)}%` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Target Badges */}
        {(hasJournalists || hasPersonas || hasCompetitors) && (
          <div className="flex flex-wrap gap-1">
            {hasJournalists && (
              <Badge variant="secondary" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {briefing.journalistIds.length} Journalist{briefing.journalistIds.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {hasPersonas && (
              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                {briefing.personaIds.length} Persona{briefing.personaIds.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {hasCompetitors && (
              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                {briefing.competitorIds.length} Competitor{briefing.competitorIds.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        )}

        {/* Focus Areas */}
        {briefing.focusAreas.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {briefing.focusAreas.slice(0, 3).map((area, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {area}
              </Badge>
            ))}
            {briefing.focusAreas.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{briefing.focusAreas.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(briefing.updatedAt)}
          </div>

          <div className="flex gap-1">
            {briefing.status === 'draft' && onGenerate && (
              <Button
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onGenerate(briefing);
                }}
              >
                Generate
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(briefing);
                }}
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(briefing);
                }}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
