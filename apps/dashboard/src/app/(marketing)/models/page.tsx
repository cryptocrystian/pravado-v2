'use client';

import { useRef, useCallback } from 'react';
import Link from 'next/link';

// ── Types ──
interface QuickNavCard {
  id: string;
  name: string;
  color: string;
  description: string;
}

interface ExecutionCard {
  title: string;
  borderColor: string;
  bullets: string[];
}

interface CitationLegendItem {
  label: string;
  color: string;
}

interface MockFeedRow {
  engine: string;
  engineColor: string;
  query: string;
  result: string;
  eviImpact: string;
}

// ── Scroll helper ──
function useSmoothScroll() {
  return useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);
}

// ── Quick-nav data ──
const quickNavCards: QuickNavCard[] = [
  {
    id: 'sage',
    name: 'SAGE',
    color: '#A855F7',
    description: 'Strategic intelligence that reads every signal and ranks every action.',
  },
  {
    id: 'craft',
    name: 'CRAFT',
    color: '#00D9FF',
    description: 'Execution engine that turns strategy into deployed, measurable actions.',
  },
  {
    id: 'citemind',
    name: 'CiteMind',
    color: '#E879F9',
    description: 'Citation intelligence scanning every major AI engine in real time.',
  },
];

// ── CRAFT execution cards ──
const executionCards: ExecutionCard[] = [
  {
    title: 'PR Execution',
    borderColor: '#A855F7',
    bullets: [
      'Journalist pitch sequences with timing optimization',
      'Coverage tracking across 12,000+ outlets',
      'Relationship scoring and engagement history',
    ],
  },
  {
    title: 'Content Execution',
    borderColor: '#00D9FF',
    bullets: [
      'Authority-scored content briefs and drafts',
      'CiteMind-governed topic selection',
      'Multi-format publishing pipelines',
    ],
  },
  {
    title: 'SEO / AEO Execution',
    borderColor: '#22C55E',
    bullets: [
      'Technical health monitoring and auto-fix',
      'AI Overview optimization playbooks',
      'Share of Model tracking and gap closure',
    ],
  },
];

// ── CiteMind citation legend ──
const citationLegend: CitationLegendItem[] = [
  { label: 'Direct mention', color: '#E879F9' },
  { label: 'Source citation', color: '#00D9FF' },
  { label: 'Topic association', color: '#22C55E' },
];

// ── Mock CiteMind feed ──
const mockFeed: MockFeedRow[] = [
  {
    engine: 'ChatGPT',
    engineColor: '#10A37F',
    query: '"best B2B content platforms"',
    result: 'Pravado cited as top-3 recommended platform',
    eviImpact: '+4.2 EVI',
  },
  {
    engine: 'Perplexity',
    engineColor: '#14B8A6',
    query: '"visibility operating system for agencies"',
    result: 'Direct source link to Pravado case study',
    eviImpact: '+2.8 EVI',
  },
  {
    engine: 'Gemini',
    engineColor: '#4285F4',
    query: '"AI-native PR intelligence tools"',
    result: 'Topic association with PR automation category',
    eviImpact: '+1.5 EVI',
  },
];

