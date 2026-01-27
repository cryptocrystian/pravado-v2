'use client';

/**
 * Relationship Badge - DS 3.0
 *
 * Visual indicator for contact relationship stage.
 *
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
 */

import type { RelationshipStage } from '../types';

interface Props {
  stage: RelationshipStage;
  size?: 'sm' | 'md';
}

const STAGE_CONFIG = {
  cold: {
    color: 'bg-white/10 text-white/50 ring-white/20',
    label: 'Cold',
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
  },
  warm: {
    color: 'bg-semantic-warning/15 text-semantic-warning ring-semantic-warning/30',
    label: 'Warm',
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
      </svg>
    ),
  },
  engaged: {
    color: 'bg-semantic-success/15 text-semantic-success ring-semantic-success/30',
    label: 'Engaged',
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  advocate: {
    color: 'bg-brand-iris/20 text-brand-iris ring-brand-iris/30',
    label: 'Advocate',
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
};

export function RelationshipBadge({ stage, size = 'sm' }: Props) {
  const config = STAGE_CONFIG[stage];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full ring-1 ${config.color} ${sizeClasses}`}>
      {config.icon}
      {config.label}
    </span>
  );
}
