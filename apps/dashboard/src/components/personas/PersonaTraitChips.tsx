/**
 * PersonaTraitChips Component (Sprint S51.2)
 * Displays persona traits as chips with strength indicators and categories
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AudiencePersonaTrait } from '@pravado/types';
import { getTraitCategoryLabel } from '@/lib/personaApi';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { useState } from 'react';

interface PersonaTraitChipsProps {
  traits: AudiencePersonaTrait[];
  maxVisible?: number;
  showCategory?: boolean;
  showStrength?: boolean;
  onTraitClick?: (trait: AudiencePersonaTrait) => void;
}

export function PersonaTraitChips({
  traits,
  maxVisible = 8,
  showCategory = true,
  showStrength = true,
  onTraitClick,
}: PersonaTraitChipsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort traits: verified/primary first, then by strength
  const sortedTraits = [...traits].sort((a, b) => {
    if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1;
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return b.traitStrength - a.traitStrength;
  });

  const visibleTraits = isExpanded ? sortedTraits : sortedTraits.slice(0, maxVisible);
  const hasMore = traits.length > maxVisible;

  // Category color mapping
  const categoryColors: Record<string, string> = {
    skill: 'bg-blue-100 text-blue-800 border-blue-200',
    demographic: 'bg-purple-100 text-purple-800 border-purple-200',
    psychographic: 'bg-green-100 text-green-800 border-green-200',
    behavioral: 'bg-orange-100 text-orange-800 border-orange-200',
    interest: 'bg-pink-100 text-pink-800 border-pink-200',
  };

  // Strength indicator: 0-0.3 = low, 0.3-0.7 = medium, 0.7-1 = high
  const getStrengthLabel = (strength: number): string => {
    if (strength >= 0.7) return 'High';
    if (strength >= 0.3) return 'Medium';
    return 'Low';
  };

  const getStrengthColor = (strength: number): string => {
    if (strength >= 0.7) return 'bg-green-500';
    if (strength >= 0.3) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  if (traits.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic py-4 text-center">
        No traits available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Traits Grid */}
      <div className="flex flex-wrap gap-2">
        {visibleTraits.map((trait) => {
          const categoryColor = categoryColors[trait.traitCategory] || 'bg-gray-100 text-gray-800 border-gray-200';

          return (
            <div
              key={trait.id}
              className={cn(
                'group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all',
                categoryColor,
                onTraitClick && 'cursor-pointer hover:shadow-md hover:scale-105'
              )}
              onClick={() => onTraitClick?.(trait)}
              title={trait.contextSnippet || trait.traitName}
            >
              {/* Verified/Primary badges */}
              {trait.isVerified && (
                <span title="Verified trait"><Shield className="h-3 w-3 flex-shrink-0" /></span>
              )}
              {trait.isPrimary && (
                <span title="Primary trait"><Check className="h-3 w-3 flex-shrink-0" /></span>
              )}

              {/* Trait name */}
              <span className="font-medium text-sm">
                {trait.traitName}
              </span>

              {/* Trait value (if present) */}
              {trait.traitValue && (
                <span className="text-xs opacity-75">
                  ({trait.traitValue})
                </span>
              )}

              {/* Strength indicator */}
              {showStrength && (
                <div
                  className={cn(
                    'h-1.5 w-1.5 rounded-full flex-shrink-0',
                    getStrengthColor(trait.traitStrength)
                  )}
                  title={`Strength: ${getStrengthLabel(trait.traitStrength)} (${(trait.traitStrength * 100).toFixed(0)}%)`}
                />
              )}

              {/* Category label on hover */}
              {showCategory && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {getTraitCategoryLabel(trait.traitCategory)}
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show More/Less Button */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Show {traits.length - maxVisible} More
              </>
            )}
          </Button>
        </div>
      )}

      {/* Summary Stats */}
      <div className="flex items-center gap-4 pt-2 border-t text-xs text-gray-500">
        <span>
          <span className="font-medium text-gray-700">{traits.length}</span> total
        </span>
        <span>
          <span className="font-medium text-gray-700">
            {traits.filter((t) => t.isVerified).length}
          </span>{' '}
          verified
        </span>
        <span>
          <span className="font-medium text-gray-700">
            {traits.filter((t) => t.isPrimary).length}
          </span>{' '}
          primary
        </span>
        <span>
          <span className="font-medium text-gray-700">
            {traits.filter((t) => t.traitStrength >= 0.7).length}
          </span>{' '}
          high strength
        </span>
      </div>

      {/* Category Legend */}
      {showCategory && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {Object.entries(categoryColors).map(([category, colorClass]) => {
            const count = traits.filter((t) => t.traitCategory === category).length;
            if (count === 0) return null;

            return (
              <Badge
                key={category}
                variant="outline"
                className={cn('text-xs', colorClass)}
              >
                {getTraitCategoryLabel(category)} ({count})
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
