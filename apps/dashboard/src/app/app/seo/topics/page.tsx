'use client';

/**
 * Topic Clusters — /app/seo/topics
 * Split-pane: 300px cluster list | flex cluster detail.
 *
 * HONEST DATA: clusters come from useSeoTopics (/api/seo/topics), formed by
 * SERP-result overlap over the org's cached DataForSEO SERP data. No mock data.
 * Honest loading / empty / error states; a new org with no cached SERP data shows
 * the empty state, not a fabricated cluster list.
 *
 * Gated behind SEO_TOPICS_WIRED.
 */

export const dynamic = 'force-dynamic';

import { ChartLineUp, WarningCircle } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

import { ComingSoonGate } from '@/components/gates/ComingSoonGate';
import { ClusterDetail } from '@/components/seo/ClusterDetail';
import { TopicClusterList } from '@/components/seo/TopicClusterList';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useSeoTopics } from '@/hooks/useSeoTopics';

export default function TopicsPage() {
  const wired = useFeatureFlag('SEO_TOPICS_WIRED');
  const { clusters, isLoading, error } = useSeoTopics();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Default the selection to the first cluster once data arrives.
  useEffect(() => {
    if (selectedId === null && clusters.length > 0) {
      setSelectedId(clusters[0].id);
    }
  }, [clusters, selectedId]);

  if (!wired) {
    return <ComingSoonGate pillar="SEO" subsurface="Topic Clusters" />;
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-49px)] overflow-hidden">
        <div className="w-[300px] flex-shrink-0 border-r border-border-subtle p-4 space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-10 w-full bg-white/5 rounded-lg animate-pulse"
            />
          ))}
        </div>
        <div className="flex-1 p-6">
          <div className="h-8 w-64 bg-white/5 rounded-lg animate-pulse mb-6" />
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-24 bg-white/5 rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error — honest, no fake fallback
  if (error) {
    return (
      <div className="flex h-[calc(100vh-49px)] items-center justify-center p-8">
        <div className="bg-panel border border-semantic-danger/20 rounded-xl p-8 flex flex-col items-center justify-center text-center max-w-md">
          <WarningCircle
            size={26}
            className="text-semantic-danger mb-3"
            weight="fill"
          />
          <p className="text-sm text-white/85 leading-relaxed">
            Couldn&rsquo;t load topic clusters.
          </p>
          <p className="text-[13px] text-white/50 leading-relaxed mt-1">
            {error instanceof Error
              ? error.message
              : 'Please try again shortly.'}
          </p>
        </div>
      </div>
    );
  }

  // Empty — a new org / no cached SERPs genuinely has no clusters yet
  if (clusters.length === 0) {
    return (
      <div className="flex h-[calc(100vh-49px)] items-center justify-center p-8">
        <div className="bg-panel border border-border-subtle rounded-xl p-10 flex flex-col items-center justify-center text-center max-w-md">
          <ChartLineUp size={28} className="text-white/25 mb-3" weight="fill" />
          <p className="text-sm text-white/85 leading-relaxed">
            No topic clusters yet.
          </p>
          <p className="text-[13px] text-white/55 leading-relaxed mt-1.5">
            Clusters form from your tracked keywords once SERP data is
            collected. Add tracked keywords and run a SERP refresh (in
            Competitors), and keywords that share ranking results will group
            into topics here.
          </p>
        </div>
      </div>
    );
  }

  const selectedCluster =
    clusters.find((c) => c.id === selectedId) ?? clusters[0] ?? null;

  return (
    <div className="flex h-[calc(100vh-49px)] overflow-hidden">
      <TopicClusterList
        clusters={clusters}
        selectedId={selectedCluster?.id ?? null}
        onSelect={setSelectedId}
      />
      <ClusterDetail cluster={selectedCluster} />
    </div>
  );
}
