'use client';

/**
 * Contact Detail Drawer - DS 3.0
 *
 * Slide-out drawer showing full contact details and timeline.
 *
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
 */

import type { MediaContact, TimelineEntry } from '../types';
import { RelationshipBadge } from './RelationshipBadge';
import { TopicCurrencyIndicator } from './TopicCurrencyIndicator';

interface Props {
  contact: MediaContact | null;
  timeline?: TimelineEntry[];
  onClose: () => void;
}

export function ContactDetailDrawer({ contact, timeline = [], onClose }: Props) {
  if (!contact) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-[#0D0D12] border-l border-[#1A1A24] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0D0D12] border-b border-[#1A1A24] px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">{contact.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                {contact.outlet && (
                  <span className="text-sm text-brand-cyan">{contact.outlet}</span>
                )}
                <RelationshipBadge stage={contact.relationshipStage} />
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <svg className="w-5 h-5 text-white/55" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#13131A] border border-[#1A1A24]">
              <div className="text-xs text-white/55 mb-1">Topic Currency</div>
              <TopicCurrencyIndicator currency={contact.topicCurrency} showLabel />
            </div>
            <div className="p-4 rounded-xl bg-[#13131A] border border-[#1A1A24]">
              <div className="text-xs text-white/55 mb-1">Pitch Score</div>
              <div className="text-xl font-bold text-white">{contact.pitchEligibilityScore}</div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/55 uppercase tracking-wider">
              Contact Info
            </h3>
            {contact.email && (
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-white/55" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-white">{contact.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-white/55">Preferred:</span>
              <div className="flex gap-1">
                {contact.preferredChannels.map((ch) => (
                  <span key={ch} className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-white/55">
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Beats */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/55 uppercase tracking-wider">
              Beats
            </h3>
            <div className="flex flex-wrap gap-2">
              {contact.beats.map((beat) => (
                <span key={beat} className="px-3 py-1 text-sm rounded-full bg-brand-iris/10 text-brand-iris border border-brand-iris/20">
                  {beat}
                </span>
              ))}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/55 uppercase tracking-wider">
              Recent Activity
            </h3>
            {timeline.length > 0 ? (
              <div className="space-y-3">
                {timeline.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-[#13131A]"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white/55" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white">{entry.title}</div>
                      {entry.description && (
                        <div className="text-xs text-white/55 mt-0.5">{entry.description}</div>
                      )}
                      <div className="text-xs text-white/55 mt-1">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-white/55 rounded-lg border border-dashed border-[#1A1A24]">
                No recent activity
              </div>
            )}
          </div>

          {/* Notes */}
          {contact.notes && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white/55 uppercase tracking-wider">
                Notes
              </h3>
              <p className="text-sm text-white/55">{contact.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-[#1A1A24] space-y-3">
            <button
              type="button"
              className="w-full px-4 py-2 bg-brand-iris text-white text-sm font-medium rounded-lg hover:bg-brand-iris/90 transition-colors"
            >
              Create Pitch
            </button>
            <button
              type="button"
              className="w-full px-4 py-2 bg-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/15 transition-colors"
            >
              Edit Contact
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
