'use client';

import Link from 'next/link';
import type { SageBrief, BriefPriority } from './content-mock-data';

const priorityConfig: Record<BriefPriority, { label: string; className: string; gapColor: string }> = {
  critical: {
    label: 'CRITICAL',
    className: 'bg-red-500/10 text-red-500 text-xs px-2 py-0.5 rounded-full',
    gapColor: 'text-red-500',
  },
  high: {
    label: 'HIGH',
    className: 'bg-amber-500/10 text-amber-500 text-xs px-2 py-0.5 rounded-full',
    gapColor: 'text-amber-500',
  },
  medium: {
    label: 'MEDIUM',
    className: 'bg-white/5 text-white/70 text-xs px-2 py-0.5 rounded-full',
    gapColor: 'text-white/45',
  },
};

export function BriefCard({ brief }: { brief: SageBrief }) {
  const priority = priorityConfig[brief.priority];

  return (
    <div className="bg-cc-page border border-white/8 rounded-xl p-4 mb-3 hover:border-white/[0.16] transition-colors">
      {/* Topic */}
      <h4 className="text-sm font-semibold text-white mb-2">{brief.topic}</h4>

      {/* Badges */}
      <div className="flex items-center gap-2 mb-2">
        <span className="bg-cc-cyan/10 text-cc-cyan text-xs px-2 py-0.5 rounded-full">
          {brief.contentType}
        </span>
        <span className={priority.className}>{priority.label}</span>
      </div>

      {/* AEO gap */}
      <p className={`text-xs ${priority.gapColor} mb-3`}>{brief.aeoGap}</p>

      {/* CTA */}
      <Link
        href={`/app/content/new/brief/${brief.id}`}
        className="text-sm font-medium text-cc-cyan hover:text-cc-cyan/80 transition-colors"
      >
        Create from Brief &rarr;
      </Link>
    </div>
  );
}
