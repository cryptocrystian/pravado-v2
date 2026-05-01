'use client';

/**
 * /audit/pr — PR-led entry path for the three-pillar EVI scorecard.
 *
 * Halo pillar per docs/canon/DECISIONS_LOG.md D027. PR is Pravado's
 * best shot at unambiguously defensible best-in-class status (AEO is
 * crowded, Content is HubSpot's category, PR software is stale and
 * Pravado has the 283K-profile database advantage).
 *
 * Target buyer: Cision / Muck Rack refugees. Vocabulary is PR-native;
 * AEO is mentioned only as the limiting pillar in the reveal.
 *
 * Layered messaging architecture per work order Phase 1C:
 *   Hero → Problem (Layer 1) → Structural (Layer 2) → Reveal (Layer 3)
 *   → Mid-page form repeat → Social proof / category positioning
 *   → FAQ → Footer CTA.
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  Newspaper,
  FileText,
  Brain,
  CheckCircle,
  XCircle,
  CaretDown,
  ArrowRight,
} from '@phosphor-icons/react';
import { AuditForm } from '@/components/marketing/AuditForm';
import { EVIScorecardResults } from '@/components/marketing/EVIScorecardResults';
import type { ScanResponse } from '@/components/marketing/audit-types';

function TM() {
  return <sup style={{ fontSize: '0.6em', verticalAlign: 'super' }}>&trade;</sup>;
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
    q: 'How is this different from Cision?',
    a: 'Cision is a media database and clipping service — it tells you a placement happened. Pravado has the same media database (283K+ verified journalist profiles, continuously refreshed) plus the content layer that should compound from each placement and the AI citation tracking that confirms the placement created compounding authority. Cision is a piece of what Pravado does. The integration across pillars is the point.',
  },
  {
    q: 'Will this replace my media database?',
    a: 'Yes. Pravado includes a 283,000-profile journalist database with beat-aware matching, named-spokesperson routing, pitch personalization scoring, and follow-up guardrails. Standalone, it replaces Cision or Muck Rack at roughly 70% lower cost. But the standalone case is the smaller value — the content and AI citation pillars are where compounding visibility actually lives.',
  },
  {
    q: 'What’s an Earned Visibility Index?',
    a: 'EVI is a 0–100 composite score that measures how visible your brand is in the places buyers actually make decisions: AI engines, search results, and earned media. Unlike traffic or impression metrics, EVI is specifically about earned presence — visibility you can’t directly buy. The index decomposes into three pillars (PR, Content, AI Citation), each scored 0–100, weighted 0.40 / 0.35 / 0.25 to produce the composite.',
  },
  {
    q: 'Do you actually run scans against ChatGPT and Perplexity?',
    a: 'For the audit, the AI Citation pillar is computed by simulating buyer-intent queries against the trained behavior of five major engines (ChatGPT, Perplexity, Gemini, Claude, Bing Copilot). For paid customers, CiteMind runs live citation tracking — actual queries, weekly, with share-of-model trends and competitor comparison surfaced in the dashboard.',
  },
  {
    q: 'What happens after the scan?',
    a: 'We email you a magic link to a free dashboard view of your scorecard plus the option to book a call to discuss what a remediation program would look like for your specific situation. No upgrade pitch with a number — that conversation belongs in a sales call where your actual P&L is on the table.',
  },
];

export default function AuditPrPage() {
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
              'linear-gradient(rgba(232,121,249,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(232,121,249,0.025) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <EVIScorecardResults scanResult={result} entryPath="pr" />
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />

      {/* Technical grid — magenta tinted to flag PR pillar */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          backgroundImage:
            'linear-gradient(rgba(232,121,249,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(232,121,249,0.025) 1px, transparent 1px)',
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
                    background: 'rgba(232,121,249,0.12)',
                    color: '#E879F9',
                    border: '1px solid rgba(232,121,249,0.25)',
                  }}
                >
                  For PR Leaders
                </span>
              </div>

              <h1
                style={{
                  fontSize: 56,
                  fontWeight: 800,
                  lineHeight: 1.05,
                  marginTop: 0,
                  marginBottom: 24,
                  background: 'linear-gradient(135deg, #ffffff 0%, #E879F9 60%, #A855F7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-0.02em',
                }}
              >
                Cision tracked the placement. Muck Rack found the journalist. Now what?
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
                You earned the tier-1 hit. The mention is in the report. Six months
                later, when buyers ask Perplexity or ChatGPT who leads your category,
                your competitors are cited. Same story, every quarter. Your PR work
                is real — the visibility just stops compounding the moment the press
                cycle ends.
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
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} weight="fill" color="#22C55E" />
                  Free, no credit card
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} weight="fill" color="#22C55E" />
                  20–30 seconds
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} weight="fill" color="#22C55E" />
                  283K-profile media database
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
                border: '1px solid rgba(232,121,249,0.15)',
                position: 'sticky',
                top: 32,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#E879F9',
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
                Score your three pillars. See the variance that&apos;s hiding the work.
              </h2>
              <AuditForm
                entryPath="pr"
                onResult={setResult}
                ctaLabel="Get my PR scorecard"
              />
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* SECTION 2: PROBLEM (Layer 1) — names lived experience      */}
        {/* ─────────────────────────────────────────────────────────── */}
        <section style={{ background: '#0D0D14', padding: '80px 5%', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
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
              The hits keep landing. The compound interest never does.
            </h2>
            <p
              style={{
                fontSize: 18,
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              You ship 30+ placements a quarter. Tier-1 hits, named-spokesperson
              features, the occasional viral moment. Your media database is current.
              Your pitch list is segmented by beat. The reporting deck shows a healthy
              AVE column. And yet, when your CMO asks what those placements actually
              <em> built</em> — what topics you now own, what queries cite you, where
              authority compounded — the honest answer is: we don&apos;t know. The hits
              arrive. The compound interest never does.
            </p>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* SECTION 3: STRUCTURAL (Layer 2) — names the silo            */}
        {/* ─────────────────────────────────────────────────────────── */}
        <section style={{ background: '#0A0A0F', padding: '80px 5%', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
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
                maxWidth: 720,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              It&apos;s not your team. It&apos;s the tool stack.
            </h2>

            <div style={{ maxWidth: 720, margin: '0 auto', marginBottom: 40 }}>
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, marginTop: 0, marginBottom: 20 }}>
                Cision tells you a placement happened. Muck Rack tells you which
                journalist wrote it. Neither knows what content on your site that
                placement <em>should</em> be pointing to, or whether the AI engines
                your buyers are actually using have learned that you&apos;re the brand
                to cite for the topic.
              </p>
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, marginTop: 0, marginBottom: 0 }}>
                PR tools were designed when the internet had ten gateways: Google,
                the major outlets, the trade press. The gateways multiplied. The
                tools didn&apos;t. In 2026, half of category research happens inside
                ChatGPT, Perplexity, Gemini, Claude, and Bing Copilot — and your
                media database has no idea any of them exist.
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
                { name: 'Cision', sees: 'Mentions, AVE, clipping reports', misses: 'Whether content compounds or AI engines cite the brand' },
                { name: 'Muck Rack', sees: 'Journalist relationships, beat coverage', misses: 'Whether earned coverage created compounding authority' },
                { name: 'Pravado', sees: 'All of the above + content layer + AI citation tracking', misses: null },
              ].map((tool) => {
                const isPravado = tool.name === 'Pravado';
                return (
                  <div
                    key={tool.name}
                    style={{
                      padding: 20,
                      borderRadius: 12,
                      background: isPravado ? 'rgba(232,121,249,0.06)' : 'rgba(255,255,255,0.03)',
                      border: isPravado ? '1px solid rgba(232,121,249,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div style={{ fontSize: 16, fontWeight: 700, color: isPravado ? '#E879F9' : '#ffffff', marginBottom: 16 }}>
                      {tool.name}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(34,197,94,0.9)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                        Sees
                      </div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
                        {tool.sees}
                      </div>
                    </div>
                    {tool.misses && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(239,68,68,0.9)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                          Misses
                        </div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                          {tool.misses}
                        </div>
                      </div>
                    )}
                    {isPravado && (
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: 6,
                          background: 'rgba(232,121,249,0.08)',
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.85)',
                          fontWeight: 600,
                          marginTop: 4,
                        }}
                      >
                        One platform. Three pillars. Shared schema.
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
        {/* ─────────────────────────────────────────────────────────── */}
        <section style={{ background: '#0D0D14', padding: '80px 5%', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
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
              Three pillars of earned visibility. One scorecard. One platform that runs them together.
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
              Best-in-class on PR by itself. Compounding when paired with Content
              and AI Citation, because the schema is shared at the platform level —
              not retrofitted across an acquisition stack.
            </p>

            {/* PR Pillar — long treatment */}
            <div
              className="audit-pr-feature-grid"
              style={{
                padding: 40,
                borderRadius: 16,
                background: 'rgba(232,121,249,0.04)',
                border: '1px solid rgba(232,121,249,0.18)',
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
                    background: 'rgba(232,121,249,0.15)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Newspaper size={26} weight="regular" color="#E879F9" />
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#E879F9', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                  Pillar 1
                </div>
                <h3 style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', lineHeight: 1.2, marginTop: 0, marginBottom: 0 }}>
                  PR Authority
                </h3>
              </div>
              <div>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginTop: 0, marginBottom: 16 }}>
                  Pravado includes the most comprehensive PR platform shipping today:
                  a <strong style={{ color: '#ffffff' }}>283,000-profile media database</strong> with named-journalist matching,
                  beat-aware pitch routing, named-spokesperson positioning, pitch
                  personalization scored at the journalist level, and follow-up cadence
                  guardrails capped at two per contact per seven-day window.
                </p>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginTop: 0, marginBottom: 16 }}>
                  Standalone, it&apos;s a Cision replacement at roughly 70% lower cost.
                  But the database isn&apos;t the point — the database talks to the
                  rest of the platform.
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
                    'Beat-aware journalist matching',
                    'Named-spokesperson routing',
                    'Pitch personalization scoring',
                    'Follow-up guardrails',
                    'Coverage tracking + AVE',
                    'Crisis comms surface',
                  ].map((feature) => (
                    <li key={feature} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle size={14} weight="fill" color="#E879F9" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Content + AI — briefer treatment */}
            <div className="audit-pillars-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
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
                <div style={{ fontSize: 11, fontWeight: 700, color: '#A855F7', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
                  Pillar 2
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', lineHeight: 1.25, marginTop: 0, marginBottom: 14 }}>
                  Content Authority
                </h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.65, margin: 0 }}>
                  Every placement Pravado helps you earn comes with a content layer
                  that matters: the pillar pages that should compound from the press
                  hit, the FAQ schema that lets AI engines extract the answer, the
                  named-entity scaffolding that connects your spokesperson to your
                  topic to the citing outlet.
                </p>
              </div>

              <div
                style={{
                  padding: 32,
                  borderRadius: 16,
                  background: 'rgba(0,217,255,0.04)',
                  border: '1px solid rgba(0,217,255,0.15)',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(0,217,255,0.15)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Brain size={22} weight="regular" color="#00D9FF" />
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#00D9FF', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
                  Pillar 3
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', lineHeight: 1.25, marginTop: 0, marginBottom: 14 }}>
                  AI Citation Authority
                </h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.65, margin: 0 }}>
                  Every piece of content is scored by CiteMind<TM /> for citation
                  worthiness across ChatGPT, Perplexity, Gemini, Claude, and Bing
                  Copilot. You see which queries cite you, which cite competitors,
                  and what you&apos;d need to publish to flip the share-of-model.
                </p>
              </div>
            </div>

            {/* Orchestration callout */}
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
                The orchestration layer (<strong style={{ color: '#A855F7' }}>SAGE</strong>
                <TM /> strategy mesh, <strong style={{ color: '#00D9FF' }}>CRAFT</strong>
                <TM /> execution, <strong style={{ color: '#E879F9' }}>CiteMind</strong>
                <TM /> citation intelligence) is the thing no single-pillar competitor
                can ship — because it requires shared schema across PR, Content, and
                AEO that no acquisition stack can retrofit.
              </p>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* SECTION 5: MID-PAGE FORM REPEAT                            */}
        {/* ─────────────────────────────────────────────────────────── */}
        <section style={{ background: '#0A0A0F', padding: '80px 5%', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
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
              See the variance you&apos;ve been flying blind on.
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
              Free three-pillar scorecard. Specific gaps, named outlets, operational
              remediation. 20–30 seconds.
            </p>
            <div
              style={{
                padding: 32,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(232,121,249,0.15)',
              }}
            >
              <AuditForm
                entryPath="pr"
                onResult={setResult}
                ctaLabel="Get my PR scorecard"
              />
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* SECTION 6: SOCIAL PROOF / CATEGORY POSITIONING             */}
        {/* ─────────────────────────────────────────────────────────── */}
        <section style={{ background: '#0D0D14', padding: '80px 5%', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
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
              Built by people who&apos;ve been in PR&apos;s seat.
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
              Pravado&apos;s media database draws from 283,000 verified journalist
              profiles, refreshed continuously, with beat coverage that goes deeper
              than Cision&apos;s tier classifications and matching that&apos;s smarter
              than Muck Rack&apos;s keyword search. The team behind it built and ran
              a comms function before founding the platform.
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
                  gridTemplateColumns: 'minmax(0, 1.4fr) repeat(3, minmax(0, 1fr))',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(0,0,0,0.2)',
                }}
              >
                <div style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Capability
                </div>
                <div style={{ padding: '16px 20px', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                  Cision
                </div>
                <div style={{ padding: '16px 20px', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                  Muck Rack
                </div>
                <div style={{ padding: '16px 20px', fontSize: 13, fontWeight: 700, color: '#E879F9', textAlign: 'center' }}>
                  Pravado
                </div>
              </div>
              {[
                { capability: '283K-profile journalist database',  cision: true,  muck: true,  pravado: true },
                { capability: 'Beat-aware pitch matching',         cision: true,  muck: true,  pravado: true },
                { capability: 'Coverage tracking + AVE',           cision: true,  muck: false, pravado: true },
                { capability: 'Pillar content layer',              cision: false, muck: false, pravado: true },
                { capability: 'AEO citation tracking',             cision: false, muck: false, pravado: true },
                { capability: 'Cross-pillar EVI scorecard',        cision: false, muck: false, pravado: true },
                { capability: 'Shared schema across PR / Content / AEO', cision: false, muck: false, pravado: true },
              ].map((row, i) => (
                <div
                  key={row.capability}
                  className="audit-compare-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.4fr) repeat(3, minmax(0, 1fr))',
                    borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                  }}
                >
                  <div style={{ padding: '14px 20px', fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
                    {row.capability}
                  </div>
                  <div style={{ padding: '14px 20px', textAlign: 'center' }}>
                    {row.cision ? (
                      <CheckCircle size={20} weight="fill" color="rgba(34,197,94,0.7)" />
                    ) : (
                      <XCircle size={20} weight="regular" color="rgba(255,255,255,0.2)" />
                    )}
                  </div>
                  <div style={{ padding: '14px 20px', textAlign: 'center' }}>
                    {row.muck ? (
                      <CheckCircle size={20} weight="fill" color="rgba(34,197,94,0.7)" />
                    ) : (
                      <XCircle size={20} weight="regular" color="rgba(255,255,255,0.2)" />
                    )}
                  </div>
                  <div style={{ padding: '14px 20px', textAlign: 'center' }}>
                    {row.pravado && <CheckCircle size={20} weight="fill" color="#E879F9" />}
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
              Comparison reflects publicly stated capabilities of Cision and Muck Rack as of 2026.
            </p>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* SECTION 7: FAQ                                              */}
        {/* ─────────────────────────────────────────────────────────── */}
        <section style={{ background: '#0A0A0F', padding: '80px 5%', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
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
        <section style={{ background: '#0D0D14', padding: '80px 5%', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
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
              Score your PR pillar. See the variance.
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
              Free three-pillar EVI<TM /> scorecard. No credit card. No upgrade
              pitch. The conversation that matters happens after the scan, on a
              call where your specifics are on the table.
            </p>

            <div
              style={{
                padding: 32,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(232,121,249,0.18)',
                marginBottom: 24,
                textAlign: 'left',
              }}
            >
              <AuditForm
                entryPath="pr"
                onResult={setResult}
                ctaLabel="Get my PR scorecard"
              />
            </div>

            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
              Or skip the scan and{' '}
              <Link
                href="https://pravado.io/contact"
                style={{
                  color: '#E879F9',
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
      {/* Inline-style grids set desktop layout; these breakpoint rules */}
      {/* override at narrow viewports. !important is required because  */}
      {/* inline styles win specificity by default.                     */}
      {/* Comparison table uses overflow-x scroll rather than 1fr stack */}
      {/* so the row/column relationship between vendors and the seven  */}
      {/* capabilities stays legible.                                   */}
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
