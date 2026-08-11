'use client';

/**
 * CitationVelocityByEngine — stacked area of REAL per-engine citation velocity.
 * Each point is a capture DATE; each series is one AI engine's brand-mentioned
 * citation count on that date, derived from citation_monitor_results (CiteMind).
 * No mock data — an org whose monitor has not run shows the honest empty note.
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

import type { EngineVelocityPoint } from '@/hooks/useAnalyticsSeo';

// Stable per-engine colors. Unknown engines fall back to the cyan accent.
const ENGINE_COLORS: Record<string, string> = {
  chatgpt: '#00D9FF',
  perplexity: '#A855F7',
  claude: '#E879F9',
  gemini: '#F59E0B',
  google: '#60A5FA',
  googleai: '#60A5FA',
};

const FALLBACK_COLOR = '#00D9FF';

function colorFor(engine: string): string {
  return ENGINE_COLORS[engine.toLowerCase()] ?? FALLBACK_COLOR;
}

function labelFor(engine: string): string {
  const map: Record<string, string> = {
    chatgpt: 'ChatGPT',
    perplexity: 'Perplexity',
    claude: 'Claude',
    gemini: 'Gemini',
    google: 'Google AI',
    googleai: 'Google AI',
  };
  return map[engine.toLowerCase()] ?? engine;
}

function VelocityTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-panel border border-border-subtle rounded-lg p-2.5 text-xs shadow-lg">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export function CitationVelocityByEngine({
  data,
  engines,
}: {
  data: EngineVelocityPoint[];
  engines: string[];
}) {
  return (
    <div className="bg-panel border border-border-subtle rounded-xl p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-4">
        Citation Velocity by Engine
      </h3>

      {data.length === 0 || engines.length === 0 ? (
        <div className="h-[240px] flex flex-col items-center justify-center text-center px-6">
          <p className="text-sm text-white/70">No citation activity yet.</p>
          <p className="text-[13px] text-white/45 mt-1.5 leading-relaxed">
            Per-engine velocity appears once the CiteMind monitor records
            brand-mentioned citations across ChatGPT, Perplexity, and Claude.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data}>
            <CartesianGrid
              horizontal
              vertical={false}
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip content={<VelocityTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {engines.map((engine) => (
              <Area
                key={engine}
                type="monotone"
                dataKey={engine}
                name={labelFor(engine)}
                stackId="citations"
                fill={colorFor(engine)}
                stroke={colorFor(engine)}
                fillOpacity={0.3}
                strokeWidth={1.5}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
