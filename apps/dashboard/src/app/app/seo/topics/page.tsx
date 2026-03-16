'use client';

/**
 * Topic Clusters — /app/seo/topics
 * Split-pane: 300px cluster list | flex cluster detail.
 */

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { TopicClusterList } from '@/components/seo/TopicClusterList';
import { ClusterDetail } from '@/components/seo/ClusterDetail';
import { mockClusters } from '@/components/seo/seo-mock-data';

export default function TopicsPage() {
  const [selectedId, setSelectedId] = useState('tc-1');

  const selectedCluster =
    mockClusters.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex h-[calc(100vh-49px)] overflow-hidden">
      <TopicClusterList selectedId={selectedId} onSelect={setSelectedId} />
      <ClusterDetail cluster={selectedCluster} />
    </div>
  );
}