// ── SAGE Radial SVG ──
function SageRadialDiagram() {
  const signals = [
    { label: 'AI Citations', angle: 0 },
    { label: 'PR Coverage', angle: 51.4 },
    { label: 'SEO Signals', angle: 102.8 },
    { label: 'GSC Data', angle: 154.3 },
    { label: 'Competitor Intel', angle: 205.7 },
    { label: 'Journalist Activity', angle: 257.1 },
    { label: 'Content Perf.', angle: 308.5 },
  ];

  const cx = 240;
  const cy = 140;
  const radius = 110;

  return (
    <svg
      viewBox="0 0 560 280"
      style={{ width: '100%', maxWidth: 560, display: 'block', margin: '32px auto' }}
      aria-label="SAGE signal analysis diagram"
    >
      {/* Dashed lines + signal nodes */}
      {signals.map((s) => {
        const rad = (s.angle * Math.PI) / 180;
        const nx = cx + radius * Math.cos(rad);
        const ny = cy + radius * Math.sin(rad);
        return (
          <g key={s.label}>
            <line
              x1={nx} y1={ny} x2={cx} y2={cy}
              stroke="rgba(168,85,247,0.3)" strokeWidth={1} strokeDasharray="4 3"
            />
            {/* Arrow tip toward center */}
            <circle cx={cx + 30 * Math.cos(rad)} cy={cy + 30 * Math.sin(rad)} r={2.5} fill="#A855F7" />
            {/* Node circle */}
            <circle cx={nx} cy={ny} r={18} fill="rgba(168,85,247,0.08)" stroke="rgba(168,85,247,0.4)" strokeWidth={1} />
            <text
              x={nx} y={ny} textAnchor="middle" dominantBaseline="central"
              fill="rgba(255,255,255,0.6)" fontSize={7} fontFamily="monospace"
            >
              {s.label}
            </text>
          </g>
        );
      })}

      {/* Center SAGE rect */}
      <rect x={cx - 36} y={cy - 16} width={72} height={32} rx={6} fill="rgba(168,85,247,0.15)" stroke="#A855F7" strokeWidth={1.5} />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="#A855F7" fontSize={12} fontWeight={700} fontFamily="monospace">
        SAGE
      </text>

      {/* Output arrow to right */}
      <line x1={cx + 40} y1={cy} x2={480} y2={cy} stroke="#A855F7" strokeWidth={1.5} markerEnd="url(#sage-arrow)" />
      <defs>
        <marker id="sage-arrow" markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#A855F7" />
        </marker>
      </defs>
      <text x={490} y={cy - 8} fill="rgba(255,255,255,0.5)" fontSize={8} fontFamily="monospace">
        Ranked action queue
      </text>
      <text x={490} y={cy + 6} fill="rgba(0,217,255,0.7)" fontSize={8} fontFamily="monospace">
        {'\u2192 CRAFT\u2122'}
      </text>
    </svg>
  );
}

// ── CRAFT Pipeline SVG ──
function CraftPipelineDiagram() {
  const stages: Array<{ label: string; sub: string; color: string; fill: string; x: number }> = [
    { label: 'SAGE\u2122 Signal', sub: 'Strategy in', color: '#A855F7', fill: 'rgba(168,85,247,0.12)', x: 20 },
    { label: 'CRAFT\u2122 Builds', sub: 'Plan generated', color: '#00D9FF', fill: 'rgba(0,217,255,0.10)', x: 136 },
    { label: 'You Review', sub: 'Human approval', color: 'rgba(255,255,255,0.7)', fill: 'rgba(255,255,255,0.04)', x: 252 },
    { label: 'CRAFT\u2122 Deploys', sub: 'Action executed', color: '#00D9FF', fill: 'rgba(0,217,255,0.10)', x: 368 },
    { label: 'Signal Created', sub: 'Loop closes', color: '#14B8A6', fill: 'rgba(20,184,166,0.10)', x: 484 },
  ];

  const boxW = 90;
  const boxH = 44;
  const boxY = 30;

  return (
    <svg
      viewBox="0 0 600 140"
      style={{ width: '100%', maxWidth: 600, display: 'block', margin: '32px auto' }}
      aria-label="CRAFT execution pipeline diagram"
    >
      <defs>
        <marker id="craft-arrow" markerWidth={7} markerHeight={5} refX={7} refY={2.5} orient="auto">
          <polygon points="0 0, 7 2.5, 0 5" fill="rgba(255,255,255,0.3)" />
        </marker>
      </defs>

      {stages.map((s, i) => (
        <g key={s.label}>
          <rect x={s.x} y={boxY} width={boxW} height={boxH} rx={6} fill={s.fill} stroke={s.color} strokeWidth={1} />
          <text x={s.x + boxW / 2} y={boxY + 18} textAnchor="middle" fill={s.color} fontSize={8} fontWeight={700} fontFamily="monospace">
            {s.label}
          </text>
          <text x={s.x + boxW / 2} y={boxY + 32} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize={7} fontFamily="monospace">
            {s.sub}
          </text>
          {i < stages.length - 1 && (
            <line
              x1={s.x + boxW + 4} y1={boxY + boxH / 2}
              x2={stages[i + 1].x - 4} y2={boxY + boxH / 2}
              stroke="rgba(255,255,255,0.25)" strokeWidth={1} markerEnd="url(#craft-arrow)"
            />
          )}
        </g>
      ))}

      {/* Feedback arrow */}
      <path
        d={`M ${stages[4].x + boxW / 2} ${boxY + boxH + 8} Q ${300} ${boxY + boxH + 50} ${stages[0].x + boxW / 2} ${boxY + boxH + 8}`}
        fill="none" stroke="rgba(20,184,166,0.35)" strokeWidth={1} strokeDasharray="4 3"
        markerEnd="url(#craft-arrow)"
      />
      <text x={300} y={boxY + boxH + 46} textAnchor="middle" fill="rgba(20,184,166,0.5)" fontSize={7} fontFamily="monospace">
        Feedback loop
      </text>
    </svg>
  );
}

