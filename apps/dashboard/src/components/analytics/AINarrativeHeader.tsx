'use client';

/**
 * AINarrativeHeader — SAGE-generated one-line insight at the top of each analytics tab.
 */

import { Lightning } from '@phosphor-icons/react';

interface AINarrativeHeaderProps {
  narrative: string;
}

export function AINarrativeHeader({ narrative }: AINarrativeHeaderProps) {
  return (
    <div className="flex items-start gap-3 bg-brand-cyan/5 border border-brand-cyan/20 rounded-xl px-4 py-3">
      <div className="w-6 h-6 rounded-lg bg-brand-cyan/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Lightning size={14} weight="fill" className="text-brand-cyan" />
      </div>
      <p className="text-sm text-white/70 leading-relaxed">
        {narrative}
      </p>
    </div>
  );
}
