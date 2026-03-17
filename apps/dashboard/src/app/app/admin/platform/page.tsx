'use client';

import { useState, useEffect } from 'react';

interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

interface QueueData {
  queues: QueueStats[];
  redis_unavailable?: boolean;
}

export default function AdminPlatformPage() {
  const [data, setData] = useState<QueueData | null>(null);

  useEffect(() => {
    fetch('/api/admin/platform/queues')
      .then(r => r.json())
      .then(setData)
      .catch(() => setData({ queues: [], redis_unavailable: true }));
  }, []);

  function statusBadge(q: QueueStats) {
    if (q.failed > 10 || q.waiting > 100) return 'bg-semantic-danger/15 text-semantic-danger';
    if (q.failed > 0) return 'bg-semantic-warning/15 text-semantic-warning';
    return 'bg-semantic-success/15 text-semantic-success';
  }

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-lg font-bold text-white mb-6">Platform Health</h1>

      {data?.redis_unavailable && (
        <div className="bg-brand-cyan/10 border border-brand-cyan/20 rounded-lg px-4 py-3 mb-6">
          <p className="text-sm text-brand-cyan">BullMQ queues are disabled — Redis unavailable</p>
        </div>
      )}

      {!data ? (
        <div className="h-48 rounded-lg animate-pulse" style={{ background: '#13131A' }} />
      ) : data.queues.length === 0 && !data.redis_unavailable ? (
        <p className="text-sm text-white/40">No queue data available</p>
      ) : data.queues.length > 0 ? (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#1F1F28' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#13131A' }}>
                <th className="text-left px-4 py-3 text-[11px] text-white/40 uppercase tracking-wider">Queue</th>
                <th className="text-right px-4 py-3 text-[11px] text-white/40 uppercase tracking-wider">Waiting</th>
                <th className="text-right px-4 py-3 text-[11px] text-white/40 uppercase tracking-wider">Active</th>
                <th className="text-right px-4 py-3 text-[11px] text-white/40 uppercase tracking-wider">Failed</th>
                <th className="text-right px-4 py-3 text-[11px] text-white/40 uppercase tracking-wider">Completed</th>
                <th className="text-right px-4 py-3 text-[11px] text-white/40 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#1F1F28' }}>
              {data.queues.map(q => (
                <tr key={q.name} style={{ background: '#0A0A0F' }}>
                  <td className="px-4 py-3 text-white/80 font-mono text-xs">{q.name}</td>
                  <td className="px-4 py-3 text-right text-white/60 tabular-nums">{q.waiting}</td>
                  <td className="px-4 py-3 text-right text-white/60 tabular-nums">{q.active}</td>
                  <td className="px-4 py-3 text-right text-white/60 tabular-nums">{q.failed}</td>
                  <td className="px-4 py-3 text-right text-white/60 tabular-nums">{q.completed}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${statusBadge(q)}`}>
                      {q.failed > 10 || q.waiting > 100 ? 'Critical' : q.failed > 0 ? 'Warning' : 'Healthy'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
