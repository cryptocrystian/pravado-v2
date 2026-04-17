'use client';

const EMPTY_BRIEF = 'SAGE\u2122 is analyzing your signals. Your first daily brief will appear here once enough data has been collected.';

interface SituationBriefProps {
  compact?: boolean;
  /** Real brief text from API. Falls back to empty state when absent. */
  briefText?: string | null;
}

export function SituationBrief({ compact, briefText }: SituationBriefProps) {
  const text = briefText || EMPTY_BRIEF;

  if (compact) {
    return (
      <div className="flex items-stretch bg-slate-1 border-b border-border-subtle"
        style={{ minHeight: '64px' }}>

        {/* Left accent — iris color signals SAGE intelligence */}
        <div className="w-1 flex-shrink-0 bg-brand-iris rounded-r-sm" />

        {/* Content */}
        <div className="flex items-center gap-4 px-5 flex-1 min-w-0">

          {/* Badge */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-iris animate-pulse
                shadow-[0_0_6px_rgba(168,85,247,0.9)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-iris">
                SAGE&trade;
              </span>
            </div>
            <span className="text-[9px] text-white/30 uppercase tracking-wide whitespace-nowrap">
              Daily Brief
            </span>
          </div>

          {/* Vertical rule */}
          <div className="flex-shrink-0 w-px self-stretch my-3 bg-border-subtle" />

          {/* Brief text */}
          <p className="flex-1 text-xs text-white/70 leading-relaxed line-clamp-2 min-w-0">
            {text}
          </p>

          {/* CTA — only show when we have real data */}
          {briefText && (
            <button className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg
              text-xs font-semibold text-brand-cyan
              border border-brand-cyan/30 bg-brand-cyan/5
              hover:bg-brand-cyan/12 hover:border-brand-cyan/60
              transition-all duration-150 whitespace-nowrap">
              See opportunities
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cc-surface border border-white/8 rounded-2xl p-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[13px] font-semibold uppercase tracking-wider text-white/60">
          SAGE&trade; Situation Brief
        </span>
        {briefText && (
          <span className="text-xs text-white/45">Today</span>
        )}
      </div>

      {/* Body */}
      <p className="text-sm text-white/70 leading-relaxed mb-4">
        {text}
      </p>

      {/* Action link — only show when we have real data */}
      {briefText && (
        <button className="text-sm font-medium text-cc-cyan hover:text-cc-cyan/80 transition-colors cursor-pointer">
          See journalist opportunities &rarr;
        </button>
      )}
    </div>
  );
}
