'use client';

/**
 * CitationsTable — real CiteMind citation-monitor results with slide-in detail.
 *
 * HONEST DATA: reads /api/seo/citations, which proxies the real citation monitor
 * endpoints (citation_monitor_results + citation_summaries). Every column maps to
 * a genuine backend field. No owned/earned classification, no per-row citation
 * counts, no trend arrows, no fabricated SAGE recommendations — none of those have
 * a real source in the monitor data, so they are omitted rather than invented.
 *
 * A brand-new org has no monitored results yet; that renders as an honest empty
 * state ("no AI citations detected yet"), which is correct, not a bug.
 */

import {
  MagnifyingGlass,
  X,
  Link as LinkIcon,
  WarningCircle,
  Robot,
} from '@phosphor-icons/react';
import { useState } from 'react';
import useSWR from 'swr';

// ============================================================================
// Real backend row shape (citation_monitor_results)
// ============================================================================

type Engine = 'chatgpt' | 'perplexity' | 'claude' | 'gemini';

interface CitationResult {
  id: string;
  engine: Engine | string;
  query_prompt: string;
  query_topic: string;
  response_excerpt: string | null;
  brand_mentioned: boolean;
  mention_type: 'direct' | 'indirect' | 'competitor' | null;
  citation_url: string | null;
  monitored_at: string;
}

interface CitationSummary {
  total_queries?: number;
  total_mentions?: number;
  mention_rate?: number | null;
}

interface CitationsPayload {
  items: CitationResult[];
  summary: CitationSummary | null;
}

// ============================================================================
// Display helpers
// ============================================================================

const ENGINE_LABEL: Record<string, string> = {
  chatgpt: 'ChatGPT',
  perplexity: 'Perplexity',
  claude: 'Claude',
  gemini: 'Gemini',
};

function engineLabel(engine: string): string {
  return ENGINE_LABEL[engine] ?? engine;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

async function jsonFetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new Error(json?.error?.message ?? `Request failed (${res.status})`);
  }
  return json.data as T;
}

// ============================================================================
// Component
// ============================================================================

