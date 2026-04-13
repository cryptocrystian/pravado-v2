'use client';

/**
 * ExecutiveSummaryReport — light-theme layout rendered off-screen for PDF capture.
 *
 * Structure:
 *   Cover area (logo, org name, period)
 *   Section 1: EVI Headline + Pillar Breakdown
 *   Section 2: Top Wins
 *   Section 3: SAGE Next Actions
 */

import {
  mockHeadlineMetrics,
  mockAttribution,
  mockTopWins,
  mockEVITrend,
} from '../analytics-mock-data';

interface ExecutiveSummaryReportProps {
  orgName: string;
  period: string;
}

export function ExecutiveSummaryReport({ orgName, period }: ExecutiveSummaryReportProps) {
  const hm = mockHeadlineMetrics;
  const trend = mockEVITrend;
  const lastEvi = trend[trend.length - 1]?.evi ?? 0;
  const firstEvi = trend[0]?.evi ?? 0;
  const eviDelta = (lastEvi - firstEvi).toFixed(1);

  return (
    <div style={{ width: 794, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#fff', color: '#1a1a2e', padding: 48 }}>

      {/* Cover */}
      <div style={{ marginBottom: 40, borderBottom: '3px solid #00D9FF', paddingBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, background: '#A855F7', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>P</span>
          </div>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 18, letterSpacing: 3, color: '#1a1a2e' }}>PRAVADO</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: '#1a1a2e' }}>Monthly Executive Summary</h1>
        <p style={{ fontSize: 14, color: '#666', margin: '8px 0 0' }}>{orgName} &middot; {period} &middot; Generated {new Date().toLocaleDateString()}</p>
      </div>

      {/* Section 1: EVI Headline */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#888', marginBottom: 16 }}>Earned Visibility Index</h2>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 12 }}>
          <span style={{ fontSize: 56, fontWeight: 800, color: '#00D9FF' }}>{lastEvi.toFixed(1)}</span>
          <span style={{ fontSize: 20, fontWeight: 600, color: Number(eviDelta) >= 0 ? '#22C55E' : '#EF4444' }}>
            {Number(eviDelta) >= 0 ? '+' : ''}{eviDelta} pts
          </span>
        </div>

        {/* EVI Trend mini chart (simple bar representation) */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 48, marginBottom: 16 }}>
          {trend.map((p, i) => {
            const max = Math.max(...trend.map(t => t.evi));
            const min = Math.min(...trend.map(t => t.evi));
            const range = max - min || 1;
            const h = Math.max(8, ((p.evi - min) / range) * 44);
            return (
              <div key={i} style={{ flex: 1, height: h, background: '#00D9FF', borderRadius: 3, opacity: 0.6 + (i / trend.length) * 0.4 }} />
            );
          })}
        </div>

        {/* Pillar Contribution */}
        <h3 style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 8 }}>PILLAR CONTRIBUTION</h3>
        <div style={{ display: 'flex', gap: 0, height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
          {mockAttribution.map((a, i) => (
            <div key={i} style={{ width: `${a.percent}%`, background: i === 0 ? '#A855F7' : i === 1 ? '#E879F9' : '#00D9FF' }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {mockAttribution.map((a, i) => (
            <span key={i} style={{ fontSize: 12, color: '#666' }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: i === 0 ? '#A855F7' : i === 1 ? '#E879F9' : '#00D9FF', marginRight: 6 }} />
              {a.label}: {a.percent}%
            </span>
          ))}
        </div>
      </div>

      {/* Section 2: Key Metrics */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#888', marginBottom: 16 }}>Key Metrics</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { label: 'EVI Change', value: hm.eviChange.value },
            { label: 'Content Published', value: String(hm.contentPublished.value) },
            { label: 'Earned Placements', value: String(hm.earnedPlacements.value) },
            { label: 'AI Citations', value: String(hm.totalCitations.value) },
          ].map((m) => (
            <div key={m.label} style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#888', margin: '0 0 4px' }}>{m.label}</p>
              <p style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#1a1a2e' }}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Top Wins */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#888', marginBottom: 16 }}>Top Wins This Period</h2>
        {mockTopWins.map((win, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
            <span style={{ width: 24, height: 24, borderRadius: 12, background: '#22C55E', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {i + 1}
            </span>
            <p style={{ fontSize: 13, lineHeight: 1.5, color: '#333', margin: 0 }}>{win}</p>
          </div>
        ))}
      </div>

      {/* Section 4: SAGE Next Actions */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#888', marginBottom: 16 }}>SAGE Recommended Actions</h2>
        {[
          'Publish Enterprise AEO guide to close 48-pt gap vs CompetitorX',
          'Pitch AI Visibility angle to Sarah Chen (TechCrunch) — high citation potential',
          'Add structured FAQ schema to top 3 content pieces — projected +3 EVI pts',
        ].map((action, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
            <span style={{ width: 24, height: 24, borderRadius: 12, background: '#A855F7', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {i + 1}
            </span>
            <p style={{ fontSize: 13, lineHeight: 1.5, color: '#333', margin: 0 }}>{action}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
