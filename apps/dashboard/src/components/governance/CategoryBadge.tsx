/**
 * Category Badge Component (Sprint S59)
 * Displays governance policy category with color coding
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { GovernancePolicyCategory } from '@/lib/governanceApi';
import { getCategoryLabel } from '@/lib/governanceApi';

interface CategoryBadgeProps {
  category: GovernancePolicyCategory;
  className?: string;
}

const categoryConfig: Record<GovernancePolicyCategory, { className: string }> = {
  content: { className: 'bg-blue-100 text-blue-800 border-blue-200' },
  crisis: { className: 'bg-red-100 text-red-800 border-red-200' },
  reputation: { className: 'bg-purple-100 text-purple-800 border-purple-200' },
  journalist: { className: 'bg-teal-100 text-teal-800 border-teal-200' },
  legal: { className: 'bg-amber-100 text-amber-800 border-amber-200' },
  data_privacy: { className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  media_relations: { className: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  executive_comms: { className: 'bg-pink-100 text-pink-800 border-pink-200' },
  competitive_intel: { className: 'bg-orange-100 text-orange-800 border-orange-200' },
  brand_safety: { className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
};

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const config = categoryConfig[category] || { className: 'bg-gray-100 text-gray-800 border-gray-200' };

  return (
    <Badge variant="outline" className={cn('text-xs font-medium', config.className, className)}>
      {getCategoryLabel(category)}
    </Badge>
  );
}