export function CitationsTable() {
  const { data, error, isLoading } = useSWR<CitationsPayload>(
    '/api/seo/citations?days=30&limit=50',
    jsonFetcher,
    { revalidateOnFocus: false }
  );

  const [engineFilter, setEngineFilter] = useState<string>('all');
  const [selected, setSelected] = useState<CitationResult | null>(null);

  const items = data?.items ?? [];
  const summary = data?.summary ?? null;

  // Engines actually present in the data — a real, functional filter (no fake chips).
  const enginesPresent = Array.from(new Set(items.map((r) => r.engine))).sort();

  const rows =
    engineFilter === 'all'
      ? items
      : items.filter((r) => r.engine === engineFilter);

  const mentionedCount = items.filter((r) => r.brand_mentioned).length;

  // Honest header sub-line: prefer the real 30-day summary aggregate; otherwise
  // describe only what was actually loaded.
  const subLine =
    summary && typeof summary.total_queries === 'number'
      ? `${summary.total_mentions ?? 0} brand mentions across ${
          summary.total_queries
        } monitored queries (last 30 days)`
      : `${mentionedCount} brand mention${
          mentionedCount === 1 ? '' : 's'
        } in ${items.length} recent monitored result${
          items.length === 1 ? '' : 's'
        }`;

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-white/95 tracking-tight">
            Citations
          </h2>
          <p className="text-[13px] text-white/55 mt-0.5">
            {isLoading ? 'Loading citation monitor results…' : subLine}
          </p>
        </div>
      </div>

      {/* Engine filter — only real engines present in the data */}
      {!isLoading &&
        !error &&
        items.length > 0 &&
        enginesPresent.length > 1 && (
          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => setEngineFilter('all')}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-medium border transition-colors ${
                engineFilter === 'all'
                  ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30'
                  : 'bg-slate-3 text-white/60 border-border-subtle hover:text-white/85 hover:border-slate-5'
              }`}
            >
              All engines
            </button>
            {enginesPresent.map((eng) => (
              <button
                key={eng}
                type="button"
                onClick={() => setEngineFilter(eng)}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-medium border transition-colors ${
                  engineFilter === eng
                    ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30'
                    : 'bg-slate-3 text-white/60 border-border-subtle hover:text-white/85 hover:border-slate-5'
                }`}
              >
                {engineLabel(eng)}
              </button>
            ))}
          </div>
        )}

      {/* Loading */}
      {isLoading && (
        <div className="bg-panel border border-border-subtle rounded-xl p-4 space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-11 w-full bg-white/5 rounded-lg animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error — honest, no fake fallback */}
      {!isLoading && error && (
        <div className="bg-panel border border-semantic-danger/20 rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <WarningCircle
            size={26}
            className="text-semantic-danger mb-3"
            weight="fill"
          />
          <p className="text-sm text-white/85 leading-relaxed max-w-md">
            Couldn&rsquo;t load citation data.
          </p>
          <p className="text-[13px] text-white/50 leading-relaxed max-w-md mt-1">
            {error instanceof Error
              ? error.message
              : 'Please try again shortly.'}
          </p>
        </div>
      )}

      {/* Empty — a new org genuinely starts with zero detected citations */}
      {!isLoading && !error && items.length === 0 && (
        <div className="bg-panel border border-border-subtle rounded-xl p-10 flex flex-col items-center justify-center text-center">
          <Robot size={28} className="text-white/25 mb-3" weight="fill" />
          <p className="text-sm text-white/85 leading-relaxed max-w-md">
            No AI citations detected yet.
          </p>
          <p className="text-[13px] text-white/55 leading-relaxed max-w-md mt-1.5">
            CiteMind polls ChatGPT, Perplexity and Claude for your tracked
            topics. As soon as an engine references your brand, the result will
            appear here.
          </p>
        </div>
      )}

      {/* Populated */}
      {!isLoading && !error && items.length > 0 && (
        <div className="bg-panel border border-border-subtle rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">
                    Engine
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">
                    Topic
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">
                    Query
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">
                    Brand Mentioned
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">
                    Source
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">
                    Last Checked
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border-subtle last:border-0 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setSelected(row)}
                  >
                    <td className="px-4 py-3 text-white/85 whitespace-nowrap">
                      {engineLabel(row.engine)}
                    </td>
                    <td className="px-4 py-3 text-white/70 max-w-[180px] truncate">
                      {row.query_topic || '—'}
                    </td>
                    <td className="px-4 py-3 text-white/60 max-w-[280px] truncate">
                      {row.query_prompt}
                    </td>
                    <td className="px-4 py-3">
                      {row.brand_mentioned ? (
                        <span className="inline-flex items-center px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border bg-semantic-success/10 text-semantic-success border-semantic-success/20">
                          Mentioned
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border bg-white/5 text-white/50 border-white/15">
                          Not found
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate">
                      {row.citation_url ? (
                        <span className="text-brand-cyan font-mono text-[13px]">
                          {row.citation_url}
                        </span>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/50 whitespace-nowrap">
                      {formatDateTime(row.monitored_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-in detail — real fields only */}
      {selected && (
        <>
          <div
            className="fixed inset-0 bg-page/70 backdrop-blur-sm z-40"
            onClick={() => setSelected(null)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-[480px] max-w-full bg-panel border-l border-border-subtle z-50 overflow-y-auto">
            <div className="sticky top-0 bg-panel border-b border-border-subtle px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MagnifyingGlass size={16} className="text-brand-cyan" />
                <h3 className="text-lg font-semibold text-white/90 tracking-tight">
                  Citation Detail
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                aria-label="Close detail panel"
              >
                <X size={16} className="text-white/50" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Engine + mention status */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-cyan">
                  {engineLabel(selected.engine)}
                </span>
                {selected.brand_mentioned ? (
                  <span className="inline-flex items-center px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border bg-semantic-success/10 text-semantic-success border-semantic-success/20">
                    Brand mentioned
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border bg-white/5 text-white/50 border-white/15">
                    Not mentioned
                  </span>
                )}
                {selected.mention_type && (
                  <span className="text-xs text-white/50 uppercase tracking-wide">
                    {selected.mention_type}
                  </span>
                )}
              </div>

              {/* Topic */}
              <div>
                <p className="text-xs font-semibold text-white/55 uppercase tracking-wide mb-1">
                  Topic
                </p>
                <p className="text-sm text-white/85">
                  {selected.query_topic || '—'}
                </p>
              </div>

              {/* Query prompt */}
              <div>
                <p className="text-xs font-semibold text-white/55 uppercase tracking-wide mb-1">
                  Query
                </p>
                <p className="text-sm text-white/85 leading-relaxed bg-white/5 rounded-lg px-3 py-2 italic">
                  &ldquo;{selected.query_prompt}&rdquo;
                </p>
              </div>

              {/* Source URL */}
              <div>
                <p className="text-xs font-semibold text-white/55 uppercase tracking-wide mb-1">
                  Source URL
                </p>
                {selected.citation_url ? (
                  <a
                    href={selected.citation_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-brand-cyan font-mono break-all hover:underline"
                  >
                    <LinkIcon size={14} className="shrink-0" />
                    {selected.citation_url}
                  </a>
                ) : (
                  <p className="text-sm text-white/40">
                    No source URL captured for this result.
                  </p>
                )}
              </div>

              {/* Response excerpt */}
              {selected.response_excerpt && (
                <div>
                  <p className="text-xs font-semibold text-white/55 uppercase tracking-wide mb-1">
                    Engine response excerpt
                  </p>
                  <p className="text-[13px] text-white/70 leading-relaxed bg-white/5 rounded-lg px-3 py-2">
                    {selected.response_excerpt}
                  </p>
                </div>
              )}

              {/* Monitored at */}
              <div>
                <p className="text-xs font-semibold text-white/55 uppercase tracking-wide mb-1">
                  Last checked
                </p>
                <p className="text-sm text-white/70">
                  {formatDateTime(selected.monitored_at)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
