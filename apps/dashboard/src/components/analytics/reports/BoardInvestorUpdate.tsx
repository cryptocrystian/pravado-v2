'use client';

/**
 * BoardInvestorUpdate — 1-page light-theme PDF layout for board/investor updates.
 */

import { mockEVITrend, mockCompetitorTrend, mockTopWins } from '../analytics-mock-data';

interface BoardInvestorUpdateProps {
  orgName: string;
  period: string;
}

export function BoardInvestorUpdate({ orgName, period }: BoardInvestorUpdateProps) {
  const lastEvi = mockEVITrend[mockEVITrend.length - 1]?.evi ?? 0;
  const theirEvi = mockCompetitorTrend[mockCompetitorTrend.length - 1]?.evi ?? 0;
  const gap = lastEvi - theirEvi;

  return (
    <div style={{ width: 794, fontFamily: 'system-ui, sans-serif', background: '#fff', color: '#1a1a2e', padding: 48 }}>
      {/* Header */}
      <div style={{ borderBottom: '3px solid #A855F7', paddingBottom: 24, marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, background: '#A855F7', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>P</span>
          </div>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 16, letterSpacing: 3 }}>PRAVADO</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Board / Investor Update</h1>
        <p style={{ fontSize: 13, color: '#666', margin: '6px 0 0' }}>{orgName} &middot; {period}</p>
      </div>

      {/* EVI Hero */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: '#888', letterSpacing: 2, margin: '0 0 8px' }}>Earned Visibility Index</p>
        <p style={{ fontSize: 64, fontWeight: 800, color: '#00D9FF', margin: 0 }}>{lastEvi.toFixed(1)}</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 4, height: 40, marginTop: 16 }}>
          {mockEVITrend.map((p, i) => {
            const max = Math.max(...mockEVITrend.map(t => t.evi));
            const min = Math.min(...mockEVITrend.map(t => t.evi));
            const range = max - min || 1;
            const h = Math.max(6, ((p.evi - min) / range) * 36);
            return <div key={i} style={{ flex: 1, maxWidth: 32, height: h, background: '#00D9FF', borderRadius: 3, opacity: 0.5 + (i / mockEVITrend.length) * 0.5 }} />;
          })}
        </div>
      </div>

      {/* Competitive Position */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
        <div style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#888', margin: '0 0 4px' }}>Your EVI</p>
          <p style={{ fontSize: 36, fontWeight: 800, color: '#00D9FF', margin: 0 }}>{lastEvi.toFixed(1)}</p>
        </div>
        <div style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#888', margin: '0 0 4px' }}>Top Competitor</p>
          <p style={{ fontSize: 36, fontWeight: 800, color: '#666', margin: 0 }}>{theirEvi.toFixed(1)}</p>
        </div>
        <div style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#888', margin: '0 0 4px' }}>Gap</p>
          <p style={{ fontSize: 36, fontWeight: 800, color: gap >= 0 ? '#22C55E' : '#EF4444', margin: 0 }}>{gap >= 0 ? '+' : ''}{gap.toFixed(1)}</p>
        </div>
      </div>

      {/* Key Wins */}
      <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#888', marginBottom: 12 }}>Key Milestones</h2>
      {mockTopWins.map((win, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
          <span style={{ width: 20, height: 20, borderRadius: 10, background: '#22C55E', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {i + 1}
          </span>
          <p style={{ fontSize: 13, lineHeight: 1.5, color: '#333', margin: 0 }}>{win}</p>
        </div>
      ))}
    </div>
  );
}
