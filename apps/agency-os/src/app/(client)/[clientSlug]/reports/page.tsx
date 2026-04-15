import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { formatDate, STATUS_LABELS } from '@/lib/utils';

export default async function ClientPortalReportsPage({
  params,
}: {
  params: { clientSlug: string };
}) {
  const supabase = await createSupabaseServerClient();

  const { data: client } = await supabase
    .schema('agency').from('clients').select('id, name')
    .eq('slug', params.clientSlug).single();

  if (!client) notFound();

  const { data: reports } = await supabase
    .schema('agency').from('reports').select('*')
    .eq('client_id', client.id).eq('status', 'sent')
    .order('period_start', { ascending: false });

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-heading-xl text-white-0 mb-1">Reports</h1>
        <p className="text-sm text-slate-6">Monthly and quarterly performance reports</p>
      </div>

      <div className="panel-card divide-y divide-border-subtle">
        {(reports ?? []).length === 0 ? (
          <p className="px-5 py-12 text-sm text-slate-6 text-center">
            No reports available yet — your first monthly report will appear here
          </p>
        ) : (
          (reports ?? []).map(report => {
            const snap = report.data_snapshot as Record<string, number> | null;
            return (
              <div key={report.id} className="px-5 py-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-white-0 capitalize">
                      {report.type} Report
                    </p>
                    <p className="text-xs text-slate-6">
                      {formatDate(report.period_start, { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  {report.report_url && (
                    <a
                      href={report.report_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      Download PDF ↗
                    </a>
                  )}
                </div>

                {/* Snapshot highlights */}
                {snap && (
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Coverage', value: snap.coverage_count ?? 0 },
                      { label: 'Tier 1', value: (snap.coverage_by_tier as unknown as Record<string, number> | undefined)?.tier1 ?? 0 },
                      { label: 'Videos', value: snap.videos_published ?? 0 },
                      { label: 'Pitches Placed', value: snap.pitches_placed ?? 0 },
                    ].map(stat => (
                      <div key={stat.label} className="bg-slate-3 rounded-md p-3 text-center">
                        <p className="text-lg font-bold text-white-0">{stat.value}</p>
                        <p className="text-xs text-slate-6 mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
