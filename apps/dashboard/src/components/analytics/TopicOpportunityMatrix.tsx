'use client';

/**
 * TopicOpportunityMatrix — 2x2 scatter plot.
 * X = your score, Y = competitor score.
 * Quadrants: Defend (top-right), Dominate (bottom-right), Prioritize (top-left), Watch (bottom-left)
 */

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Label,
} from 'recharts';
import { mockTopicPerformance } from './analytics-mock-data';

const scatterData = mockTopicPerformance.map((t) => ({
  name: t.topic,
  yourScore: t.endScore,
  competitorScore: t.endScore + (t.gapToLeader ?? 0) * -1, // reconstruct competitor score
}));

// Midpoint for quadrant lines
const MID = 60;

function MatrixTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof scatterData[0] }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-2 border border-white/10 rounded-lg p-2.5 text-xs shadow-lg">
      <p className="text-white/90 font-semibold mb-1">{d.name}</p>
      <p className="text-brand-cyan">You: {d.yourScore}</p>
      <p className="text-white/50">Competitor: {d.competitorScore}</p>
    </div>
  );
}

export function TopicOpportunityMatrix() {
  return (
    <div className="bg-panel border border-border-subtle rounded-xl p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-4">
        Topic Opportunity Matrix
      </h3>

      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" />
          <XAxis
            type="number"
            dataKey="yourScore"
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
            axisLine={false}
            tickLine={false}
          >
            <Label value="Your Score →" position="bottom" offset={0} style={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }} />
          </XAxis>
          <YAxis
            type="number"
            dataKey="competitorScore"
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
            axisLine={false}
            tickLine={false}
            width={30}
          >
            <Label value="Competitor ↑" angle={-90} position="insideLeft" offset={10} style={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }} />
          </YAxis>

          {/* Quadrant dividers */}
          <ReferenceLine x={MID} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
          <ReferenceLine y={MID} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />

          <Tooltip content={<MatrixTooltip />} />
          <Scatter data={scatterData} fill="#00D9FF" fillOpacity={0.8}>
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Quadrant labels */}
      <div className="grid grid-cols-2 gap-2 mt-2 text-[10px]">
        <div className="text-center text-semantic-danger font-semibold">Prioritize (Low you, High them)</div>
        <div className="text-center text-semantic-warning font-semibold">Defend (High you, High them)</div>
        <div className="text-center text-white/30">Watch (Low you, Low them)</div>
        <div className="text-center text-semantic-success font-semibold">Dominate (High you, Low them)</div>
      </div>
    </div>
  );
}
