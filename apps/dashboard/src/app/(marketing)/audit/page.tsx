'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  GoogleLogo,
  Robot,
  Compass,
  Sparkle,
  Globe,
  Newspaper,
  FileText,
  Brain,
  ArrowsHorizontal,
  ArrowRight,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

// ── Types ──────────────────────────────────────────────────────────────────────

type AuditStep = 'input' | 'scanning' | 'results';

// Mirror of apps/api/src/routes/siloTaxAudit/index.ts ScanResponse.
// Three-pillar EVI scorecard per docs/canon/DECISIONS_LOG.md D027.
type EVIBand = 'At Risk' | 'Emerging' | 'Competitive' | 'Dominant';
type PillarKey = 'pr' | 'content' | 'ai';
type EntryPath = 'pr' | 'content' | 'ai' | 'generic';
type Severity = 'high' | 'medium' | 'low';

interface PillarGap {
  title: string;
  description: string;
  severity: Severity;
  remediation: string;
}

interface PillarScore {
  score: number;
  band: EVIBand;
  signals: Record<string, string>;
  gaps: PillarGap[];
}

interface ScanResult {
  evi_score: number;
  evi_band: EVIBand;
  pillars: { pr: PillarScore; content: PillarScore; ai: PillarScore };
  variance: {
    spread: number;
    leading_pillar: PillarKey;
    lagging_pillar: PillarKey;
    orchestration_opportunity: string;
  };
  benchmark: {
    category_quartile: 1 | 2 | 3 | 4 | null;
    category_label: string | null;
  };
  scan_metadata: {
    brand_url: string;
    competitor_urls: string[];
    scanned_at: string;
    engines_consulted: string[];
  };
  magic_link_sent: boolean;
}

interface ScanResponse extends ScanResult {
  audit_id: string | null;
  org_id: string;
  trial_expires_at: string;
  entry_path: EntryPath;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function TM() {
  return <sup style={{ fontSize: '0.6em', verticalAlign: 'super' }}>&trade;</sup>;
}

function sevColor(severity: Severity): string {
  switch (severity) {
    case 'high': return '#EF4444';
    case 'medium': return '#F59E0B';
    case 'low': return '#22C55E';
  }
}

function sevLabel(severity: Severity): string {
  return severity.toUpperCase();
}

// Pillar-specific accent palette. Mapped from the marketing brand
// colors used elsewhere on pravado.io: PR pillar inherits the magenta
// CiteMind accent (PR's earned-media work feeds the citation graph),
// Content uses the iris SAGE accent (strategy/authority infrastructure),
// AI Citation uses the cyan CRAFT accent (the execution layer that
// drives AI engine surface presence).
const PILLAR_CONFIG: Record<PillarKey, { label: string; accent: string; bgAccent: string; Icon: Icon }> = {
  pr:      { label: 'PR Authority',          accent: '#E879F9', bgAccent: 'rgba(232,121,249,0.10)', Icon: Newspaper },
  content: { label: 'Content Authority',     accent: '#A855F7', bgAccent: 'rgba(168,85,247,0.10)',  Icon: FileText  },
  ai:      { label: 'AI Citation Authority', accent: '#00D9FF', bgAccent: 'rgba(0,217,255,0.10)',   Icon: Brain     },
};

// Pillar order shown to the user is determined by entry_path so the
// buyer sees their entry-pillar first. Variance section renders after
// all three pillars regardless of order.
function pillarOrder(entryPath: EntryPath): PillarKey[] {
  switch (entryPath) {
    case 'pr':      return ['pr', 'content', 'ai'];
    case 'content': return ['content', 'pr', 'ai'];
    case 'ai':      return ['ai', 'pr', 'content'];
    case 'generic':
    default:        return ['pr', 'content', 'ai'];
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
  'Computing earned visibility breakdown...',
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

// ── Fallback result for degraded API ───────────────────────────────────────────
// Mid-band three-pillar shape so the marketing page still renders if /api/audit/scan
// fails. Never reached for 4xx — only for network errors / 5xx.

function buildFallbackResult(): ScanResponse {
  return {
    evi_score: 52,
    evi_band: 'Emerging',
    pillars: {
      pr: {
        score: 50,
        band: 'Emerging',
        signals: { earned_media_frequency: 'Limited surfaced press archive on homepage; few named-spokesperson quotes detected.' },
        gaps: [
          { title: 'No named-spokesperson coverage detected', description: 'Brand mentions are organization-level, not person-attributed. Citation graphs weight named-quote coverage more heavily.', severity: 'medium', remediation: 'CRAFT operationalizes named-spokesperson positioning across the pitch pipeline with weekly journalist briefs.' },
          { title: 'Press archive not surfaced', description: 'No /press or /news section detected. Without surfaced earned coverage, AI engines cannot infer authority transfer.', severity: 'medium', remediation: 'CRAFT routes a structured press archive build with schema-marked authority signals.' },
        ],
      },
      content: {
        score: 55,
        band: 'Emerging',
        signals: { topical_coverage: 'Surface content covers product features, not category authority hubs.' },
        gaps: [
          { title: 'Topic-cluster gaps in primary category', description: 'No deep-coverage hubs detected for strategic topics. Authority infrastructure requires hub-and-spoke topic ownership.', severity: 'high', remediation: 'CRAFT generates topic-pillar content with structured FAQ and HowTo schema, governed by CiteMind for AEO citation worthiness.' },
        ],
      },
      ai: {
        score: 48,
        band: 'Emerging',
        signals: { citation_rate_estimate: 'Buyer-intent queries surface category leaders, not this brand.' },
        gaps: [
          { title: 'Buyer-intent queries surface competitors', description: 'Representative buyer questions in category cite competitors, not this brand. Engines learn category leadership from training data and crawl signals.', severity: 'high', remediation: 'CRAFT runs CiteMind\'s share-of-model program: weekly query monitoring, entity disambiguation, orchestrated content + PR pushes.' },
        ],
      },
    },
    variance: {
      spread: 7,
      leading_pillar: 'content',
      lagging_pillar: 'ai',
      orchestration_opportunity: 'Pillar scores are close enough that no single discipline is the obvious culprit. The compounding loop is broken: PR mentions are not echoing into AI answers, and content pieces are not being cited as supporting evidence.',
    },
    benchmark: { category_quartile: null, category_label: null },
    scan_metadata: {
      brand_url: '',
      competitor_urls: [],
      scanned_at: new Date().toISOString(),
      engines_consulted: ['ChatGPT', 'Perplexity', 'Gemini', 'Claude', 'Bing Copilot'],
    },
    magic_link_sent: false,
    audit_id: null,
    org_id: '',
    trial_expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    entry_path: 'generic',
  };
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [step, setStep] = useState<AuditStep>('input');
  const [brandUrl, setBrandUrl] = useState('');
  const [competitors, setCompetitors] = useState(['', '', '']);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeLog, setActiveLog] = useState(0);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);

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
        // /audit is the neutral, three-pillar-balanced entry. Sub-pages
        // /audit/pr, /audit/content, /audit/ai (Phase 1C/1D) override.
        entry_path: 'generic' as EntryPath,
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
      setStep('input');
      return;
    }

