'use client';

/**
 * SeoEngineBreakdown — per-engine citation totals (Analytics-SEO panel 1).
 * Rows come from citation_summaries.by_engine (CiteMind): real queries, mentions,
 * and mention rate per AI engine. Rate renders as an honest em-dash when the
 * engine has 0 queries (rate is null) — never a fabricated 0%.
 */

import type { EngineStat } from '@/hooks/useAnalyticsSeo';

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: 'ChatGPT',
  perplexity: 'Perplexity',
  claude: 'Claude',
  gemini: 'Gemini',
  google: 'Google AI',
  googleai: 'Google AI',
};

function labelFor(engine: string): string {
  return ENGINE_LABELS[engine.toLowerCase()] ?? engine;
}

export function SeoEngineBreakdown({ engines }: { engines: EngineStat[] }) {
  return (
    <div className="bg-panel border border-border-subtle rounded-xl p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-4">
        By AI Engine
      </h3>

      {engines.length === 0 ? (
        <div className="py-10 flex flex-col items-center justify-center text-center px-6">
          <p className="text-sm text-white/70">No engine data yet.</p>
          <p className="text-[13px] text-white/45 mt-1.5 leading-relaxed">
            Per-engine citation counts appear once the CiteMind monitor has run
            for your organization.
          </p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 pb-2 mb-1 border-b border-white/5 text-[11px] uppercase tracking-wide text-white/35">
            <span>Engine</span>
            <span className="text-right w-16">Queries</span>
            <span className="text-right w-16">Citations</span>
            <span className="text-right w-16">Rate</span>
          </div>
          {engines.map((e) => (
            <div
              key={e.engine}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-4 py-2.5 border-b border-white/5 text-sm items-center"
            >
              <span className="text-white/80">{labelFor(e.engine)}</span>
              <span className="text-right w-16 tabular-nums text-white/60">
                {e.queries}
              </span>
              <span className="text-right w-16 tabular-nums text-brand-cyan font-semibold">
                {e.mentions}
              </span>
              <span className="text-right w-16 tabular-nums text-white/60">
                {e.rate !== null ? `${Math.round(e.rate * 100)}%` : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
