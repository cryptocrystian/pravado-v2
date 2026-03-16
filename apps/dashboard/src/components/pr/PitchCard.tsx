'use client';

import type { PitchItem } from './pr-mock-data';

const priorityConfig: Record<string, { bg: string; text: string }> = {
  high: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
  medium: { bg: 'bg-white/5', text: 'text-white/45' },
  low: { bg: 'bg-white/5', text: 'text-white/30' },
};

interface PitchCardProps {
  pitch: PitchItem;
  onClick?: () => void;
}

export function PitchCard({ pitch, onClick }: PitchCardProps) {
  const priority = priorityConfig[pitch.priority] ?? priorityConfig.medium;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-slate-2 border border-slate-4 rounded-xl p-4 mb-2 cursor-pointer hover:border-slate-5 transition-colors"
    >
      {/* Title */}
      <h4 className="text-sm font-semibold text-white mb-1">{pitch.title}</h4>

      {/* Journalist + pub */}
      <p className="text-xs text-white/70 mb-2">
        {pitch.journalistName} &middot; {pitch.publication}
      </p>

      {/* Priority + beat tags */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priority.bg} ${priority.text}`}>
          {pitch.priority.toUpperCase()}
        </span>
        {pitch.beats?.map((beat) => (
          <span key={beat} className="text-xs text-white/30 bg-white/5 px-1.5 py-0.5 rounded-full">
            {beat}
          </span>
        ))}
      </div>

      {/* AEO target */}
      <p className="text-xs text-brand-magenta font-medium">AEO target: {pitch.aeoTarget}</p>

      {/* Date */}
      <p className="text-xs text-white/30 mt-1">{pitch.created}</p>
    </button>
  );
}
