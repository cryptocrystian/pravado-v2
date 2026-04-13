'use client';

/**
 * PRCampaignReport — light-theme PDF layout for PR Campaign reports.
 */

import { mockPlacements, mockPitchFunnel, mockPRSummary } from '../analytics-mock-data';

interface PRCampaignReportProps {
  orgName: string;
  period: string;
}

export function PRCampaignReport({ orgName, period }: PRCampaignReportProps) {
  return (
    <div style={{ width: 794, fontFamily: 'system-ui, sans-serif', background: '#fff', color: '#1a1a2e', padding: 48 }}>
      {/* Header */}
      <div style={{ borderBottom: '3px solid #E879F9', paddingBottom: 24, marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, background: '#A855F7', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>P</span>
          </div>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 16, letterSpacing: 3 }}>PRAVADO</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>PR Campaign Report</h1>
        <p style={{ fontSize: 13, color: '#666', margin: '6px 0 0' }}>{orgName} &middot; {period}</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Placements', value: mockPRSummary.placements },
          { label: 'Est. Reach', value: mockPRSummary.reach },
          { label: 'EVI from PR', value: mockPRSummary.eviFromPR },
          { label: 'Pitches Sent', value: mockPitchFunnel.sent },
        ].map(m => (
          <div key={m.label} style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#888', margin: '0 0 4px' }}>{m.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Placements Table */}
      <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#888', marginBottom: 12 }}>Earned Placements</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 32 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
            {['Publication', 'Headline', 'Date', 'Reach', 'EVI Lift'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: '#888', textTransform: 'uppercase', fontSize: 10 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {mockPlacements.map((p, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '8px 12px', fontWeight: 600 }}>{p.publication}</td>
              <td style={{ padding: '8px 12px', color: '#444' }}>{p.headline}</td>
              <td style={{ padding: '8px 12px', color: '#888' }}>{p.date}</td>
              <td style={{ padding: '8px 12px' }}>{p.reach}</td>
              <td style={{ padding: '8px 12px', color: p.pending ? '#888' : '#22C55E', fontWeight: 600 }}>{p.eviLift}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pitch Funnel */}
      <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#888', marginBottom: 12 }}>Pitch Funnel</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 32 }}>
        {[
          { label: 'Sent', value: mockPitchFunnel.sent, color: '#60A5FA' },
          { label: 'Replied', value: mockPitchFunnel.replies, color: '#A78BFA' },
          { label: 'Placed', value: mockPitchFunnel.placements, color: '#22C55E' },
        ].map((stage, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ background: stage.color, color: '#fff', borderRadius: 8, padding: '12px 8px', fontSize: 24, fontWeight: 800 }}>
              {stage.value}
            </div>
            <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{stage.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
