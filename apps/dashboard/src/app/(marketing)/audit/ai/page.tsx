'use client';

/**
 * /audit/ai — AEO/AI-led entry path for the three-pillar EVI scorecard.
 *
 * D027 Phase 1D per docs/sprints/D027-AUDIT-REBUILD/WORK_ORDER.md.
 * Polish bar: "good and shippable" — production-quality bar belongs to
 * /audit/pr (halo). Same shared components and same mobile reflow
 * conventions as /audit/pr.
 *
 * Target buyer: Semrush AI Visibility / Profound / Search Atlas
 * refugees. Vocabulary is AEO-native, but the page does the explicit
 * reframe: AI visibility is a symptom, not a strategy. The pillar gets
 * the longest treatment, then immediately pivots to cross-pillar
 * dependency — citations are the output of PR signal + content
 * authority, not a thing you can monitor your way into.
 *
 * Layered messaging architecture mirrors /audit/pr:
 *   Hero → Problem (Layer 1) → Structural (Layer 2) → Reveal (Layer 3)
 *   → Mid-page form repeat → Social proof / category positioning
 *   → FAQ → Footer CTA.
 *
 * Pillar accent: cyber-blue (#00D9FF) — AI Citation pillar color.
 */

import {
  Brain,
  Newspaper,
  FileText,
  CheckCircle,
  XCircle,
  CaretDown,
  ArrowRight,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { useState } from 'react';

import type { ScanResponse } from '@/components/marketing/audit-types';
import { AuditForm } from '@/components/marketing/AuditForm';
import { EVIScorecardResults } from '@/components/marketing/EVIScorecardResults';

function TM() {
  return (
    <sup style={{ fontSize: '0.6em', verticalAlign: 'super' }}>&trade;</sup>
  );
}

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

interface FaqItem {
  q: string;
  a: string;
}

const FAQ: FaqItem[] = [
  {
    q: 'How is this different from Semrush AI Visibility Score?',
    a: 'Semrush AI Visibility scores citation outcomes — it tells you whether ChatGPT mentioned you this week. It is a measurement instrument and a good one. It is not a remediation system. Pravado measures the same outcome and decomposes it into the structural causes: the PR signal that put you in citation training data, the content authority that gives engines something to extract, the schema and entity scaffolding that lets them attribute correctly. You see the score AND the three things upstream that move it. The scorecard isn’t the product — the orchestration of what changes the score is.',
  },
  {
    q: 'How is this different from Profound?',
    a: 'Profound is the deepest pure-AEO monitoring product on the market — query-level tracking, competitive share-of-model, agent action tracking. Excellent at the measurement layer. Pravado overlaps on measurement (CiteMind tracks citations across the same five engines) but goes further: when a citation gap is identified, CRAFT generates the press release or pillar page or schema scaffolding required to close it, the 283K-profile media database routes the pitch, and the next scan measures whether it landed. Monitoring without remediation is a dashboard, not a system.',
  },
  {
    q: 'Isn’t AEO just SEO with new vocabulary?',
    a: 'No. SEO optimizes a page for a ranking algorithm against a query corpus. AEO optimizes for citation extraction across a fragmenting set of generative engines, each with a different training cutoff, retrieval pattern, and citation behavior. The work is structurally different — entity disambiguation, schema completeness, named-spokesperson coverage, citation worthiness. SEO is one input; PR signal and content authority architecture are larger inputs. AEO is the umbrella outcome.',
  },
  {
    q: 'What’s an Earned Visibility Index?',
    a: 'EVI is a 0–100 composite score that measures how visible your brand is in the places buyers actually make decisions: AI engines, search results, and earned media. The index decomposes into three pillars (PR, Content, AI Citation), each scored 0–100, weighted 0.40 / 0.35 / 0.25 to produce the composite. The AI Citation pillar is the smallest weight by design — because citation is the output of PR signal + content authority, not the cause of them. EVI keeps the input/output relationship visible.',
  },
  {
    q: 'Do you actually run scans against ChatGPT and Perplexity?',
    a: 'For the audit, the AI Citation pillar is computed by simulating buyer-intent queries against the trained behavior of five major engines (ChatGPT, Perplexity, Gemini, Claude, Bing Copilot). For paid customers, CiteMind runs live citation tracking — actual queries, weekly, with share-of-model trends and competitor comparison surfaced in the dashboard.',
  },
  {
    q: 'What happens after the scan?',
    a: 'We email you a magic link to a free dashboard view of your scorecard plus the option to book a call. The conversation focuses on which structural inputs (PR signal, content gaps, schema, entity coverage) are bottlenecking your AI citation outcome and what a remediation program looks like for your specific category. No upgrade pitch with a number — that belongs in a sales call.',
  },
];

export default function AuditAiPage() {
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  if (result) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            backgroundImage:
              'linear-gradient(rgba(0,217,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,217,255,0.025) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <EVIScorecardResults scanResult={result} entryPath="ai" />
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />

      {/* Technical grid — cyan tinted to flag AI Citation pillar */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          backgroundImage:
            'linear-gradient(rgba(0,217,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,217,255,0.025) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* ─────────────────────────────────────────────────────────── */}
        {/* SECTION 1: HERO                                            */}
        {/* ─────────────────────────────────────────────────────────── */}
        <section style={{ background: '#0A0A0F', padding: '120px 5% 80px' }}>
          <div
            className="audit-hero-grid"
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
              gap: 64,
              alignItems: 'start',
            }}
          >
            {/* Left: copy */}
            <div>
              <div style={{ marginBottom: 24 }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '6px 16px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    background: 'rgba(0,217,255,0.12)',
                    color: '#00D9FF',
                    border: '1px solid rgba(0,217,255,0.25)',
                  }}
                >
                  For AI Visibility Teams
                </span>
              </div>

              <h1
                style={{
                  fontSize: 56,
                  fontWeight: 800,
                  lineHeight: 1.05,
                  marginTop: 0,
                  marginBottom: 24,
                  background:
                    'linear-gradient(135deg, #ffffff 0%, #00D9FF 60%, #06B6D4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-0.02em',
                }}
              >
                You can see the citation gap. You can&apos;t see what causes it.
              </h1>

              <p
                style={{
                  fontSize: 19,
                  color: 'rgba(255,255,255,0.65)',
                  lineHeight: 1.6,
                  marginTop: 0,
                  marginBottom: 32,
                  maxWidth: 580,
                }}
              >
                Semrush shows your AI Visibility Score dipped. Profound shows
                the competitor took the share-of-model on three buyer-intent
                queries. You rewrite the page. The score pops back. Two weeks
                later it dips again. Monitoring is not strategy. AI citation is
                a downstream outcome of PR signal and content authority — and
                your AEO stack was designed to measure the outcome, not move the
                inputs.
              </p>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 24,
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <CheckCircle size={16} weight="fill" color="#22C55E" />
                  Free, no credit card
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <CheckCircle size={16} weight="fill" color="#22C55E" />
                  20–30 seconds
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <CheckCircle size={16} weight="fill" color="#22C55E" />
                  5-engine citation scan
                </span>
              </div>
            </div>

            {/* Right: form */}
            <div
              className="audit-hero-form-col"
              style={{
                padding: 32,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(0,217,255,0.15)',
                position: 'sticky',
                top: 32,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#00D9FF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 8,
                }}
              >
                Earned Visibility Scorecard
              </div>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#ffffff',
                  marginTop: 0,
                  marginBottom: 24,
                  lineHeight: 1.25,
                }}
              >
                Score your AI citations. See the inputs that actually move them.
              </h2>
              <AuditForm
                entryPath="ai"
                onResult={setResult}
                ctaLabel="Get my AI scorecard"
              />
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* SECTION 2: PROBLEM (Layer 1) — names lived experience      */}
        {/* ─────────────────────────────────────────────────────────── */}
        <section
          style={{
            background: '#0D0D14',
            padding: '80px 5%',
            borderTop: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              The Problem
            </div>
            <h2
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.2,
                marginTop: 0,
                marginBottom: 24,
                textAlign: 'center',
                letterSpacing: '-0.01em',
              }}
            >
              The dashboard tells you the citation dropped. It can&apos;t tell
              you why.
            </h2>
            <p
              style={{
                fontSize: 18,
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              You have an AEO tool. The AI Visibility Score is on the dashboard.
              The query-level breakdown is granular. You see exactly which
              prompts cite the competitor instead of you. You rewrite the page.
              Add the FAQ schema. Republish. The score recovers — sometimes. Two
              weeks later, a new query you weren&apos;t tracking starts citing
              somebody else&apos;s press hit from Bloomberg. You go fix that
              one. Then another. The monitoring is sharp. The remediation is
              whack-a-mole. Because what actually moves AI citation isn&apos;t a
              single page edit — it&apos;s the upstream PR signal and the
              architectural integrity of your content authority. Your tool was
              built to measure the symptom.
            </p>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* SECTION 3: STRUCTURAL (Layer 2) — names the silo            */}
        {/* ─────────────────────────────────────────────────────────── */}
        <section
          style={{
            background: '#0A0A0F',
            padding: '80px 5%',
            borderTop: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div style={{ maxWidth: 920, margin: '0 auto' }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              Why this is structural
            </div>
            <h2
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.2,
                marginTop: 0,
                marginBottom: 32,
                textAlign: 'center',
                letterSpacing: '-0.01em',
                maxWidth: 780,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              AEO tools see the symptom. The disease is two pillars upstream.
            </h2>

            <div style={{ maxWidth: 720, margin: '0 auto', marginBottom: 40 }}>
              <p
                style={{
                  fontSize: 17,
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1.75,
                  marginTop: 0,
                  marginBottom: 20,
                }}
              >
                Semrush AI Visibility, Profound, Search Atlas, Otterly — all
                credible measurement instruments. They tell you whether ChatGPT
                cited you, which queries the competitor took, how share-of-model
                trended this week. None of them generate the press hit that puts
                you in next quarter&apos;s training data. None of them produce
                the pillar page with the FAQ schema and named-entity coverage
                that lets the engines extract the answer. None of them route a
                journalist pitch.
              </p>
              <p
                style={{
                  fontSize: 17,
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1.75,
                  marginTop: 0,
                  marginBottom: 0,
                }}
              >
                AI citations are an output. The inputs are PR signal (does the
                trained-on web know you&apos;re the brand to cite for this
                topic?) and content authority (when an engine retrieves, is your
                page the clean extraction it wants?). AEO-only tools watch the
                output dial. Pravado moves the upstream inputs <em>and</em>{' '}
                watches the output — because the output is fed by inputs the
                tool itself controls.
              </p>
            </div>

            {/* Three-tool diagram */}
            <div
              className="audit-tools-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 16,
                maxWidth: 920,
                margin: '0 auto',
              }}
            >
              {[
                {
                  name: 'Semrush',
                  sees: 'AI Visibility Score, query-level citations, competitive share-of-model',
                  misses:
                    'No PR signal generation, no content authority remediation',
                },
                {
                  name: 'Profound',
                  sees: 'Deep query tracking, agent action visibility, brand mention sentiment',
                  misses: 'No upstream input control — measurement-only',
                },
                {
                  name: 'Pravado',
                  sees: 'All of the above + PR signal generation + content authority architecture',
                  misses: null,
                },
              ].map((tool) => {
                const isPravado = tool.name === 'Pravado';
                return (
                  <div
                    key={tool.name}
                    style={{
                      padding: 20,
                      borderRadius: 12,
                      background: isPravado
                        ? 'rgba(0,217,255,0.06)'
                        : 'rgba(255,255,255,0.03)',
                      border: isPravado
                        ? '1px solid rgba(0,217,255,0.3)'
                        : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: isPravado ? '#00D9FF' : '#ffffff',
                        marginBottom: 16,
                      }}
                    >
                      {tool.name}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'rgba(34,197,94,0.9)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          marginBottom: 6,
                        }}
                      >
                        Sees
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: 'rgba(255,255,255,0.75)',
                          lineHeight: 1.5,
                        }}
                      >
                        {tool.sees}
                      </div>
                    </div>
                    {tool.misses && (
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: 'rgba(239,68,68,0.9)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            marginBottom: 6,
                          }}
                        >
                          Misses
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: 'rgba(255,255,255,0.55)',
                            lineHeight: 1.5,
                          }}
                        >
                          {tool.misses}
                        </div>
                      </div>
                    )}
                    {isPravado && (
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: 6,
                          background: 'rgba(0,217,255,0.08)',
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.85)',
                          fontWeight: 600,
                          marginTop: 4,
                        }}
                      >
                        Measure the output. Move the inputs.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* SECTION 4: REVEAL (Layer 3) — three pillars credentialed   */}
        {/* AI Citation gets longest treatment, then pivots to         */}
        {/* cross-pillar dependency.                                   */}
        {/* ─────────────────────────────────────────────────────────── */}
        <section
          style={{
            background: '#0D0D14',
            padding: '80px 5%',
            borderTop: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              How Pravado works
            </div>
            <h2
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.2,
                marginTop: 0,
                marginBottom: 16,
                textAlign: 'center',
                letterSpacing: '-0.01em',
                maxWidth: 760,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              Three pillars of earned visibility. One scorecard. One platform
              that runs them together.
            </h2>
            <p
              style={{
                fontSize: 17,
                color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.6,
                margin: '0 auto 56px',
                textAlign: 'center',
                maxWidth: 720,
              }}
            >
              Best-in-class AI citation tracking. Compounding when paired with
              the PR and Content layers that feed the citation outcome — because
              the schema is shared at the platform level, not retrofitted across
              an acquisition stack.
            </p>

            {/* AI Citation Pillar — long treatment */}
            <div
              className="audit-pr-feature-grid"
              style={{
                padding: 40,
                borderRadius: 16,
                background: 'rgba(0,217,255,0.04)',
                border: '1px solid rgba(0,217,255,0.18)',
                marginBottom: 24,
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr)',
                gap: 40,
                alignItems: 'start',
              }}
            >
              <div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'rgba(0,217,255,0.15)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Brain size={26} weight="regular" color="#00D9FF" />
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#00D9FF',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom: 8,
                  }}
                >
                  Pillar 1
                </div>
                <h3
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: '#ffffff',
                    lineHeight: 1.2,
                    marginTop: 0,
                    marginBottom: 0,
                  }}
                >
                  AI Citation Authority
                </h3>
              </div>
              <div>
                <p
                  style={{
                    fontSize: 16,
                    color: 'rgba(255,255,255,0.75)',
                    lineHeight: 1.7,
                    marginTop: 0,
                    marginBottom: 16,
                  }}
                >
                  CiteMind
                  <TM /> tracks brand citations across{' '}
                  <strong style={{ color: '#ffffff' }}>
                    five major engines
                  </strong>{' '}
                  (ChatGPT, Perplexity, Gemini, Claude, Bing Copilot) at the
                  query level — share-of-model, sentiment, competitor
                  displacement, entity disambiguation accuracy, unlinked-mention
                  rate. As a measurement instrument, it is on parity with the
                  best AEO-only tools shipping today.
                </p>
                <p
                  style={{
                    fontSize: 16,
                    color: 'rgba(255,255,255,0.75)',
                    lineHeight: 1.7,
                    marginTop: 0,
                    marginBottom: 16,
                  }}
                >
                  But measurement isn&apos;t the moat. The moat is what the
                  platform does with the gap CiteMind surfaces — generate the
                  press release, route it through the 283K-profile journalist
                  database, scaffold the pillar page with the schema and
                  named-entity coverage required, then re-scan to confirm the
                  citation flipped. AEO tools watch. Pravado watches and moves.
                </p>
                <ul
                  className="audit-pr-features-list"
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 8,
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  {[
                    '5-engine citation tracking',
                    'Share-of-model trends',
                    'Entity disambiguation scoring',
                    'Unlinked-mention recovery',
                    'Competitor displacement alerts',
                    'Citation-gap remediation hooks',
                  ].map((feature) => (
                    <li
                      key={feature}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <CheckCircle size={14} weight="fill" color="#00D9FF" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* PR + Content — briefer treatment, framed as the upstream inputs */}
            <div
              className="audit-pillars-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 24,
              }}
            >
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
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(232,121,249,0.15)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Newspaper size={22} weight="regular" color="#E879F9" />
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#E879F9',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom: 6,
                  }}
                >
                  Pillar 2 — Upstream input
                </div>
                <h3
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#ffffff',
                    lineHeight: 1.25,
                    marginTop: 0,
                    marginBottom: 14,
                  }}
                >
                  PR Authority
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.7)',
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  The press hits in tier-1 outlets are what put your brand in
                  next quarter&apos;s LLM training data. Pravado&apos;s
                  283K-profile media database, beat-aware matching, and
                  named-spokesperson routing exist so the citation gap CiteMind
                  surfaces today has a press signal closing it tomorrow.
                </p>
              </div>

              <div
                style={{
                  padding: 32,
                  borderRadius: 16,
                  background: 'rgba(168,85,247,0.04)',
                  border: '1px solid rgba(168,85,247,0.15)',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(168,85,247,0.15)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <FileText size={22} weight="regular" color="#A855F7" />
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#A855F7',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom: 6,
                  }}
                >
                  Pillar 3 — Upstream input
                </div>
                <h3
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#ffffff',
                    lineHeight: 1.25,
                    marginTop: 0,
                    marginBottom: 14,
                  }}
                >
                  Content Authority
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.7)',
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  When an engine retrieves to answer a buyer query, the content
                  it finds has to be the clean extraction it wants. CRAFT
                  scaffolds pillar pages with FAQ schema, named-entity coverage,
                  and topic cluster integrity — the architecture that makes your
                  content the citation, not someone else&apos;s.
                </p>
              </div>
            </div>

            {/* Orchestration callout — frames the cross-pillar dependency */}
            <div
              style={{
                marginTop: 40,
                padding: 28,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontSize: 16,
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1.7,
                  margin: 0,
                  maxWidth: 800,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                The orchestration layer (
                <strong style={{ color: '#A855F7' }}>SAGE</strong>
                <TM /> strategy mesh,{' '}
                <strong style={{ color: '#00D9FF' }}>CRAFT</strong>
                <TM /> execution,{' '}
                <strong style={{ color: '#E879F9' }}>CiteMind</strong>
                <TM /> citation intelligence) is what no AEO-only tool can ship
                — because moving the inputs requires schema shared with the PR
                and Content pillars at the platform level. Acquisition stacks
                can&apos;t retrofit it.
              </p>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* SECTION 5: MID-PAGE FORM REPEAT                            */}
        {/* ─────────────────────────────────────────────────────────── */}
        <section
          style={{
            background: '#0A0A0F',
            padding: '80px 5%',
            borderTop: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <h2
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.2,
                marginTop: 0,
                marginBottom: 12,
                textAlign: 'center',
                letterSpacing: '-0.01em',
              }}
            >
              See the citation. See what feeds it.
            </h2>
            <p
              style={{
                fontSize: 16,
                color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.6,
                margin: '0 auto 40px',
                textAlign: 'center',
                maxWidth: 600,
              }}
            >
              Free three-pillar scorecard. AI citation share-of-model plus the
              upstream PR and content gaps that decide whether it grows. 20–30
              seconds.
            </p>
            <div
              style={{
                padding: 32,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(0,217,255,0.15)',
              }}
            >
              <AuditForm
                entryPath="ai"
                onResult={setResult}
                ctaLabel="Get my AI scorecard"
              />
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* SECTION 6: SOCIAL PROOF / CATEGORY POSITIONING             */}
        {/* ─────────────────────────────────────────────────────────── */}
        <section
          style={{
            background: '#0D0D14',
            padding: '80px 5%',
            borderTop: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              How Pravado compares
            </div>
            <h2
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.2,
                marginTop: 0,
                marginBottom: 16,
                textAlign: 'center',
                letterSpacing: '-0.01em',
              }}
            >
              Measurement parity. Remediation no AEO-only tool can ship.
            </h2>
            <p
              style={{
                fontSize: 16,
                color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.65,
                margin: '0 auto 48px',
                textAlign: 'center',
                maxWidth: 720,
              }}
            >
              Semrush AI Visibility and Profound are credible measurement
              instruments and Pravado overlaps where it matters: query-level
              citation tracking across the same five engines. The
              differentiation is everything that happens after a gap is found.
            </p>

            {/* Comparison table */}
            <div
              className="audit-compare-wrapper"
              style={{
                borderRadius: 14,
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
                overflow: 'hidden',
              }}
            >
              <div
                className="audit-compare-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'minmax(0, 1.4fr) repeat(3, minmax(0, 1fr))',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(0,0,0,0.2)',
                }}
              >
                <div
                  style={{
                    padding: '16px 20px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Capability
                </div>
                <div
                  style={{
                    padding: '16px 20px',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.7)',
                    textAlign: 'center',
                  }}
                >
                  Semrush AI
                </div>
                <div
                  style={{
                    padding: '16px 20px',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.7)',
                    textAlign: 'center',
                  }}
                >
                  Profound
                </div>
                <div
                  style={{
                    padding: '16px 20px',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#00D9FF',
                    textAlign: 'center',
                  }}
                >
                  Pravado
                </div>
              </div>
              {[
                {
                  capability: 'Multi-engine citation tracking',
                  sem: true,
                  prof: true,
                  pravado: true,
                },
                {
                  capability: 'Query-level share-of-model',
                  sem: true,
                  prof: true,
                  pravado: true,
                },
                {
                  capability: 'Competitor citation displacement alerts',
                  sem: true,
                  prof: true,
                  pravado: true,
                },
                {
                  capability: 'Pre-publish citation worthiness scoring',
                  sem: false,
                  prof: false,
                  pravado: true,
                },
                {
                  capability: 'PR pillar (283K media database)',
                  sem: false,
                  prof: false,
                  pravado: true,
                },
                {
                  capability: 'Pillar page + schema content layer',
                  sem: false,
                  prof: false,
                  pravado: true,
                },
                {
                  capability: 'Cross-pillar EVI scorecard',
                  sem: false,
                  prof: false,
                  pravado: true,
                },
                {
                  capability: 'Shared schema across PR / Content / AEO',
                  sem: false,
                  prof: false,
                  pravado: true,
                },
              ].map((row, i) => (
                <div
                  key={row.capability}
                  className="audit-compare-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'minmax(0, 1.4fr) repeat(3, minmax(0, 1fr))',
                    borderTop:
                      i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                    background:
                      i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                  }}
                >
                  <div
                    style={{
                      padding: '14px 20px',
                      fontSize: 14,
                      color: 'rgba(255,255,255,0.85)',
                    }}
                  >
                    {row.capability}
                  </div>
                  <div style={{ padding: '14px 20px', textAlign: 'center' }}>
                    {row.sem ? (
                      <CheckCircle
                        size={20}
                        weight="fill"
                        color="rgba(34,197,94,0.7)"
                      />
                    ) : (
                      <XCircle
                        size={20}
                        weight="regular"
                        color="rgba(255,255,255,0.2)"
                      />
                    )}
                  </div>
                  <div style={{ padding: '14px 20px', textAlign: 'center' }}>
                    {row.prof ? (
                      <CheckCircle
                        size={20}
                        weight="fill"
                        color="rgba(34,197,94,0.7)"
                      />
                    ) : (
                      <XCircle
                        size={20}
                        weight="regular"
                        color="rgba(255,255,255,0.2)"
                      />
                    )}
                  </div>
                  <div style={{ padding: '14px 20px', textAlign: 'center' }}>
                    {row.pravado && (
                      <CheckCircle size={20} weight="fill" color="#00D9FF" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.35)',
                textAlign: 'center',
                marginTop: 16,
                marginBottom: 0,
              }}
            >
              Comparison reflects publicly stated capabilities of Semrush AI
              Visibility and Profound as of 2026.
            </p>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* SECTION 7: FAQ                                              */}
        {/* ─────────────────────────────────────────────────────────── */}
        <section
          style={{
            background: '#0A0A0F',
            padding: '80px 5%',
            borderTop: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <h2
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.2,
                marginTop: 0,
                marginBottom: 40,
                textAlign: 'center',
                letterSpacing: '-0.01em',
              }}
            >
              Frequently asked questions
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FAQ.map((item, i) => {
                const isOpen = openFaq === i;
                return (
                  <div
                    key={item.q}
                    style={{
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      style={{
                        width: '100%',
                        padding: '20px 24px',
                        background: 'transparent',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: 16,
                        fontWeight: 600,
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 16,
                      }}
                    >
                      <span>{item.q}</span>
                      <CaretDown
                        size={18}
                        weight="bold"
                        color="rgba(255,255,255,0.5)"
                        style={{
                          flexShrink: 0,
                          transition: 'transform 0.2s ease',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      />
                    </button>
                    {isOpen && (
                      <div
                        style={{
                          padding: '0 24px 22px',
                          fontSize: 15,
                          color: 'rgba(255,255,255,0.7)',
                          lineHeight: 1.7,
                        }}
                      >
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* SECTION 8: FOOTER CTA                                      */}
        {/* ─────────────────────────────────────────────────────────── */}
        <section
          style={{
            background: '#0D0D14',
            padding: '80px 5%',
            borderTop: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
            <h2
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.2,
                marginTop: 0,
                marginBottom: 16,
                letterSpacing: '-0.01em',
              }}
            >
              Score your AI citations. Move the inputs.
            </h2>
            <p
              style={{
                fontSize: 17,
                color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.6,
                margin: '0 auto 40px',
                maxWidth: 560,
              }}
            >
              Free three-pillar EVI
              <TM /> scorecard. No credit card. No upgrade pitch. The
              conversation that matters happens after the scan, on a call where
              your specifics are on the table.
            </p>

            <div
              style={{
                padding: 32,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(0,217,255,0.18)',
                marginBottom: 24,
                textAlign: 'left',
              }}
            >
              <AuditForm
                entryPath="ai"
                onResult={setResult}
                ctaLabel="Get my AI scorecard"
              />
            </div>

            <p
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.45)',
                margin: 0,
              }}
            >
              Or skip the scan and{' '}
              <Link
                href="https://pravado.io/contact"
                style={{
                  color: '#00D9FF',
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                book a call directly
                <ArrowRight size={13} weight="bold" />
              </Link>
              .
            </p>
          </div>
        </section>
      </div>

      {/* ── Mobile reflow ─────────────────────────────────────────── */}
      {/* Mirrors /audit/pr/page.tsx breakpoint conventions verified  */}
      {/* live at 375/768/1024 in commit a6d37ff (Phase 1C.1).        */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .audit-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
          .audit-hero-form-col {
            position: static !important;
            top: auto !important;
          }
          .audit-tools-grid {
            grid-template-columns: 1fr !important;
          }
          .audit-pr-feature-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
            padding: 28px !important;
          }
          .audit-pillars-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .audit-pr-features-list {
            grid-template-columns: 1fr !important;
          }
          .audit-compare-wrapper {
            overflow-x: auto !important;
          }
          .audit-compare-grid {
            min-width: 600px !important;
          }
        }
      `}</style>
    </>
  );
}
