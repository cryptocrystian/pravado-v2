'use client';

/**
 * ComingSoonGate
 *
 * Phase 0 Track 0B — replaces every surface that would otherwise ship
 * hardcoded mock data. Empty-is-honest: no fake numbers, no fake progress
 * bars, no fake "loading…" states. The gate stays up until Phase 1 wires
 * the surface to real data.
 *
 * See docs/sprints/PHASE-0-FIRE-BREAK/TRACK-0B-MOCK-CONTAINMENT.md
 */

import { Sparkle } from '@phosphor-icons/react';

interface ComingSoonGateProps {
  pillar: 'Command' | 'PR' | 'Content' | 'SEO' | 'Analytics' | 'Settings';
  subsurface: string;
  description?: string;
}

export function ComingSoonGate({
  pillar,
  subsurface,
  description,
}: ComingSoonGateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <Sparkle size={48} className="text-brand-cyan opacity-50 mb-4" />
      <p className="text-xs uppercase tracking-widest text-white/40 mb-2">
        {pillar} — {subsurface}
      </p>
      <h2 className="text-2xl font-semibold mb-3 text-white">
        Activating as SAGE ingests your data
      </h2>
      <p className="text-white/60 max-w-md text-sm leading-relaxed">
        {description ??
          'This surface comes online as SAGE has enough signal to populate it with real insights for your brand.'}
      </p>
    </div>
  );
}
