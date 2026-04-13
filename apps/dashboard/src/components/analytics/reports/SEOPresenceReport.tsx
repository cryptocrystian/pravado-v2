'use client';

/**
 * SEOPresenceReport — light-theme PDF layout for SEO/AI presence reports.
 */

import { mockSEOSummary, mockTopicPerformance, mockEngineTrend } from '../analytics-mock-data';

interface SEOPresenceReportProps {
  orgName: string;
  period: string;
}

export function SEOPresenceReport({ orgName, period }: SEOPresenceReportProps) {
  const s = mockSEOSummary;
  const engines = Object.keys(mockEngineTrend[0] || {}).filter(k => k !== 'date');
  const latestEngines = mockEngineTrend[mockEngineTrend.length - 1] || {};

  return (
    <div style={{ width: 794, fontFamily: 'system-ui, sans-serif', background: '#fff', color: '#1a1a2e', padding: 48 }}>
      {/* Header */}
      <div style={{ borderBottom: '3px solid #00D9FF', paddingBottom: 24, marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, background: '#A855F7', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>P</span>
          </div>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 16, letterSpacing: 3 }}>PRAVADO</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>SEO / AI Presence Report</h1>
        <p style={{ fontSize: 13, color: '#666', margin: '6px 0 0' }}>{orgName} &middot; {period}</p>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'EVI Score', value: s.evi.value, delta: s.evi.delta },
          { label: 'Share of Voice', value: s.shareOfVoice.value, delta: s.shareOfVoice.delta },
          { label: 'Total Citations', value: s.totalCitations.value, delta: s.totalCitations.delta },
          { label: 'Topics Winning', value: s.topicsWinning.value, delta: '' },
        ].map(m => (
          <div key={m.label} style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#888', margin: '0 0 4px' }}>{m.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{m.value}</p>
            {m.delta && <p style={{ fontSize: 11, color: '#22C55E', margin: '2px 0 0' }}>{m.delta}</p>}
          </div>
        ))}
      </div>

      {/* Citations by Engine */}
      <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#888', marginBottom: 12 }}>Citations by Engine (Latest)</h2>
      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        {engines.map(engine => (
          <div key={engine} style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#888', margin: '0 0 4px' }}>{engine}</p>
            <p style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{(latestEngines as unknown as Record<string, number>)[engine]}</p>
          </div>
        ))}
      </div>

      {/* Topic Performance */}
      <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#888', marginBottom: 12 }}>Topic Cluster Performance</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 32 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
            {['Topic', 'Start', 'End', 'Delta', 'Leader', 'Gap'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, color: '#888', textTransform: 'uppercase', fontSize: 10 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {mockTopicPerformance.map((t, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '8px 10px', fontWeight: 600 }}>{t.topic}</td>
              <td style={{ padding: '8px 10px' }}>{t.startScore}</td>
              <td style={{ padding: '8px 10px' }}>{t.endScore}</td>
              <td style={{ padding: '8px 10px', color: t.delta >= 0 ? '#22C55E' : '#EF4444', fontWeight: 600 }}>{t.delta >= 0 ? '+' : ''}{t.delta}</td>
              <td style={{ padding: '8px 10px', color: t.isYou ? '#00D9FF' : '#888' }}>{t.leader}</td>
              <td style={{ padding: '8px 10px', color: '#888' }}>{t.gapToLeader ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
