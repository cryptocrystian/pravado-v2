'use client';

/**
 * Brand Voice Settings — /app/settings/brand-voice
 *
 * Manage brand voices that govern AI content generation tone and style.
 * 4-step wizard: Name → Upload Samples → Detected Traits → Confirm & Save
 */

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { BrandVoiceWizard, VoiceCard } from '@/components/settings/BrandVoiceWizard';
import { mockBrandVoice } from '@/components/content/content-mock-data';
import type { BrandVoice } from '@/components/content/content-mock-data';

export default function BrandVoiceSettingsPage() {
  const [voices, setVoices] = useState<BrandVoice[]>([mockBrandVoice]);
  const [showWizard, setShowWizard] = useState(false);

  function handleSave(voice: BrandVoice) {
    setVoices((prev) => [...prev, voice]);
    setShowWizard(false);
  }

  function handleDelete(id: string) {
    setVoices((prev) => prev.filter((v) => v.id !== id));
  }

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
        <h1 className="text-3xl font-bold text-white mb-2">Brand Voice</h1>
        <p className="text-sm text-white/70 mb-8">
          Teach Pravado your brand&apos;s writing style. All AI generations will
          match your voice.
        </p>

        {/* Existing voices */}
        <div className="space-y-3 mb-6">
          {voices.map((voice) => (
            <VoiceCard
              key={voice.id}
              voice={voice}
              onDelete={() => handleDelete(voice.id)}
            />
          ))}
        </div>

        {/* Add button */}
        {!showWizard && (
          <button
            type="button"
            onClick={() => setShowWizard(true)}
            className="bg-cc-cyan text-cc-page rounded-xl px-4 py-2 text-sm font-medium hover:bg-cc-cyan/90 transition-colors"
          >
            + Add Brand Voice
          </button>
        )}

        {/* Wizard */}
        {showWizard && (
          <BrandVoiceWizard
            onSave={handleSave}
            onCancel={() => setShowWizard(false)}
          />
        )}
      </div>
    </div>
  );
}
