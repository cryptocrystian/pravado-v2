'use client';

/**
 * Content Asset Work Surface
 *
 * Full article editing page using the Tiptap block editor.
 * Three-panel layout: Outline | Writing Canvas | Intelligence Margin (stubbed)
 *
 * @see /docs/canon/CONTENT_PILLAR_CANON.md
 * @see /docs/CONTENT_HUB_REDESIGN_PROPOSAL.md
 */

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import { ArticleEditor } from '@/components/content/editor/ArticleEditor';
import type { ContentStatus } from '@/components/content/types';

// ============================================
// TYPES
// ============================================

interface AssetPageProps {
  params: {
    id: string;
  };
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_ASSET = {
  id: '1',
  title: 'Ultimate Guide to Marketing Automation',
  status: 'draft' as ContentStatus,
  /** HTML content for Tiptap editor (converted from the original markdown) */
  body: `<h1>Ultimate Guide to Marketing Automation</h1>
<h2>Introduction</h2>
<p>Marketing automation has become essential for modern businesses. Companies that implement automation see significant improvements in efficiency and conversion rates.</p>
<h2>What is Marketing Automation?</h2>
<p>Marketing automation refers to software platforms designed to help marketers automate repetitive tasks...</p>
<h2>Key Benefits</h2>
<ul>
<li>Increased efficiency</li>
<li>Better lead nurturing</li>
<li>Improved ROI tracking</li>
<li>Personalized customer journeys</li>
</ul>
<h2>Implementation Best Practices</h2>
<p>When implementing marketing automation, consider these factors:</p>
<ol>
<li>Define clear goals</li>
<li>Segment your audience</li>
<li>Create relevant content</li>
<li>Test and optimize</li>
</ol>
<h2>Conclusion</h2>
<p>Marketing automation is no longer optional for competitive businesses.</p>`,
};

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function AssetWorkSurfacePage({ params }: AssetPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [asset, setAsset] = useState<typeof MOCK_ASSET | null>(null);

  // Fetch asset data
  useEffect(() => {
    async function fetchAsset() {
      setIsLoading(true);
      try {
        // In production: const res = await fetch(`/api/content/items/${params.id}`);
        await new Promise((resolve) => setTimeout(resolve, 300));
        setAsset(MOCK_ASSET);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAsset();
  }, [params.id]);

  const handleSave = useCallback((data: { title: string; content: string }) => {
    // In production: await fetch(`/api/content/items/${params.id}`, { method: 'PATCH', body: JSON.stringify(data) });
    console.log('Auto-save:', data.title, `(${data.content.length} chars)`);
  }, []);

  const handleStatusChange = useCallback((status: ContentStatus) => {
    // In production: await fetch(`/api/content/items/${params.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    console.log('Status change:', status);
  }, []);

  const handleBack = useCallback(() => {
    router.push('/app/content');
  }, [router]);

  if (isLoading || !asset) {
    return (
      <div className="h-screen bg-slate-0 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-iris border-t-transparent rounded-full animate-spin" />
          <span className="text-white/50">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <ArticleEditor
        id={asset.id}
        initialTitle={asset.title}
        initialContent={asset.body}
        status={asset.status}
        onSave={handleSave}
        onStatusChange={handleStatusChange}
        onBack={handleBack}
      />
    </div>
  );
}
