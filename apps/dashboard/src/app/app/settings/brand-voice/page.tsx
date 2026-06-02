'use client';

/**
 * Brand Voice Settings — /app/settings/brand-voice
 *
 * Phase 0 Track 0B: gated behind SETTINGS_BRAND_VOICE_WIRED. The hardcoded
 * "Default Voice — Authoritative / Professional · Medium (15-22 words avg)"
 * pre-fill has been removed; voices state seeds empty in Phase 1.
 */

export const dynamic = 'force-dynamic';

import { ComingSoonGate } from '@/components/gates/ComingSoonGate';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function BrandVoiceSettingsPage() {
  const wired = useFeatureFlag('SETTINGS_BRAND_VOICE_WIRED');
  if (!wired) {
    return <ComingSoonGate pillar="Settings" subsurface="Brand Voice" />;
  }
  // Phase 1 restores the wizard + VoiceCard list backed by real org data.
  return null;
}
