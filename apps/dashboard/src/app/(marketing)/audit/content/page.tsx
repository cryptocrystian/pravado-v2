'use client';

/**
 * /audit/content — Content-led entry path for the three-pillar EVI scorecard.
 *
 * D027 Phase 1D per docs/sprints/D027-AUDIT-REBUILD/WORK_ORDER.md.
 * Polish bar: "good and shippable" — the production-quality bar belongs
 * to /audit/pr (halo). Same shared components (AuditForm,
 * EVIScorecardResults) and same mobile reflow conventions as /audit/pr.
 *
 * Target buyer: HubSpot / Contently / Marketo refugees. Vocabulary is
 * content-native; PR and AI Citation appear in the reveal as the
 * limiting pillars, not as the centerpiece.
 *
 * Layered messaging architecture mirrors /audit/pr:
 *   Hero → Problem (Layer 1) → Structural (Layer 2) → Reveal (Layer 3)
 *   → Mid-page form repeat → Social proof / category positioning
 *   → FAQ → Footer CTA.
 *
 * Pillar accent: iris (#A855F7) — Content's pillar color.
 */

import {
  FileText,
  Newspaper,
  Brain,
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
    q: 'How is this different from HubSpot or Contently?',
    a: 'HubSpot is a publishing pipeline + CRM with content as one of many surfaces. Contently is editorial workflow + freelance network. Both tell you what shipped and what got traffic. Neither tells you whether the content built compounding authority — whether AI engines now cite you for the topics you covered, whether the press hits that should point at your pillar pages have somewhere to land, whether your topic clusters are actually owned or just published into. Pravado measures the authority outcome, not the publishing throughput.',
  },
  {
    q: 'Will this replace my CMS?',
    a: 'No. Pravado is the strategy + intelligence layer above whatever CMS you publish into. CRAFT generates the briefs, schema scaffolding, and named-entity coverage that make content cite-worthy; CiteMind scores each piece and tracks which engines pick it up; SAGE tells you what topic clusters to invest in next based on cross-pillar signals. Your CMS still owns publish. Pravado owns whether what you publish actually compounds.',
  },
  {
    q: 'What’s an Earned Visibility Index?',
    a: 'EVI is a 0–100 composite score that measures how visible your brand is in the places buyers actually make decisions: AI engines, search results, and earned media. Unlike traffic or page-view metrics, EVI is specifically about earned presence — visibility you can’t buy with media spend. The index decomposes into three pillars (PR, Content, AI Citation), each scored 0–100, weighted 0.40 / 0.35 / 0.25 to produce the composite. Content sits at 0.35 weight — the second-heaviest pillar by design.',
  },
  {
    q: 'Does this work if my team uses freelancers, an agency, or in-house?',
    a: 'Yes. The audit measures outcomes, not workflow. The scorecard tells you whether your content built authority regardless of whether the words came from a staff editor, a freelancer pool, or a managed-service partner. The remediation preview points at the operational gaps in what compounds, not the headcount that produced it.',
  },
  {
    q: 'How does Content Authority get scored?',
    a: 'The Content pillar combines topical coverage breadth and depth (do you have the pillar pages, the supporting cluster, the FAQ schema), content freshness signals (when did the canonical pages last update), entity coverage (do you have named-entity scaffolding tying spokesperson → topic → outlet), and topic cluster integrity (does the internal linking pattern reflect a real authority architecture or a content calendar). Each contributes to the 0–100 score with 3–5 specific gaps surfaced.',
  },
  {
    q: 'What happens after the scan?',
    a: 'We email you a magic link to a free dashboard view of your scorecard plus the option to book a call to discuss what a remediation program would look like for your content authority specifically. No upgrade pitch with a number — that conversation belongs in a sales call where your actual content strategy and category dynamics are on the table.',
  },
];

