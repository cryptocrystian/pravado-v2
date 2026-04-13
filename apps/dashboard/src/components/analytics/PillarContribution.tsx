'use client';

/**
 * PillarContribution — Horizontal stacked bar showing PR/Content/SEO
 * contribution to EVI change, with per-pillar delta cards.
 */

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const PILLARS = [
  { name: 'PR', delta: 1.8, color: '#E879F9' },       // brand-magenta
  { name: 'Content', delta: 1.4, color: '#A855F7' },   // brand-iris
  { name: 'SEO', delta: 1.0, color: '#00D9FF' },       // brand-cyan
];

const chartData = [{ name: 'EVI', PR: 1.8, Content: 1.4, SEO: 1.0 }];

export function PillarContribution() {
  const total = PILLARS.reduce((s, p) => s + p.delta, 0);

  return (
    <div className="bg-panel border border-border-subtle rounded-xl p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-4">
        EVI Change by Pillar
      </h3>

      {/* Stacked bar */}
      <ResponsiveContainer width="100%" height={28}>
        <BarChart data={chartData} layout="vertical" barSize={20}>
          <XAxis type="number" hide />
          <Tooltip
            cursor={false}
            contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
            itemStyle={{ color: 'rgba(255,255,255,0.9)' }}
          />
          <Bar dataKey="PR" stackId="evi" fill="#E879F9" radius={[6, 0, 0, 6]} />
          <Bar dataKey="Content" stackId="evi" fill="#A855F7" />
          <Bar dataKey="SEO" stackId="evi" fill="#00D9FF" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Per-pillar cards */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {PILLARS.map((p) => (
          <div key={p.name} className="bg-slate-3/30 border border-border-subtle rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              <span className="text-xs font-medium text-white/60">{p.name}</span>
            </div>
            <span className="text-lg font-bold text-semantic-success">+{p.delta}</span>
            <span className="text-xs text-white/40 ml-1">pts</span>
            <p className="text-[11px] text-white/30 mt-0.5">{Math.round((p.delta / total) * 100)}% of total</p>
          </div>
        ))}
      </div>
    </div>
  );
}
