'use client';

import type { Journalist } from './pr-mock-data';
import { citationBadgeConfig, relationshipDotConfig } from './pr-mock-data';

interface JournalistListItemProps {
  journalist: Journalist;
  isActive: boolean;
  onClick: () => void;
}

export function JournalistListItem({ journalist, isActive, onClick }: JournalistListItemProps) {
  const citBadge = citationBadgeConfig[journalist.aiCitation];
  const relDot = relationshipDotConfig[journalist.relationship];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-3 flex items-center gap-3 border-b border-white/5 transition-colors cursor-pointer ${
        isActive
          ? 'bg-slate-2 border-l-2 border-l-brand-magenta'
          : 'border-l-2 border-l-transparent hover:bg-slate-2/50'
      }`}
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-medium text-white/70">{journalist.initials}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-white truncate">{journalist.name}</span>
          <span className="text-[13px] text-white/50 truncate">{journalist.publication}</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {journalist.beats.slice(0, 2).map((beat) => (
            <span key={beat} className="text-xs text-white/30">
              {beat}
            </span>
          ))}
          {journalist.beats.length > 2 && (
            <span className="text-xs text-white/30">+{journalist.beats.length - 2}</span>
          )}
        </div>
      </div>

      {/* Right side: AI Citation + Relationship dot */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${citBadge.bg} ${citBadge.text}`}>
          {journalist.aiCitation.toUpperCase()}
        </span>
        <div className={`w-1.5 h-1.5 rounded-full ${relDot}`} />
      </div>
    </button>
  );
}
