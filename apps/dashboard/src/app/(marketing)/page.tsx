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

// ── Browser frame component ──
function BrowserFrame({ label, height = 400 }: { label: string; height?: number }) {
  return (
    <div style={{
      borderRadius: '10px 10px 8px 8px', overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 40px 80px rgba(168,85,247,0.12), 0 20px 40px rgba(0,0,0,0.5)',
    }}>
      <div style={{
        height: 36, background: '#1A1A24',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6,
      }}>
        {['rgba(239,68,68,0.5)', 'rgba(245,158,11,0.5)', 'rgba(34,197,94,0.5)'].map((c, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
        ))}
        <div style={{
          marginLeft: 12, flex: 1, height: 20, borderRadius: 4,
          background: 'rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', paddingLeft: 8,
          fontSize: 11, color: 'rgba(255,255,255,0.25)',
        }}>app.pravado.io</div>
      </div>
      <div style={{
        height, background: '#06060A',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.15)', fontSize: 13, fontFamily: 'monospace',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        {label}
      </div>
    </div>
  );
}

// ── Constants ──
const TAB_DATA: Record<string, {
  color: string; label: string; headline: string;
  body: string; stats: Array<{ n: string; label: string }>;
  screenshot: string;
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
    screenshot: 'SCREENSHOT: Analytics PR view \u2014 EVI LIFT column',
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
    screenshot: 'SCREENSHOT: Content pillar \u2014 CiteMind citation feed',
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
    screenshot: 'SCREENSHOT: SEO pillar \u2014 SAGE recommendations',
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
        minHeight: 680, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px 60px', textAlign: 'center',
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

        <div style={{ position: 'relative', maxWidth: 720 }}>
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
      <section style={{ padding: '100px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 12, fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const }}>THE PROBLEM</div>
        <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 800, margin: '0 0 60px', color: '#ffffff', lineHeight: 1.1, maxWidth: 600 }}>
          Five tools. Zero connection.<br />No idea what&apos;s working.
        </h2>

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
      </section>

      {/* ═══════════════════════════════════
          SECTION 3: EVI
          ═══════════════════════════════════ */}
      <section ref={eviRef} style={{ padding: '100px 48px', background: '#0D0D14', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
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
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['ChatGPT', 'Perplexity', 'Claude', 'Gemini'].map(e => (
              <span key={e} style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>{e}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          SECTION 4: PLATFORM (tabbed pillars)
          ═══════════════════════════════════ */}
      <section id="platform" style={{ padding: '100px 48px', maxWidth: 1200, margin: '0 auto' }}>
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

          <BrowserFrame label={tab.screenshot} height={360} />
        </div>
      </section>

      {/* ═══════════════════════════════════
          SECTION 5: HOW SAGE WORKS
          ═══════════════════════════════════ */}
      <section style={{ padding: '100px 48px', background: '#0D0D14' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
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
      <section style={{ padding: '100px 48px', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
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
      </section>

      {/* ═══════════════════════════════════
          SECTION 7: FOUNDER NOTE
          ═══════════════════════════════════ */}
      <section style={{ padding: '80px 48px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>
            Built by Christian Dibrell, Founder of Saipien Labs &mdash;
            because AI is changing how brands get found, and most teams aren&apos;t ready.
          </p>
          <a
            href="https://www.linkedin.com/in/christiandibrell/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 14, fontWeight: 500, color: '#00D9FF', textDecoration: 'none' }}
          >
            Connect on LinkedIn &rarr;
          </a>
        </div>
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
