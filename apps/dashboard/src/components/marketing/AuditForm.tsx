'use client';

/**
 * AuditForm — shared input + scanning component for the audit funnel.
 *
 * Used by /audit, /audit/pr, /audit/content, /audit/ai. Owns its own
 * idle/scanning sub-state so multiple instances can co-exist on a
 * landing page (hero form + sticky form + footer form). Only the form
 * the user actually submits will transition to scanning; the others
 * stay idle until the parent receives onResult and unmounts the
 * marketing layers.
 *
 * Props:
 *   - entryPath: tags the scan with the buyer's entry pillar so the
 *     server records funnel attribution and the results page templates
 *     pillar order accordingly.
 *   - compact: tight vertical layout for sticky / mid-page form repeats.
 *   - onResult: parent transitions to results display when called.
 *   - layout: 'hero' (default — full form with competitors) or
 *     'inline' (URL+email only, for repeat instances).
 */

import { useState, useCallback } from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import {
  EMAIL_REGEX,
  buildFallbackResult,
  type EntryPath,
  type ScanResponse,
} from './audit-types';

const SCAN_LOGS = [
  'Resolving DNS and SSL chain...',
  'Crawling sitemap and page graph...',
  'Extracting entity mentions from page content...',
  'Querying Google Knowledge Graph API...',
  'Checking Bing Entity Search coverage...',
  'Probing ChatGPT for brand mentions...',
  'Probing Perplexity for citation presence...',
  'Probing Gemini for knowledge recall...',
  'Calculating schema.org coverage depth...',
  'Cross-referencing competitor entity footprints...',
  'Building authority pillar matrix...',
  'Computing earned visibility breakdown...',
  'Generating EVI score...',
  'Finalizing audit report...',
];

type FormStep = 'idle' | 'scanning';

interface Props {
  entryPath: EntryPath;
  onResult: (result: ScanResponse) => void;
  compact?: boolean;
  layout?: 'hero' | 'inline';
  ctaLabel?: string;
}

