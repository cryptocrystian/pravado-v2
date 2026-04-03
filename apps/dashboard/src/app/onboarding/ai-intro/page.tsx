'use client';

/**
 * AI-Led Onboarding — v3 (Sprint S-INT-07)
 *
 * Activation-critical 7-step wizard:
 *   1. brand        — Company name, domain, industry, company_size → creates org
 *   2. gsc          — Connect Google Search Console (optional, skip allowed)
 *   3. competitors  — Add 1–5 competitor domains
 *   4. journalists  — Add key journalists (optional, skip allowed)
 *   5. content      — Paste existing content URLs (optional, skip allowed)
 *   6. activation   — Progress screen: EVI snapshot + SAGE signal scan
 *   7. proposals    — Show first real SAGE proposals → enter dashboard
 *
 * Exit criteria: fresh org gets real EVI score + real SAGE proposals within 10 minutes.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { track, Events, identifyUser } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

// ============================================
// TYPES
// ============================================

type Step = 'brand' | 'gsc' | 'competitors' | 'journalists' | 'content' | 'activation' | 'proposals';

interface BrandForm {
  name: string;
  domain: string;
  industry: string;
  company_size: string;
}

interface Competitor {
  domain: string;
  name: string;
}

interface Journalist {
  name: string;
  email: string;
  outlet_name: string;
  beat: string;
}

// ============================================
// STEP CONFIG
// ============================================

const STEPS: Step[] = ['brand', 'gsc', 'competitors', 'journalists', 'content', 'activation', 'proposals'];

const STEP_LABELS: Record<Step, string> = {
  brand: 'Brand Setup',
  gsc: 'Search Console',
  competitors: 'Competitors',
  journalists: 'Journalists',
  content: 'Content',
  activation: 'SAGE Activation',
  proposals: 'Your Proposals',
};

const AI_MESSAGES: Record<Step, string> = {
  brand: "Let's set up your brand profile. This seeds your media monitoring, competitive intelligence, and the EVI scoring engine.",
  gsc: "Connect Google Search Console to pull real keyword data. This powers your SEO intelligence and SAGE recommendations.",
  competitors: "Add your top competitors. I'll track their visibility, coverage, and AI citations against yours.",
  journalists: "Add journalists you already work with. I'll enrich their profiles with verified contact data and track engagement.",
  content: "Paste URLs of your existing content. I'll index them, score with CiteMind, and use them for SAGE recommendations.",
  activation: "Running SAGE activation. Calculating your first EVI score and generating personalized proposals based on everything you've provided.",
  proposals: "Your first SAGE proposals are ready. These are prioritized actions based on your competitive position and goals.",
};

// ============================================
// INDUSTRIES & SIZES
// ============================================

const INDUSTRIES = [
  'B2B SaaS', 'Enterprise Software', 'FinTech', 'HealthTech', 'E-Commerce',
  'Consumer Tech', 'Professional Services', 'Media & Publishing', 'Cybersecurity',
  'AI / ML', 'Developer Tools', 'Marketing & AdTech', 'Other',
];

const COMPANY_SIZES = [
  '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+',
];

// ============================================
// ICONS
// ============================================

function ArrowRight() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>; }
function CheckIcon()  { return <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>; }
function LightningIcon() { return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>; }
function PlusIcon()   { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>; }
function XIcon()      { return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>; }
function LinkIcon()   { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>; }

// ============================================
// AI DOT
// ============================================

function AIDot({ pulse = false, size = 'sm' }: { pulse?: boolean; size?: 'sm' | 'md' }) {
  const sz = size === 'md' ? 'w-3 h-3' : 'w-2 h-2';
  return <span className={`${sz} rounded-full bg-brand-cyan shrink-0 ${pulse ? 'animate-pulse' : ''}`} />;
}

// ============================================
// PROGRESS STEPPER
// ============================================

function Stepper({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300 ${
            i < current  ? 'bg-semantic-success text-white' :
            i === current ? 'bg-brand-iris text-white' :
            'bg-slate-3 border border-slate-4 text-white/25'
          }`}>
            {i < current ? <CheckIcon /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`w-5 h-px transition-colors duration-300 ${i < current ? 'bg-semantic-success/50' : 'bg-slate-4'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// AI MESSAGE BUBBLE
// ============================================

function AIBubble({ text, typing }: { text: string; typing: boolean }) {
  return (
    <div className="border-l-2 border-brand-cyan bg-slate-2/60 border border-slate-4 rounded-xl p-4 mb-8">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center shrink-0">
          <AIDot size="md" pulse={typing} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-cyan">Pravado AI</span>
            {typing && <span className="text-[11px] text-white/30 animate-pulse">thinking...</span>}
          </div>
          <p className="text-[14px] text-white/80 leading-relaxed">
            {text}
            {typing && <span className="animate-pulse ml-0.5 text-brand-cyan">|</span>}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SHARED COMPONENTS
// ============================================

function Field({
  label, hint, value, onChange, placeholder, type = 'text', required = false,
}: {
  label: string; hint?: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-white/80 mb-1.5">{label}</label>
      {hint && <p className="text-[12px] text-white/40 mb-2">{hint}</p>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 bg-slate-2 border border-slate-4 rounded-xl text-white text-[14px] placeholder:text-white/20 focus:outline-none focus:border-brand-iris/50 focus:ring-1 focus:ring-brand-iris/20 transition-colors"
      />
    </div>
  );
}

function PrimaryBtn({
  children, onClick, disabled = false, type = 'button', loading = false,
}: {
  children: React.ReactNode; onClick?: () => void;
  disabled?: boolean; type?: 'button' | 'submit'; loading?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className="inline-flex items-center gap-2 px-8 py-3 bg-brand-iris text-white text-[14px] font-semibold rounded-xl hover:bg-brand-iris/90 shadow-[0_0_20px_rgba(139,92,246,0.25)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-150"
    >
      {loading ? <><AIDot pulse size="md" /><span>Working...</span></> : children}
    </button>
  );
}

function SkipBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[13px] text-white/35 hover:text-white/55 transition-colors"
    >
      Skip for now
    </button>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function AIIntroPage() {
  const router = useRouter();

  // Step state
  const [step, setStep] = useState<Step>('brand');
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setOrgId] = useState<string | null>(null);

  // Brand form
  const [brand, setBrand] = useState<BrandForm>({
    name: '', domain: '', industry: '', company_size: '',
  });

  // Competitors
  const [competitors, setCompetitors] = useState<Competitor[]>([
    { domain: '', name: '' },
  ]);

  // Journalists
  const [journalists, setJournalists] = useState<Journalist[]>([
    { name: '', email: '', outlet_name: '', beat: '' },
  ]);

  // Content URLs
  const [contentUrls, setContentUrls] = useState<string[]>(['']);

  // Activation state
  const [activationPhase, setActivationPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [activationLabel, setActivationLabel] = useState('Initializing...');
  const [completionFailed, setCompletionFailed] = useState(false);
  const [eviScore, setEviScore] = useState<number | null>(null);

  // Proposals state
  const [proposals, setProposals] = useState<Array<{ id: string; title: string; pillar: string; impact: string; rationale: string }>>([]);

  const stepIndex = STEPS.indexOf(step);

  // ── Typewriter effect ──────────────────────────────────────
  useEffect(() => {
    const msg = AI_MESSAGES[step];
    setTypedText('');
    setIsTyping(true);
    let i = 0;
    const iv = setInterval(() => {
      if (i < msg.length) { setTypedText(msg.slice(0, ++i)); }
      else { clearInterval(iv); setIsTyping(false); }
    }, 16);
    return () => clearInterval(iv);
  }, [step]);

  // ── Resume from saved step ─────────────────────────────────
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/onboarding/status');
        const json = await res.json();
        if (json.success && json.data?.has_org) {
          setOrgId(json.data.org_id);
          setBrand({
            name: json.data.org_name || '',
            domain: json.data.domain || '',
            industry: json.data.industry || '',
            company_size: json.data.company_size || '',
          });
          // If completed, redirect to dashboard
          if (json.data.completed) {
            router.replace('/app/command-center');
            return;
          }
          // Resume at saved step
          const savedStep = json.data.onboarding_step ?? 0;
          if (savedStep > 0 && savedStep < STEPS.length) {
            setStep(STEPS[savedStep]);
          }
        }
      } catch {
        // No saved progress — start fresh
      }
    }
    checkStatus();
  }, [router]);

  // ── Navigation ─────────────────────────────────────────────
  function goNext() {
    const n = STEPS[stepIndex + 1];
    if (n) setStep(n);
  }
  function goBack() {
    const p = STEPS[stepIndex - 1];
    if (p) setStep(p);
  }

  async function updateStep(nextStep: number, skipped = false) {
    try {
      await fetch('/api/onboarding/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: nextStep, skipped }),
      });
      // Track step completion (S-INT-08)
      if (skipped) {
        track(Events.ONBOARDING_STEP_SKIPPED, { step: nextStep, step_name: STEPS[nextStep] });
      } else {
        track(Events.ONBOARDING_STEP_COMPLETED, { step: nextStep, step_name: STEPS[nextStep] });
      }
    } catch {
      // Non-critical, continue
    }
  }

  // ── Step 1: Brand Setup ────────────────────────────────────
  async function handleBrandSubmit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/onboarding/brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brand),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Failed to save brand');
      setOrgId(json.data.org_id);
      identifyUser(json.data.org_id, { org_name: brand.name, industry: brand.industry });
      await updateStep(1);
      goNext();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // ── Step 2: GSC (skip-allowed) ─────────────────────────────
  async function handleGscSkip() {
    await updateStep(2, true);
    goNext();
  }

  // ── Step 3: Competitors ────────────────────────────────────
  async function handleCompetitorsSave() {
    setSaving(true);
    setError(null);
    try {
      const valid = competitors.filter((c) => c.domain.trim());
      if (valid.length === 0) {
        await updateStep(3, true);
        goNext();
        return;
      }
      const res = await fetch('/api/onboarding/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitors: valid }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Failed to save competitors');
      await updateStep(3);
      goNext();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // ── Step 4: Journalists ────────────────────────────────────
  async function handleJournalistsSave() {
    setSaving(true);
    setError(null);
    try {
      const valid = journalists.filter((j) => j.name.trim());
      if (valid.length === 0) {
        await updateStep(4, true);
        goNext();
        return;
      }
      const res = await fetch('/api/onboarding/journalists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journalists: valid }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Failed to save journalists');
      await updateStep(4);
      goNext();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // ── Step 5: Content ────────────────────────────────────────
  async function handleContentSave() {
    setSaving(true);
    setError(null);
    try {
      const valid = contentUrls.filter((u) => u.trim());
      if (valid.length === 0) {
        await updateStep(5, true);
        goNext();
        return;
      }
      const res = await fetch('/api/onboarding/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: valid }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Failed to save content');
      await updateStep(5);
      goNext();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // ── Step 6: SAGE Activation ────────────────────────────────
  const runActivation = useCallback(async () => {
    if (activationPhase !== 'idle') return;
    setActivationPhase('running');

    const labels = [
      'Initializing SAGE engine...',
      'Calculating Earned Visibility Index...',
      'Scanning for SEO signals...',
      'Analyzing PR intelligence...',
      'Evaluating content authority...',
      'Generating SAGE proposals...',
      'Finalizing your activation...',
    ];

    let li = 0;
    const labelIv = setInterval(() => {
      li = Math.min(li + 1, labels.length - 1);
      setActivationLabel(labels[li]);
    }, 1200);

    try {
      // Trigger activation
      await fetch('/api/onboarding/activate', { method: 'POST' });

      // Poll EVI score
      let score: number | null = null;
      for (let attempt = 0; attempt < 12; attempt++) {
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const eviRes = await fetch('/api/evi/current');
          const eviJson = await eviRes.json();
          if (eviJson.success && eviJson.data?.score != null) {
            score = eviJson.data.score;
            break;
          }
        } catch {
          // Keep polling
        }
      }

      setEviScore(score ?? 0);

      // Mark onboarding complete — retry up to 3 times since this is the critical gate
      let completed = false;
      for (let retry = 0; retry < 3 && !completed; retry++) {
        try {
          const completeRes = await fetch('/api/onboarding/complete', { method: 'POST' });
          const completeJson = await completeRes.json();
          if (completeRes.ok && completeJson.success) {
            completed = true;
            console.log('[Onboarding] Completion confirmed');
          } else {
            console.warn('[Onboarding] Completion attempt failed:', completeJson.error?.message);
            if (retry < 2) await new Promise((r) => setTimeout(r, 1000));
          }
        } catch (completeErr) {
          console.warn('[Onboarding] Completion network error, retry', retry + 1, completeErr);
          if (retry < 2) await new Promise((r) => setTimeout(r, 1000));
        }
      }

      if (!completed) {
        console.error('[Onboarding] Failed to mark onboarding complete after 3 attempts');
        setCompletionFailed(true);
      }

      // Fetch SAGE proposals
      try {
        const sageRes = await fetch('/api/command-center/action-stream');
        const sageJson = await sageRes.json();
        if (sageJson.success && Array.isArray(sageJson.data?.actions)) {
          setProposals(
            sageJson.data.actions.slice(0, 5).map((a: Record<string, unknown>) => ({
              id: (a.id as string) || String(Math.random()),
              title: (a.title as string) || 'Untitled action',
              pillar: (a.pillar as string) || 'Cross-Pillar',
              impact: (a.impact as string) || 'Medium',
              rationale: (a.rationale as string) || '',
            }))
          );
        }
      } catch {
        // No proposals available yet
      }

      clearInterval(labelIv);
      setActivationPhase('done');
      await updateStep(6);
      // Track onboarding completion (S-INT-08)
      track(Events.ONBOARDING_COMPLETED, {
        evi_score: score ?? 0,
        proposal_count: proposals.length,
      });
    } catch {
      clearInterval(labelIv);
      // Still attempt to mark complete even if activation/polling failed
      try {
        const completeRes = await fetch('/api/onboarding/complete', { method: 'POST' });
        const completeJson = await completeRes.json();
        if (completeRes.ok && completeJson.success) {
          console.log('[Onboarding] Completion confirmed (fallback)');
        }
      } catch {
        console.error('[Onboarding] Fallback completion also failed');
      }
      setActivationPhase('done');
    }
  }, [activationPhase]);

  useEffect(() => {
    if (step === 'activation') {
      runActivation();
    }
  }, [step, runActivation]);

  // ── Helpers ────────────────────────────────────────────────
  function addCompetitor() {
    if (competitors.length < 5) {
      setCompetitors([...competitors, { domain: '', name: '' }]);
    }
  }
  function removeCompetitor(i: number) {
    setCompetitors(competitors.filter((_, idx) => idx !== i));
  }
  function updateCompetitor(i: number, field: keyof Competitor, v: string) {
    setCompetitors(competitors.map((c, idx) => idx === i ? { ...c, [field]: v } : c));
  }

  function addJournalist() {
    if (journalists.length < 10) {
      setJournalists([...journalists, { name: '', email: '', outlet_name: '', beat: '' }]);
    }
  }
  function removeJournalist(i: number) {
    setJournalists(journalists.filter((_, idx) => idx !== i));
  }
  function updateJournalist(i: number, field: keyof Journalist, v: string) {
    setJournalists(journalists.map((j, idx) => idx === i ? { ...j, [field]: v } : j));
  }

  function addContentUrl() {
    if (contentUrls.length < 10) {
      setContentUrls([...contentUrls, '']);
    }
  }
  function removeContentUrl(i: number) {
    setContentUrls(contentUrls.filter((_, idx) => idx !== i));
  }

  const pillarColor: Record<string, string> = {
    PR: 'text-brand-magenta',
    Content: 'text-brand-iris',
    SEO: 'text-brand-teal',
    'Cross-Pillar': 'text-white/60',
  };

  const pillarBg: Record<string, string> = {
    PR: 'bg-brand-magenta/8 border-brand-magenta/20',
    Content: 'bg-brand-iris/8 border-brand-iris/20',
    SEO: 'bg-brand-teal/8 border-brand-teal/20',
    'Cross-Pillar': 'bg-slate-3 border-slate-4',
  };

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-slate-0">
      {/* Ambient gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 20% 10%, rgba(139,92,246,0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 90%, rgba(0,217,255,0.08) 0%, transparent 50%)' }}
      />

      <div className="relative min-h-screen flex flex-col">

        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[18px] font-bold text-white tracking-tight">Pravado</span>
            <AIDot pulse={isTyping} />
          </div>
          <div className="flex items-center gap-4">
            {stepIndex > 0 && step !== 'activation' && step !== 'proposals' && (
              <button type="button" onClick={goBack} className="text-[13px] text-white/35 hover:text-white/65 transition-colors">
                &larr; Back
              </button>
            )}
            <span className="text-[12px] text-white/25">{STEP_LABELS[step]}</span>
            <button
              type="button"
              onClick={() => {
                fetch('/api/auth/signout', { method: 'POST' }).then(() => {
                  window.location.href = '/login';
                });
              }}
              className="text-[12px] text-white/25 hover:text-white/50 transition-colors ml-2"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Progress */}
        <div className="px-8 mb-8 shrink-0">
          <Stepper current={stepIndex} total={STEPS.length} />
        </div>

        {/* Content */}
        <main className="flex-1 flex items-start justify-center px-6 pb-16">
          <div className="w-full max-w-[900px]">

            {/* AI bubble */}
            <AIBubble text={typedText} typing={isTyping} />

            {/* Error banner */}
            {error && (
              <div className="bg-semantic-danger/8 border border-semantic-danger/25 rounded-xl px-4 py-3 mb-6">
                <p className="text-[13px] text-semantic-danger">{error}</p>
              </div>
            )}

            {/* ── Step 1: Brand Setup ── */}
            {step === 'brand' && (
              <div className="max-w-lg mx-auto space-y-5">
                <h2 className="text-[24px] font-bold text-white mb-6">Set up your brand</h2>
                <Field
                  label="Company Name"
                  hint="This is your organization name in Pravado."
                  value={brand.name}
                  onChange={(v) => setBrand((f) => ({ ...f, name: v }))}
                  placeholder="e.g., Acme Corporation"
                  required
                />
                <Field
                  label="Domain"
                  hint="Used to scan existing coverage and calculate your EVI score."
                  value={brand.domain}
                  onChange={(v) => setBrand((f) => ({ ...f, domain: v }))}
                  placeholder="e.g., acme.com"
                />
                <div>
                  <label className="block text-[13px] font-semibold text-white/80 mb-2">Industry</label>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRIES.map((ind) => (
                      <button
                        key={ind}
                        type="button"
                        onClick={() => setBrand((f) => ({ ...f, industry: ind }))}
                        className={`px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-all duration-150 ${
                          brand.industry === ind
                            ? 'bg-brand-iris/15 border-brand-iris/40 text-brand-iris'
                            : 'bg-slate-2 border-slate-4 text-white/50 hover:border-slate-5 hover:text-white/75'
                        }`}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-white/80 mb-2">Company Size</label>
                  <div className="flex flex-wrap gap-2">
                    {COMPANY_SIZES.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setBrand((f) => ({ ...f, company_size: sz }))}
                        className={`px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-all duration-150 ${
                          brand.company_size === sz
                            ? 'bg-brand-iris/15 border-brand-iris/40 text-brand-iris'
                            : 'bg-slate-2 border-slate-4 text-white/50 hover:border-slate-5 hover:text-white/75'
                        }`}
                      >
                        {sz} employees
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-2 flex justify-center">
                  <PrimaryBtn onClick={handleBrandSubmit} disabled={!brand.name.trim()} loading={saving}>
                    Continue <ArrowRight />
                  </PrimaryBtn>
                </div>
              </div>
            )}

            {/* ── Step 2: Connect GSC ── */}
            {step === 'gsc' && (
              <div className="max-w-lg mx-auto">
                <h2 className="text-[24px] font-bold text-white mb-2">Connect Google Search Console</h2>
                <p className="text-[14px] text-white/40 mb-8">
                  Real keyword data makes your EVI score and SAGE proposals significantly more accurate.
                </p>

                <div className="bg-slate-2 border border-slate-4 rounded-xl p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center">
                      <LinkIcon />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-white/90">Google Search Console</p>
                      <p className="text-[12px] text-white/40">Keyword rankings, impressions, CTR</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/integrations/gsc/auth-url');
                        const json = await res.json();
                        if (json.success && json.data?.url) {
                          window.location.href = json.data.url;
                        }
                      } catch {
                        setError('Failed to start GSC connection');
                      }
                    }}
                    className="w-full px-4 py-3 bg-brand-teal/10 border border-brand-teal/30 text-brand-teal text-[14px] font-semibold rounded-xl hover:bg-brand-teal/15 transition-colors"
                  >
                    Connect Google Search Console
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <SkipBtn onClick={handleGscSkip} />
                  <PrimaryBtn onClick={async () => { await updateStep(2); goNext(); }}>
                    Continue <ArrowRight />
                  </PrimaryBtn>
                </div>
              </div>
            )}

            {/* ── Step 3: Competitors ── */}
            {step === 'competitors' && (
              <div className="max-w-lg mx-auto">
                <h2 className="text-[24px] font-bold text-white mb-2">Add your top competitors</h2>
                <p className="text-[14px] text-white/40 mb-6">
                  I'll track their visibility, coverage, and AI citations against yours.
                </p>

                <div className="space-y-3 mb-6">
                  {competitors.map((comp, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-3 border border-slate-4 flex items-center justify-center text-[11px] font-bold text-white/40 shrink-0">{i + 1}</span>
                      <input
                        type="text"
                        value={comp.domain}
                        onChange={(e) => updateCompetitor(i, 'domain', e.target.value)}
                        placeholder="competitor.com"
                        className="flex-1 px-3 py-2.5 bg-slate-2 border border-slate-4 rounded-xl text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-brand-iris/50 transition-colors"
                      />
                      <input
                        type="text"
                        value={comp.name}
                        onChange={(e) => updateCompetitor(i, 'name', e.target.value)}
                        placeholder="Name (optional)"
                        className="w-36 px-3 py-2.5 bg-slate-2 border border-slate-4 rounded-xl text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-brand-iris/50 transition-colors"
                      />
                      {competitors.length > 1 && (
                        <button type="button" onClick={() => removeCompetitor(i)} className="text-white/25 hover:text-white/50 shrink-0">
                          <XIcon />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {competitors.length < 5 && (
                  <button
                    type="button"
                    onClick={addCompetitor}
                    className="flex items-center gap-2 text-[13px] text-white/40 hover:text-white/60 mb-8 transition-colors"
                  >
                    <PlusIcon /> Add another competitor
                  </button>
                )}

                <div className="flex items-center justify-between">
                  <SkipBtn onClick={async () => { await updateStep(3, true); goNext(); }} />
                  <PrimaryBtn onClick={handleCompetitorsSave} loading={saving} disabled={!competitors.some((c) => c.domain.trim())}>
                    Save & Continue <ArrowRight />
                  </PrimaryBtn>
                </div>
              </div>
            )}

            {/* ── Step 4: Journalists ── */}
            {step === 'journalists' && (
              <div className="max-w-2xl mx-auto">
                <h2 className="text-[24px] font-bold text-white mb-2">Add key journalists</h2>
                <p className="text-[14px] text-white/40 mb-6">
                  Add journalists you already work with. I'll enrich their profiles with verified emails and track engagement.
                </p>

                <div className="space-y-3 mb-6">
                  {journalists.map((j, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-3 border border-slate-4 flex items-center justify-center text-[11px] font-bold text-white/40 shrink-0">{i + 1}</span>
                      <input
                        type="text"
                        value={j.name}
                        onChange={(e) => updateJournalist(i, 'name', e.target.value)}
                        placeholder="Full name"
                        className="flex-1 px-3 py-2.5 bg-slate-2 border border-slate-4 rounded-xl text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-brand-iris/50 transition-colors"
                      />
                      <input
                        type="email"
                        value={j.email}
                        onChange={(e) => updateJournalist(i, 'email', e.target.value)}
                        placeholder="Email (optional)"
                        className="w-44 px-3 py-2.5 bg-slate-2 border border-slate-4 rounded-xl text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-brand-iris/50 transition-colors"
                      />
                      <input
                        type="text"
                        value={j.outlet_name}
                        onChange={(e) => updateJournalist(i, 'outlet_name', e.target.value)}
                        placeholder="Publication"
                        className="w-32 px-3 py-2.5 bg-slate-2 border border-slate-4 rounded-xl text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-brand-iris/50 transition-colors"
                      />
                      {journalists.length > 1 && (
                        <button type="button" onClick={() => removeJournalist(i)} className="text-white/25 hover:text-white/50 shrink-0">
                          <XIcon />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {journalists.length < 10 && (
                  <button
                    type="button"
                    onClick={addJournalist}
                    className="flex items-center gap-2 text-[13px] text-white/40 hover:text-white/60 mb-8 transition-colors"
                  >
                    <PlusIcon /> Add another journalist
                  </button>
                )}

                <div className="flex items-center justify-between">
                  <SkipBtn onClick={async () => { await updateStep(4, true); goNext(); }} />
                  <PrimaryBtn onClick={handleJournalistsSave} loading={saving} disabled={!journalists.some((j) => j.name.trim())}>
                    Save & Continue <ArrowRight />
                  </PrimaryBtn>
                </div>
              </div>
            )}

            {/* ── Step 5: Content ── */}
            {step === 'content' && (
              <div className="max-w-lg mx-auto">
                <h2 className="text-[24px] font-bold text-white mb-2">Add existing content</h2>
                <p className="text-[14px] text-white/40 mb-6">
                  Paste URLs of your published articles, guides, or blog posts. I'll index and score them with CiteMind.
                </p>

                <div className="space-y-3 mb-6">
                  {contentUrls.map((url, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-3 border border-slate-4 flex items-center justify-center text-[11px] font-bold text-white/40 shrink-0">{i + 1}</span>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => {
                          const updated = [...contentUrls];
                          updated[i] = e.target.value;
                          setContentUrls(updated);
                        }}
                        placeholder="https://yourdomain.com/blog/article-title"
                        className="flex-1 px-3 py-2.5 bg-slate-2 border border-slate-4 rounded-xl text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-brand-iris/50 transition-colors"
                      />
                      {contentUrls.length > 1 && (
                        <button type="button" onClick={() => removeContentUrl(i)} className="text-white/25 hover:text-white/50 shrink-0">
                          <XIcon />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {contentUrls.length < 10 && (
                  <button
                    type="button"
                    onClick={addContentUrl}
                    className="flex items-center gap-2 text-[13px] text-white/40 hover:text-white/60 mb-8 transition-colors"
                  >
                    <PlusIcon /> Add another URL
                  </button>
                )}

                <div className="flex items-center justify-between">
                  <SkipBtn onClick={async () => { await updateStep(5, true); goNext(); }} />
                  <PrimaryBtn onClick={handleContentSave} loading={saving} disabled={!contentUrls.some((u) => u.trim())}>
                    Save & Activate SAGE <ArrowRight />
                  </PrimaryBtn>
                </div>
              </div>
            )}

            {/* ── Step 6: SAGE Activation ── */}
            {step === 'activation' && (
              <div className="text-center py-8">
                {activationPhase !== 'done' ? (
                  <>
                    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-brand-iris/10 border border-brand-iris/20 flex items-center justify-center">
                      <AIDot pulse size="md" />
                    </div>
                    <h2 className="text-[22px] font-bold text-white mb-2">Activating SAGE Intelligence</h2>
                    <p className="text-[14px] text-white/40 mb-8">{activationLabel}</p>

                    {/* Progress bar */}
                    <div className="max-w-sm mx-auto bg-slate-3 rounded-full h-1 overflow-hidden mb-8">
                      <style>{`@keyframes expandWidth { from { width: 0% } to { width: 95% } } .activation-bar { animation: expandWidth 20s ease-in-out forwards; }`}</style>
                      <div className="activation-bar h-full bg-brand-iris rounded-full" />
                    </div>

                    <div className="max-w-md mx-auto space-y-2">
                      {[
                        'Calculating Earned Visibility Index...',
                        'Running signal ingestors across all pillars...',
                        'Generating SAGE proposals...',
                      ].map((label, i) => (
                        <div key={i} className="flex items-center gap-2.5 text-left">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-iris/50 shrink-0 animate-pulse" style={{ animationDelay: `${i * 500}ms` }} />
                          <span className="text-[12px] text-white/40">{label}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center gap-2 bg-semantic-success/10 border border-semantic-success/25 rounded-full px-4 py-1.5 mb-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-semantic-success" />
                      <span className="text-[12px] font-semibold text-semantic-success">Activation Complete</span>
                    </div>
                    <h2 className="text-[26px] font-bold text-white mb-3">Your SAGE engine is live</h2>

                    {/* EVI Score card */}
                    <div className="max-w-xs mx-auto bg-slate-2 border border-slate-4 rounded-xl p-6 mb-8">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-white/35 mb-2">Earned Visibility Index</p>
                      <p className="text-[48px] font-bold text-brand-iris leading-none mb-1">
                        {eviScore ?? 0}
                      </p>
                      <p className="text-[13px] text-white/40">out of 100 — your starting baseline</p>
                    </div>

                    <PrimaryBtn onClick={goNext}>
                      See Your Proposals <ArrowRight />
                    </PrimaryBtn>
                    {completionFailed && (
                      <div className="mt-4 p-4 bg-brand-amber/10 border border-brand-amber/20 rounded-xl text-center">
                        <p className="text-xs text-white/55 mb-2">Setup is taking longer than expected.</p>
                        <button
                          onClick={() => {
                            document.cookie = 'onboarding_escape=true;path=/;max-age=86400';
                            router.push('/app/command-center');
                          }}
                          className="px-4 py-2 text-sm font-medium text-brand-cyan border border-brand-cyan/30 rounded-lg hover:bg-brand-cyan/10 transition-colors"
                        >
                          Continue to Dashboard &rarr;
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Step 7: First Proposals ── */}
            {step === 'proposals' && (
              <div>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 bg-brand-iris/10 border border-brand-iris/25 rounded-full px-4 py-1.5 mb-4">
                    <LightningIcon />
                    <span className="text-[12px] font-semibold text-brand-iris">SAGE Proposals</span>
                  </div>
                  <h2 className="text-[26px] font-bold text-white mb-1">Your first recommended actions</h2>
                  <p className="text-[14px] text-white/40">
                    {proposals.length > 0
                      ? `${proposals.length} prioritized actions based on your competitive position.`
                      : 'SAGE is still processing. Proposals will appear in your Command Center shortly.'}
                  </p>
                </div>

                {proposals.length > 0 ? (
                  <div className="space-y-3 mb-8">
                    {proposals.map((p) => (
                      <div key={p.id} className={`border rounded-xl p-4 ${pillarBg[p.pillar] || pillarBg['Cross-Pillar']}`}>
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center gap-1 shrink-0 w-16 text-center">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${pillarColor[p.pillar] || pillarColor['Cross-Pillar']}`}>{p.pillar}</span>
                            <span className={`text-[12px] font-semibold ${pillarColor[p.pillar] || pillarColor['Cross-Pillar']}`}>{p.impact}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-white/90 mb-1">{p.title}</p>
                            {p.rationale && <p className="text-[12px] text-white/40 leading-relaxed">{p.rationale}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-2 border border-slate-4 rounded-xl p-8 text-center mb-8">
                    <p className="text-[14px] text-white/50">
                      SAGE is still generating proposals. They'll be ready in your Command Center.
                    </p>
                  </div>
                )}

                <div className="bg-slate-2 border border-slate-4 rounded-xl p-4 mb-8">
                  <p className="text-[12px] text-white/40 leading-relaxed">
                    <span className="font-semibold text-white/65">These proposals are live in your Command Center.</span>{' '}
                    You can approve, modify, or dismiss them. SAGE will continue generating new proposals as your data grows.
                  </p>
                </div>

                <div className="text-center">
                  <PrimaryBtn onClick={() => router.push('/app/command-center')}>
                    <LightningIcon /> Enter Your Dashboard
                  </PrimaryBtn>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
