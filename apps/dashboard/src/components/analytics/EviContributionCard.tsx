'use client';

/**
 * EviContributionCard — Earned media EVI contribution insight.
 */

import { InfoTooltip } from '@/components/shared/InfoTooltip';

export function EviContributionCard() {
  return (
    <div className="bg-cc-surface border border-white/8 rounded-2xl p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-3">
        EVI Contribution from Earned Media <InfoTooltip content="How much of your EVI growth comes from earned media (PR coverage, journalist mentions) vs. owned content and SEO. Higher earned media contribution means your PR is driving AI visibility." size={11} />
      </h3>
      <div className="bg-white/[0.03] rounded-xl p-4">
        <p className="text-sm text-white/70 leading-relaxed">
          Earned media drove 31% of your EVI growth this period. TechCrunch is
          your highest-impact earned media source &mdash; their articles are
          cited 3&times; more in ChatGPT responses than comparable tech
          publications. Each TechCrunch placement is estimated to deliver +3&ndash;5
          EVI points over 30 days.
        </p>
      </div>
    </div>
  );
}
