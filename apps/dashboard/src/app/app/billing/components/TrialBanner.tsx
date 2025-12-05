/**
 * Trial Banner Component (Sprint S33.2)
 * Warning banner for trial expiration
 */

'use client';

import React from 'react';

interface TrialBannerProps {
  daysRemaining: number;
  onUpgradeClick: () => void;
}

export function TrialBanner({ daysRemaining, onUpgradeClick }: TrialBannerProps) {
  if (daysRemaining <= 0) return null;

  const isUrgent = daysRemaining <= 3;
  const bgColor = isUrgent ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200';
  const textColor = isUrgent ? 'text-red-800' : 'text-yellow-800';
  const buttonColor = isUrgent
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-yellow-600 hover:bg-yellow-700 text-white';

  return (
    <div className={`border rounded-lg p-4 ${bgColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <svg
            className={`w-5 h-5 mr-3 ${textColor}`}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className={`font-medium ${textColor}`}>
              {daysRemaining === 1
                ? 'Your trial ends tomorrow'
                : `Your trial ends in ${daysRemaining} days`}
            </p>
            <p className={`text-sm ${textColor} opacity-90`}>
              Upgrade now to keep access to all features
            </p>
          </div>
        </div>
        <button
          onClick={onUpgradeClick}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${buttonColor}`}
        >
          Upgrade Now
        </button>
      </div>
    </div>
  );
}
