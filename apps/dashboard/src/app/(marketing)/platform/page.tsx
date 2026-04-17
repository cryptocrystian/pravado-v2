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

// ── Page ──
export default function PlatformPage() {
  const { ref: eviRef, inView: eviInView } = useInView();
  const eviValue = useCounter(74.2, 2000, eviInView);

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
            border: '1px solid rgba(168,85,247,0.3)',
            fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.15em',
            color: '#A855F7',
          }}>
            THE PRAVADO ARCHITECTURE
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(42px, 5.5vw, 64px)', fontWeight: 800,
            lineHeight: 1.08, margin: '0 0 12px',
            color: '#ffffff', letterSpacing: '-0.02em',
          }}>
            Built Different.
          </h1>
          <h2 style={{
            fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 600,
            lineHeight: 1.2, margin: '0 0 28px',
            color: '#00D9FF', letterSpacing: '-0.01em',
          }}>
            An operating system, not a dashboard.
          </h2>

          <p style={{
            fontSize: 18, lineHeight: 1.65, margin: '0 auto 36px',
            maxWidth: 580, color: 'rgba(255,255,255,0.6)',
          }}>
            Pravado isn&apos;t another marketing dashboard stitched together from
            disconnected widgets. It&apos;s three proprietary engines &mdash; SAGE&trade;,
            CRAFT&trade;, and CiteMind&trade; &mdash; working in a continuous closed loop.
            Strategy informs execution, execution generates signal, signal refines
            strategy. Every action compounds into a single score: EVI&trade;.
          </p>

          {/* CTA */}
          <Link href="/beta" style={{
            display: 'inline-block', padding: '13px 32px', borderRadius: 8,
            fontSize: 15, fontWeight: 700, background: '#A855F7', color: '#ffffff',
            textDecoration: 'none',
          }}>Apply for Beta Access &rarr;</Link>
        </div>
      </section>

      {/* ═══════════════════════════════════
          SECTION 2: THE ARCHITECTURE
          ═══════════════════════════════════ */}
      <section style={{ padding: '100px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 12, fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const }}>
          THE ARCHITECTURE
        </div>
        <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 800, margin: '0 0 60px', color: '#ffffff', lineHeight: 1.1, maxWidth: 600 }}>
          Four engines. One closed loop.
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'start' }}>
          {/* Left: Orbital diagram */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <svg width={480} height={480} viewBox="0 0 480 480" style={{ maxWidth: '100%' }}>
              {/* Concentric rings */}
              <circle cx={240} cy={240} r={80} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              <circle cx={240} cy={240} r={140} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
              <circle cx={240} cy={240} r={200} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={1} />

              {/* Dashed connection arrows */}
              {/* SAGE (top) -> CRAFT (bottom-left) */}
              <line x1={240} y1={50} x2={100} y2={380} stroke="#A855F7" strokeWidth={1} strokeDasharray="6 4" strokeOpacity={0.4} />
              {/* CRAFT (bottom-left) -> CiteMind (bottom-right) */}
              <line x1={100} y1={380} x2={380} y2={380} stroke="#00D9FF" strokeWidth={1} strokeDasharray="6 4" strokeOpacity={0.4} />
              {/* CiteMind (bottom-right) -> SAGE (top) */}
              <line x1={380} y1={380} x2={240} y2={50} stroke="#E879F9" strokeWidth={1} strokeDasharray="6 4" strokeOpacity={0.4} />

              {/* Arrow heads */}
              <defs>
                <marker id="arrow-iris" markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto">
                  <path d="M0,0 L8,3 L0,6" fill="#A855F7" fillOpacity={0.6} />
                </marker>
                <marker id="arrow-cyan" markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto">
                  <path d="M0,0 L8,3 L0,6" fill="#00D9FF" fillOpacity={0.6} />
                </marker>
                <marker id="arrow-magenta" markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto">
                  <path d="M0,0 L8,3 L0,6" fill="#E879F9" fillOpacity={0.6} />
                </marker>
              </defs>

              {/* Directed flow lines with arrows */}
              <line x1={220} y1={80} x2={130} y2={350} stroke="#A855F7" strokeWidth={1.5} strokeOpacity={0.3} markerEnd="url(#arrow-iris)" />
              <line x1={130} y1={400} x2={350} y2={400} stroke="#00D9FF" strokeWidth={1.5} strokeOpacity={0.3} markerEnd="url(#arrow-cyan)" />
              <line x1={360} y1={360} x2={260} y2={80} stroke="#E879F9" strokeWidth={1.5} strokeOpacity={0.3} markerEnd="url(#arrow-magenta)" />

              {/* EVI center node */}
              <circle cx={240} cy={240} r={60} fill="#0A0A0F" stroke="#22C55E" strokeWidth={2} />
              <circle cx={240} cy={240} r={60} fill="url(#evi-glow)" />
              <defs>
                <radialGradient id="evi-glow">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                </radialGradient>
              </defs>
              <text x={240} y={232} textAnchor="middle" fill="#22C55E" fontSize={32} fontWeight={800} fontFamily="monospace">74.2</text>
              <text x={240} y={256} textAnchor="middle" fill="#22C55E" fontSize={11} fontWeight={700} letterSpacing="0.15em" fontFamily="monospace" opacity={0.7}>STRONG</text>

              {/* SAGE node (top) */}
              <circle cx={240} cy={40} r={32} fill="#0A0A0F" stroke="#A855F7" strokeWidth={2} />
              <circle cx={240} cy={40} r={32} fill="rgba(168,85,247,0.1)" />
              <text x={240} y={38} textAnchor="middle" fill="#A855F7" fontSize={10} fontWeight={700} fontFamily="monospace">SAGE</text>
              <text x={240} y={50} textAnchor="middle" fill="#A855F7" fontSize={7} fontFamily="monospace" opacity={0.6}>{'\u2122'}</text>

              {/* CRAFT node (bottom-left) */}
              <circle cx={90} cy={390} r={32} fill="#0A0A0F" stroke="#00D9FF" strokeWidth={2} />
              <circle cx={90} cy={390} r={32} fill="rgba(0,217,255,0.1)" />
              <text x={90} y={388} textAnchor="middle" fill="#00D9FF" fontSize={10} fontWeight={700} fontFamily="monospace">CRAFT</text>
              <text x={90} y={400} textAnchor="middle" fill="#00D9FF" fontSize={7} fontFamily="monospace" opacity={0.6}>{'\u2122'}</text>

              {/* CiteMind node (bottom-right) */}
              <circle cx={390} cy={390} r={32} fill="#0A0A0F" stroke="#E879F9" strokeWidth={2} />
              <circle cx={390} cy={390} r={32} fill="rgba(232,121,249,0.1)" />
              <text x={390} y={384} textAnchor="middle" fill="#E879F9" fontSize={8} fontWeight={700} fontFamily="monospace">Cite</text>
              <text x={390} y={396} textAnchor="middle" fill="#E879F9" fontSize={8} fontWeight={700} fontFamily="monospace">Mind{'\u2122'}</text>
            </svg>
          </div>

          {/* Right: Signal inputs */}
          <div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 20, textTransform: 'uppercase' as const }}>
              WHAT SAGE{'\u2122'} READS:
            </div>
            {[
              { signal: 'AI citation frequency & position across ChatGPT, Perplexity, Claude, Gemini', icon: '\u2609' },
              { signal: 'PR coverage placement authority and journalist sentiment', icon: '\u2606' },
              { signal: 'Content performance vs. competitor citation share', icon: '\u25C8' },
              { signal: 'SEO ranking velocity and SERP feature ownership', icon: '\u25B2' },
              { signal: 'Brand entity salience in knowledge graphs', icon: '\u25C9' },
              { signal: 'Real-time EVI\u2122 sub-score drift across V / A / M', icon: '\u25CF' },
            ].map(({ signal, icon }, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '14px 0',
                borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <span style={{ fontSize: 16, color: '#A855F7', lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{icon}</span>
                <span style={{ fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,0.6)' }}>{signal}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Loop statement */}
        <div style={{
          marginTop: 60, padding: '24px 32px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, textAlign: 'center',
        }}>
          <p style={{
            fontFamily: 'monospace', fontSize: 14, lineHeight: 2,
            color: 'rgba(255,255,255,0.5)', margin: 0,
          }}>
            <span style={{ color: '#A855F7', fontWeight: 700 }}>SAGE{'\u2122'}</span>
            <span> identifies </span>
            <span style={{ color: 'rgba(255,255,255,0.25)' }}> → </span>
            <span style={{ color: '#00D9FF', fontWeight: 700 }}>CRAFT{'\u2122'}</span>
            <span> executes </span>
            <span style={{ color: 'rgba(255,255,255,0.25)' }}> → </span>
            <span style={{ color: '#E879F9', fontWeight: 700 }}>CiteMind{'\u2122'}</span>
            <span> measures </span>
            <span style={{ color: 'rgba(255,255,255,0.25)' }}> → </span>
            <span style={{ color: '#22C55E', fontWeight: 700 }}>EVI{'\u2122'}</span>
            <span> updates </span>
            <span style={{ color: 'rgba(255,255,255,0.25)' }}> → </span>
            <span style={{ color: '#A855F7', fontWeight: 700 }}>SAGE{'\u2122'}</span>
            <span> re-analyzes</span>
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════
          SECTION 3: SAGE DEEP DIVE
          ═══════════════════════════════════ */}
      <section style={{ padding: '100px 48px', background: '#0D0D14' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.15em', color: '#A855F7', marginBottom: 8, textTransform: 'uppercase' as const }}>
            SAGE{'\u2122'}
          </div>
          <div style={{ fontSize: 13, fontFamily: 'monospace', color: 'rgba(255,255,255,0.35)', marginBottom: 12, letterSpacing: '0.05em' }}>
            Signal &middot; Authority &middot; Growth &middot; Exposure
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 800, margin: '0 0 48px', color: '#ffffff', lineHeight: 1.1 }}>
            The strategic brain.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'start' }}>
            {/* Left: Copy */}
            <div>
              <p style={{ fontSize: 16, lineHeight: 1.75, color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
                SAGE{'\u2122'} isn&apos;t a recommendation engine that fires once and forgets.
                It&apos;s an always-on intelligence layer that continuously ingests
                signals from your PR coverage, content performance, SEO rankings,
                and AI citation data &mdash; then synthesizes them into prioritized
                actions ranked by estimated EVI{'\u2122'} impact.
              </p>
              <p style={{ fontSize: 16, lineHeight: 1.75, color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
                While other tools show you dashboards full of data and leave the
                interpretation to you, SAGE{'\u2122'} tells you exactly what to do next
                and why. It understands the compound relationship between pillars:
                a PR placement that triggers a content refresh that improves an
                AI citation that lifts your entire EVI{'\u2122'} score.
              </p>
              <p style={{ fontSize: 16, lineHeight: 1.75, color: 'rgba(255,255,255,0.6)' }}>
                Every recommendation includes a projected EVI{'\u2122'} delta, the
                reasoning chain behind it, and a one-click path to execution
                through CRAFT{'\u2122'}. No more guessing which task matters most.
              </p>
            </div>

            {/* Right: Mockup card */}
            <div style={{
              padding: 24, borderRadius: 12,
              background: 'rgba(8,8,18,0.8)',
              border: '1px solid rgba(168,85,247,0.2)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}>
              <div style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 16, textTransform: 'uppercase' as const }}>
                SAGE{'\u2122'} RECOMMENDATIONS
              </div>
              {[
                {
                  priority: 'HIGH',
                  pillar: 'PR',
                  pillarColor: '#E879F9',
                  title: 'Pitch Sarah Chen at TechCrunch re: AI visibility category',
                  delta: '+4.2 EVI',
                  reason: 'Beat alignment 94% · Publication authority: Tier 1 · Gap: AI search category not covered',
                },
                {
                  priority: 'HIGH',
                  pillar: 'Content',
                  pillarColor: '#14B8A6',
                  title: 'Refresh "What is AI Visibility" article with citation-optimized structure',
                  delta: '+2.8 EVI',
                  reason: 'Currently cited by GPT at position #4 · Structure fix could move to #2',
                },
                {
                  priority: 'MED',
                  pillar: 'SEO',
                  pillarColor: '#00D9FF',
                  title: 'Add FAQ schema to 3 landing pages for AI Overview inclusion',
                  delta: '+1.6 EVI',
                  reason: 'Competitors in AI Overview · Your pages missing structured data',
                },
              ].map((rec, i) => (
                <div key={i} style={{
                  padding: '14px 16px', marginBottom: i < 2 ? 8 : 0,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{
                      fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
                      background: rec.priority === 'HIGH' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                      color: rec.priority === 'HIGH' ? '#EF4444' : '#F59E0B',
                      fontFamily: 'monospace',
                    }}>{rec.priority}</span>
                    <span style={{
                      fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
                      background: `${rec.pillarColor}15`, color: rec.pillarColor,
                    }}>{rec.pillar}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#22C55E', fontFamily: 'monospace' }}>{rec.delta}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 4, lineHeight: 1.4 }}>{rec.title}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>{rec.reason}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Capability chips */}
          <div style={{ display: 'flex', gap: 12, marginTop: 48, flexWrap: 'wrap' }}>
            {[
              'Cross-pillar signal synthesis',
              'EVI-ranked prioritization',
              'Compound effect modeling',
              'Real-time re-analysis loop',
            ].map(chip => (
              <span key={chip} style={{
                padding: '8px 16px', borderRadius: 20,
                fontSize: 13, fontWeight: 500,
                background: 'rgba(168,85,247,0.08)',
                border: '1px solid rgba(168,85,247,0.2)',
                color: '#A855F7',
              }}>{chip}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          SECTION 4: CRAFT DEEP DIVE
          ═══════════════════════════════════ */}
      <section style={{ padding: '100px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.15em', color: '#00D9FF', marginBottom: 8, textTransform: 'uppercase' as const }}>
            CRAFT{'\u2122'}
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 800, margin: '0 0 20px', color: '#ffffff', lineHeight: 1.1 }}>
            The execution engine.
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: 'rgba(255,255,255,0.6)', maxWidth: 640, marginBottom: 48 }}>
            Strategy without execution is a slide deck. CRAFT{'\u2122'} closes the
            gap between what SAGE{'\u2122'} recommends and what actually ships. It
            generates journalist pitches, citation-optimized content briefs,
            technical SEO fixes, and AEO schemas &mdash; all governed by mode
            policies (Autopilot, Copilot, or Manual) so your team stays in
            control at exactly the level they choose.
          </p>

          {/* 6-step workflow timeline */}
          <div style={{ position: 'relative' }}>
            {/* Connecting line */}
            <div style={{
              position: 'absolute', top: 24, left: 24, right: 24,
              height: 2, background: 'rgba(0,217,255,0.1)',
            }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
              {[
                { step: '01', label: 'Signal In', desc: 'SAGE identifies gap or opportunity' },
                { step: '02', label: 'Brief Generated', desc: 'CRAFT creates execution brief' },
                { step: '03', label: 'Mode Gate', desc: 'Autopilot / Copilot / Manual review' },
                { step: '04', label: 'Asset Built', desc: 'Content, pitch, or fix produced' },
                { step: '05', label: 'Published', desc: 'Deployed to target channel' },
                { step: '06', label: 'Measured', desc: 'CiteMind tracks impact on EVI' },
              ].map(({ step, label, desc }, i) => (
                <div key={step} style={{ textAlign: 'center', position: 'relative' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px', position: 'relative',
                    background: '#0A0A0F',
                    border: `2px solid ${i <= 4 ? '#00D9FF' : 'rgba(0,217,255,0.3)'}`,
                    boxShadow: i <= 4 ? '0 0 12px rgba(0,217,255,0.2)' : 'none',
                  }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#00D9FF' }}>{step}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          SECTION 5: CITEMIND DEEP DIVE
          ═══════════════════════════════════ */}
      <section style={{ padding: '100px 48px', background: '#0D0D14' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.15em', color: '#E879F9', marginBottom: 8, textTransform: 'uppercase' as const }}>
            CiteMind{'\u2122'}
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 800, margin: '0 0 20px', color: '#ffffff', lineHeight: 1.1 }}>
            The eyes inside AI engines.
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: 'rgba(255,255,255,0.6)', maxWidth: 640, marginBottom: 48 }}>
            CiteMind{'\u2122'} continuously scans major AI engines &mdash; ChatGPT,
            Perplexity, Claude, and Gemini &mdash; to track how, when, and where
            your brand appears in AI-generated answers. It monitors citation
            position, frequency, context sentiment, and competitive displacement
            in real time.
          </p>

          {/* Engine row with dots */}
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginBottom: 48, flexWrap: 'wrap' }}>
            {[
              { name: 'ChatGPT', status: 'live' },
              { name: 'Perplexity', status: 'live' },
              { name: 'Claude', status: 'live' },
              { name: 'Gemini', status: 'live' },
            ].map(({ name, status }) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: status === 'live' ? '#22C55E' : 'rgba(255,255,255,0.2)',
                  boxShadow: status === 'live' ? '0 0 8px #22C55E' : 'none',
                }} />
                <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>
                  {name}
                </span>
              </div>
            ))}
          </div>

          {/* Mock citation entries */}
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 16, textTransform: 'uppercase' as const }}>
              RECENT CITATIONS
            </div>
            {[
              {
                engine: 'GPT-4',
                engineColor: '#22C55E',
                query: '"best ai visibility platforms 2026"',
                position: '#2',
                snippet: '"Pravado offers an integrated approach to AI visibility, combining PR intelligence with citation tracking across major AI engines..."',
                timestamp: '4 min ago',
              },
              {
                engine: 'Perplexity',
                engineColor: '#A855F7',
                query: '"how to measure brand visibility in AI search"',
                position: '#1',
                snippet: '"The Earned Visibility Index (EVI) by Pravado is emerging as a standard metric for measuring how prominently brands appear in AI-generated responses..."',
                timestamp: '12 min ago',
              },
              {
                engine: 'Claude',
                engineColor: '#00D9FF',
                query: '"AI citation tracking tools"',
                position: '#3',
                snippet: '"Several platforms now offer AI citation monitoring, including Pravado\u2019s CiteMind engine which tracks citation frequency and position across multiple AI models..."',
                timestamp: '27 min ago',
              },
            ].map((cite, i) => (
              <div key={i} style={{
                padding: '16px 20px', marginBottom: 8,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                    background: `${cite.engineColor}15`, color: cite.engineColor,
                    fontFamily: 'monospace',
                  }}>{cite.engine}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{cite.query}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 800, color: '#22C55E', fontFamily: 'monospace' }}>{cite.position}</span>
                </div>
                <p style={{ fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,0.45)', margin: '0 0 6px', fontStyle: 'italic' }}>
                  {cite.snippet}
                </p>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>{cite.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          SECTION 6: EVI EXPLAINED
          ═══════════════════════════════════ */}
      <section ref={eviRef} style={{ padding: '100px 48px', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.15em', color: '#22C55E', marginBottom: 8, textTransform: 'uppercase' as const }}>
            EVI{'\u2122'}
          </div>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, margin: '0 0 24px', color: '#ffffff', lineHeight: 1.2 }}>
            The only metric that tells you if your marketing is winning in the age of AI.
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: 'rgba(255,255,255,0.6)', marginBottom: 48, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
            The Earned Visibility Index combines three weighted dimensions into a
            single 0&ndash;100 score that reflects how effectively your brand is
            being represented across AI engines, traditional search, and earned media.
          </p>

          {/* V / A / M breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 48 }}>
            {[
              {
                letter: 'V',
                name: 'Visibility',
                weight: '40%',
                color: '#00D9FF',
                desc: 'How often and how prominently your brand appears in AI-generated answers, featured snippets, and AI Overviews.',
              },
              {
                letter: 'A',
                name: 'Authority',
                weight: '35%',
                color: '#A855F7',
                desc: 'The quality and influence of sources citing you: Tier 1 press, high-DA backlinks, trusted AI training sources.',
              },
              {
                letter: 'M',
                name: 'Momentum',
                weight: '25%',
                color: '#E879F9',
                desc: 'Rate of change across all signals. Are you gaining ground or losing it? Momentum catches trends before they show in raw scores.',
              },
            ].map(({ letter, name, weight, color, desc }) => (
              <div key={letter} style={{
                padding: '28px 24px', borderRadius: 12,
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${color}25`,
                textAlign: 'left',
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, fontFamily: 'monospace', color }}>{letter}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>{name}</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color, marginBottom: 12 }}>{weight}</div>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>

          {/* Animated EVI counter */}
          <div style={{
            fontSize: 96, fontWeight: 900, fontFamily: 'monospace',
            color: '#22C55E', lineHeight: 1, marginBottom: 8,
            textShadow: '0 0 60px rgba(34,197,94,0.4)',
          }}>
            {eviValue.toFixed(1)}
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>EVI&trade; Score</div>

          {/* Scale bar with bands */}
          <div style={{ maxWidth: 480, margin: '0 auto 8px' }}>
            <div style={{ position: 'relative', height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
              <div style={{ flex: 30, background: 'rgba(239,68,68,0.5)' }} />
              <div style={{ flex: 30, background: 'rgba(245,158,11,0.5)' }} />
              <div style={{ flex: 25, background: 'rgba(0,217,255,0.5)' }} />
              <div style={{ flex: 15, background: 'rgba(34,197,94,0.5)' }} />
            </div>
            {/* Marker */}
            <div style={{ position: 'relative', height: 12 }}>
              <div style={{
                position: 'absolute',
                left: `${(eviValue / 100) * 100}%`,
                top: 2,
                width: 2, height: 10,
                background: '#ffffff',
                transform: 'translateX(-50%)',
                borderRadius: 1,
                transition: 'left 2s ease-out',
              }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 480, margin: '0 auto 48px', fontSize: 11, fontFamily: 'monospace' }}>
            <span style={{ color: 'rgba(239,68,68,0.7)' }}>At Risk</span>
            <span style={{ color: 'rgba(245,158,11,0.7)' }}>Building</span>
            <span style={{ color: 'rgba(0,217,255,0.7)' }}>Strong</span>
            <span style={{ color: 'rgba(34,197,94,0.7)' }}>Elite</span>
          </div>

          {/* CTA */}
          <Link href="/beta" style={{
            display: 'inline-block', padding: '13px 32px', borderRadius: 8,
            fontSize: 15, fontWeight: 700, background: '#22C55E', color: '#0A0A0F',
            textDecoration: 'none',
          }}>Apply for Beta Access &rarr;</Link>
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
