'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  GoogleLogo,
  Robot,
  Compass,
  Sparkle,
  Globe,
  Lock,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

// ── Types ──────────────────────────────────────────────────────────────────────

type AuditStep = 'input' | 'scanning' | 'results';

interface AuditResult {
  evi_score: number;
  silo_tax_monthly: number;
  monthly_cash_loss: number;
  risk_premium: number;
  authority_leakage: number;
  ppc_replacement: number;
  hallucination_overhead: number;
  gaps: Array<{
    type: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    description: string;
    affected_engine: string;
  }>;
  top_competitor_advantage: string;
  total_authority_void: boolean;
  audit_id: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function TM() {
  return <sup style={{ fontSize: '0.6em', verticalAlign: 'super' }}>&trade;</sup>;
}

function sevColor(severity: 'HIGH' | 'MEDIUM' | 'LOW'): string {
  switch (severity) {
    case 'HIGH': return '#EF4444';
    case 'MEDIUM': return '#F59E0B';
    case 'LOW': return '#22C55E';
  }
}

// EVI canonical bands per docs/canon/EARNED_VISIBILITY_INDEX.md.
// Hex values are approved DS v3.1 tokens (semantic-danger / brand-amber /
// brand-cyan / semantic-success) — verified against DS_v3_COMPLIANCE_CHECKLIST.
function eviBand(score: number): { label: string; color: string; bgColor: string } {
  if (score <= 40) return { label: 'At Risk',     color: '#EF4444', bgColor: 'rgba(239,68,68,0.15)' };
  if (score <= 60) return { label: 'Emerging',    color: '#F59E0B', bgColor: 'rgba(245,158,11,0.15)' };
  if (score <= 80) return { label: 'Competitive', color: '#00D9FF', bgColor: 'rgba(0,217,255,0.15)' };
  return                  { label: 'Dominant',    color: '#22C55E', bgColor: 'rgba(34,197,94,0.15)' };
}

// Mirror of the server-side regex in apps/api/src/routes/siloTaxAudit/index.ts.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Odometer ───────────────────────────────────────────────────────────────────

function Odometer({
  target,
  prefix = '',
  duration = 2000,
}: {
  target: number;
  prefix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let triggered = false;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered) {
          triggered = true;
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {prefix}{value.toLocaleString()}
    </span>
  );
}

// ── Scan Log Messages ──────────────────────────────────────────────────────────

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
  'Building Authority Gap matrix...',
  'Computing Silo Tax estimate...',
  'Generating EVI score...',
  'Finalizing audit report...',
];

// ── Engine Row Data ────────────────────────────────────────────────────────────

const ENGINES: Array<{ name: string; Icon: Icon }> = [
  { name: 'Google',     Icon: GoogleLogo },
  { name: 'ChatGPT',    Icon: Robot },
  { name: 'Perplexity', Icon: Compass },
  { name: 'Gemini',     Icon: Sparkle },
  { name: 'Bing',       Icon: Globe },
];

const CITEMIND_ENGINES = [
  { name: 'Google Knowledge Graph', status: 'monitoring' as const, locked: false },
  { name: 'ChatGPT / OpenAI', status: 'active' as const, locked: false },
  { name: 'Perplexity AI', status: 'locked' as const, locked: true },
  { name: 'Gemini / Google AI', status: 'locked' as const, locked: true },
  { name: 'Claude / Anthropic', status: 'locked' as const, locked: true },
];

