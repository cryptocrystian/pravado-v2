'use client';

/**
 * Version History Panel
 *
 * Displays content version history with events and restore capability.
 *
 * @see /docs/canon/CONTENT_PILLAR_CANON.md
 */

import { text, label, interactive } from '../tokens';

// ============================================
// TYPES
// ============================================

export type VersionEventType =
  | 'created'
  | 'edited'
  | 'status_change'
  | 'citemind_check'
  | 'derivative_generated'
  | 'published'
  | 'restored';

export interface VersionEvent {
  id: string;
  version: number;
  type: VersionEventType;
  description: string;
  author: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

export interface VersionHistoryPanelProps {
  /** Version events */
  events: VersionEvent[];
  /** Current version number */
  currentVersion: number;
  /** Callback when restore is requested */
  onRestore?: (eventId: string, version: number) => void;
  /** Callback when viewing a version diff */
  onViewDiff?: (eventId: string) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Compact mode */
  compact?: boolean;
}

// ============================================
// EVENT TYPE CONFIG
// ============================================

const EVENT_CONFIG: Record<VersionEventType, { icon: React.ReactNode; color: string }> = {
  created: {
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
      </svg>
    ),
    color: 'text-brand-cyan',
  },
  edited: {
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
    ),
    color: 'text-brand-iris',
  },
  status_change: {
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    color: 'text-semantic-success',
  },
  citemind_check: {
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    color: 'text-brand-magenta',
  },
  derivative_generated: {
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
      </svg>
    ),
    color: 'text-brand-cyan',
  },
  published: {
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
      </svg>
    ),
    color: 'text-semantic-success',
  },
  restored: {
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
      </svg>
    ),
    color: 'text-semantic-warning',
  },
};

// ============================================
// SKELETON
// ============================================

function VersionHistorySkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <div className="w-6 h-6 bg-slate-4 rounded-full" />
          <div className="flex-1">
            <div className="h-4 w-32 bg-slate-4 rounded mb-1" />
            <div className="h-3 w-48 bg-slate-4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function VersionHistoryPanel({
  events,
  currentVersion,
  onRestore,
  onViewDiff,
  isLoading = false,
  compact = false,
}: VersionHistoryPanelProps) {
  if (isLoading) {
    return (
      <div className={`${compact ? 'p-3' : 'p-4'}`}>
        <h3 className={`${label} mb-3`}>Version History</h3>
        <VersionHistorySkeleton />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={`${compact ? 'p-3' : 'p-4'}`}>
        <h3 className={`${label} mb-3`}>Version History</h3>
        <p className={`text-xs ${text.hint} text-center py-4`}>No version history available</p>
      </div>
    );
  }

  return (
    <div className={`${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={label}>Version History</h3>
        <span className={`text-[10px] ${text.hint}`}>v{currentVersion}</span>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-3 top-3 bottom-3 w-px bg-slate-4" />

        {/* Events */}
        <div className={`space-y-3 max-h-64 overflow-y-auto ${compact ? 'pr-1' : 'pr-2'}`}>
          {events.map((event, index) => {
            const config = EVENT_CONFIG[event.type];
            const isCurrent = event.version === currentVersion;
            const canRestore = !isCurrent && onRestore && event.type !== 'created';

            return (
              <div key={event.id} className="relative flex gap-3">
                {/* Event dot */}
                <div
                  className={`
                    relative z-10 flex items-center justify-center w-6 h-6 rounded-full
                    ${isCurrent ? 'bg-brand-iris/20 ring-2 ring-brand-iris' : 'bg-slate-3'}
                    ${config.color}
                  `}
                >
                  {config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-xs font-medium ${isCurrent ? 'text-brand-iris' : text.primary}`}>
                        {event.description}
                        {isCurrent && (
                          <span className="ml-1 text-[10px] text-brand-iris">(current)</span>
                        )}
                      </p>
                      <p className={`text-[10px] ${text.hint}`}>
                        {event.author} · v{event.version}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {onViewDiff && index < events.length - 1 && (
                        <button
                          onClick={() => onViewDiff(event.id)}
                          className={`p-1 rounded ${interactive.ghost}`}
                          title="View changes"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      )}
                      {canRestore && (
                        <button
                          onClick={() => onRestore(event.id, event.version)}
                          className={`text-[10px] ${text.accent} hover:underline`}
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <p className={`text-[10px] ${text.hint} mt-0.5`}>
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default VersionHistoryPanel;