export default function AuditContentPage() {
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
              'linear-gradient(rgba(168,85,247,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.025) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <EVIScorecardResults scanResult={result} entryPath="content" />
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />

      {/* Technical grid — iris tinted to flag Content pillar */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          backgroundImage:
            'linear-gradient(rgba(168,85,247,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.025) 1px, transparent 1px)',
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
                    background: 'rgba(168,85,247,0.12)',
                    color: '#A855F7',
                    border: '1px solid rgba(168,85,247,0.25)',
                  }}
                >
                  For Content Leaders
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
                    'linear-gradient(135deg, #ffffff 0%, #A855F7 60%, #7C3AED 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-0.02em',
                }}
              >
                You shipped 200 pieces last quarter. ChatGPT still cites the
                competitor.
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
                Your editorial calendar is full. Your traffic chart points up
                and to the right on long-tail. The pillar pages exist. And yet,
                when buyers ask Perplexity or ChatGPT who owns your category,
                the answer surfaces a competitor you outpublished three to one.
                Volume isn&apos;t the problem. Authority is. Your content stack
                measures publishing throughput; the buyer journey now measures
                something else.
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
                border: '1px solid rgba(168,85,247,0.15)',
                position: 'sticky',
                top: 32,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#A855F7',
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
                Score your content authority. See what your publishing
                isn&apos;t buying.
              </h2>
              <AuditForm
                entryPath="content"
                onResult={setResult}
                ctaLabel="Get my Content scorecard"
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
              Volume up. Authority flat. Competitor still owns the category
              answer.
            </h2>
            <p
              style={{
                fontSize: 18,
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              You have a calendar. You have a brief template. You have an SEO
              tool telling you what to cover. You ship the pieces. Some rank. A
              handful go viral. The dashboard shows growth on the long tail.
              Then the CMO opens ChatGPT in an executive review, asks &ldquo;who
              leads our category,&rdquo; and your brand isn&apos;t in the
              answer. The competitor is. The one you outpublish three to one.
              Because what compounds in 2026 isn&apos;t pages shipped —
              it&apos;s <em>authority architecture</em>: schema, named entities,
              citation worthiness, topic cluster integrity. Your content stack
              was built for the page-view web, and the buyer journey moved.
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
                maxWidth: 760,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              It&apos;s not your editorial team. It&apos;s the tool stack.
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
                HubSpot tells you a page published. Contently tells you a
                freelancer turned in a draft. Marketo tells you who opened the
                email. None of them know whether the piece you shipped earned a
                single citation in ChatGPT, whether the pillar page has the
                schema AI engines need to extract the answer, or whether your
                topic cluster is structurally whole or just a calendar of
                related posts.
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
                Content tools were built for the SEO web — publish, optimize for
                Google, watch the rank chart. The web split. Half of category
                research now happens inside ChatGPT, Perplexity, Gemini, Claude,
                and Bing Copilot, and those engines reward an architecture your
                CMS dashboard wasn&apos;t designed to surface: named entities,
                schema completeness, cluster integrity, citation worthiness.
                Your throughput tools have no idea any of this is being
                measured.
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
                  name: 'HubSpot',
                  sees: 'Publishing pipeline, page views, lead capture',
                  misses: 'Whether content built citation-worthy authority',
                },
                {
                  name: 'Contently',
                  sees: 'Editorial workflow, freelance throughput, brand voice',
                  misses:
                    'Whether the pieces produced compound topical authority',
                },
                {
                  name: 'Pravado',
                  sees: 'All of the above + schema scaffolding + AI citation tracking + PR layer',
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
                        ? 'rgba(168,85,247,0.06)'
                        : 'rgba(255,255,255,0.03)',
                      border: isPravado
                        ? '1px solid rgba(168,85,247,0.3)'
                        : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: isPravado ? '#A855F7' : '#ffffff',
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
                          background: 'rgba(168,85,247,0.08)',
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
        {/* Content gets longest treatment; PR + AI briefer.           */}
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
              Authority infrastructure for Content. Compounding when paired with
              PR and AI Citation, because the schema is shared at the platform
              level — not retrofitted across an acquisition stack.
            </p>

            {/* Content Pillar — long treatment */}
            <div
              className="audit-pr-feature-grid"
              style={{
                padding: 40,
                borderRadius: 16,
                background: 'rgba(168,85,247,0.04)',
                border: '1px solid rgba(168,85,247,0.18)',
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
                    background: 'rgba(168,85,247,0.15)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <FileText size={26} weight="regular" color="#A855F7" />
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#A855F7',
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
                  Content Authority
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
                  Pravado treats content as{' '}
                  <strong style={{ color: '#ffffff' }}>
                    authority infrastructure
                  </strong>
                  , not blog calendar. CRAFT generates briefs scaffolded with
                  the named-entity coverage, FAQ schema, and topic cluster
                  topology that AI engines reward. CiteMind scores every piece
                  for citation worthiness across five engines before it ships,
                  and tracks which engines pick it up after.
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
                  Standalone, it&apos;s the strategy + intelligence layer above
                  whatever CMS you publish into. The CMS still owns publish.
                  Pravado owns whether what you publish actually compounds.
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
                    'Pillar page + cluster topology',
                    'FAQ + entity schema scaffolding',
                    'Named-entity coverage planning',
                    'Citation worthiness scoring',
                    'Topic cluster health audits',
                    'Cross-pillar publish hooks',
                  ].map((feature) => (
                    <li
                      key={feature}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <CheckCircle size={14} weight="fill" color="#A855F7" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* PR + AI — briefer treatment */}
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
                  Pillar 2
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
                  Every pillar page Pravado helps you build deserves the press
                  hits that should point at it. The 283K-profile media database
                  matches named journalists to your content topics, routes
                  pitches by beat, and tracks coverage so the earned mentions
                  land where the topical authority lives.
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
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#00D9FF',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom: 6,
                  }}
                >
                  Pillar 3
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
                  AI Citation Authority
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.7)',
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  CiteMind
                  <TM /> tracks which queries cite you across ChatGPT,
                  Perplexity, Gemini, Claude, and Bing Copilot — and tells you
                  which content gaps you&apos;d need to close to flip the
                  share-of-model on the queries that matter to your category.
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
                The orchestration layer (
                <strong style={{ color: '#A855F7' }}>SAGE</strong>
                <TM /> strategy mesh,{' '}
                <strong style={{ color: '#00D9FF' }}>CRAFT</strong>
                <TM /> execution,{' '}
                <strong style={{ color: '#E879F9' }}>CiteMind</strong>
                <TM /> citation intelligence) is the thing no single-pillar
                competitor can ship — because it requires shared schema across
                PR, Content, and AEO that no acquisition stack can retrofit.
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
              See what your throughput isn&apos;t buying.
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
              Free three-pillar scorecard. Specific topical gaps, schema misses,
              citation share-of-model. 20–30 seconds.
            </p>
            <div
              style={{
                padding: 32,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(168,85,247,0.15)',
              }}
            >
              <AuditForm
                entryPath="content"
                onResult={setResult}
                ctaLabel="Get my Content scorecard"
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
              Built for the citation web, not the page-view web.
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
              Pravado&apos;s Content pillar is built to score, structure, and
              compound — not just publish. It sits above your CMS, instruments
              what compounds, and ties content output to the PR signal and AI
              citation outcome that decide whether your authority actually
              grows.
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
                  HubSpot
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
                  Contently
                </div>
                <div
                  style={{
                    padding: '16px 20px',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#A855F7',
                    textAlign: 'center',
                  }}
                >
                  Pravado
                </div>
              </div>
              {[
                {
                  capability: 'Editorial workflow + brief management',
                  hub: true,
                  con: true,
                  pravado: true,
                },
                {
                  capability: 'Page publishing pipeline',
                  hub: true,
                  con: false,
                  pravado: true,
                },
                {
                  capability: 'SEO keyword research + on-page checks',
                  hub: true,
                  con: false,
                  pravado: true,
                },
                {
                  capability: 'Citation worthiness scoring (pre-publish)',
                  hub: false,
                  con: false,
                  pravado: true,
                },
                {
                  capability: 'AI engine citation tracking',
                  hub: false,
                  con: false,
                  pravado: true,
                },
                {
                  capability: 'PR pillar (283K media database)',
                  hub: false,
                  con: false,
                  pravado: true,
                },
                {
                  capability: 'Cross-pillar EVI scorecard',
                  hub: false,
                  con: false,
                  pravado: true,
                },
                {
                  capability: 'Shared schema across PR / Content / AEO',
                  hub: false,
                  con: false,
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
                    {row.hub ? (
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
                    {row.con ? (
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
                      <CheckCircle size={20} weight="fill" color="#A855F7" />
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
              Comparison reflects publicly stated capabilities of HubSpot
              Content Hub and Contently as of 2026.
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
              Score your content authority. See the variance.
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
                border: '1px solid rgba(168,85,247,0.18)',
                marginBottom: 24,
                textAlign: 'left',
              }}
            >
              <AuditForm
                entryPath="content"
                onResult={setResult}
                ctaLabel="Get my Content scorecard"
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
                  color: '#A855F7',
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
