'use client';

import { useState } from 'react';
import { X, CheckCircle } from '@phosphor-icons/react';
import type { CoverageRow, Sentiment } from './pr-mock-data';

const sentimentColors: Record<Sentiment, string> = {
  positive: 'text-semantic-success',
  neutral: 'text-white/45',
  negative: 'text-red-500',
};

interface CoverageTableProps {
  rows: CoverageRow[];
}

export function CoverageTable({ rows }: CoverageTableProps) {
  const [showLogModal, setShowLogModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Coverage</h1>
        <button
          type="button"
          onClick={() => setShowLogModal(true)}
          className="bg-brand-magenta text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-brand-magenta/90 shadow-[0_0_10px_rgba(236,72,153,0.2)] transition-colors"
        >
          + Log Coverage
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left text-xs font-semibold uppercase tracking-wider text-white/45 py-3 pr-4">
                Headline
              </th>
              <th className="text-left text-xs font-semibold uppercase tracking-wider text-white/45 py-3 pr-4">
                Publication
              </th>
              <th className="text-left text-xs font-semibold uppercase tracking-wider text-white/45 py-3 pr-4">
                Reporter
              </th>
              <th className="text-left text-xs font-semibold uppercase tracking-wider text-white/45 py-3 pr-4">
                Date
              </th>
              <th className="text-left text-xs font-semibold uppercase tracking-wider text-white/45 py-3 pr-4">
                Reach
              </th>
              <th className="text-left text-xs font-semibold uppercase tracking-wider text-white/45 py-3 pr-4">
                Sentiment
              </th>
              <th className="text-left text-xs font-semibold uppercase tracking-wider text-white/45 py-3">
                EVI Impact
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="py-3 pr-4">
                  <span className="text-sm text-white hover:text-brand-magenta cursor-pointer transition-colors">
                    {row.headline}
                  </span>
                </td>
                <td className="text-sm text-white/70 py-3 pr-4">{row.publication}</td>
                <td className="text-sm text-white/70 py-3 pr-4">{row.reporter}</td>
                <td className="text-sm text-white/70 py-3 pr-4">{row.date}</td>
                <td className="text-sm text-white/70 py-3 pr-4">{row.reach}</td>
                <td className={`text-sm py-3 pr-4 capitalize ${sentimentColors[row.sentiment]}`}>
                  {row.sentiment}
                </td>
                <td className="py-3">
                  <span className={`text-sm font-medium ${
                    row.isPending ? 'text-white/45 italic' : 'text-brand-magenta'
                  }`}>
                    {row.eviImpact}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-cc-surface border border-emerald-500/30 rounded-xl px-4 py-3 shadow-lg animate-in slide-in-from-bottom-4">
          <CheckCircle size={16} className="text-semantic-success" weight="fill" />
          <span className="text-sm text-white">{toast}</span>
        </div>
      )}

      {/* Log Coverage Modal */}
      {showLogModal && (
        <>
          <div className="fixed inset-0 bg-page/70 z-40" onClick={() => setShowLogModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[480px] bg-slate-2 border border-slate-4 rounded-2xl p-6 z-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Log Coverage</h3>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="p-1 rounded hover:bg-white/5 transition-colors"
              >
                <X size={16} className="text-white/45" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-white/45 mb-1">Article URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cc-cyan/30"
                />
              </div>
              <div>
                <label className="block text-xs text-white/45 mb-1">Headline</label>
                <input
                  type="text"
                  placeholder="Auto-populated from URL"
                  className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cc-cyan/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/45 mb-1">Publication</label>
                  <input
                    type="text"
                    placeholder="Auto-populated"
                    className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cc-cyan/30"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/45 mb-1">Date</label>
                  <input
                    type="text"
                    placeholder="Auto-populated"
                    className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cc-cyan/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/45 mb-1">Reporter</label>
                <input
                  type="text"
                  placeholder="Select or type journalist name"
                  className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cc-cyan/30"
                />
              </div>
              <div>
                <label className="block text-xs text-white/45 mb-1">Sentiment</label>
                <select className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cc-cyan/30 appearance-none">
                  <option value="positive" className="bg-cc-surface">Positive</option>
                  <option value="neutral" className="bg-cc-surface">Neutral</option>
                  <option value="negative" className="bg-cc-surface">Negative</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowLogModal(false);
                setToast('Coverage logged — SEO impact will update within 24 hours.');
                setTimeout(() => setToast(null), 4000);
              }}
              className="w-full bg-brand-magenta text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-brand-magenta/90 shadow-[0_0_12px_rgba(236,72,153,0.25)] transition-colors mt-4"
            >
              Log Coverage
            </button>
          </div>
        </>
      )}
    </div>
  );
}
