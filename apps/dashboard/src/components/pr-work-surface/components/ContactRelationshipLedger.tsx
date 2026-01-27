'use client';

/**
 * Contact Relationship Ledger V1.1 - DS 3.0
 *
 * Complete timeline of all interactions with a media contact.
 * Core differentiator with explainability for score/stage changes.
 *
 * @see /docs/canon/PR_CONTACT_LEDGER_CONTRACT.md
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md (V1.1)
 */

import { useMemo } from 'react';
import type { LedgerEvent, LedgerEventType, NextBestAction, MediaContact } from '../types';
import { ImpactStrip } from './ImpactStrip';

// ============================================
// EVENT TYPE CONFIG - DS3
// ============================================

interface EventTypeConfig {
  label: string;
  icon: JSX.Element;
  color: string;
  bgColor: string;
}

const EVENT_TYPE_CONFIG: Record<LedgerEventType, EventTypeConfig> = {
  pitch_drafted: {
    label: 'Pitch Drafted',
    color: 'text-white/55',
    bgColor: 'bg-white/10',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  pitch_sent: {
    label: 'Pitch Sent',
    color: 'text-brand-cyan',
    bgColor: 'bg-brand-cyan/15',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
  pitch_opened: {
    label: 'Email Opened',
    color: 'text-semantic-warning',
    bgColor: 'bg-semantic-warning/15',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
  reply_received: {
    label: 'Reply Received',
    color: 'text-semantic-success',
    bgColor: 'bg-semantic-success/15',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
      </svg>
    ),
  },
  coverage_won: {
    label: 'Coverage Won',
    color: 'text-semantic-success',
    bgColor: 'bg-semantic-success/15',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  coverage_lost: {
    label: 'Coverage Lost',
    color: 'text-semantic-danger',
    bgColor: 'bg-semantic-danger/15',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  note_added: {
    label: 'Note Added',
    color: 'text-white/55',
    bgColor: 'bg-white/10',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  task_created: {
    label: 'Task Created',
    color: 'text-brand-iris',
    bgColor: 'bg-brand-iris/15',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  task_completed: {
    label: 'Task Completed',
    color: 'text-semantic-success',
    bgColor: 'bg-semantic-success/15',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  relationship_stage_changed: {
    label: 'Stage Changed',
    color: 'text-brand-iris',
    bgColor: 'bg-brand-iris/15',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11l5-5m0 0l5 5m-5-5v12" />
      </svg>
    ),
  },
  topic_currency_changed: {
    label: 'Topic Currency Changed',
    color: 'text-semantic-warning',
    bgColor: 'bg-semantic-warning/15',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  enrichment_suggested: {
    label: 'Enrichment Suggested',
    color: 'text-brand-cyan',
    bgColor: 'bg-brand-cyan/15',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  enrichment_approved: {
    label: 'Enrichment Approved',
    color: 'text-semantic-success',
    bgColor: 'bg-semantic-success/15',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  enrichment_rejected: {
    label: 'Enrichment Rejected',
    color: 'text-semantic-danger',
    bgColor: 'bg-semantic-danger/15',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  meeting_logged: {
    label: 'Meeting Logged',
    color: 'text-brand-iris',
    bgColor: 'bg-brand-iris/15',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  social_interaction: {
    label: 'Social Interaction',
    color: 'text-brand-cyan',
    bgColor: 'bg-brand-cyan/15',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    ),
  },
  citation_detected: {
    label: 'Citation Detected',
    color: 'text-semantic-success',
    bgColor: 'bg-semantic-success/15',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
};

// ============================================
// LEDGER EVENT COMPONENT
// ============================================

interface LedgerEventCardProps {
  event: LedgerEvent;
}

function LedgerEventCard({ event }: LedgerEventCardProps) {
  const config = EVENT_TYPE_CONFIG[event.type];

  const timeAgo = useMemo(() => {
    const diff = Date.now() - new Date(event.timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(event.timestamp).toLocaleDateString();
  }, [event.timestamp]);

  const hasChange = event.change !== undefined;
  const isScoreChange = event.type === 'relationship_stage_changed' || event.type === 'topic_currency_changed';

  return (
    <div className="flex gap-3 py-3">
      {/* Icon */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${config.bgColor}`}>
        <span className={config.color}>{config.icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-white">{event.title}</span>
          <span className="text-xs text-white/55 flex-shrink-0">{timeAgo}</span>
        </div>

        {event.description && (
          <p className="text-xs text-white/55 mt-0.5">{event.description}</p>
        )}

        {/* Change explainability */}
        {hasChange && isScoreChange && (
          <div className="mt-2 p-2 rounded-lg bg-[#13131A] border border-[#1A1A24]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-white/55">
                {String(event.change!.previousValue)} → {String(event.change!.newValue)}
              </span>
            </div>
            <p className="text-xs text-white/55">
              <span className="text-brand-cyan">Why:</span> {event.change!.reason}
            </p>
          </div>
        )}

        {/* Actor */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-white/55">
            {event.actor.type === 'user' ? event.actor.name || 'You' : event.actor.type === 'system' ? 'System' : 'Contact'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// NEXT BEST ACTION COMPONENT
// ============================================

interface NextBestActionCardProps {
  nba: NextBestAction;
  onAction: (nba: NextBestAction) => void;
  onDismiss?: (nba: NextBestAction) => void;
}

function NextBestActionCard({ nba, onAction, onDismiss }: NextBestActionCardProps) {
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-brand-iris/10 to-brand-cyan/5 border border-brand-iris/20">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-brand-iris uppercase tracking-wider">
          Next Best Action
        </span>
        <ImpactStrip
          sageContributions={nba.sageContributions}
          eviImpact={nba.eviImpact}
          mode={nba.modeCeiling}
          compact
        />
      </div>

      <h4 className="text-sm font-medium text-white mb-2">{nba.title}</h4>
      <p className="text-xs text-white/55 mb-3">{nba.description}</p>

      {nba.rationale && (
        <p className="text-xs text-white/55 mb-3 p-2 rounded bg-[#13131A]">
          <span className="text-brand-cyan">Why:</span> {nba.rationale}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onAction(nba)}
          className="flex-1 px-3 py-2 bg-brand-iris text-white text-xs font-medium rounded-lg hover:bg-brand-iris/90 transition-colors"
        >
          {nba.primaryAction.label}
        </button>
        {onDismiss && (
          <button
            type="button"
            onClick={() => onDismiss(nba)}
            className="px-3 py-2 text-xs text-white/55 hover:text-white transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// MAIN CONTACT RELATIONSHIP LEDGER COMPONENT
// ============================================

interface ContactRelationshipLedgerProps {
  contact: MediaContact;
  events: LedgerEvent[];
  nextBestAction?: NextBestAction;
  onNBAAction?: (nba: NextBestAction) => void;
  onNBADismiss?: (nba: NextBestAction) => void;
}

export function ContactRelationshipLedger({
  contact: _contact, // Available for future header display
  events,
  nextBestAction,
  onNBAAction,
  onNBADismiss,
}: ContactRelationshipLedgerProps) {
  // Sort events by timestamp (newest first)
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [events]);

  return (
    <div className="space-y-4">
      {/* Next Best Action */}
      {nextBestAction && onNBAAction && (
        <NextBestActionCard
          nba={nextBestAction}
          onAction={onNBAAction}
          onDismiss={onNBADismiss}
        />
      )}

      {/* Timeline Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/55 uppercase tracking-wider">
          Relationship Ledger
        </h3>
        <span className="text-xs text-white/55">{events.length} events</span>
      </div>

      {/* Timeline */}
      <div className="divide-y divide-[#1A1A24]">
        {sortedEvents.length > 0 ? (
          sortedEvents.map((event) => (
            <LedgerEventCard key={event.id} event={event} />
          ))
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-white/55">No events recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
