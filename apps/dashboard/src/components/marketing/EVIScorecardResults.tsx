'use client';

/**
 * EVIScorecardResults — pure renderer for the three-pillar audit
 * results layout. Used by all four entry paths (/audit, /audit/pr,
 * /audit/content, /audit/ai). Pillar order responds to entryPath so
 * the buyer sees their entry-pillar first; variance section always
 * renders after all three pillars regardless of order.
 */

import { ArrowsHorizontal, ArrowRight } from '@phosphor-icons/react';
import Link from 'next/link';

import {
  eviBand,
  sevColor,
  sevLabel,
  pillarOrder,
  PILLAR_CONFIG,
  type ScanResponse,
  type EntryPath,
} from './audit-types';

interface Props {
  scanResult: ScanResponse;
  entryPath: EntryPath;
}

function TM() {
  return <sup style={{ fontSize: '0.6em', verticalAlign: 'super' }}>&trade;</sup>;
}

const QUARTILE_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: 'Top quartile',
  2: '2nd quartile',
  3: '3rd quartile',
  4: 'Bottom quartile',
};

export function EVIScorecardResults({ scanResult, entryPath }: Props) {
  const band = eviBand(scanResult.evi_score);
  const order = pillarOrder(entryPath);
  const variance = scanResult.variance;
  const benchmark = scanResult.benchmark;
  const leadingConfig = PILLAR_CONFIG[variance.leading_pillar];
  const laggingConfig = PILLAR_CONFIG[variance.lagging_pillar];
  const leadingScore = scanResult.pillars[variance.leading_pillar].score;
  const laggingScore = scanResult.pillars[variance.lagging_pillar].score;

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
            {scanResult.evi_score}
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
            {scanResult.evi_band}
          </span>
        </div>

        <p
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.45)',
            lineHeight: 1.6,
            margin: 0,
            marginBottom: benchmark.category_quartile && benchmark.category_label ? 16 : 0,
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
            {QUARTILE_LABELS[benchmark.category_quartile]} for {benchmark.category_label}
          </div>
        )}
      </div>

      {/* ── Three pillar cards (ordered by entryPath) ──────────── */}
      <div
        className="evi-pillars-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {order.map((key) => {
          const pillar = scanResult.pillars[key];
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

      {/* ── Variance section ──────────────────────────────────── */}
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

        <div className="evi-variance-row" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div className="evi-variance-label evi-variance-label-lagging" style={{ minWidth: 120, textAlign: 'right' }}>
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
          <div className="evi-variance-label evi-variance-label-leading" style={{ minWidth: 120 }}>
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

      {/* ── CTAs ──────────────────────────────────────────────── */}
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

      {scanResult.magic_link_sent && (
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

      {/* Mobile reflow — pillar grid stacks at <768px; the variance  */}
      {/* row stacks (lagging label / spread bar / leading label) at  */}
      {/* <640px so the labels keep readable widths.                  */}
      <style jsx>{`
        @media (max-width: 768px) {
          .evi-pillars-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .evi-variance-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .evi-variance-label {
            min-width: 0 !important;
            text-align: center !important;
          }
        }
      `}</style>
    </div>
  );
}
