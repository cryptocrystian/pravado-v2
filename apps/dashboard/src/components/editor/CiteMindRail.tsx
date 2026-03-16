'use client';

import { useState } from 'react';
import { CaretDown, CaretRight } from '@phosphor-icons/react';
import { AeoScore } from './citemind/AeoScore';
import { EntityCoverage } from './citemind/EntityCoverage';
import { CitationSignals } from './citemind/CitationSignals';
import { Derivatives } from './citemind/Derivatives';
import { CrossPillar } from './citemind/CrossPillar';
import type {
  AeoScoreData,
  EntityItem,
  CitationSignal,
  DerivativeItem,
  CrossPillarHook,
} from './editor-mock-data';

/* ── Collapsible section wrapper ──────────────────────── */

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  alwaysOpen?: boolean;
  children: React.ReactNode;
}

function Section({ title, defaultOpen = false, alwaysOpen = false, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen || alwaysOpen);

  return (
    <div className="border-b border-white/5 last:border-b-0">
      {!alwaysOpen && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
        >
          <span className="text-xs font-semibold text-white/45 uppercase tracking-wider">
            {title}
          </span>
          {open ? (
            <CaretDown size={12} className="text-white/30" />
          ) : (
            <CaretRight size={12} className="text-white/30" />
          )}
        </button>
      )}
      {(open || alwaysOpen) && children}
    </div>
  );
}

/* ── CiteMind Rail ────────────────────────────────────── */

interface CiteMindRailProps {
  aeoScore: AeoScoreData;
  entities: EntityItem[];
  citationSignals: CitationSignal[];
  derivatives: DerivativeItem[];
  crossPillarHooks: CrossPillarHook[];
}

export function CiteMindRail({
  aeoScore,
  entities,
  citationSignals,
  derivatives,
  crossPillarHooks,
}: CiteMindRailProps) {
  return (
    <div className="w-[300px] flex-shrink-0 bg-cc-surface border-l border-white/8 flex flex-col h-full overflow-y-auto">
      {/* Rail header */}
      <div className="px-4 py-3 border-b border-white/5">
        <span className="text-xs font-semibold text-white/45 uppercase tracking-wider">
          CiteMind
        </span>
      </div>

      {/* AEO Score — always visible */}
      <Section title="AEO Score" alwaysOpen>
        <AeoScore data={aeoScore} />
      </Section>

      {/* Entities — default open */}
      <Section title="Entities" defaultOpen>
        <EntityCoverage entities={entities} />
      </Section>

      {/* Citation Signals — default open */}
      <Section title="Citation Signals" defaultOpen>
        <CitationSignals signals={citationSignals} />
      </Section>

      {/* Derivatives — default collapsed */}
      <Section title="Derivatives">
        <Derivatives derivatives={derivatives} />
      </Section>

      {/* Cross-Pillar — default collapsed */}
      <Section title="Cross-Pillar">
        <CrossPillar hooks={crossPillarHooks} />
      </Section>
    </div>
  );
}