export function AuditForm({
  entryPath,
  onResult,
  compact = false,
  layout = 'hero',
  ctaLabel = 'Get my EVI™ scorecard',
}: Props) {
  const [step, setStep] = useState<FormStep>('idle');
  const [brandUrl, setBrandUrl] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [competitors, setCompetitors] = useState(['', '', '']);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeLog, setActiveLog] = useState(0);

  const updateCompetitor = useCallback((index: number, value: string) => {
    setCompetitors((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setScanError(null);

    if (!brandUrl || !email || !name || !company) {
      setScanError('Please fill in all required fields.');
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setScanError('Please enter a valid email address.');
      return;
    }

    setStep('scanning');
    setScanProgress(0);
    setActiveLog(0);

    // Progress animation in parallel with the API call. The scan
    // typically completes well after the 5s animation; the animation
    // freezes at 100% until the response lands.
    const progressPromise = new Promise<void>((resolve) => {
      const totalMs = 5000;
      const interval = 50;
      let elapsed = 0;
      const timer = setInterval(() => {
        elapsed += interval;
        const progress = Math.min((elapsed / totalMs) * 100, 100);
        setScanProgress(progress);
        setActiveLog(Math.min(Math.floor((elapsed / totalMs) * SCAN_LOGS.length), SCAN_LOGS.length - 1));
        if (elapsed >= totalMs) {
          clearInterval(timer);
          resolve();
        }
      }, interval);
    });

    type ScanOutcome =
      | { kind: 'success'; data: ScanResponse }
      | { kind: 'rate_limit'; message: string }
      | { kind: 'validation'; message: string }
      | { kind: 'fallback' };

    const fetchPromise: Promise<ScanOutcome> = fetch('/api/audit/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brandUrl,
        email: email.trim(),
        name: name.trim(),
        company: company.trim(),
        competitorUrls: competitors.filter(Boolean),
        entry_path: entryPath,
      }),
    })
      .then<ScanOutcome>(async (res) => {
        const raw: unknown = await res.json().catch(() => ({}));
        const data = (raw ?? {}) as Record<string, unknown>;
        if (res.status === 429) {
          const message = typeof data.message === 'string'
            ? data.message
            : 'You already ran an audit for this email. Try again later.';
          return { kind: 'rate_limit', message };
        }
        if (res.status === 400) {
          const message = typeof data.error === 'string' ? data.error : 'Invalid input.';
          return { kind: 'validation', message };
        }
        if (!res.ok || typeof data.evi_score !== 'number' || !data.pillars) {
          throw new Error(typeof data.error === 'string' ? data.error : 'Invalid response');
        }
        return { kind: 'success', data: data as unknown as ScanResponse };
      })
      .catch<ScanOutcome>(() => ({ kind: 'fallback' }));

    const [, outcome] = await Promise.all([progressPromise, fetchPromise]);

    if (outcome.kind === 'rate_limit' || outcome.kind === 'validation') {
      setScanError(outcome.message);
      setStep('idle');
      return;
    }

    if (outcome.kind === 'success') {
      onResult(outcome.data);
    } else {
      onResult(buildFallbackResult(entryPath));
    }
  }, [brandUrl, email, name, company, competitors, entryPath, onResult]);

  // ── Scanning view ────────────────────────────────────────────
  if (step === 'scanning') {
    return (
      <div
        style={{
          padding: compact ? 24 : 32,
          borderRadius: 16,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center',
        }}
      >
        {/* Radar */}
        <div style={{ width: 80, height: 80, margin: '0 auto 24px', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(0,217,255,0.15)' }} />
          <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '2px solid rgba(168,85,247,0.2)' }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#00D9FF', animation: 'spin 1s linear infinite' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 6, height: 6, borderRadius: '50%', background: '#00D9FF', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>

        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', marginBottom: 6, marginTop: 0 }}>
          Scanning your visibility footprint…
        </h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 24, marginTop: 0 }}>
          {SCAN_LOGS[activeLog]}
        </p>

        <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 16 }}>
          <div
            style={{
              width: `${scanProgress}%`,
              height: '100%',
              borderRadius: 2,
              background: 'linear-gradient(90deg, #A855F7, #00D9FF)',
              transition: 'width 0.1s linear',
            }}
          />
        </div>

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
          Three-pillar analysis takes 20–30 seconds. We&apos;re evaluating PR Authority,
          Content Authority, and AI Citation Authority across five engines.
        </p>
      </div>
    );
  }

  // ── Idle (form) view ────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: compact ? '12px 14px' : '14px 16px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: '#ffffff',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: compact ? 12 : 16 }}
    >
      <div>
        <label style={labelStyle}>Your website URL *</label>
        <input
          type="url"
          required
          placeholder="https://yourcompany.com"
          value={brandUrl}
          onChange={(e) => { setBrandUrl(e.target.value); setScanError(null); }}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Work email *</label>
        <input
          type="email"
          required
          placeholder="you@yourcompany.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setScanError(null); }}
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Full name *</label>
          <input
            type="text"
            required
            placeholder="Jane Smith"
            value={name}
            onChange={(e) => { setName(e.target.value); setScanError(null); }}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Company *</label>
          <input
            type="text"
            required
            placeholder="Acme Inc"
            value={company}
            onChange={(e) => { setCompany(e.target.value); setScanError(null); }}
            style={inputStyle}
          />
        </div>
      </div>

      {layout === 'hero' && (
        <div>
          <label style={{ ...labelStyle, color: 'rgba(255,255,255,0.5)' }}>
            Competitor URLs (optional)
          </label>
          {competitors.map((comp, i) => (
            <input
              key={i}
              type="url"
              placeholder={`https://competitor${i + 1}.com`}
              value={comp}
              onChange={(e) => updateCompetitor(i, e.target.value)}
              style={{
                ...inputStyle,
                padding: '12px 16px',
                fontSize: 14,
                marginBottom: 8,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
              }}
            />
          ))}
        </div>
      )}

      {scanError && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#FCA5A5',
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          {scanError}
        </div>
      )}

      <button
        type="submit"
        style={{
          padding: compact ? '14px 24px' : '16px 32px',
          borderRadius: 10,
          border: 'none',
          background: '#00D9FF',
          color: '#0A0A0F',
          fontSize: compact ? 15 : 16,
          fontWeight: 700,
          cursor: 'pointer',
          marginTop: 4,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {ctaLabel}
        <ArrowRight size={compact ? 16 : 18} weight="bold" />
      </button>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
        No credit card required &middot; Results in under 60 seconds &middot; SOC 2 compliant
      </p>
    </form>
  );
}
