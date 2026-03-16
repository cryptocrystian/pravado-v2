'use client';

import { Lightning } from '@phosphor-icons/react';
import type { Journalist } from './pr-mock-data';
import { citationBadgeConfig, relationshipDotConfig } from './pr-mock-data';

interface SageJournalistCardProps {
  journalist: Journalist;
  onAdd?: () => void;
}

export function SageJournalistCard({ journalist, onAdd }: SageJournalistCardProps) {
  const citBadge = citationBadgeConfig[journalist.aiCitation];
  const relDot = relationshipDotConfig[journalist.relationship];

  return (
    <div className="px-3 py-3 border-b border-white/5">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-medium text-white/70">{journalist.initials}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-white truncate">{journalist.name}</span>
            <span className="text-xs text-white/45">{journalist.publication}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {journalist.beats.map((beat) => (
              <span key={beat} className="text-xs text-white/30">{beat}</span>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${citBadge.bg} ${citBadge.text}`}>
            {journalist.aiCitation.toUpperCase()}
          </span>
          <div className={`w-1.5 h-1.5 rounded-full ${relDot}`} />
        </div>
      </div>

      {/* SAGE reasoning */}
      {journalist.sageReason && (
        <div className="bg-brand-magenta/5 border border-brand-magenta/20 rounded-lg p-2 mt-2">
          <div className="flex items-start gap-1.5">
            <Lightning size={12} className="text-brand-magenta flex-shrink-0 mt-0.5" />
            <p className="text-xs text-white/70">{journalist.sageReason}</p>
          </div>
        </div>
      )}

      {/* Add button */}
      <button
        type="button"
        onClick={onAdd}
        className="text-xs text-brand-magenta hover:text-brand-magenta/80 transition-colors mt-2 cursor-pointer"
      >
        Add to Contacts
      </button>
    </div>
  );
}
