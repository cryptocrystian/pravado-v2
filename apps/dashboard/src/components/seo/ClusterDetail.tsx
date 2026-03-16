'use client';

/**
 * ClusterDetail — Right panel showing full cluster analysis.
 */

import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  Warning,
  XCircle,
  Lightbulb,
  House,
  Newspaper,
} from '@phosphor-icons/react';
import type { TopicCluster } from './seo-mock-data';


const resultIcon: Record<string, React.ReactNode> = {
  cited: <CheckCircle size={14} className="text-semantic-success" weight="fill" />,
  partial: <Warning size={14} className="text-amber-500" weight="fill" />,
  not_cited: <XCircle size={14} className="text-red-500" weight="fill" />,
};

export function ClusterDetail({ cluster }: { cluster: TopicCluster | null }) {
  const router = useRouter();

  if (!cluster) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-white/45 text-sm">Select a cluster to view details</p>
      </div>
    );
  }

  const isTrendHot = cluster.score >= 85;

  return (
    <div className="flex-1 min-w-0 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-2xl font-bold text-white">{cluster.name}</h2>
          <span className="text-2xl font-bold text-white">{cluster.score}</span>
          {isTrendHot && (
            <span className="bg-amber-500/10 text-amber-500 text-xs px-2 py-0.5 rounded-full font-medium">
              Hot
            </span>
          )}
        </div>
        <p className="text-xs text-white/45">
          {cluster.promptsTracked} prompts tracked &middot; Updated{' '}
          {cluster.lastUpdated}
        </p>
      </div>

      {/* Score by Engine */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-3">
          Score by Engine
        </h3>
        <div className="space-y-2">
          {cluster.engines.map((eng, i) => {
            const isBest = i === 0;
            return (
              <div key={eng.engine} className="flex items-center gap-3">
                <span className="w-24 text-sm text-white/70">{eng.engine}</span>
                <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cc-cyan rounded-full"
                    style={{ width: `${eng.score}%` }}
                  />
                </div>
                <span className="w-10 text-right text-sm font-bold text-white">
                  {eng.score}
                </span>
                {isBest && (
                  <span className="text-xs text-white/45">
                    &larr; Your best engine on this cluster
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Competitive Position */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-3">
          Competitive Position
        </h3>
        <div className="space-y-2">
          {cluster.competitors.map((comp, i) => {
            const rank = i + 1;
            const delta = comp.isYou
              ? null
              : comp.score - (cluster.competitors.find((c) => c.isYou)?.score ?? 0);

            return (
              <div key={comp.name} className="flex items-center gap-3">
                <span className="w-6 text-xs text-white/30 font-bold">#{rank}</span>
                <span className="w-28 text-sm text-white/70">{comp.name}</span>
                <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${comp.isYou ? 'bg-cc-cyan' : 'bg-white/20'}`}
                    style={{ width: `${comp.score}%` }}
                  />
                </div>
                <span className="w-10 text-right text-sm font-bold text-white">
                  {comp.score}
                </span>
                {comp.isYou ? (
                  <span className="bg-cc-cyan/10 text-cc-cyan text-xs px-2 py-0.5 rounded-full font-medium">
                    You
                  </span>
                ) : delta !== null ? (
                  <span className="text-xs text-white/30 w-12 text-right">
                    ({delta > 0 ? '+' : ''}{delta})
                  </span>
                ) : (
                  <span className="w-12" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Tracked Prompts */}
      {cluster.trackedPrompts.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-3">
            Tracked Prompts
          </h3>
          <div className="space-y-2">
            {cluster.trackedPrompts.map((tp) => (
              <div
                key={tp.prompt}
                className="bg-white/[0.02] rounded-xl p-3 flex items-start gap-3"
              >
                <p className="flex-1 text-sm text-white/70 italic">
                  &ldquo;{tp.prompt}&rdquo;
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  {Object.entries(tp.results).map(([engine, status]) => (
                    <div
                      key={engine}
                      className="flex items-center gap-1"
                      title={`${engine}: ${status}`}
                    >
                      <span className="text-xs text-white/30">{engine.slice(0, 3)}</span>
                      {resultIcon[status]}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {cluster.promptsTracked > cluster.trackedPrompts.length && (
            <p className="text-xs text-cc-cyan mt-2">
              View all {cluster.promptsTracked} prompts &rarr;
            </p>
          )}
        </section>
      )}

      {/* Citation Sources */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-3">
          Citation Sources
        </h3>

        {cluster.ownedCitations.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-white/45 mb-1">Your owned pages being cited:</p>
            {cluster.ownedCitations.map((c) => (
              <div
                key={c.url}
                className="flex items-center gap-2 py-1 text-sm text-white/70"
              >
                <House size={12} className="text-cc-cyan shrink-0" />
                <span className="font-mono text-xs">{c.url}</span>
                <span className="text-white/30">&mdash;</span>
                <span className="text-xs font-medium text-white">
                  {c.count} citations
                </span>
              </div>
            ))}
          </div>
        )}

        {cluster.earnedCitations.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-white/45 mb-1">Earned media being cited:</p>
            {cluster.earnedCitations.map((c) => (
              <div
                key={c.source}
                className="flex items-center gap-2 py-1 text-sm text-white/70"
              >
                <Newspaper size={12} className="text-brand-iris shrink-0" />
                <span className="text-xs">{c.source}</span>
                <span className="text-white/30">&mdash;</span>
                <span className="text-xs font-medium text-white">
                  {c.count} citations
                </span>
              </div>
            ))}
          </div>
        )}

        {cluster.coverageGap && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-500">
            <strong>Coverage gap:</strong> {cluster.coverageGap}
          </div>
        )}
      </section>

      {/* SAGE Recommendations */}
      {cluster.recommendations.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-3">
            SAGE Recommendations
          </h3>
          <div className="space-y-2">
            {cluster.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 py-1">
                {rec.type === 'success' && (
                  <CheckCircle
                    size={14}
                    className="text-semantic-success shrink-0 mt-0.5"
                    weight="fill"
                  />
                )}
                {rec.type === 'warning' && (
                  <Warning
                    size={14}
                    className="text-amber-500 shrink-0 mt-0.5"
                    weight="fill"
                  />
                )}
                {rec.type === 'idea' && (
                  <Lightbulb
                    size={14}
                    className="text-cc-cyan shrink-0 mt-0.5"
                    weight="fill"
                  />
                )}
                <div className="flex-1">
                  <p
                    className={`text-sm ${
                      rec.type === 'success' ? 'text-semantic-success' : 'text-white/70'
                    }`}
                  >
                    {rec.text}
                  </p>
                  {rec.cta && (
                    <button
                      type="button"
                      onClick={() =>
                        rec.ctaHref ? router.push(rec.ctaHref) : undefined
                      }
                      className="text-xs text-cc-cyan hover:text-cc-cyan/80 transition-colors mt-1 inline-flex items-center gap-1"
                    >
                      {rec.ctaHref ? (
                        <span className="bg-cc-cyan text-cc-page rounded-xl px-3 py-1.5 text-xs font-medium hover:bg-cc-cyan/90">
                          {rec.cta}
                        </span>
                      ) : (
                        <span>{rec.cta}</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
