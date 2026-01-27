'use client';

/**
 * Content Empty State
 *
 * Empty state display for various Content pillar views.
 * Follows DS v3.1 patterns with Iris accent.
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

import type { ContentView } from '../types';

interface ContentEmptyStateProps {
  view: ContentView | 'briefs' | 'gaps' | 'clusters' | 'derivatives';
  onAction?: () => void;
  actionLabel?: string;
}

const EMPTY_STATE_CONFIG: Record<
  string,
  { icon: React.ReactNode; title: string; subtitle: string; actionLabel?: string }
> = {
  overview: {
    icon: (
      <svg className="w-6 h-6 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Ready to build authority',
    subtitle: 'Create your first content brief to start generating authority signals and driving visibility.',
    actionLabel: '+ New Brief',
  },
  library: {
    icon: (
      <svg className="w-6 h-6 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    title: 'No content yet',
    subtitle: 'Create your first content asset to get started',
    actionLabel: 'Create Asset',
  },
  calendar: {
    icon: (
      <svg className="w-6 h-6 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Calendar is empty',
    subtitle: 'Schedule content to see it here',
    actionLabel: 'Schedule Content',
  },
  insights: {
    icon: (
      <svg className="w-6 h-6 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: 'No insights available',
    subtitle: 'Publish content to generate authority insights',
    actionLabel: 'View Library',
  },
  briefs: {
    icon: (
      <svg className="w-6 h-6 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'No briefs created',
    subtitle: 'Generate a brief to plan content strategically',
    actionLabel: 'Generate Brief',
  },
  gaps: {
    icon: (
      <svg className="w-6 h-6 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    title: 'No content gaps identified',
    subtitle: 'Gaps will appear as your content is analyzed',
  },
  clusters: {
    icon: (
      <svg className="w-6 h-6 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    title: 'No topic clusters',
    subtitle: 'Clusters will form as you create more content',
  },
  derivatives: {
    icon: (
      <svg className="w-6 h-6 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    title: 'No derivatives generated',
    subtitle: 'Generate derivatives from your content assets',
    actionLabel: 'Generate Derivatives',
  },
};

export function ContentEmptyState({ view, onAction, actionLabel }: ContentEmptyStateProps) {
  const config = EMPTY_STATE_CONFIG[view] || EMPTY_STATE_CONFIG.library;
  const buttonLabel = actionLabel || config.actionLabel;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 mb-4 rounded-xl bg-brand-iris/10 border border-brand-iris/20 flex items-center justify-center">
        {config.icon}
      </div>
      <p className="text-sm text-white/70 font-medium">{config.title}</p>
      <p className="text-xs text-white/40 mt-1 max-w-xs">{config.subtitle}</p>
      {buttonLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-brand-iris hover:bg-brand-iris/90 rounded-lg transition-colors"
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
}