    if (outcome.kind === 'success') {
      setResult(outcome.data);
    } else {
      // Network / 5xx fallback — three-pillar demo so the marketing page
      // still works when the API is degraded. Not used for 4xx.
      setResult(buildFallbackResult());
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
                Get my EVI<TM /> scorecard &rarr;
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
        {/* Three-pillar EVI scorecard. Pillar order responds to entry_path     */}
        {/* (PR / Content / AI / generic) so the buyer sees their entry-pillar  */}
        {/* first; variance section always renders after all three pillars.    */}
        {step === 'results' && result && (() => {
          const band = eviBand(result.evi_score);
          const order = pillarOrder(result.entry_path);
          const variance = result.variance;
          const benchmark = result.benchmark;
          const leadingConfig = PILLAR_CONFIG[variance.leading_pillar];
          const laggingConfig = PILLAR_CONFIG[variance.lagging_pillar];
          const leadingScore = result.pillars[variance.leading_pillar].score;
          const laggingScore = result.pillars[variance.lagging_pillar].score;
          const quartileLabel = (q: 1 | 2 | 3 | 4): string => (
            q === 1 ? 'Top quartile' :
            q === 2 ? '2nd quartile' :
            q === 3 ? '3rd quartile' :
            'Bottom quartile'
          );

          return (
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 24px 80px' }}>

              {/* ── EVI hero ──────────────────────────────────────────── */}
              <div
                style={{
                  padding: 40,
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  marginBottom: 24,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 16,
                  }}
                >
                  Earned Visibility Index (EVI<TM />)
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'center',
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <span
                    style={{
                      fontSize: 96,
                      fontWeight: 800,
                      color: band.color,
                      lineHeight: 1,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {result.evi_score}
                  </span>
                  <span style={{ fontSize: 32, color: 'rgba(255,255,255,0.3)' }}>/100</span>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '6px 16px',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      background: band.bgColor,
                      color: band.color,
                    }}
                  >
                    {result.evi_band}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.45)',
                    lineHeight: 1.6,
                    margin: 0,
                    marginBottom: benchmark.category_quartile ? 16 : 0,
                    maxWidth: 560,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                  }}
                >
                  Composite of three pillars &mdash; weighted PR Authority &times; 0.40,
                  Content Authority &times; 0.35, AI Citation Authority &times; 0.25.
                </p>

                {benchmark.category_quartile && benchmark.category_label && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 14px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.65)',
                    }}
                  >
                    {quartileLabel(benchmark.category_quartile)} for {benchmark.category_label}
                  </div>
                )}
              </div>

              {/* ── Three pillar cards (ordered by entry_path) ────────── */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                {order.map((key) => {
                  const pillar = result.pillars[key];
                  const config = PILLAR_CONFIG[key];
                  const PillarIcon = config.Icon;
                  const pillarBand = eviBand(pillar.score);
                  const topGaps = pillar.gaps.slice(0, 3);
                  return (
                    <div
                      key={key}
                      style={{
                        padding: 24,
                        borderRadius: 12,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderTop: `2px solid ${config.accent}`,
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      {/* Pillar header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: config.bgAccent,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <PillarIcon size={18} weight="regular" color={config.accent} />
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>
                          {config.label}
                        </div>
                      </div>

                      {/* Score + band */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                        <span
                          style={{
                            fontSize: 40,
                            fontWeight: 800,
                            color: config.accent,
                            lineHeight: 1,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {pillar.score}
                        </span>
                        <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }}>/100</span>
                      </div>

                      <div style={{ marginBottom: 20 }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            background: pillarBand.bgColor,
                            color: pillarBand.color,
                          }}
                        >
                          {pillar.band}
                        </span>
                      </div>

                      {/* Top gaps */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {topGaps.map((gap, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '12px 14px',
                              borderRadius: 8,
                              background: 'rgba(255,255,255,0.02)',
                              borderLeft: `3px solid ${sevColor(gap.severity)}`,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                gap: 8,
                                marginBottom: 6,
                              }}
                            >
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', lineHeight: 1.35 }}>
                                {gap.title}
                              </span>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: 3,
                                  letterSpacing: '0.04em',
                                  color: sevColor(gap.severity),
                                  background: `${sevColor(gap.severity)}1A`,
                                  flexShrink: 0,
                                }}
                              >
                                {sevLabel(gap.severity)}
                              </span>
                            </div>
                            <p
                              style={{
                                fontSize: 12,
                                color: 'rgba(255,255,255,0.5)',
                                lineHeight: 1.5,
                                margin: 0,
                                marginBottom: 8,
                              }}
                            >
                              {gap.description}
                            </p>
                            <div
                              style={{
                                fontSize: 11,
                                color: 'rgba(255,255,255,0.55)',
                                lineHeight: 1.5,
                                paddingTop: 8,
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                              }}
                            >
                              <span style={{ color: config.accent, fontWeight: 600 }}>Pravado would: </span>
                              {gap.remediation}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Variance section (always after all three pillars) ─── */}
              <div
                style={{
                  padding: 32,
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 20,
                  }}
                >
                  <ArrowsHorizontal size={14} weight="bold" color="rgba(255,255,255,0.4)" />
                  The orchestration opportunity
                </div>

                {/* Spread bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ minWidth: 120, textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
                      Lagging
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: laggingConfig.accent }}>
                      {laggingConfig.label}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}>
                      {laggingScore}
                    </div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: 8,
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.06)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${Math.min(Math.max(variance.spread, 4), 100)}%`,
                        borderRadius: 4,
                        background: `linear-gradient(90deg, ${laggingConfig.accent}, ${leadingConfig.accent})`,
                      }}
                    />
                  </div>
                  <div style={{ minWidth: 120 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
                      Leading
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: leadingConfig.accent }}>
                      {leadingConfig.label}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}>
                      {leadingScore}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.5)',
                    marginBottom: 20,
                  }}
                >
                  Spread: {variance.spread} points
                </div>

                <p
                  style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.7)',
                    lineHeight: 1.7,
                    margin: 0,
                    maxWidth: 720,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    textAlign: 'center',
                  }}
                >
                  {variance.orchestration_opportunity}
                </p>
              </div>

              {/* ── CTAs ─────────────────────────────────────────────── */}
              {/* No dollar figures, no upgrade pitch with a number per D027.   */}
              {/* Primary: book a sales conversation. Secondary: open the      */}
              {/* dashboard via the magic link already in the user's email.   */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <Link
                  href="https://pravado.io/contact"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '14px 28px',
                    borderRadius: 10,
                    background: '#00D9FF',
                    color: '#0A0A0F',
                    fontSize: 15,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  Book a call
                  <ArrowRight size={16} weight="bold" />
                </Link>
                <Link
                  href="https://app.pravado.io/login"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '14px 28px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: 15,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Save to dashboard
                </Link>
              </div>

              {/* Magic-link reassurance */}
              {result.magic_link_sent && (
                <p
                  style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.4)',
                    textAlign: 'center',
                    marginTop: 20,
                    marginBottom: 0,
                  }}
                >
                  We&apos;ve emailed you a magic link to access this scorecard from your dashboard anytime.
                </p>
              )}
            </div>
          );
        })()}
      </div>
    </>
  );
}
