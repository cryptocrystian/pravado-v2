'use client';

/**
 * RecommendationCard — Single recommendation with urgency border + CTA.
 * DS v3.1 tokens. Pillar accent: brand-teal.
 */

import { useRouter } from 'next/navigation';
import { WarningCircle, Warning } from '@phosphor-icons/react';
import type { Recommendation } from './seo-mock-data';

const iconMap = {
  danger: <WarningCircle size={18} className="text-semantic-danger shrink-0" weight="fill" />,
  warning: <Warning size={18} className="text-semantic-warning shrink-0" weight="fill" />,
};

export function RecommendationCard({
  rec,
  onDismiss,
}: {
  rec: Recommendation;
  onDismiss: (id: string) => void;
}) {
  const router = useRouter();

  const borderClass =
    rec.urgency === 'critical'
      ? rec.icon === 'danger'
        ? 'border-semantic-danger/25'
        : 'border-semantic-warning/25'
      : 'border-slate-4';

  const badgeClass =
    rec.badge === 'CRITICAL'
      ? 'bg-semantic-danger/10 text-semantic-danger'
      : 'bg-semantic-warning/10 text-semantic-warning';

  return (
    <div className={`bg-slate-2 border ${borderClass} rounded-2xl p-5 mb-3`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-1">
        {iconMap[rec.icon]}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-white">{rec.title}</h3>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ${badgeClass}`}>
              {rec.badge}
            </span>
          </div>
          <p className="text-xs text-white/45 mt-1">{rec.meta}</p>
        </div>
      </div>

      {/* Why box */}
      <div className="bg-white/[0.03] border border-slate-4 rounded-xl p-3 mt-3">
        <p className="text-sm text-white/70 leading-relaxed">{rec.why}</p>
      </div>

      {/* CTAs */}
      <div className="flex items-center gap-3 mt-4">
        <button
          type="button"
          onClick={() => rec.primaryCtaHref ? router.push(rec.primaryCtaHref) : undefined}
          className="bg-brand-teal text-slate-0 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-brand-teal/90 shadow-[0_0_10px_rgba(0,217,255,0.2)] transition-colors"
        >
          {rec.primaryCta}
        </button>
        <button
          type="button"
          onClick={() => onDismiss(rec.id)}
          className="text-sm text-white/45 hover:text-white/70 transition-colors cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
