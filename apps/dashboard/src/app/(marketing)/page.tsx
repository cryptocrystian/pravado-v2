'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ── Animated counter hook ──
function useCounter(target: number, duration: number, trigger: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(parseFloat(start.toFixed(1)));
    }, 16);
    return () => clearInterval(timer);
  }, [trigger, target, duration]);
  return value;
}

// ── Intersection observer hook ──
function useInView(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ── Browser frame with CSS mockup of the app ──
function BrowserFrame({ variant = 'command-center', height = 400 }: { variant?: 'command-center' | 'pr' | 'content' | 'seo'; height?: number }) {
  return (
    <div style={{
      borderRadius: '10px 10px 8px 8px', overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 40px 80px rgba(168,85,247,0.12), 0 20px 40px rgba(0,0,0,0.5)',
    }}>
      {/* Browser chrome */}
      <div style={{
        height: 32, background: '#1A1A24',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6,
      }}>
        {['rgba(239,68,68,0.5)', 'rgba(245,158,11,0.5)', 'rgba(34,197,94,0.5)'].map((c, i) => (
          <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
        ))}
        <div style={{
          marginLeft: 12, flex: 1, height: 18, borderRadius: 4,
          background: 'rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', paddingLeft: 8,
          fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace',
        }}>app.pravado.io/app/{variant}</div>
      </div>
      {/* App mockup */}
      <div style={{ height, background: '#0A0A0F', overflow: 'hidden', position: 'relative' }}>
        {/* Topbar */}
        <div style={{
          height: 40, background: '#0D0D14', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
        }}>
          <div style={{ width: 20, height: 20, borderRadius: 4, background: 'linear-gradient(135deg, #00D9FF, #A855F7)' }} />
          <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.8)' }}>PRAVADO</span>
          <div style={{ flex: 1 }} />
          {[
            { n: 'Command', v: 'command-center', c: '#00D9FF' },
            { n: 'PR', v: 'pr', c: '#E879F9' },
            { n: 'Content', v: 'content', c: '#14B8A6' },
            { n: 'SEO', v: 'seo', c: '#00D9FF' },
            { n: 'Calendar', v: '', c: '' },
            { n: 'Analytics', v: '', c: '' },
          ].map(item => {
            const active = item.v === variant;
            return (
              <span key={item.n} style={{
                fontSize: 10, fontWeight: 600, padding: '4px 8px', borderRadius: 4,
                color: active ? '#ffffff' : 'rgba(255,255,255,0.4)',
                background: active ? `${item.c}15` : 'transparent',
              }}>{item.n}</span>
            );
          })}
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00D9FF', boxShadow: '0 0 6px #00D9FF' }} />
            <span style={{ fontSize: 9, fontWeight: 600, color: '#00D9FF', letterSpacing: '0.1em' }}>AI ACTIVE</span>
          </div>
        </div>
        {/* Content area */}
        <div style={{ display: 'flex', height: height - 40 }}>
          {/* Left panel — strategy */}
          <div style={{ width: '28%', borderRight: '1px solid rgba(255,255,255,0.04)', padding: 12, overflow: 'hidden' }}>
            {/* EVI card */}
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: 12, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>AI VISIBILITY</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>EVI</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#00D9FF', fontFamily: 'monospace', lineHeight: 1 }}>74.2</div>
              <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', marginTop: 8 }}>
                <div style={{ width: '74%', height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #00D9FF, #A855F7)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 8, color: '#00D9FF' }}>Strong</span>
                <span style={{ fontSize: 8, color: '#22C55E' }}>+3.4 this month</span>
              </div>
            </div>
            {/* Sub-scores */}
            {[{ name: 'Visibility', score: 78.1 }, { name: 'Authority', score: 71.3 }, { name: 'Momentum', score: 68.5 }].map(s => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 4px', fontSize: 9 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>{s.name}</span>
                <span style={{ color: '#00D9FF', fontWeight: 600, fontFamily: 'monospace' }}>{s.score}</span>
              </div>
            ))}
            {/* SAGE section */}
            <div style={{ marginTop: 12, fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>SAGE&trade; RECOMMENDS</div>
            {[
              { label: 'Pitch Sarah Chen \u2014 TechCrunch', evi: '+4.2' },
              { label: 'Publish AEO guide \u2014 Perplexity', evi: '+3.1' },
              { label: 'Schema fix \u2014 Entity SEO', evi: '+2.8' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, padding: '5px 4px', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#00D9FF', fontFamily: 'monospace', width: 14, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{r.label}</span>
                <span style={{ fontSize: 8, color: '#00D9FF', fontFamily: 'monospace', fontWeight: 600, flexShrink: 0 }}>{r.evi}</span>
              </div>
            ))}
          </div>
          {/* Center panel — entity map area */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {/* Gradient mesh */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: `
                radial-gradient(ellipse 50% 40% at 30% 50%, rgba(168,85,247,0.06) 0%, transparent 70%),
                radial-gradient(ellipse 40% 50% at 70% 40%, rgba(0,217,255,0.04) 0%, transparent 70%)
              `,
            }} />
            {/* Mock entity nodes */}
            {[
              { x: '45%', y: '38%', w: 72, h: 36, label: 'Pravado', color: '#A855F7', big: true },
              { x: '20%', y: '22%', w: 52, h: 24, label: 'ChatGPT', color: '#00D9FF', big: false },
              { x: '70%', y: '18%', w: 52, h: 24, label: 'Perplexity', color: '#00D9FF', big: false },
              { x: '15%', y: '58%', w: 52, h: 24, label: 'TechCrunch', color: '#E879F9', big: false },
              { x: '72%', y: '62%', w: 52, h: 24, label: 'AI Search', color: '#14B8A6', big: false },
              { x: '38%', y: '70%', w: 44, h: 24, label: 'Claude', color: '#00D9FF', big: false },
              { x: '58%', y: '75%', w: 44, h: 24, label: 'Gemini', color: '#00D9FF', big: false },
            ].map((n, i) => (
              <div key={i} style={{
                position: 'absolute', left: n.x, top: n.y,
                width: n.w, height: n.h, transform: 'translate(-50%, -50%)',
                background: 'rgba(8,8,18,0.72)', backdropFilter: 'blur(12px)',
                border: `1px solid ${n.color}40`, borderRadius: n.big ? 10 : 6,
                boxShadow: `0 0 16px ${n.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: n.big ? 10 : 8, fontFamily: 'monospace', fontWeight: n.big ? 700 : 500,
                color: n.big ? '#ffffff' : 'rgba(255,255,255,0.7)',
              }}>
                {n.label}
              </div>
            ))}
            {/* Mock connection lines via SVG */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              {[
                { x1: '45%', y1: '38%', x2: '20%', y2: '22%', c: '#A855F7' },
                { x1: '45%', y1: '38%', x2: '70%', y2: '18%', c: '#00D9FF' },
                { x1: '45%', y1: '38%', x2: '15%', y2: '58%', c: '#E879F9' },
                { x1: '45%', y1: '38%', x2: '72%', y2: '62%', c: '#14B8A6' },
                { x1: '45%', y1: '38%', x2: '38%', y2: '70%', c: '#00D9FF' },
                { x1: '45%', y1: '38%', x2: '58%', y2: '75%', c: '#00D9FF' },
              ].map((l, i) => (
                <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                  stroke={l.c} strokeWidth={1} strokeOpacity={0.25} />
              ))}
            </svg>
          </div>
          {/* Right panel — action stream */}
          <div style={{ width: '24%', borderLeft: '1px solid rgba(255,255,255,0.04)', padding: 12, overflow: 'hidden' }}>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>ACTION STREAM</div>
            {[
              { tag: 'PR', color: '#E879F9', text: 'Pitch TechCrunch re: AI visibility' },
              { tag: 'SEO', color: '#00D9FF', text: 'Optimize landing page for AEO' },
              { tag: 'Content', color: '#14B8A6', text: 'Rewrite "AI Search" article' },
              { tag: 'PR', color: '#E879F9', text: 'Follow up: Wired journalist' },
            ].map((a, i) => (
              <div key={i} style={{
                padding: '8px 8px', marginBottom: 4, borderRadius: 6,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 7, fontWeight: 700, padding: '1px 4px', borderRadius: 3, background: `${a.color}15`, color: a.color }}>{a.tag}</span>
                  <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)' }}>+{(3.2 - i * 0.5).toFixed(1)} EVI</span>
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', lineHeight: 1.3 }}>{a.text}</div>
              </div>
            ))}
            {/* CiteMind Feed */}
            <div style={{ marginTop: 10, fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>CITEMIND&trade; FEED</div>
            {[
              { engine: 'GPT', query: '"ai visibility platform"', pos: '#2' },
              { engine: 'Perp', query: '"earned media tracking"', pos: '#1' },
            ].map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, padding: '4px 4px', fontSize: 8 }}>
                <span style={{ color: '#00D9FF', fontWeight: 700, fontFamily: 'monospace', width: 24 }}>{c.engine}</span>
                <span style={{ color: 'rgba(255,255,255,0.35)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.query}</span>
                <span style={{ color: '#22C55E', fontWeight: 600, fontFamily: 'monospace' }}>{c.pos}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Constants ──
const TAB_DATA: Record<string, {
  color: string; label: string; headline: string;
  body: string; stats: Array<{ n: string; label: string }>;
  variant: 'command-center' | 'pr' | 'content' | 'seo';
}> = {
  PR: {
    color: '#E879F9',
    label: 'EARNED MEDIA',
    headline: '283,597 journalists. SAGE\u2122 tells you which 3 to pitch today.',
    body: 'Stop spray-and-pray pitching. SAGE\u2122 analyzes journalist beat alignment, publication authority, and your current EVI\u2122 gaps to surface the exact outreach that will move your score. Every placement tracked back to EVI\u2122 impact.',
    stats: [
      { n: '25%', label: 'pitch-to-placement rate vs. 5\u20138% industry avg' },
      { n: '8.4M', label: 'estimated monthly reach from earned media' },
      { n: '+5.2', label: 'avg EVI\u2122 points from a single TechCrunch placement' },
    ],
    variant: 'pr',
  },
  Content: {
    color: '#14B8A6',
    label: 'CONTENT & AI CITATION',
    headline: 'CiteMind\u2122 scans ChatGPT, Perplexity, Claude, and Gemini. 24/7.',
    body: 'Your content either gets cited by AI engines or it doesn\'t. CiteMind\u2122 tells you which articles are winning, which are invisible, and exactly what to fix. CRAFT\u2122 generates optimized briefs based on real citation patterns \u2014 not guesswork.',
    stats: [
      { n: '4.4\u00d7', label: 'AI search traffic conversion rate vs. organic' },
      { n: '77%', label: 'of searches now end with an AI answer, not a click' },
      { n: '90%', label: 'of cited AI sources can change within 90 days' },
    ],
    variant: 'content',
  },
  SEO: {
    color: '#00D9FF',
    label: 'SEO & AEO',
    headline: 'Rank in Google. Get cited in AI. One workflow.',
    body: 'Traditional SEO gets you Google rankings. Answer Engine Optimization (AEO) gets you into ChatGPT\'s answer. SAGE\u2122 identifies your highest-impact optimizations across both \u2014 ranked by estimated EVI\u2122 improvement, not just keyword volume.',
    stats: [
      { n: '47%', label: 'of Google searches now show AI Overviews' },
      { n: '61%', label: 'drop in organic CTR when AI Overview appears' },
      { n: '$1T', label: 'in commerce projected to shift to AI assistants by 2029' },
    ],
    variant: 'seo',
  },
};

const PLANS = [
  { name: 'Starter', price: 'Free', desc: 'For individuals getting started', features: ['1 seat', '10K tokens/mo', '5 playbook runs/mo'] },
  { name: 'Growth', price: '$49/mo', desc: 'For growing teams', features: ['5 seats', '100K tokens/mo', '50 playbook runs/mo'] },
  { name: 'Pro', price: '$149/mo', desc: 'For professional teams', features: ['15 seats', '500K tokens/mo', '200 playbook runs/mo'] },
  { name: 'Enterprise', price: 'Custom', desc: 'For large organizations', features: ['Unlimited seats', 'Custom limits', 'Dedicated support'] },
];

// ── Page ──
export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<'PR' | 'Content' | 'SEO'>('PR');
  const { ref: eviRef, inView: eviInView } = useInView();
  const eviValue = useCounter(74.2, 2000, eviInView);
  const eviColor = eviValue < 30 ? '#EF4444' : eviValue < 60 ? '#F59E0B' : '#00D9FF';
  const tab = TAB_DATA[activeTab];

  return (
    <div style={{ background: '#0A0A0F' }}>

      {/* ═══════════════════════════════════
          SECTION 1: HERO
          ═══════════════════════════════════ */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        minHeight: '90vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '120px 5% 80px', textAlign: 'center',
        background: '#0A0A0F',
      }}>
        {/* Grid background */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }} />
        {/* Scan line */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(0,217,255,0.3), transparent)',
          animation: 'scanline 8s linear infinite',
          pointerEvents: 'none',
        }} />
        {/* Iris glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(168,85,247,0.07) 0%, transparent 70%)',
        }} />

        <div style={{ position: 'relative', maxWidth: 820, margin: '0 auto' }}>
          {/* Eyebrow */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '4px 14px', borderRadius: 20, marginBottom: 28,
            border: '1px solid rgba(0,217,255,0.3)',
            fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.15em',
            color: '#00D9FF',
          }}>
            PRIVATE BETA &middot; LIMITED SPOTS
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(36px, 5vw, 58px)', fontWeight: 800,
            lineHeight: 1.08, margin: '0 0 12px',
            color: '#ffffff', letterSpacing: '-0.02em',
          }}>
            Your customers don&apos;t Google anymore.
          </h1>
          <h1 style={{
            fontSize: 'clamp(36px, 5vw, 58px)', fontWeight: 800,
            lineHeight: 1.08, margin: '0 0 28px',
            color: '#00D9FF', letterSpacing: '-0.02em',
          }}>
            They ask ChatGPT. Are you in that answer?
          </h1>

          <p style={{
            fontSize: 18, lineHeight: 1.65, margin: '0 auto 36px',
            maxWidth: 540, color: 'rgba(255,255,255,0.6)',
          }}>
            Right now, ChatGPT, Perplexity, and Gemini are either recommending
            your brand, ignoring it, or sending buyers to your competitors.
            Most marketing teams have no idea which &mdash; and no way to change it.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link href="/beta" style={{
              padding: '13px 28px', borderRadius: 8, fontSize: 15,
              fontWeight: 700, background: '#00D9FF', color: '#0A0A0F',
              textDecoration: 'none', display: 'inline-block',
            }}>Apply for Beta Access</Link>
            <a href="#platform" style={{
              padding: '13px 28px', borderRadius: 8, fontSize: 15,
              fontWeight: 500, color: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.15)', textDecoration: 'none',
            }}>See the Platform &rarr;</a>
          </div>

          {/* Stat bar */}
          <div style={{
            display: 'flex', justifyContent: 'center',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '20px 0',
          }}>
            {[
              { n: '900M', label: 'ChatGPT weekly active users' },
              { n: '4.4\u00d7', label: 'AI search conversion vs. organic' },
              { n: '77%', label: 'of searches end without a click' },
            ].map(({ n, label }, i) => (
              <div key={i} style={{
                flex: 1, textAlign: 'center', padding: '0 24px',
                borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'monospace', color: '#ffffff' }}>{n}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          SECTION 2: THE PROBLEM
          ═══════════════════════════════════ */}
      <section style={{ padding: '100px 5%', background: '#0D0D14' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 12, fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const }}>THE PROBLEM</div>
        <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 800, margin: '0 0 60px', color: '#ffffff', lineHeight: 1.1, maxWidth: 640 }}>
          Five tools. Zero connection.<br />No idea what&apos;s working.
        </h2>

        {/* Persona pain cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 48 }}>
          {[
            { role: 'VP MARKETING / CMO', color: '#A855F7', pain: 'ChatGPT is sending traffic to my competitors. I can see it in analytics. I have no idea how to fix it \u2014 and neither does anyone on my team.' },
            { role: 'PR DIRECTOR', color: '#E879F9', pain: 'I got a TechCrunch placement. My CEO wants to know what it was worth in real business terms. My agency sent a PDF with impressions. That\u2019s not an answer anymore.' },
            { role: 'CONTENT / SEO MANAGER', color: '#14B8A6', pain: 'I published 30 articles last quarter. Two are being cited in AI answers. I don\u2019t know which two, why those two, or what I should write next.' },
          ].map(({ role, color, pain }) => (
            <div key={role} style={{
              padding: '20px 24px', background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${color}`, borderRadius: 10,
            }}>
              <div style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.15em', color, marginBottom: 12 }}>{role}</div>
              <p style={{ fontSize: 14, fontStyle: 'italic', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: 0 }}>&ldquo;{pain}&rdquo;</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'start' }}>
          <div>
            <p style={{ fontSize: 16, lineHeight: 1.75, color: 'rgba(255,255,255,0.65)', marginBottom: 24 }}>
              Your PR team pitches journalists without knowing which placements
              move your AI visibility score. Your content team publishes without
              knowing which articles Perplexity actually cites. Your SEO team
              tracks rankings that may not translate to AI recommendations at all.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.75, color: 'rgba(255,255,255,0.65)' }}>
              Meanwhile, you&apos;re paying $40K/year for tools that don&apos;t talk to each
              other &mdash; and can&apos;t answer the only question that matters:
              <span style={{ color: '#ffffff', fontWeight: 600 }}> is my brand winning in AI?</span>
            </p>

            {/* Intelligence Loop */}
            <div style={{
              marginTop: 40, padding: '20px 24px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12,
            }}>
              <div style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', marginBottom: 16, textTransform: 'uppercase' as const }}>
                The Pravado Intelligence Loop
              </div>
              {[
                { name: 'SAGE\u2122', color: '#A855F7', action: 'identifies the gap' },
                { name: 'CRAFT\u2122', color: '#00D9FF', action: 'closes it' },
                { name: 'CiteMind\u2122', color: '#E879F9', action: 'confirms it happened' },
                { name: 'EVI\u2122', color: '#22C55E', action: 'tells you if it\u2019s working' },
              ].map(({ name, color, action }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < 3 ? 12 : 0 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color }}>{name}</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{action}</span>
                  {i < 3 && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>&darr;</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Current stack chaos */}
          <div style={{
            padding: 32, background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12,
          }}>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 24 }}>
              Your current stack
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { name: 'Cision', purpose: 'Media database', cost: '$10K/yr' },
                { name: 'Semrush', purpose: 'SEO tracking', cost: '$400/mo' },
                { name: 'Muck Rack', purpose: 'Journalist intel', cost: '$15K/yr' },
                { name: 'BuzzSumo', purpose: 'Content analytics', cost: '$300/mo' },
                { name: 'AI Monitor', purpose: 'Citation tracking', cost: '$400/mo' },
                { name: '+ 3 more', purpose: 'Various', cost: '???' },
              ].map(({ name, purpose, cost }) => (
                <div key={name} style={{
                  padding: '10px 12px', background: 'rgba(255,255,255,0.03)',
                  border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 8,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{purpose}</div>
                  <div style={{ fontSize: 11, color: 'rgba(239,68,68,0.7)', marginTop: 2 }}>{cost}</div>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 20, padding: '10px 16px', borderRadius: 8,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.7)',
            }}>
              None of these talk to each other.
              <br />
              <span style={{ color: 'rgba(239,68,68,0.8)', fontWeight: 600 }}>None measure EVI&trade;.</span>
            </div>
          </div>
        </div>
        </div>{/* close 1400 wrapper */}
      </section>

      {/* ═══════════════════════════════════
          SECTION 3: EVI
          ═══════════════════════════════════ */}
      <section ref={eviRef} style={{ padding: '100px 5%', background: '#0D0D14', textAlign: 'center' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 12, textTransform: 'uppercase' as const }}>
            EARNED VISIBILITY INDEX
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 800, margin: '0 0 40px', color: '#ffffff', lineHeight: 1.1 }}>
            One number that tells you if your marketing is working.
          </h2>

          {/* Animated EVI */}
          <div style={{
            fontSize: 96, fontWeight: 900, fontFamily: 'monospace',
            color: eviColor, lineHeight: 1, marginBottom: 8,
            transition: 'color 0.5s',
            textShadow: `0 0 60px ${eviColor}40`,
          }}>
            {eviValue.toFixed(1)}
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>EVI&trade; Score</div>

          {/* Scale bar */}
          <div style={{ position: 'relative', height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', maxWidth: 480, margin: '0 auto 8px' }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, height: '100%',
              width: `${(eviValue / 100) * 100}%`, borderRadius: 2,
              background: 'linear-gradient(90deg, #EF4444, #F59E0B, #00D9FF)',
              transition: 'width 2s ease-out',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 480, margin: '0 auto 40px', fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)' }}>
            {['At Risk', 'Building', 'Strong', 'Elite'].map(l => <span key={l}>{l}</span>)}
          </div>

          <p style={{ fontSize: 16, lineHeight: 1.75, color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>
            EVI&trade; is Pravado&apos;s proprietary metric that unifies your PR, content,
            and SEO performance into a single score reflecting how prominently
            your brand appears in AI-generated responses. It&apos;s the first marketing
            metric that connects what you do to what AI says about you.
          </p>

          {/* AI engine row */}
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            {['ChatGPT', 'Perplexity', 'Claude', 'Gemini'].map(e => (
              <span key={e} style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>{e}</span>
            ))}
          </div>

          {/* Outcome checkmarks */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 32px', textAlign: 'left', maxWidth: 600, margin: '0 auto' }}>
            {[
              'Know your AI visibility baseline within 24 hours',
              'See exactly which PR placements moved your score \u2014 and by how much',
              'Know if ChatGPT and Perplexity are recommending you \u2014 updated daily',
              'Replace 5 disconnected tools with one score that proves it\u2019s working',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: '#22C55E', fontSize: 14, flexShrink: 0, marginTop: 1 }}>&check;</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          SECTION 4: PLATFORM (tabbed pillars)
          ═══════════════════════════════════ */}
      <section id="platform" style={{ padding: '100px 5%', background: '#0A0A0F' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 12, fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const }}>THE PLATFORM</div>
        <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 800, margin: '0 0 48px', color: '#ffffff', lineHeight: 1.1 }}>
          Three pillars. One operating system.
        </h2>

        {/* Tab selector */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 48 }}>
          {(['PR', 'Content', 'SEO'] as const).map(t => {
            const active = t === activeTab;
            const c = TAB_DATA[t].color;
            return (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding: '10px 24px', borderRadius: 8, fontSize: 13,
                fontWeight: 600, fontFamily: 'monospace', letterSpacing: '0.08em',
                background: active ? `${c}15` : 'transparent',
                color: active ? c : 'rgba(255,255,255,0.5)',
                border: `1px solid ${active ? `${c}40` : 'rgba(255,255,255,0.08)'}`,
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
                {TAB_DATA[t].label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
          <div>
            <h3 style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', lineHeight: 1.2, marginBottom: 16 }}>{tab.headline}</h3>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>{tab.body}</p>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 0 }}>
              {tab.stats.map(({ n, label }, i) => (
                <div key={i} style={{
                  flex: 1, padding: '16px 16px 16px 0',
                  borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color: tab.color }}>{n}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, lineHeight: 1.4 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          <BrowserFrame variant={tab.variant} height={360} />
        </div>
        </div>{/* close 1400 wrapper */}
      </section>

      {/* ═══════════════════════════════════
          SECTION 4.5: THE ARCHITECTURE
          ═══════════════════════════════════ */}
      <section style={{ padding: '100px 5%', background: '#0D0D14' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 12, textTransform: 'uppercase' as const }}>THE PRAVADO ARCHITECTURE</div>
          <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 800, margin: '0 0 16px', color: '#ffffff', lineHeight: 1.1 }}>
            This isn&apos;t a bundle of tools. It&apos;s an operating system.
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: 'rgba(255,255,255,0.6)', maxWidth: 640, marginBottom: 60 }}>
            Most platforms give you data and leave execution to you.
            Pravado closes the loop &mdash; from signal detection to strategic guidance
            to automated execution to citation measurement, all in service of
            one number: your EVI&trade;.
          </p>

          {/* Layered perspective diagram + right column */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', marginBottom: 60 }}>
            <svg viewBox="0 0 600 520" style={{ width: '100%', maxWidth: 600 }}>
              <defs>
                <marker id="hm-arr-iris" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,1 L0,7 L7,4 z" fill="rgba(168,85,247,0.7)" /></marker>
                <marker id="hm-arr-cyan" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,1 L0,7 L7,4 z" fill="rgba(0,217,255,0.7)" /></marker>
                <marker id="hm-arr-mag" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,1 L0,7 L7,4 z" fill="rgba(232,121,249,0.7)" /></marker>
                <marker id="hm-arr-grn" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,1 L0,7 L7,4 z" fill="rgba(34,197,94,0.5)" /></marker>
              </defs>
              {/* Layer labels */}
              <text x="20" y="110" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="monospace" letterSpacing="2">STRATEGY</text>
              <text x="20" y="240" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="monospace" letterSpacing="2">EXECUTION</text>
              <text x="20" y="370" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="monospace" letterSpacing="2">INTELLIGENCE</text>
              <text x="20" y="470" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="monospace" letterSpacing="2">OUTPUT</text>
              {/* Vertical axis */}
              <line x1="310" y1="80" x2="310" y2="450" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 4" />
              {/* SAGE ellipse + node */}
              <ellipse cx="310" cy="105" rx="180" ry="28" fill="none" stroke="rgba(168,85,247,0.3)" strokeWidth="1.5" />
              <rect x="436" y="79" width="88" height="32" rx="6" fill="rgba(168,85,247,0.12)" stroke="rgba(168,85,247,0.5)" strokeWidth="1.5" />
              <text x="480" y="92" textAnchor="middle" fill="#A855F7" fontSize="11" fontWeight="700" fontFamily="monospace">SAGE&trade;</text>
              <text x="480" y="105" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="monospace">STRATEGY</text>
              <circle cx="480" cy="105" r="4" fill="#A855F7" opacity="0.6" />
              {/* SAGE → CRAFT arrow */}
              <path d="M 310 133 L 310 188" stroke="rgba(168,85,247,0.5)" strokeWidth="1.5" markerEnd="url(#hm-arr-iris)" />
              <text x="318" y="165" fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="monospace">dispatches action</text>
              {/* CRAFT ellipse + node */}
              <ellipse cx="310" cy="230" rx="180" ry="28" fill="none" stroke="rgba(0,217,255,0.25)" strokeWidth="1.5" />
              <rect x="96" y="204" width="88" height="32" rx="6" fill="rgba(0,217,255,0.08)" stroke="rgba(0,217,255,0.45)" strokeWidth="1.5" />
              <text x="140" y="217" textAnchor="middle" fill="#00D9FF" fontSize="11" fontWeight="700" fontFamily="monospace">CRAFT&trade;</text>
              <text x="140" y="230" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="monospace">EXECUTION</text>
              <circle cx="140" cy="230" r="4" fill="#00D9FF" opacity="0.6" />
              {/* CRAFT → CiteMind arrow */}
              <path d="M 310 258 L 310 313" stroke="rgba(0,217,255,0.5)" strokeWidth="1.5" markerEnd="url(#hm-arr-cyan)" />
              <text x="318" y="290" fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="monospace">generates signals</text>
              {/* CiteMind ellipse + node */}
              <ellipse cx="310" cy="355" rx="180" ry="28" fill="none" stroke="rgba(232,121,249,0.2)" strokeWidth="1.5" />
              <rect x="432" y="329" width="96" height="32" rx="6" fill="rgba(232,121,249,0.08)" stroke="rgba(232,121,249,0.4)" strokeWidth="1.5" />
              <text x="480" y="342" textAnchor="middle" fill="#E879F9" fontSize="11" fontWeight="700" fontFamily="monospace">CiteMind&trade;</text>
              <text x="480" y="355" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="monospace">INTELLIGENCE</text>
              <circle cx="480" cy="355" r="4" fill="#E879F9" opacity="0.6" />
              {/* CiteMind → EVI arrow */}
              <path d="M 310 383 L 310 428" stroke="rgba(232,121,249,0.5)" strokeWidth="1.5" markerEnd="url(#hm-arr-mag)" />
              <text x="318" y="410" fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="monospace">citation data</text>
              {/* EVI center */}
              <circle cx="310" cy="455" r="36" fill="rgba(34,197,94,0.1)" stroke="rgba(34,197,94,0.5)" strokeWidth="2" />
              <circle cx="310" cy="455" r="28" fill="rgba(34,197,94,0.05)" stroke="rgba(34,197,94,0.3)" strokeWidth="1" />
              <text x="310" y="450" textAnchor="middle" fill="rgba(34,197,94,0.8)" fontSize="10" fontFamily="monospace" letterSpacing="1">EVI&trade;</text>
              <text x="310" y="465" textAnchor="middle" fill="#22C55E" fontSize="16" fontWeight="900" fontFamily="monospace">74.2</text>
              {/* Feedback loop */}
              <path d="M 274 455 Q 80 455 80 230 Q 80 105 200 100" stroke="rgba(34,197,94,0.3)" strokeWidth="1" fill="none" strokeDasharray="5 4" markerEnd="url(#hm-arr-grn)" />
              <text x="58" y="280" fill="rgba(34,197,94,0.4)" fontSize="9" fontFamily="monospace" transform="rotate(-90, 58, 280)">re-analysis loop</text>
            </svg>

            {/* Right column */}
            <div>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', marginBottom: 16, lineHeight: 1.2 }}>Three layers. One direction.</h3>
              <p style={{ fontSize: 15, lineHeight: 1.75, color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
                SAGE&trade; operates at the strategy layer &mdash; reading signals, identifying gaps, ranking actions by EVI&trade; impact.
                CRAFT&trade; operates at the execution layer &mdash; building campaigns, drafting pitches, deploying content.
                CiteMind&trade; operates at the intelligence layer &mdash; scanning AI engines continuously, detecting every citation,
                feeding results back into EVI&trade;. Each layer informs the next. The loop never stops.
              </p>
              <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 2 }}>
                <span style={{ color: '#A855F7', fontWeight: 700 }}>SAGE&trade;</span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}> &rarr; </span>
                <span style={{ color: '#00D9FF', fontWeight: 700 }}>CRAFT&trade;</span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}> &rarr; </span>
                <span style={{ color: '#E879F9', fontWeight: 700 }}>CiteMind&trade;</span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}> &rarr; </span>
                <span style={{ color: '#22C55E', fontWeight: 700 }}>EVI&trade;</span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}> &rarr; </span>
                <span style={{ color: '#A855F7', fontWeight: 700 }}>SAGE&trade;</span>
              </div>
            </div>
          </div>

          {/* 3-column outcomes with links */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
            {[
              { name: 'SAGE\u2122', color: '#A855F7', desc: 'Analyzes 50+ signals daily. Surfaces your 3 highest-impact actions ranked by EVI\u2122 improvement.', href: '/models#sage' },
              { name: 'CRAFT\u2122', color: '#00D9FF', desc: 'Drafts pitches, sequences outreach, publishes briefs. SAGE\u2122 identifies, CRAFT\u2122 executes.', href: '/models#craft' },
              { name: 'CiteMind\u2122', color: '#E879F9', desc: 'Scans ChatGPT, Perplexity, Claude, Gemini 24/7. Every citation feeds back into EVI\u2122.', href: '/models#citemind' },
            ].map(({ name, color, desc, href }) => (
              <div key={name} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color, marginBottom: 8 }}>{name}</div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.55)', margin: '0 0 8px' }}>{desc}</p>
                <Link href={href} style={{ fontSize: 12, color, textDecoration: 'none', fontWeight: 500 }}>Learn more &rarr;</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          SECTION 5: HOW SAGE WORKS
          ═══════════════════════════════════ */}
      <section style={{ padding: '100px 5%', background: '#0D0D14' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 12, textTransform: 'uppercase' as const }}>HOW IT WORKS</div>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
              Three steps. Zero guesswork.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
            {[
              { num: '01', label: 'Connect', desc: 'Link Google Search Console, your content library, and your PR history. Takes 5 minutes.', color: '#00D9FF' },
              { num: '02', label: 'Scan', desc: 'SAGE\u2122 scans AI engines 24/7 for citations, opportunities, and gaps. CiteMind\u2122 builds your visibility map.', color: '#A855F7' },
              { num: '03', label: 'Act', desc: 'Your Action Stream surfaces exactly what to do next, ranked by EVI\u2122 impact. CRAFT\u2122 executes.', color: '#E879F9' },
            ].map(({ num, label, desc, color }) => (
              <div key={num} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                  background: `${color}10`, border: `1px solid ${color}30`,
                  fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color,
                }}>{num}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>{label}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.5)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          SECTION 6: PRICING / BETA CTA
          ═══════════════════════════════════ */}
      <section style={{ padding: '100px 5%', textAlign: 'center', background: '#0A0A0F' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 12, textTransform: 'uppercase' as const }}>PRICING</div>
        <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 800, margin: '0 0 8px', color: '#ffffff', lineHeight: 1.1 }}>
          Private Beta &mdash; Free While We Build Together
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 48 }}>
          During beta, all features are available at no cost.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 48 }}>
          {PLANS.map(plan => (
            <div key={plan.name} style={{
              padding: '24px 20px', borderRadius: 12, textAlign: 'left',
              background: 'rgba(8,8,18,0.72)',
              border: '1px solid rgba(168,85,247,0.15)',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>{plan.name}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#00D9FF', marginBottom: 4, fontFamily: 'monospace' }}>{plan.price}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>{plan.desc}</div>
              <div style={{ flex: 1, marginBottom: 16 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00D9FF', flexShrink: 0 }} />
                    {f}
                  </div>
                ))}
              </div>
              <div style={{
                textAlign: 'center', padding: '8px 0', borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: 'rgba(168,85,247,0.1)', color: '#A855F7', border: '1px solid rgba(168,85,247,0.2)',
              }}>Coming Soon</div>
            </div>
          ))}
        </div>

        {/* CTA banner */}
        <div style={{
          padding: '40px 32px', borderRadius: 16,
          background: 'rgba(8,8,18,0.72)', border: '1px solid rgba(0,217,255,0.2)',
          boxShadow: '0 0 40px rgba(0,217,255,0.08)',
        }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: '#ffffff', marginBottom: 16 }}>
            During beta, all features are available at no cost.
          </p>
          <Link href="/beta" style={{
            display: 'inline-block', padding: '13px 32px', borderRadius: 8,
            fontSize: 15, fontWeight: 700, background: '#00D9FF', color: '#0A0A0F',
            textDecoration: 'none',
          }}>Apply for Beta Access &rarr;</Link>
        </div>
        </div>{/* close 1400 wrapper */}
      </section>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes scanline {
          0% { top: -1px; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}
