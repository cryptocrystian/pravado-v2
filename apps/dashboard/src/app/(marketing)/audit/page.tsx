'use client';

/**
 * /audit — generic three-pillar EVI scorecard landing page.
 *
 * Cold traffic / unsegmented entry point. Sub-pages /audit/pr,
 * /audit/content, /audit/ai are pillar-segmented entry paths
 * (Phase 1C/1D) that reuse the same AuditForm + EVIScorecardResults
 * components but template their own marketing layers.
 *
 * Per docs/canon/DECISIONS_LOG.md D027 and
 * docs/sprints/D027-AUDIT-REBUILD/WORK_ORDER.md Phase 1B/1C.
 */

import {
  GoogleLogo,
  Robot,
  Compass,
  Sparkle,
  Globe,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { useState } from 'react';

import type { ScanResponse } from '@/components/marketing/audit-types';
import { AuditForm } from '@/components/marketing/AuditForm';
import { EVIScorecardResults } from '@/components/marketing/EVIScorecardResults';

function TM() {
  return (
    <sup style={{ fontSize: '0.6em', verticalAlign: 'super' }}>&trade;</sup>
  );
}

const ENGINES: Array<{ name: string; Icon: Icon }> = [
  { name: 'Google', Icon: GoogleLogo },
  { name: 'ChatGPT', Icon: Robot },
  { name: 'Perplexity', Icon: Compass },
  { name: 'Gemini', Icon: Sparkle },
  { name: 'Bing', Icon: Globe },
];

const KEYFRAMES = `
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
`;

export default function AuditPage() {
  const [result, setResult] = useState<ScanResponse | null>(null);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />

      {/* Technical grid background */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          backgroundImage:
            'linear-gradient(rgba(168,85,247,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.03) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {result ? (
          <EVIScorecardResults scanResult={result} entryPath="generic" />
        ) : (
          <div
            style={{
              maxWidth: 680,
              margin: '0 auto',
              padding: '120px 24px 80px',
            }}
          >
            {/* Eyebrow */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '6px 16px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  background: 'rgba(168,85,247,0.12)',
                  color: '#A855F7',
                  border: '1px solid rgba(168,85,247,0.2)',
                }}
              >
                SAGE
                <TM /> PROPRIETARY DIAGNOSTIC &middot; FREE
              </span>
            </div>

            <h1
              style={{
                textAlign: 'center',
                fontSize: 52,
                fontWeight: 800,
                lineHeight: 1.1,
                marginBottom: 16,
                background:
                  'linear-gradient(135deg, #ffffff 0%, #A855F7 50%, #00D9FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Your earned visibility, scored.
            </h1>

            <p
              style={{
                textAlign: 'center',
                fontSize: 18,
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.6,
                marginBottom: 48,
                maxWidth: 560,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              A free, three-pillar diagnostic of your PR Authority, Content
              Authority, and AI Citation Authority &mdash; and the variance
              between them that&apos;s costing you compounding visibility.
            </p>

            <AuditForm entryPath="generic" onResult={setResult} />

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 32,
                marginTop: 48,
              }}
            >
              {ENGINES.map(({ name, Icon }) => (
                <div
                  key={name}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.35)',
                  }}
                >
                  <Icon
                    size={24}
                    weight="regular"
                    color="rgba(255,255,255,0.55)"
                  />
                  {name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
