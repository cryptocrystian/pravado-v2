'use client';

/**
 * Knowledge Base Settings — /app/settings/knowledge-base
 *
 * Company facts, products, and messaging that ground all AI generations.
 * Five collapsible category sections with upload + paste capability.
 */

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { KnowledgeBaseSection } from '@/components/settings/KnowledgeBaseSection';
import { kbCategories } from '@/components/content/content-mock-data';

export default function KnowledgeBaseSettingsPage() {
  return (
    <div className="min-h-full bg-cc-page pt-8 pb-16 px-8">
      <div className="max-w-[800px] mx-auto">
        {/* Back */}
        <Link
          href="/app/settings"
          className="text-sm text-white/45 hover:text-white/70 transition-colors mb-8 inline-block"
        >
          &larr; Settings
        </Link>

        {/* Header */}
        <h1 className="text-3xl font-bold text-white mb-2">Knowledge Base</h1>
        <p className="text-sm text-white/70 mb-8">
          Company facts, products, and messaging that ground all AI generations
          and prevent hallucinations.
        </p>

        {/* Category sections */}
        <div>
          {kbCategories.map((cat) => (
            <KnowledgeBaseSection key={cat.id} category={cat} />
          ))}
        </div>

        {/* Save button */}
        <div className="mt-6">
          <button
            type="button"
            className="bg-cc-cyan text-cc-page rounded-xl px-6 py-3 text-sm font-semibold hover:bg-cc-cyan/90 transition-colors"
          >
            Save Knowledge Base
          </button>
        </div>
      </div>
    </div>
  );
}
