/**
 * Plan Recommendation Badge Component (Sprint S33.2)
 * Shows AI-driven plan recommendation
 */

'use client';

import React from 'react';

interface PlanRecommendationBadgeProps {
  recommendedPlanSlug: string;
  className?: string;
}

export function PlanRecommendationBadge({
  recommendedPlanSlug,
  className = ''
}: PlanRecommendationBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ${className}`}
    >
      <svg
        className="w-3 h-3 mr-1"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
          clipRule="evenodd"
        />
      </svg>
      Recommended: {recommendedPlanSlug.charAt(0).toUpperCase() + recommendedPlanSlug.slice(1)}
    </span>
  );
}