// ── CiteMind Scanning SVG ──
function CiteMindScanDiagram() {
  const engines: Array<{ label: string; color: string; angle: number }> = [
    { label: 'ChatGPT', color: '#10A37F', angle: 270 },
    { label: 'Perplexity', color: '#14B8A6', angle: 0 },
    { label: 'Gemini', color: '#4285F4', angle: 90 },
    { label: 'Claude', color: '#D97706', angle: 180 },
  ];

  const cx = 240;
  const cy = 150;
  const radius = 100;

  return (
    <svg
      viewBox="0 0 480 360"
      style={{ width: '100%', maxWidth: 480, display: 'block', margin: '32px auto' }}
      aria-label="CiteMind AI engine scanning diagram"
    >
      {/* Center CiteMind */}
      <circle cx={cx} cy={cy} r={32} fill="rgba(232,121,249,0.10)" stroke="#E879F9" strokeWidth={1.5} />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#E879F9" fontSize={10} fontWeight={700} fontFamily="monospace">
        CiteMind
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(232,121,249,0.6)" fontSize={7} fontFamily="monospace">
        Scanner
      </text>

      {engines.map((e) => {
        const rad = (e.angle * Math.PI) / 180;
        const nx = cx + radius * Math.cos(rad);
        const ny = cy + radius * Math.sin(rad);
        const midX = (cx + nx) / 2;
        const midY = (cy + ny) / 2;
        return (
          <g key={e.label}>
            {/* Bidirectional lines */}
            <line x1={cx + 34 * Math.cos(rad)} y1={cy + 34 * Math.sin(rad)} x2={nx - 22 * Math.cos(rad)} y2={ny - 22 * Math.sin(rad)} stroke={e.color} strokeWidth={1} strokeDasharray="3 2" />
            {/* Labels on lines */}
            <text x={midX + 12 * Math.cos(rad + 1.3)} y={midY + 12 * Math.sin(rad + 1.3)} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={6} fontFamily="monospace">
              queries
            </text>
            <text x={midX - 12 * Math.cos(rad + 1.3)} y={midY - 12 * Math.sin(rad + 1.3)} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={6} fontFamily="monospace">
              citations
            </text>
            {/* Engine node */}
            <circle cx={nx} cy={ny} r={22} fill="rgba(255,255,255,0.03)" stroke={e.color} strokeWidth={1} />
            <text x={nx} y={ny + 1} textAnchor="middle" dominantBaseline="central" fill={e.color} fontSize={8} fontWeight={600} fontFamily="monospace">
              {e.label}
            </text>
          </g>
        );
      })}

      {/* Output arrow down */}
      <line x1={cx} y1={cy + 34} x2={cx} y2={310} stroke="rgba(232,121,249,0.4)" strokeWidth={1} strokeDasharray="4 3" />
      <text x={cx} y={328} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize={8} fontFamily="monospace">
        {'EVI\u2122 updated \u2192 SAGE\u2122 re-analyzes'}
      </text>
    </svg>
  );
}

