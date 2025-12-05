/**
 * NarrativeSectionTypeBadge Component (Sprint S70)
 *
 * Displays the section type with appropriate styling
 */

'use client';

import React from 'react';
import type { NarrativeSectionType } from '@pravado/types';
import { getSectionTypeLabel } from '@/lib/unifiedNarrativeApi';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NarrativeSectionTypeBadgeProps {
  sectionType: NarrativeSectionType;
  className?: string;
  size?: 'sm' | 'md';
}

const SECTION_TYPE_COLORS: Partial<Record<NarrativeSectionType, string>> = {
  executive_summary: 'bg-purple-100 text-purple-800',
  strategic_overview: 'bg-blue-100 text-blue-800',
  key_achievements: 'bg-green-100 text-green-800',
  critical_risks: 'bg-red-100 text-red-800',
  market_position: 'bg-indigo-100 text-indigo-800',
  competitive_landscape: 'bg-orange-100 text-orange-800',
  financial_implications: 'bg-emerald-100 text-emerald-800',
  forward_outlook: 'bg-cyan-100 text-cyan-800',
  introduction: 'bg-gray-100 text-gray-800',
  conclusion: 'bg-gray-100 text-gray-800',
  appendix: 'bg-gray-100 text-gray-600',
  custom: 'bg-gray-100 text-gray-800',
};

export default function NarrativeSectionTypeBadge({
  sectionType,
  className = '',
  size = 'md',
}: NarrativeSectionTypeBadgeProps) {
  const colorClass = SECTION_TYPE_COLORS[sectionType] || 'bg-gray-100 text-gray-800';
  const label = getSectionTypeLabel(sectionType);

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs',
        colorClass,
        className
      )}
    >
      {label}
    </Badge>
  );
}
