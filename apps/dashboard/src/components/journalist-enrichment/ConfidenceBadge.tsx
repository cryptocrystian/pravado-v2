/**
 * Confidence Badge Component (Sprint S50)
 * Displays confidence score with color-coded visual indicator
 */

import React from 'react';

interface ConfidenceBadgeProps {
  score: number; // 0-100
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
}

export function ConfidenceBadge({
  score,
  label = 'Confidence',
  size = 'md',
  showPercentage = true,
}: ConfidenceBadgeProps) {
  // Determine color based on score
  const getColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (score >= 20) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getLabel = (score: number): string => {
    if (score >= 80) return 'High';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Medium';
    if (score >= 20) return 'Low';
    return 'Very Low';
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const colorClass = getColor(score);
  const sizeClass = sizeClasses[size];
  const confidenceLabel = getLabel(score);

  return (
    <div className="inline-flex items-center gap-2">
      {label && (
        <span className="text-sm text-gray-600 font-medium">{label}:</span>
      )}
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${colorClass} ${sizeClass}`}
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
              score >= 80 ? 'bg-green-600' :
              score >= 60 ? 'bg-blue-600' :
              score >= 40 ? 'bg-yellow-600' :
              score >= 20 ? 'bg-orange-600' : 'bg-red-600'
            }`}
          ></span>
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              score >= 80 ? 'bg-green-500' :
              score >= 60 ? 'bg-blue-500' :
              score >= 40 ? 'bg-yellow-500' :
              score >= 20 ? 'bg-orange-500' : 'bg-red-500'
            }`}
          ></span>
        </span>
        {confidenceLabel}
        {showPercentage && (
          <span className="opacity-75">({Math.round(score)}%)</span>
        )}
      </span>
    </div>
  );
}

interface ConfidenceBarProps {
  score: number; // 0-100
  height?: string;
  showLabel?: boolean;
}

export function ConfidenceBar({
  score,
  height = 'h-2',
  showLabel = true,
}: ConfidenceBarProps) {
  const getColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    if (score >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const colorClass = getColor(score);

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600">Confidence</span>
          <span className="text-xs font-semibold text-gray-700">
            {Math.round(score)}%
          </span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${height} overflow-hidden`}>
        <div
          className={`${height} ${colorClass} rounded-full transition-all duration-300`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
    </div>
  );
}