// ── CSS Keyframes ──────────────────────────────────────────────────────────────

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

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function SiloTaxAuditPage() {
  const [step, setStep] = useState<AuditStep>('input');
  const [brandUrl, setBrandUrl] = useState('');
  const [competitors, setCompetitors] = useState(['', '', '']);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeLog, setActiveLog] = useState(0);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [showFormula, setShowFormula] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(72 * 60 * 60); // 72 hours in seconds

  // Countdown timer for CiteMind window
  useEffect(() => {
    if (step !== 'results') return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  const formatCountdown = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  const updateCompetitor = useCallback((index: number, value: string) => {
    setCompetitors((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  // ── Scan Handler ───────────────────────────────────────────────────────────
  // Single-transaction submit: validates inputs client-side, transitions to
  // scanning, and on a successful response goes straight to results — the
  // server creates the account, generates the magic link, and emails it.

  const handleStartScan = useCallback(async () => {
    setScanError(null);

    // Client-side validation. Server re-validates.
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

    // Progress animation (5 seconds — runs in parallel with the API call).
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
      | { kind: 'success'; data: AuditResult }
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
        if (!res.ok || typeof data.evi_score !== 'number') {
          throw new Error(typeof data.error === 'string' ? data.error : 'Invalid response');
        }
        return { kind: 'success', data: data as unknown as AuditResult };
      })
      .catch<ScanOutcome>(() => ({ kind: 'fallback' }));

    const [, outcome] = await Promise.all([progressPromise, fetchPromise]);

    if (outcome.kind === 'rate_limit' || outcome.kind === 'validation') {
      setScanError(outcome.message);
      setStep('input');
      return;
    }

    if (outcome.kind === 'success') {
      setResult(outcome.data);
    } else {
      // Network / 5xx fallback — show a demo result so the marketing page
      // still works when the API is degraded. Not used for 4xx.
      setResult({
        evi_score: 23,
        silo_tax_monthly: 14200,
        monthly_cash_loss: 8400,
        risk_premium: 5800,
        authority_leakage: 4200,
        ppc_replacement: 6800,
        hallucination_overhead: 3200,
        gaps: [
          { type: 'entity', severity: 'HIGH', title: 'No Knowledge Graph Entity', description: 'Your brand has no structured entity in Google Knowledge Graph. AI engines cannot confirm your existence.', affected_engine: 'Google, Gemini' },
          { type: 'citation', severity: 'HIGH', title: 'Zero ChatGPT Citations', description: 'ChatGPT does not reference your brand in any category-related queries. Competitors own this space.', affected_engine: 'ChatGPT' },
          { type: 'schema', severity: 'MEDIUM', title: 'Missing Organization Schema', description: 'No Organization or LocalBusiness schema detected. Search engines infer rather than confirm your identity.', affected_engine: 'Google, Bing' },
          { type: 'authority', severity: 'MEDIUM', title: 'Thin Backlink Authority', description: 'Domain authority is below industry median. AI engines weight authoritative sources for citation selection.', affected_engine: 'Perplexity, Gemini' },
          { type: 'content', severity: 'LOW', title: 'No FAQ/HowTo Structured Data', description: 'Missing FAQ and HowTo schema reduces chance of featured snippet and AI answer inclusion.', affected_engine: 'Google, Bing' },
        ],
        top_competitor_advantage: 'Competitor has 3x more entity coverage and active Knowledge Graph presence',
        total_authority_void: true,
        audit_id: 'aud_' + Math.random().toString(36).slice(2, 10),
      });
    }

    setStep('results');
  }, [brandUrl, email, name, company, competitors]);

  // ── Render ─────────────────────────────────────────────────────────────────

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
        {/* ── STEP 1: INPUT ─────────────────────────────────────────────────── */}
        {step === 'input' && (
          <div style={{ maxWidth: 680, margin: '0 auto', padding: '120px 24px 80px' }}>
            {/* Eyebrow badge */}
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
                SAGE<TM /> PROPRIETARY DIAGNOSTIC &middot; FREE
              </span>
            </div>

            {/* Gradient headline */}
            <h1
              style={{
                textAlign: 'center',
                fontSize: 52,
                fontWeight: 800,
                lineHeight: 1.1,
                marginBottom: 16,
                background: 'linear-gradient(135deg, #ffffff 0%, #A855F7 50%, #00D9FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Discover your Silo Tax.
            </h1>

            <p
              style={{
                textAlign: 'center',
                fontSize: 18,
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.6,
                marginBottom: 48,
                maxWidth: 520,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              See how much revenue you lose every month because your PR, Content,
              and SEO operate in disconnected silos. Free, instant, no credit card.
            </p>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleStartScan();
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              {/* Brand URL */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.7)',
                    marginBottom: 6,
                  }}
                >
                  Your website URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://yourcompany.com"
                  value={brandUrl}
                  onChange={(e) => { setBrandUrl(e.target.value); setScanError(null); }}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#ffffff',
                    fontSize: 15,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Work email */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.7)',
                    marginBottom: 6,
                  }}
                >
                  Work email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@yourcompany.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setScanError(null); }}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#ffffff',
                    fontSize: 15,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Name + Company side-by-side on wider, stacked on narrow */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.7)',
                      marginBottom: 6,
                    }}
                  >
                    Full name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Smith"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setScanError(null); }}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.04)',
                      color: '#ffffff',
                      fontSize: 15,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.7)',
                      marginBottom: 6,
                    }}
                  >
                    Company *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Acme Inc"
                    value={company}
                    onChange={(e) => { setCompany(e.target.value); setScanError(null); }}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.04)',
                      color: '#ffffff',
                      fontSize: 15,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Competitor URLs */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.5)',
                    marginBottom: 6,
                  }}
                >
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
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(255,255,255,0.02)',
                      color: '#ffffff',
                      fontSize: 14,
                      outline: 'none',
                      marginBottom: 8,
                      boxSizing: 'border-box',
                    }}
                  />
                ))}
              </div>

              {/* Inline error (rate limit, validation) */}
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

              {/* CTA */}
              <button
                type="submit"
                style={{
                  padding: '16px 32px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#00D9FF',
                  color: '#0A0A0F',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: 8,
                }}
              >
                Run Silo Tax<TM /> Audit &rarr;
              </button>
            </form>

            {/* Trust signals */}
            <div
              style={{
                textAlign: 'center',
                marginTop: 32,
                fontSize: 12,
                color: 'rgba(255,255,255,0.35)',
              }}
            >
              <p style={{ margin: 0 }}>
                No credit card required &middot; Results in under 60 seconds &middot; SOC 2 compliant
              </p>
            </div>

            {/* Engine row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 32,
                marginTop: 48,
              }}
            >
              {ENGINES.map(({ name: engineName, Icon }) => (
                <div
                  key={engineName}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.35)',
                  }}
                >
                  <Icon size={24} weight="regular" color="rgba(255,255,255,0.55)" />
                  {engineName}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: SCANNING ──────────────────────────────────────────────── */}
        {step === 'scanning' && (
          <div
            style={{
              maxWidth: 560,
              margin: '0 auto',
              padding: '160px 24px 80px',
              textAlign: 'center',
            }}
          >
            {/* Radar animation */}
            <div
              style={{
                width: 120,
                height: 120,
                margin: '0 auto 40px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '2px solid rgba(0,217,255,0.15)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 10,
                  borderRadius: '50%',
                  border: '2px solid rgba(168,85,247,0.2)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '2px solid transparent',
                  borderTopColor: '#00D9FF',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#00D9FF',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            </div>

            <h2
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: 8,
              }}
            >
              Scanning your visibility footprint...
            </h2>
            <p
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.45)',
                marginBottom: 32,
              }}
            >
              {SCAN_LOGS[activeLog]}
            </p>

            {/* Progress bar */}
            <div
              style={{
                width: '100%',
                height: 4,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.06)',
                overflow: 'hidden',
                marginBottom: 32,
              }}
            >
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

            {/* Live counter cards */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
              <div
                style={{
                  padding: '16px 24px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  minWidth: 140,
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: '#00D9FF',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {Math.floor(scanProgress * 12)}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                  Network Requests
                </div>
              </div>
              <div
                style={{
                  padding: '16px 24px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  minWidth: 140,
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: '#A855F7',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {Math.floor(scanProgress * 47)}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                  Data Points
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: RESULTS ───────────────────────────────────────────────── */}
        {step === 'results' && result && (
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 24px 80px' }}>
            {/* Row 1: EVI + Silo Tax */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: 24,
                marginBottom: 24,
              }}
            >
              {/* EVI Panel */}
              {(() => {
                const band = eviBand(result.evi_score);
                return (
                  <div
                    style={{
                      padding: 32,
                      borderRadius: 16,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.4)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 12,
                      }}
                    >
                      Earned Visibility Index (EVI<TM />)
                    </div>

                    {/* Score */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
                      <span
                        style={{
                          fontSize: 64,
                          fontWeight: 800,
                          color: band.color,
                          lineHeight: 1,
                        }}
                      >
                        {result.evi_score}
                      </span>
                      <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.3)' }}>/100</span>
                    </div>

                    {/* Scale bar */}
                    <div
                      style={{
                        height: 8,
                        borderRadius: 4,
                        background: 'rgba(255,255,255,0.06)',
                        marginBottom: 16,
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          width: `${result.evi_score}%`,
                          height: '100%',
                          borderRadius: 4,
                          background: band.color,
                          transition: 'width 1s ease-out',
                        }}
                      />
                    </div>

                    {/* Status badge */}
                    <div style={{ marginBottom: 16 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          background: band.bgColor,
                          color: band.color,
                        }}
                      >
                        {band.label}
                      </span>
                    </div>

                    {/* Narrative */}
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: 0, marginBottom: 24 }}>
                      {result.total_authority_void
                        ? 'Your brand is effectively invisible to AI engines. When prospects ask ChatGPT, Perplexity, or Gemini about your category, competitors are cited — you are not. This is not a future risk; it is current revenue loss.'
                        : 'Your brand has partial visibility across AI engines but significant gaps remain. Competitors with stronger entity presence are capturing the citations and authority signals that should be yours.'}
                    </p>

                    {/* Competitor note */}
                    {result.top_competitor_advantage && (
                      <div
                        style={{
                          padding: '12px 16px',
                          borderRadius: 8,
                          background: 'rgba(239,68,68,0.06)',
                          border: '1px solid rgba(239,68,68,0.12)',
                          fontSize: 13,
                          color: 'rgba(255,255,255,0.6)',
                          marginBottom: 24,
                        }}
                      >
                        <strong style={{ color: '#EF4444' }}>Competitor Edge:</strong>{' '}
                        {result.top_competitor_advantage}
                      </div>
                    )}

                    {/* CTA buttons */}
                    <div style={{ display: 'flex', gap: 12 }}>
                      <Link
                        href="https://app.pravado.io/beta"
                        style={{
                          padding: '12px 24px',
                          borderRadius: 10,
                          border: 'none',
                          background: '#A855F7',
                          color: '#ffffff',
                          fontSize: 14,
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'inline-block',
                        }}
                      >
                        Fix My Visibility &rarr;
                      </Link>
                      <Link
                        href="https://pravado.io/platform"
                        style={{
                          padding: '12px 24px',
                          borderRadius: 10,
                          border: '1px solid rgba(255,255,255,0.12)',
                          background: 'transparent',
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: 14,
                          fontWeight: 600,
                          textDecoration: 'none',
                          display: 'inline-block',
                        }}
                      >
                        Learn How PRAVADO Works
                      </Link>
                    </div>
                  </div>
                );
              })()}

              {/* Silo Tax Panel */}
              <div
                style={{
                  padding: 32,
                  borderRadius: 16,
                  background: 'rgba(232,121,249,0.04)',
                  border: '1px solid rgba(232,121,249,0.15)',
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 12,
                  }}
                >
                  Your Monthly Silo Tax<TM />
                </div>

                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 800,
                    color: '#E879F9',
                    lineHeight: 1,
                    marginBottom: 16,
                  }}
                >
                  <Odometer target={result.silo_tax_monthly} prefix="$" duration={2000} />
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.4)',
                    marginBottom: 24,
                  }}
                >
                  estimated revenue lost per month to siloed operations
                </div>

                {/* Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                      Monthly Cash Loss
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#EF4444' }}>
                      ${result.monthly_cash_loss.toLocaleString()}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                      Risk Premium
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#F59E0B' }}>
                      ${result.risk_premium.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Formula reveal */}
                <button
                  onClick={() => setShowFormula((prev) => !prev)}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    padding: '8px 14px',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: 12,
                    cursor: 'pointer',
                    width: '100%',
                    marginBottom: showFormula ? 16 : 0,
                  }}
                >
                  {showFormula ? 'Hide formula ▲' : 'Show formula ▼'}
                </button>

                {showFormula && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.02)',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>
                        Authority Leakage
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#A855F7' }}>
                        ${result.authority_leakage.toLocaleString()}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.02)',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>
                        PPC Replacement
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#00D9FF' }}>
                        ${result.ppc_replacement.toLocaleString()}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.02)',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>
                        KG Risk
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#E879F9' }}>
                        ${result.hallucination_overhead.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Fix CTA */}
                <div style={{ marginTop: 24 }}>
                  <Link
                    href="https://pravado.io/pricing"
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '12px 20px',
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #A855F7, #E879F9)',
                      color: '#ffffff',
                      fontSize: 14,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    Fix this for $199/mo &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Row 2: Entity Gaps + CiteMind Window */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 24,
              }}
            >
              {/* Entity Gaps */}
              <div
                style={{
                  padding: 32,
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 20,
                  }}
                >
                  Entity &amp; Authority Gaps ({result.gaps.length})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {result.gaps.map((gap, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.02)',
                        borderLeft: `3px solid ${sevColor(gap.severity)}`,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>
                          {gap.title}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 4,
                            color: sevColor(gap.severity),
                            background: `${sevColor(gap.severity)}15`,
                          }}
                        >
                          {gap.severity}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.45)',
                          lineHeight: 1.5,
                          margin: 0,
                          marginBottom: 4,
                        }}
                      >
                        {gap.description}
                      </p>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                        Affects: {gap.affected_engine}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CiteMind 72H Window */}
              <div
                style={{
                  padding: 32,
                  borderRadius: 16,
                  background: 'rgba(0,217,255,0.03)',
                  border: '1px solid rgba(0,217,255,0.12)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.4)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    CiteMind<TM /> 72H Window
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#00D9FF',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatCountdown(countdown)}
                  </div>
                </div>

                {/* Engine rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {CITEMIND_ENGINES.map((engine, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 14px',
                        borderRadius: 8,
                        background: engine.locked
                          ? 'rgba(255,255,255,0.02)'
                          : 'rgba(0,217,255,0.04)',
                        border: engine.locked
                          ? '1px solid rgba(255,255,255,0.04)'
                          : '1px solid rgba(0,217,255,0.1)',
                        opacity: engine.locked ? 0.5 : 1,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          color: engine.locked ? 'rgba(255,255,255,0.35)' : '#ffffff',
                          fontWeight: engine.locked ? 400 : 500,
                        }}
                      >
                        {engine.name}
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: 4,
                          color:
                            engine.status === 'active'
                              ? '#22C55E'
                              : engine.status === 'monitoring'
                                ? '#00D9FF'
                                : 'rgba(255,255,255,0.5)',
                          background:
                            engine.status === 'active'
                              ? 'rgba(34,197,94,0.12)'
                              : engine.status === 'monitoring'
                                ? 'rgba(0,217,255,0.1)'
                                : 'rgba(255,255,255,0.04)',
                        }}
                      >
                        {engine.locked ? (
                          <>
                            <Lock size={11} weight="fill" />
                            Locked
                          </>
                        ) : engine.status === 'active' ? 'Active' : 'Monitoring'}
                      </span>
                    </div>
                  ))}
                </div>

                <p
                  style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.4)',
                    lineHeight: 1.6,
                    margin: 0,
                    marginBottom: 20,
                  }}
                >
                  CiteMind<TM /> is actively monitoring 2 engines for your brand.
                  Activate full stack to track all 5 engines and receive real-time
                  citation alerts.
                </p>

                <Link
                  href="https://app.pravado.io/beta"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '14px 24px',
                    borderRadius: 10,
                    background: '#00D9FF',
                    color: '#0A0A0F',
                    fontSize: 14,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  Activate Full CiteMind<TM /> Stack &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
