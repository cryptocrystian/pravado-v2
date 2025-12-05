'use client';

/**
 * Sentiment Badge Component (Sprint S40)
 * Displays sentiment as a colored badge
 */

import type { MentionSentiment } from '@pravado/types';

interface SentimentBadgeProps {
  sentiment: MentionSentiment;
  size?: 'sm' | 'md';
}

export function SentimentBadge({ sentiment, size = 'sm' }: SentimentBadgeProps) {
  const getStyle = () => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getLabel = () => {
    return sentiment.charAt(0).toUpperCase() + sentiment.slice(1);
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${getStyle()} ${sizeClasses}`}
    >
      {getLabel()}
    </span>
  );
}
