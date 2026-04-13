'use client';

/**
 * CitationVelocityByEngine — Stacked area chart showing citations over time by AI engine.
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const engineColors: Record<string, string> = {
  ChatGPT: '#00E5CC',
  Perplexity: '#A78BFA',
  GoogleAI: '#F59E0B',
  Gemini: '#EC4899',
  Claude: '#60A5FA',
};

const mockCitationVelocityByEngine = [
  { week: 'W1', ChatGPT: 32, Perplexity: 18, GoogleAI: 12, Gemini: 8, Claude: 5 },
  { week: 'W2', ChatGPT: 36, Perplexity: 21, GoogleAI: 14, Gemini: 9, Claude: 6 },
  { week: 'W3', ChatGPT: 41, Perplexity: 25, GoogleAI: 15, Gemini: 8, Claude: 7 },
  { week: 'W4', ChatGPT: 45, Perplexity: 28, GoogleAI: 16, Gemini: 9, Claude: 8 },
  { week: 'W5', ChatGPT: 48, Perplexity: 31, GoogleAI: 17, Gemini: 10, Claude: 9 },
  { week: 'W6', ChatGPT: 52, Perplexity: 34, GoogleAI: 18, Gemini: 10, Claude: 9 },
];

const engines = ['ChatGPT', 'Perplexity', 'GoogleAI', 'Gemini', 'Claude'];

export function CitationVelocityByEngine() {
  return (
    <div className="bg-panel border border-border-subtle rounded-xl p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-4">
        Citation Velocity by Engine
      </h3>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={mockCitationVelocityByEngine}>
          <CartesianGrid horizontal vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} width={30} />
          <Tooltip
            contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}
          />
          {engines.map((engine) => (
            <Area
              key={engine}
              type="monotone"
              dataKey={engine}
              stackId="citations"
              fill={engineColors[engine]}
              stroke={engineColors[engine]}
              fillOpacity={0.3}
              strokeWidth={1.5}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
