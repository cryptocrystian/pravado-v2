'use client';

/**
 * EarnedMediaAnalytics — real PR-pillar analytics for /app/analytics/pr.
 *
 * HONEST DATA: reads real earned-media signals:
 *  - /api/media-monitoring/stats  → earned placement counts + sentiment split
 *  - /api/media-monitoring/mentions → recent brand coverage timeline
 * Every section renders real values or an honest empty state. No mocks, no
 * fabricated placements. If the org has no monitored sources / mentions, the
 * timeline shows a guidance empty state rather than invented rows.
 */

import { Newspaper, LinkSimple } from '@phosphor-icons/react';
import useSWR from 'swr';

interface Stats {
  totalSources: number;
  activeSources: number;
  totalArticles: number;
  articlesThisWeek: number;
  totalMentions: number;
  mentionsThisWeek: number;
  positiveMentions: number;
  neutralMentions: number;
  negativeMentions: number;
  avgRelevance: number;
}

interface MentionRow {
  id: string;
  entity: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  createdAt: string;
  article: {
    title: string;
    url: string;
    domainAuthority: number;
    publishedAt: string | null;
  } | null;
}

async function jsonFetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message ?? 'request failed');
  return json.data as T;
}

const SENTIMENT_STYLE: Record<string, string> = {
  positive: 'text-semantic-success',
  negative: 'text-semantic-error',
  neutral: 'text-white/50',
};

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <div className="bg-panel border border-border-subtle rounded-xl p-5">
      <p className="text-meta font-semibold uppercase tracking-wide text-white/55 mb-1">
        {label}
      </p>
      <p className="text-3xl font-bold tabular-nums text-white/95">{value}</p>
      <p className="text-meta text-white/50 mt-1">{sub}</p>
    </div>
  );
}

export function EarnedMediaAnalytics() {
  const { data: stats, isLoading: statsLoading } = useSWR<{ stats: Stats }>(
    '/api/media-monitoring/stats',
    jsonFetcher,
    { revalidateOnFocus: false }
  );
  const { data: mentions, isLoading: mentionsLoading } = useSWR<{
    mentions: MentionRow[];
    total: number;
  }>(
    '/api/media-monitoring/mentions?entityType=brand&limit=20&sortOrder=desc',
    jsonFetcher,
    { revalidateOnFocus: false }
  );

  const s = stats?.stats;
  const rows = mentions?.mentions ?? [];

  return (
    <div className="pt-6 pb-16 px-8 overflow-y-auto h-full">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Earned placement stat cards */}
        {statsLoading ? (
          <div className="grid grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 bg-panel border border-border-subtle rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              label="Earned Placements"
              value={s?.totalMentions ?? 0}
              sub={`${s?.mentionsThisWeek ?? 0} in the last 7 days`}
            />
            <StatCard
              label="Positive Coverage"
              value={s?.positiveMentions ?? 0}
              sub="favorable brand mentions"
            />
            <StatCard
              label="Monitored Sources"
              value={s?.activeSources ?? 0}
              sub={`${s?.totalArticles ?? 0} articles tracked`}
            />
            <StatCard
              label="Needs Attention"
              value={s?.negativeMentions ?? 0}
              sub="negative brand mentions"
            />
          </div>
        )}

        {/* Coverage timeline */}
        <div className="bg-panel border border-border-subtle rounded-xl p-5">
          <h3 className="text-[13px] font-semibold uppercase tracking-wider text-white/60 mb-4">
            Coverage Timeline
          </h3>

          {mentionsLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-14 w-full bg-white/5 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : rows.length > 0 ? (
            <ul className="divide-y divide-border-subtle">
              {rows.map((mention) => (
                <li
                  key={mention.id}
                  className="flex items-start gap-3 py-3 first:pt-0"
                >
                  <Newspaper
                    size={18}
                    className="text-white/30 mt-0.5 shrink-0"
                    weight="regular"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white/85 truncate">
                      {mention.article?.title ?? mention.entity}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-meta text-white/40">
                      <span
                        className={SENTIMENT_STYLE[mention.sentiment] ?? ''}
                      >
                        {mention.sentiment}
                      </span>
                      {mention.article?.domainAuthority ? (
                        <span>DA {mention.article.domainAuthority}</span>
                      ) : null}
                      <span>
                        {new Date(mention.createdAt).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                          }
                        )}
                      </span>
                    </div>
                  </div>
                  {mention.article?.url ? (
                    <a
                      href={mention.article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/30 hover:text-white/70 transition-colors shrink-0"
                      aria-label="Open source article"
                    >
                      <LinkSimple size={16} />
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Newspaper
                size={24}
                className="text-white/20 mb-3"
                weight="fill"
              />
              <p className="text-sm text-white/50 leading-relaxed max-w-sm">
                No earned coverage detected yet. Configure media monitoring
                sources and brand mentions will appear here as they are found.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
