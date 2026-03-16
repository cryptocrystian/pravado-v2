'use client';

import { sageRecommendations } from './cc-mock-data';

export function SageRecommendations() {
  return (
    <div>
      {/* Section header */}
      <div className="mb-3">
        <span className="text-[13px] font-semibold uppercase tracking-wider text-white/60">
          SAGE Recommends
        </span>
      </div>

      {/* Container */}
      <div className="bg-cc-surface border border-white/8 rounded-2xl p-6">
        {sageRecommendations.map((rec, idx) => (
          <div
            key={rec.id}
            className={`flex items-start gap-4 py-4 ${
              idx < sageRecommendations.length - 1
                ? 'border-b border-white/5'
                : ''
            } ${idx === 0 ? 'pt-0' : ''}`}
          >
            {/* Rank number */}
            <span className="text-2xl font-bold text-cc-cyan w-8 flex-shrink-0 text-center">
              {rec.rank}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-semibold text-white mb-1">
                {rec.title}
              </h4>
              <p className="text-[13px] text-white/50 mb-2">{rec.meta}</p>
              <button className="text-sm font-medium text-cc-cyan hover:text-cc-cyan/80 transition-colors cursor-pointer">
                {rec.cta}
              </button>
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="flex justify-end pt-3">
          <button className="text-sm text-white/45 hover:text-white/70 transition-colors cursor-pointer">
            See all recommendations &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
