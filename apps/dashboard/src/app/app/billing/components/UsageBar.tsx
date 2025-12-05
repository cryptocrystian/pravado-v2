/**
 * Usage Bar Component (Sprint S33.2)
 * Color-coded progress bar for resource usage
 */

'use client';

import React from 'react';

interface UsageBarProps {
  label: string;
  used: number;
  limit: number;
  unit?: string;
  overage?: number;
}

export function UsageBar({ label, used, limit, unit = '', overage = 0 }: UsageBarProps) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const totalUsed = used + overage;

  // Color coding: green <70%, yellow 70-99%, red >=100%
  let barColor = 'bg-green-500';
  let textColor = 'text-green-700';
  if (percentage >= 100 || overage > 0) {
    barColor = 'bg-red-500';
    textColor = 'text-red-700';
  } else if (percentage >= 70) {
    barColor = 'bg-yellow-500';
    textColor = 'text-yellow-700';
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={`font-semibold ${textColor}`}>
          {totalUsed.toLocaleString()} / {limit.toLocaleString()} {unit}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {overage > 0 && (
        <div className="text-xs text-red-600 font-medium">
          +{overage.toLocaleString()} {unit} overage
        </div>
      )}

      <div className="text-xs text-gray-500">
        {percentage.toFixed(1)}% used
      </div>
    </div>
  );
}