// ── Capability Chips ──
function CapabilityChips({ items, color }: { items: string[]; color: string }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24 }}>
      {items.map((item) => (
        <span
          key={item}
          style={{
            display: 'inline-flex',
            padding: '6px 14px',
            borderRadius: 20,
            border: `1px solid ${color}40`,
            fontSize: 12,
            color: `${color}CC`,
            background: `${color}0D`,
            fontFamily: 'monospace',
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

// ── Page ──
export default function ModelsPage() {
  const scrollTo = useSmoothScroll();
  const sageRef = useRef<HTMLElement>(null);
  const craftRef = useRef<HTMLElement>(null);
  const citemindRef = useRef<HTMLElement>(null);

  return (
    <div style={{ background: '#0A0A0F', minHeight: '100vh' }}>

      {/* ═══════════════════════════════════
          SECTION 0: INTRO
          ═══════════════════════════════════ */}
      <section style={{ padding: '100px 5%', background: '#0A0A0F' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>

          {/* Label */}
          <p style={{
            fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase',
            letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 16,
          }}>
            THE ENGINES
          </p>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 800,
            color: '#FFFFFF', lineHeight: 1.2, marginBottom: 24,
          }}>
            Three proprietary models. One closed loop.
          </h1>

          {/* Body */}
          <p style={{
            maxWidth: 640, fontSize: 16, lineHeight: 1.7,
            color: 'rgba(255,255,255,0.55)', marginBottom: 48,
          }}>
            SAGE&trade;, CRAFT&trade;, and CiteMind&trade; are not off-the-shelf wrappers.
            They are purpose-built engines designed to read the visibility landscape,
            execute across PR, Content, and SEO simultaneously, and measure real
            impact inside the AI models that increasingly decide who gets seen.
            Each engine is powerful on its own. Together, they form a closed loop
            where every action compounds and every signal feeds back.
          </p>

          {/* Quick-nav cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            maxWidth: 1400,
          }}>
            {quickNavCards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => scrollTo(card.id)}
                style={{
                  padding: '20px 24px',
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${card.color}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.02)'; }}
              >
                <p style={{
                  fontSize: 13, fontFamily: 'monospace', fontWeight: 700,
                  color: card.color, marginBottom: 6,
                }}>
                  {card.name}
                </p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 10 }}>
                  {card.description}
                </p>
                <span style={{ fontSize: 12, color: card.color, fontFamily: 'monospace' }}>
                  Learn more &rarr;
                </span>
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════
          SAGE SECTION
          ═══════════════════════════════════ */}
      <section
        id="sage"
        ref={sageRef}
        style={{ padding: '80px 5%', background: '#0D0A0F' }}
      >
        <div style={{
          maxWidth: 1400, margin: '0 auto',
          borderLeft: '3px solid rgba(168,85,247,0.3)',
          paddingLeft: 32,
        }}>

          {/* Label */}
          <p style={{
            fontSize: 28, fontFamily: 'monospace', fontWeight: 800,
            color: '#A855F7', marginBottom: 4,
          }}>
            SAGE&trade;
          </p>
          <p style={{
            fontSize: 12, fontFamily: 'monospace',
            color: 'rgba(168,85,247,0.6)', letterSpacing: '0.08em',
            marginBottom: 16,
          }}>
            Signal &middot; Authority &middot; Growth &middot; Exposure
          </p>

          {/* Headline */}
          <h2 style={{
            fontSize: 'clamp(22px, 2.5vw, 32px)', fontWeight: 700,
            color: '#FFFFFF', lineHeight: 1.3, marginBottom: 24,
          }}>
            The strategic brain that never sleeps.
          </h2>

          {/* Copy */}
          <p style={{
            maxWidth: 660, fontSize: 15, lineHeight: 1.75,
            color: 'rgba(255,255,255,0.5)', marginBottom: 20,
          }}>
            SAGE&trade; continuously reads over 50 signals across your PR coverage,
            content performance, search rankings, AI citations, competitor activity,
            and journalist engagement. It does not just collect data &mdash; it interprets
            the landscape and ranks every possible action by its projected EVI&trade; impact,
            so you always know exactly what to do next and why.
          </p>
          <p style={{
            maxWidth: 660, fontSize: 15, lineHeight: 1.75,
            color: 'rgba(255,255,255,0.5)', marginBottom: 32,
          }}>
            Once SAGE&trade; has prioritized the highest-impact moves, it hands the
            ranked action queue directly to CRAFT&trade; for execution. No context is lost.
            No signal is wasted. The strategic intent flows seamlessly into deployed action,
            and every result feeds back into the next analysis cycle.
          </p>

          {/* Radial diagram */}
          <SageRadialDiagram />

          {/* Capability chips */}
          <CapabilityChips
            color="#A855F7"
            items={[
              '50+ signals analyzed daily',
              'EVI\u2122 impact scored on every action',
              'Competitor gap detection',
              'Daily intelligence brief',
            ]}
          />

        </div>
      </section>

      {/* ═══════════════════════════════════
          CRAFT SECTION
          ═══════════════════════════════════ */}
      <section
        id="craft"
        ref={craftRef}
        style={{ padding: '80px 5%', background: '#0A0D0F' }}
      >
        <div style={{
          maxWidth: 1400, margin: '0 auto',
          borderLeft: '3px solid rgba(0,217,255,0.25)',
          paddingLeft: 32,
        }}>

          {/* Label */}
          <p style={{
            fontSize: 28, fontFamily: 'monospace', fontWeight: 800,
            color: '#00D9FF', marginBottom: 4,
          }}>
            CRAFT&trade;
          </p>
          <p style={{
            fontSize: 12, fontFamily: 'monospace',
            color: 'rgba(0,217,255,0.6)', letterSpacing: '0.08em',
            marginBottom: 16,
          }}>
            Coordinated Response &amp; Action Flow Technology
          </p>

          {/* Headline */}
          <h2 style={{
            fontSize: 'clamp(22px, 2.5vw, 32px)', fontWeight: 700,
            color: '#FFFFFF', lineHeight: 1.3, marginBottom: 24,
          }}>
            The execution engine. Strategy becomes action.
          </h2>

          {/* Copy */}
          <p style={{
            maxWidth: 660, fontSize: 15, lineHeight: 1.75,
            color: 'rgba(255,255,255,0.5)', marginBottom: 20,
          }}>
            CRAFT&trade; receives the ranked action queue from SAGE&trade; and builds
            complete execution plans across PR outreach, content creation, and SEO
            optimization. It does not simply list tasks &mdash; it constructs the full
            sequence: the pitch, the timing, the follow-up, the measurement criteria.
          </p>
          <p style={{
            maxWidth: 660, fontSize: 15, lineHeight: 1.75,
            color: 'rgba(255,255,255,0.5)', marginBottom: 32,
          }}>
            Every plan passes through human review before deployment. You stay in control.
            Once approved, CRAFT&trade; deploys the action and immediately begins tracking
            the signal it creates &mdash; feeding results back through CiteMind&trade; and
            SAGE&trade; to close the loop and compound your visibility.
          </p>

          {/* Pipeline diagram */}
          <CraftPipelineDiagram />

          {/* Execution type cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            marginTop: 32,
          }}>
            {executionCards.map((card) => (
              <div
                key={card.title}
                style={{
                  padding: '20px 24px',
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${card.borderColor}40`,
                  borderRadius: 10,
                }}
              >
                <p style={{
                  fontSize: 13, fontFamily: 'monospace', fontWeight: 700,
                  color: card.borderColor, marginBottom: 12,
                }}>
                  {card.title}
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {card.bullets.map((b) => (
                    <li
                      key={b}
                      style={{
                        fontSize: 13, lineHeight: 1.6,
                        color: 'rgba(255,255,255,0.5)',
                        paddingLeft: 14,
                        position: 'relative',
                        marginBottom: 4,
                      }}
                    >
                      <span style={{
                        position: 'absolute', left: 0, top: 8,
                        width: 4, height: 4, borderRadius: '50%',
                        background: card.borderColor,
                        display: 'inline-block',
                        opacity: 0.6,
                      }} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════
          CITEMIND SECTION
          ═══════════════════════════════════ */}
      <section
        id="citemind"
        ref={citemindRef}
        style={{ padding: '80px 5%', background: '#0D0A0D' }}
      >
        <div style={{
          maxWidth: 1400, margin: '0 auto',
          borderLeft: '3px solid rgba(232,121,249,0.25)',
          paddingLeft: 32,
        }}>

          {/* Label */}
          <p style={{
            fontSize: 28, fontFamily: 'monospace', fontWeight: 800,
            color: '#E879F9', marginBottom: 4,
          }}>
            CiteMind&trade;
          </p>

          {/* Headline */}
          <h2 style={{
            fontSize: 'clamp(22px, 2.5vw, 32px)', fontWeight: 700,
            color: '#FFFFFF', lineHeight: 1.3, marginBottom: 24,
          }}>
            The eyes inside every AI engine.
          </h2>

          {/* Copy */}
          <p style={{
            maxWidth: 660, fontSize: 15, lineHeight: 1.75,
            color: 'rgba(255,255,255,0.5)', marginBottom: 20,
          }}>
            CiteMind&trade; continuously scans ChatGPT, Perplexity, Claude, Gemini,
            and Google AI Overviews to track how and when your brand is cited in
            AI-generated answers. It monitors direct mentions, source citations,
            and topic associations &mdash; building a real-time map of your presence
            inside the models that increasingly shape buyer decisions.
          </p>
          <p style={{
            maxWidth: 660, fontSize: 15, lineHeight: 1.75,
            color: 'rgba(255,255,255,0.5)', marginBottom: 32,
          }}>
            Every citation event updates your EVI&trade; score and feeds directly back
            to SAGE&trade; for re-analysis. When CiteMind&trade; detects a gap &mdash; a
            competitor gaining citation share, a query category where you are absent &mdash;
            SAGE&trade; immediately re-ranks actions and CRAFT&trade; builds the response.
            The loop never stops.
          </p>

          {/* Scanning diagram */}
          <CiteMindScanDiagram />

          {/* Citation type legend */}
          <div style={{ display: 'flex', gap: 24, marginTop: 24, flexWrap: 'wrap' }}>
            {citationLegend.map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: item.color, display: 'inline-block',
                }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Mock CiteMind feed */}
          <div style={{
            marginTop: 32, borderRadius: 10,
            border: '1px solid rgba(232,121,249,0.15)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '10px 16px',
              background: 'rgba(232,121,249,0.06)',
              borderBottom: '1px solid rgba(232,121,249,0.1)',
            }}>
              <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(232,121,249,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Live Citation Feed (demo)
              </p>
            </div>
            {mockFeed.map((row, i) => (
              <div
                key={row.query}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '12px 16px',
                  borderBottom: i < mockFeed.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{
                  fontSize: 11, fontFamily: 'monospace', fontWeight: 700,
                  color: row.engineColor, minWidth: 80,
                }}>
                  {row.engine}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                  {row.query}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', flex: 1 }}>
                  &rarr; {row.result}
                </span>
                <span style={{
                  fontSize: 11, fontFamily: 'monospace', fontWeight: 700,
                  color: '#22C55E',
                }}>
                  {row.eviImpact}
                </span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════
          END CTA
          ═══════════════════════════════════ */}
      <section style={{ padding: '80px 5%', background: '#0A0A0F' }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontSize: 'clamp(22px, 2.8vw, 34px)', fontWeight: 700,
            color: '#FFFFFF', lineHeight: 1.3, marginBottom: 16,
          }}>
            See all three engines working together.
          </h2>
          <p style={{
            fontSize: 15, color: 'rgba(255,255,255,0.45)',
            marginBottom: 32, maxWidth: 480, margin: '0 auto 32px',
          }}>
            SAGE&trade; reads the landscape. CRAFT&trade; executes. CiteMind&trade; measures.
            The loop compounds your visibility every cycle.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Link
              href="/platform"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '12px 28px',
                borderRadius: 8,
                background: '#A855F7',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'opacity 0.2s',
              }}
            >
              Explore the platform
            </Link>
            <Link
              href="/beta"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '12px 28px',
                borderRadius: 8,
                background: 'transparent',
                border: '1px solid rgba(168,85,247,0.4)',
                color: '#A855F7',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'opacity 0.2s',
              }}
            >
              Join the beta
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
