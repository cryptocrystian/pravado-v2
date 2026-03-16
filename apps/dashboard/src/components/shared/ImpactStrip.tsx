'use client';

/**
 * ImpactStrip — Required on every work surface
 *
 * Displays SAGE strategic context, EVI score, and mode switcher.
 * Sits between the surface header and the main content area.
 *
 * @see docs/canon/MODE_UX_ARCHITECTURE.md §6A
 * @see docs/skills/PRAVADO_DESIGN_SKILL.md (Impact Strip pattern)
 */

import { ModeSwitcher } from './ModeSwitcher';
import type { Pillar } from '@/lib/mode-preferences';
import type { AutomationMode } from '@/lib/mode-preferences';

interface ImpactStripProps {
  sageTag: string;
  eviScore: number | null;
  eviDelta: number | null;
  pillar: Pillar;
  ceiling?: AutomationMode;
}

export function ImpactStrip({
  sageTag,
  eviScore,
  eviDelta,
  pillar,
  ceiling,
}: ImpactStripProps) {
  return (
    <div className="flex items-center gap-4 px-6 py-2 border-b border-border-subtle bg-slate-1/50">
      {/* SAGE Tag */}
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/50"> {/* typography-allow: impact-strip label */}
        <span className="text-brand-iris">✦</span>
        SAGE
        <span className="font-normal normal-case text-white/40 ml-1">
          {sageTag}
        </span>
      </div>

      {/* EVI Score */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">EVI</span> {/* typography-allow: impact-strip label */}
        {eviScore !== null ? (
          <>
            <span className="text-sm font-bold text-brand-cyan tabular-nums">{eviScore.toFixed(1)}</span>
            {eviDelta !== null && eviDelta !== 0 && (
              <span className={`text-xs ${eviDelta > 0 ? 'text-semantic-success' : 'text-semantic-danger'}`}>
                {eviDelta > 0 ? '↑' : '↓'}{Math.abs(eviDelta).toFixed(1)}
              </span>
            )}
          </>
        ) : (
          <span className="text-sm text-white/30">—</span>
        )}
      </div>

      {/* Mode Switcher — right-aligned */}
      <div className="ml-auto">
        <ModeSwitcher pillar={pillar} ceiling={ceiling} compact />
      </div>
    </div>
  );
}

export default ImpactStrip;
