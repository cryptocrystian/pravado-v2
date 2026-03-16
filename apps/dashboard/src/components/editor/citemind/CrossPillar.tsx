'use client';

import { useRouter } from 'next/navigation';
import { Newspaper, ChartLineUp, User, ArrowRight } from '@phosphor-icons/react';
import type { CrossPillarHook } from '../editor-mock-data';

const pillarConfig = {
  pr: { icon: Newspaper, color: 'text-brand-iris', bg: 'bg-brand-iris/10', label: 'PR Intelligence' },
  seo: { icon: ChartLineUp, color: 'text-cc-cyan', bg: 'bg-cc-cyan/10', label: 'SEO/AEO' },
};

interface CrossPillarProps {
  hooks: CrossPillarHook[];
}

export function CrossPillar({ hooks }: CrossPillarProps) {
  const router = useRouter();

  return (
    <div className="p-4 space-y-3">
      {hooks.map((hook, idx) => {
        const config = pillarConfig[hook.pillar];
        const PillarIcon = config.icon;
        return (
          <div key={idx} className={`${config.bg} rounded-lg p-3`}>
            <div className="flex items-center gap-2 mb-2">
              <PillarIcon size={16} className={config.color} />
              <span className={`text-xs font-medium ${config.color}`}>
                {hook.type}
              </span>
            </div>
            <p className="text-sm text-white/90 font-medium mb-1">
              {hook.title}
            </p>
            <p className="text-xs text-white/45 mb-3">{hook.description}</p>

            {/* Journalist matches for PR hooks */}
            {hook.matches && hook.matches.length > 0 && (
              <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5">
                <span className="text-xs text-white/30 block">
                  Journalist matches
                </span>
                {hook.matches.map((match) => (
                  <div key={match.name} className="flex items-center gap-2 py-1">
                    <User size={14} className="text-white/30 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-white/80 block">
                        {match.name}
                      </span>
                      <span className="text-xs text-white/30">
                        {match.outlet}
                      </span>
                    </div>
                    <span className="text-xs text-semantic-success flex-shrink-0">
                      {match.relevance}%
                    </span>
                  </div>
                ))}
                {/* Cross-pillar CTA: Create Pitch from journalist match */}
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/app/pr/pitches/new?journalist=${encodeURIComponent(hook.matches![0]?.name ?? '')}`
                    )
                  }
                  className="flex items-center gap-1 mt-2 text-xs font-medium text-cc-cyan hover:text-cc-cyan/80 transition-colors"
                >
                  Create Pitch <ArrowRight size={12} />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
