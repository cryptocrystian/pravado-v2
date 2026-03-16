'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TemplateCard } from './TemplateCard';
import { mockTemplates } from './content-mock-data';
import type { ContentTemplate, TemplateTag } from './content-mock-data';

const filterPills: Array<{ label: string; value: TemplateTag | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'High AEO Impact', value: 'High AEO Impact' },
  { label: 'PR-Ready', value: 'PR-Ready' },
  { label: 'SEO-Focused', value: 'SEO-Focused' },
  { label: 'Quick <500 words', value: 'Quick <500 words' },
];

export function TemplateLibrary() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<TemplateTag | 'all'>('all');

  const filtered =
    activeFilter === 'all'
      ? mockTemplates
      : mockTemplates.filter((t) => t.tags.includes(activeFilter));

  function handleSelect(template: ContentTemplate) {
    router.push(`/app/content/new/template/${template.id}`);
  }

  return (
    <div>
      {/* Filter row */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filterPills.map((pill) => (
          <button
            key={pill.value}
            type="button"
            onClick={() => setActiveFilter(pill.value)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              activeFilter === pill.value
                ? 'bg-cc-cyan text-cc-page font-medium'
                : 'bg-white/5 text-white/45 border border-white/8 hover:text-white/70'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onClick={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}
