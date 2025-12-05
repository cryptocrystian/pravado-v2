/**
 * PersonaCard Component (Sprint S51.2)
 * Displays an audience persona summary card with scores, traits, and insights
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { AudiencePersona } from '@pravado/types';
import {
  formatPersonaName,
  getPersonaTypeLabel,
  getScoreColor,
  getSeniorityLevelLabel,
} from '@/lib/personaApi';
import { cn } from '@/lib/utils';
import { Building2, MapPin, TrendingUp, Users } from 'lucide-react';

interface PersonaCardProps {
  persona: AudiencePersona;
  onClick?: () => void;
  isSelected?: boolean;
  traitCount?: number;
  insightCount?: number;
}

export function PersonaCard({
  persona,
  onClick,
  isSelected = false,
  traitCount = 0,
  insightCount = 0,
}: PersonaCardProps) {
  const scoreColor = getScoreColor(persona.overallScore);
  const personaTypeLabel = getPersonaTypeLabel(persona.personaType);
  const displayName = formatPersonaName(persona);

  // Map score color to Tailwind classes
  const scoreColorClasses: Record<string, string> = {
    green: 'bg-green-100 text-green-800 border-green-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
  };

  const scoreTextClasses: Record<string, string> = {
    green: 'text-green-700',
    blue: 'text-blue-700',
    yellow: 'text-yellow-700',
    red: 'text-red-700',
  };

  // Status badge color
  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700 border-green-200',
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    archived: 'bg-orange-100 text-orange-700 border-orange-200',
  };

  // Format last updated
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-blue-500 shadow-lg',
        !isSelected && 'hover:border-gray-400'
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate" title={displayName}>
              {displayName}
            </h3>
            {persona.name !== displayName && (
              <p className="text-sm text-gray-600 truncate" title={persona.name}>
                {persona.name}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge
              variant="outline"
              className={cn('text-xs font-medium', scoreColorClasses[scoreColor])}
            >
              {persona.overallScore.toFixed(0)}
            </Badge>
            <Badge variant="outline" className={cn('text-xs', statusColors[persona.status])}>
              {persona.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Persona Type & Description */}
        <div className="space-y-1">
          <Badge variant="secondary" className="text-xs">
            {personaTypeLabel}
          </Badge>
          {persona.description && (
            <p className="text-sm text-gray-600 line-clamp-2" title={persona.description}>
              {persona.description}
            </p>
          )}
        </div>

        {/* Demographics */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          {persona.industry && (
            <div className="flex items-center gap-1" title={persona.industry}>
              <Building2 className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{persona.industry}</span>
            </div>
          )}
          {persona.seniorityLevel && (
            <div className="flex items-center gap-1" title={getSeniorityLevelLabel(persona.seniorityLevel)}>
              <TrendingUp className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{getSeniorityLevelLabel(persona.seniorityLevel)}</span>
            </div>
          )}
          {persona.location && (
            <div className="flex items-center gap-1" title={persona.location}>
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{persona.location}</span>
            </div>
          )}
          {persona.companySize && (
            <div className="flex items-center gap-1" title={persona.companySize}>
              <Users className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{persona.companySize.toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Scores */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center">
            <div className={cn('text-lg font-semibold', scoreTextClasses[getScoreColor(persona.relevanceScore)])}>
              {persona.relevanceScore.toFixed(0)}
            </div>
            <div className="text-xs text-gray-500">Relevance</div>
          </div>
          <div className="text-center">
            <div className={cn('text-lg font-semibold', scoreTextClasses[getScoreColor(persona.engagementScore)])}>
              {persona.engagementScore.toFixed(0)}
            </div>
            <div className="text-xs text-gray-500">Engagement</div>
          </div>
          <div className="text-center">
            <div className={cn('text-lg font-semibold', scoreTextClasses[getScoreColor(persona.alignmentScore)])}>
              {persona.alignmentScore.toFixed(0)}
            </div>
            <div className="text-xs text-gray-500">Alignment</div>
          </div>
        </div>

        {/* Counts & Metadata */}
        <div className="flex items-center justify-between pt-2 border-t text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span title={`${traitCount} traits`}>
              <span className="font-medium text-gray-700">{traitCount}</span> traits
            </span>
            <span title={`${insightCount} insights`}>
              <span className="font-medium text-gray-700">{insightCount}</span> insights
            </span>
          </div>
          <span title={`Updated ${formatDate(persona.updatedAt)}`}>
            {formatDate(persona.updatedAt)}
          </span>
        </div>

        {/* Tags */}
        {persona.tags && persona.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2 border-t">
            {persona.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {persona.tags.length > 3 && (
              <Badge variant="outline" className="text-xs text-gray-500">
                +{persona.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Validation & Source Indicators */}
        <div className="flex items-center gap-2 text-xs">
          {persona.isValidated && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Validated
            </Badge>
          )}
          {persona.generationMethod === 'llm_assisted' && (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              AI Generated
            </Badge>
          )}
          {persona.sourceCount > 0 && (
            <span className="text-gray-500" title={`${persona.sourceCount} sources`}>
              {persona.sourceCount} {persona.sourceCount === 1 ? 'source' : 'sources'}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
