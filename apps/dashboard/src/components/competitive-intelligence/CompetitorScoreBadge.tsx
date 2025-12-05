'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CompetitorTier } from '@pravado/types';
import { getTierLabel, getTierColor, getTierBgColor } from '@/lib/competitorIntelligenceApi';

interface CompetitorScoreBadgeProps {
  tier: CompetitorTier;
  score?: number | null;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CompetitorScoreBadge({
  tier,
  score,
  showScore = false,
  size = 'md',
  className,
}: CompetitorScoreBadgeProps) {
  const tierLabel = getTierLabel(tier);
  const tierColor = getTierColor(tier);
  const tierBgColor = getTierBgColor(tier);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <Badge
        variant="outline"
        className={cn(tierBgColor, tierColor, 'border-0 font-medium', sizeClasses[size])}
      >
        {tierLabel}
      </Badge>
      {showScore && score !== null && score !== undefined && (
        <span
          className={cn(
            'font-semibold',
            score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-red-600'
          )}
        >
          {score.toFixed(0)}
        </span>
      )}
    </div>
  );
}

interface CompetitorEVIBadgeProps {
  eviScore?: number | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CompetitorEVIBadge({ eviScore, size = 'md', className }: CompetitorEVIBadgeProps) {
  if (eviScore === null || eviScore === undefined) {
    return (
      <Badge variant="outline" className={cn('text-gray-500', className)}>
        No EVI
      </Badge>
    );
  }

  const getEVIVariant = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'default';
    if (score >= 40) return 'warning';
    return 'destructive';
  };

  const getEVILabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <Badge variant={getEVIVariant(eviScore)} className={cn(sizeClasses[size], className)}>
      EVI: {eviScore.toFixed(0)} ({getEVILabel(eviScore)})
    </Badge>
  );
}

interface CompetitorSentimentBadgeProps {
  sentiment?: number | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CompetitorSentimentBadge({
  sentiment,
  size = 'md',
  className,
}: CompetitorSentimentBadgeProps) {
  if (sentiment === null || sentiment === undefined) {
    return (
      <Badge variant="outline" className={cn('text-gray-500', className)}>
        No Sentiment
      </Badge>
    );
  }

  const getSentimentVariant = (score: number) => {
    if (score > 0.3) return 'success';
    if (score < -0.3) return 'destructive';
    return 'secondary';
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.3) return 'Positive';
    if (score < -0.3) return 'Negative';
    return 'Neutral';
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <Badge variant={getSentimentVariant(sentiment)} className={cn(sizeClasses[size], className)}>
      {getSentimentLabel(sentiment)} ({(sentiment * 100).toFixed(0)}%)
    </Badge>
  );
}
