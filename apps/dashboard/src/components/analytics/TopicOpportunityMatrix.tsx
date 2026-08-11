'use client';

/**
 * TopicOpportunityMatrix — scatter of REAL topic clusters.
 * X = total search volume, Y = visibility score (0-100). Both come straight from
 * the org's persisted seo_keyword_clusters (SERP-overlap clustering). A cluster is
 * PLOTTED ONLY when BOTH axes have a real value — clusters missing volume or score
 * are omitted rather than placed at a fabricated coordinate.
 *
 * Quadrants (score midpoint 50): high score = we rank well; high volume = big
 * opportunity. No mock data — an org with no scored+sized clusters shows the
 * honest empty note.
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

import type { TopicCluster } from '@/hooks/useAnalyticsSeo';

interface ScatterPoint {
  name: string;
  volume: number;
  score: number;
  avgPosition: number | null;
  memberCount: number;
}

// Visibility score midpoint (score is a 0-100 scale).
const SCORE_MID = 50;

function MatrixTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ScatterPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-panel border border-border-subtle rounded-lg p-2.5 text-xs shadow-lg">
      <p className="text-white/90 font-semibold mb-1">{d.name}</p>
      <p className="text-brand-cyan">Score: {d.score}</p>
      <p className="text-white/50">Volume: {d.volume.toLocaleString()}</p>
      {d.avgPosition !== null && (
        <p className="text-white/50">Avg position: {d.avgPosition}</p>
      )}
      <p className="text-white/40 mt-1">
        {d.memberCount} keyword{d.memberCount === 1 ? '' : 's'}
      </p>
    </div>
  );
}

export function TopicOpportunityMatrix({
  clusters,
}: {
  clusters: TopicCluster[];
}) {
  // Plot ONLY clusters with BOTH real axes — never a fabricated coordinate.
  const scatterData: ScatterPoint[] = clusters
    .filter((c) => c.totalVolume !== null && c.score !== null)
    .map((c) => ({
      name: c.name,
      volume: c.totalVolume as number,
      score: c.score as number,
      avgPosition: c.avgPosition,
      memberCount: c.memberKeywords.length,
    }));

  const omitted = clusters.length - scatterData.length;

  return (
    <div className="bg-panel border border-border-subtle rounded-xl p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-4">
        Topic Opportunity Matrix
      </h3>

      {scatterData.length === 0 ? (
        <div className="h-[280px] flex flex-col items-center justify-center text-center px-6">
          <p className="text-sm text-white/70">
            No scored, sized clusters yet.
          </p>
          <p className="text-[13px] text-white/45 mt-1.5 leading-relaxed">
            A cluster is plotted once it has both a real search volume and a
            visibility score (from your owned SERP position). Track keywords and
            run a SERP refresh in Competitors, then compute clusters in Topics.
          </p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis
                type="number"
                dataKey="volume"
                name="Volume"
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
                axisLine={false}
                tickLine={false}
              >
                <Label
                  value="Search Volume →"
                  position="bottom"
                  offset={0}
                  style={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }}
                />
              </XAxis>
              <YAxis
                type="number"
                dataKey="score"
                name="Score"
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
                axisLine={false}
                tickLine={false}
                width={30}
              >
                <Label
                  value="Visibility Score ↑"
                  angle={-90}
                  position="insideLeft"
                  offset={10}
                  style={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }}
                />
              </YAxis>

              {/* Score midpoint divider (real scale, not an invented axis point). */}
              <ReferenceLine
                y={SCORE_MID}
                stroke="rgba(255,255,255,0.15)"
                strokeDasharray="4 4"
              />

              <Tooltip
                content={<MatrixTooltip />}
                cursor={{ strokeDasharray: '3 3' }}
              />
              <Scatter data={scatterData} fill="#00D9FF" fillOpacity={0.8} />
            </ScatterChart>
          </ResponsiveContainer>

          {omitted > 0 && (
            <p className="text-[11px] text-white/35 mt-2">
              {omitted} cluster{omitted === 1 ? '' : 's'} not plotted (missing
              real volume or score).
            </p>
          )}
        </>
      )}
    </div>
  );
}
