/**
 * Source Type Badge Component (Sprint S48.2)
 * Displays the discovery source type with appropriate styling
 */

import type { DiscoverySourceType } from '@pravado/types';

interface SourceTypeBadgeProps {
  sourceType: DiscoverySourceType;
  size?: 'sm' | 'md';
}

function getSourceTypeColor(sourceType: DiscoverySourceType): string {
  switch (sourceType) {
    case 'article_author':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'rss_feed':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'social_profile':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'staff_directory':
      return 'bg-green-100 text-green-800 border-green-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

function getSourceTypeLabel(sourceType: DiscoverySourceType): string {
  switch (sourceType) {
    case 'article_author':
      return 'Article Author';
    case 'rss_feed':
      return 'RSS Feed';
    case 'social_profile':
      return 'Social Profile';
    case 'staff_directory':
      return 'Staff Directory';
    default:
      return sourceType;
  }
}

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
};

export function SourceTypeBadge({ sourceType, size = 'md' }: SourceTypeBadgeProps) {
  const colorClass = getSourceTypeColor(sourceType);
  const label = getSourceTypeLabel(sourceType);

  return (
    <span
      className={`inline-flex items-center font-medium rounded border ${colorClass} ${sizeClasses[size]}`}
    >
      {label}
    </span>
  );
}
