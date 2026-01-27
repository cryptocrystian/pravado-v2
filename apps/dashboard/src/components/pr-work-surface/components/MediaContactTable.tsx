'use client';

/**
 * Media Contact Table - DS 3.0
 *
 * Reusable table component for displaying media contacts.
 *
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
 */

import type { MediaContact } from '../types';
import { RelationshipBadge } from './RelationshipBadge';
import { TopicCurrencyIndicator } from './TopicCurrencyIndicator';

interface Props {
  contacts: MediaContact[];
  onContactClick?: (contact: MediaContact) => void;
  emptyMessage?: string;
}

function EntityTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    journalist: 'bg-brand-cyan/15 text-brand-cyan',
    podcast: 'bg-brand-iris/15 text-brand-iris',
    influencer: 'bg-brand-magenta/15 text-brand-magenta',
    kol: 'bg-semantic-warning/15 text-semantic-warning',
    outlet: 'bg-white/10 text-white/50',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[type] || colors.outlet}`}>
      {type}
    </span>
  );
}

function PitchScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-semantic-success' : score >= 60 ? 'text-semantic-warning' : 'text-white/50';
  return <span className={`text-sm font-medium ${color}`}>{score}</span>;
}

export function MediaContactTable({ contacts, onContactClick, emptyMessage }: Props) {
  if (contacts.length === 0) {
    return (
      <div className="p-12 text-center rounded-xl border border-dashed border-[#1A1A24]">
        <svg className="w-12 h-12 mx-auto text-white/40 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="text-sm text-white/55">{emptyMessage || 'No contacts found'}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#1A1A24]">
      <table className="w-full">
        <thead>
          <tr className="bg-[#13131A]">
            <th className="px-4 py-3 text-left text-xs font-medium text-white/55 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white/55 uppercase tracking-wider">
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white/55 uppercase tracking-wider">
              Beats
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white/55 uppercase tracking-wider">
              Topic Currency
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white/55 uppercase tracking-wider">
              Relationship
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white/55 uppercase tracking-wider">
              Pitch Score
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white/55 uppercase tracking-wider">
              Last Touch
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1A1A24]">
          {contacts.map((contact) => (
            <tr
              key={contact.id}
              onClick={() => onContactClick?.(contact)}
              className="hover:bg-[#111116] cursor-pointer transition-colors"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-iris/30 to-brand-cyan/30 flex items-center justify-center text-white text-sm font-medium">
                    {contact.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-white">{contact.name}</div>
                    {contact.outlet && (
                      <div className="text-xs text-white/55">{contact.outlet}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <EntityTypeBadge type={contact.entityType} />
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                  {contact.beats.slice(0, 2).map((beat) => (
                    <span key={beat} className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-white/55">
                      {beat}
                    </span>
                  ))}
                  {contact.beats.length > 2 && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-white/55">
                      +{contact.beats.length - 2}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <TopicCurrencyIndicator currency={contact.topicCurrency} />
              </td>
              <td className="px-4 py-3">
                <RelationshipBadge stage={contact.relationshipStage} />
              </td>
              <td className="px-4 py-3">
                <PitchScoreBadge score={contact.pitchEligibilityScore} />
              </td>
              <td className="px-4 py-3 text-sm text-white/55">
                {contact.lastInteraction
                  ? new Date(contact.lastInteraction).toLocaleDateString()
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
