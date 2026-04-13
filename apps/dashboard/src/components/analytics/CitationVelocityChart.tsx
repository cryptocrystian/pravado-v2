'use client';

/**
 * CitationVelocityChart — Line chart showing citation count over time
 * for the top 3 content pieces.
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { mockCitationVelocity, mockContentRows } from './analytics-mock-data';

const PIECE_COLORS = ['#00D9FF', '#A855F7', '#E879F9'];
const pieceNames = mockContentRows.slice(0, 3).map(r => r.title);

export function CitationVelocityChart() {
  return (
    <div className="bg-panel border border-border-subtle rounded-xl p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-4">
        Citation Velocity — Top 3 Content
      </h3>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={mockCitationVelocity}>
          <CartesianGrid horizontal vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} width={30} />
          <Tooltip
            contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="piece1" name={pieceNames[0] ?? 'Piece 1'} stroke={PIECE_COLORS[0]} strokeWidth={2} dot={{ r: 2 }} />
          <Line type="monotone" dataKey="piece2" name={pieceNames[1] ?? 'Piece 2'} stroke={PIECE_COLORS[1]} strokeWidth={2} dot={{ r: 2 }} />
          <Line type="monotone" dataKey="piece3" name={pieceNames[2] ?? 'Piece 3'} stroke={PIECE_COLORS[2]} strokeWidth={2} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
