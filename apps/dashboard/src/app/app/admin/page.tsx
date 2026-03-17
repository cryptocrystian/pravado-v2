'use client';

import { useState, useEffect } from 'react';

interface Overview {
  system: { api: string; database: string; redis: string };
  orgs: { total: number; active_7d: number; active_30d: number; onboarding_complete: number };
  llm: { tokens_today: number; tokens_month: number; cost_estimate_month: number };
  sage: { proposals_generated_7d: number; proposals_accepted_7d: number; acceptance_rate: number };
  beta: { pending_requests: number };
}

function StatusPill({ label, status }: { label: string; status: string }) {
  const color = status === 'ok' || status === 'healthy'
    ? 'bg-semantic-success/15 text-semantic-success border-semantic-success/30'
    : status === 'degraded'
    ? 'bg-semantic-warning/15 text-semantic-warning border-semantic-warning/30'
    : 'bg-semantic-danger/15 text-semantic-danger border-semantic-danger/30';
  return (
    <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded border ${color}`}>
      {label}: {status}
    </span>
  );
}

function MetricCard({ label, value, subtitle }: { label: string; value: string | number; subtitle?: string }) {
  return (
    <div className="p-4 rounded-lg border" style={{ background: '#13131A', borderColor: '#1F1F28' }}>
      <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
      {subtitle && <p className="text-[11px] text-white/35 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    function load() {
      fetch('/api/admin/overview')
        .then(r => r.json())
        .then(d => { if (d.system) setData(d); })
        .catch(() => {});
    }
    load();
    const iv = setInterval(load, 60000);
    return () => clearInterval(iv);
  }, []);

  if (!data) {
    return (
      <div className="p-8">
        <h1 className="text-lg font-bold text-white mb-6">Overview</h1>
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-24 rounded-lg animate-pulse" style={{ background: '#13131A' }} />
          ))}
        </div>
      </div>
    );
  }

  const anyDegraded = data.system.database !== 'ok' || data.system.redis !== 'ok';

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-lg font-bold text-white mb-6">Overview</h1>

      {/* System status */}
      {anyDegraded && (
        <div className="bg-semantic-warning/10 border border-semantic-warning/20 rounded-lg px-4 py-3 mb-6">
          <p className="text-sm text-semantic-warning font-medium">One or more systems need attention</p>
        </div>
      )}
      <div className="flex items-center gap-2 mb-6">
        <StatusPill label="API" status={data.system.api} />
        <StatusPill label="Database" status={data.system.database} />
        <StatusPill label="Redis" status={data.system.redis} />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="Total Orgs"
          value={data.orgs.total}
          subtitle={`${data.orgs.active_7d} active last 7 days`}
        />
        <MetricCard
          label="Onboarding Complete"
          value={data.orgs.onboarding_complete}
          subtitle={data.orgs.total > 0 ? `${Math.round((data.orgs.onboarding_complete / data.orgs.total) * 100)}% of total` : '--'}
        />
        <MetricCard
          label="SAGE Acceptance Rate"
          value={data.sage.acceptance_rate > 0 ? `${Math.round(data.sage.acceptance_rate * 100)}%` : '--'}
          subtitle={`${data.sage.proposals_generated_7d} generated / ${data.sage.proposals_accepted_7d} accepted (7d)`}
        />
        <MetricCard
          label="LLM Spend This Month"
          value={`$${data.llm.cost_estimate_month.toFixed(2)}`}
          subtitle={`${data.llm.tokens_month.toLocaleString()} tokens`}
        />
        <MetricCard
          label="Pending Beta Requests"
          value={data.beta.pending_requests}
        />
      </div>
    </div>
  );
}
