'use client';

/**
 * Template Brief Intake — /app/content/new/template/[id]
 *
 * Shows a form + live preview for the selected template.
 * The form schema is driven by the template's field config.
 */

export const dynamic = 'force-dynamic';

import { use } from 'react';
import Link from 'next/link';
import { TemplateIntakeForm } from '@/components/content/TemplateIntakeForm';
import { mockTemplates } from '@/components/content/content-mock-data';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TemplateIntakePage({ params }: PageProps) {
  const { id } = use(params);
  const template = mockTemplates.find((t) => t.id === id);
  const templateName = template?.name ?? 'Thought Leadership Article';

  return (
    <div className="min-h-full bg-cc-page pt-8 pb-16 px-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Back */}
        <Link
          href="/app/content/new?view=templates"
          className="text-sm text-white/45 hover:text-white/70 transition-colors mb-8 inline-block"
        >
          &larr; Templates
        </Link>

        {/* Header */}
        <h1 className="text-3xl font-bold text-white mb-2">{templateName}</h1>
        <p className="text-sm text-white/70 mb-8">
          Fill in the brief &mdash; AI will draft your content from these
          inputs.
        </p>

        {/* Form + Preview */}
        <TemplateIntakeForm templateName={templateName} />
      </div>
    </div>
  );
}
