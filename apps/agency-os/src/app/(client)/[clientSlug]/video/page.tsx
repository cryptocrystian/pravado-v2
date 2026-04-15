'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDate, STATUS_LABELS } from '@/lib/utils';
import { CheckCircle, XCircle, ExternalLink, Loader2 } from 'lucide-react';

interface Production {
  id: string;
  title: string;
  format: string;
  status: string;
  vimeo_review_url: string | null;
  revision_count: number;
  revision_notes: string | null;
  youtube_url: string | null;
}

export default function ClientVideoPortalPage({
  params,
}: {
  params: { clientSlug: string };
}) {
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      // Get client id from slug
      const { data: client } = await supabase
        .schema('agency')
        .from('clients')
        .select('id')
        .eq('slug', params.clientSlug)
        .single();

      if (!client) return;

      const { data } = await supabase
        .schema('agency')
        .from('video_productions')
        .select('id, title, format, status, vimeo_review_url, revision_count, revision_notes, youtube_url')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      setProductions(data ?? []);
      setLoading(false);
    }
    load();
  }, [params.clientSlug]);

  // Subscribe to real-time status updates
  useEffect(() => {
    const channel = supabase
      .channel('client-video-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'agency',
        table: 'video_productions',
      }, payload => {
        setProductions(prev =>
          prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p)
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function submitReview(
    productionId: string,
    decision: 'approved' | 'revision_requested'
  ) {
    setSubmitting(productionId);
    const { data: { user } } = await supabase.auth.getUser();

    // Get client_member id
    const { data: member } = await supabase
      .schema('agency')
      .from('client_members')
      .select('id')
      .eq('user_id', user?.id)
      .single();

    // Insert review record
    await supabase.schema('agency').from('video_reviews').insert({
      production_id: productionId,
      reviewer_id: member?.id,
      decision,
      feedback: decision === 'revision_requested' ? feedback[productionId] : null,
      reviewed_at: new Date().toISOString(),
    });

    // Update production status via API (so webhook can fire notifications)
    await fetch(`/api/agency/video/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productionId, decision, feedback: feedback[productionId] }),
    });

    setSubmitting(null);
    // Optimistically update local state
    setProductions(prev =>
      prev.map(p =>
        p.id === productionId
          ? { ...p, status: decision === 'approved' ? 'approved' : 'revision' }
          : p
      )
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-brand-cyan" />
      </div>
    );
  }

  const awaitingReview = productions.filter(p => p.status === 'client_review');
  const other = productions.filter(p => p.status !== 'client_review');

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-heading-xl text-white-0 mb-1">Video</h1>
        <p className="text-sm text-slate-6">Review and approve your video productions</p>
      </div>

      {/* Awaiting review */}
      {awaitingReview.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide mb-3 text-brand-cyan">
            Awaiting Your Review ({awaitingReview.length})
          </h2>
          <div className="space-y-4">
            {awaitingReview.map(prod => (
              <div key={prod.id} className="panel-card p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white-0">{prod.title}</h3>
                    <p className="text-xs text-slate-6 capitalize mt-0.5">
                      {prod.format.replace(/_/g, ' ')}
                      {prod.revision_count > 0 && ` · Revision ${prod.revision_count}`}
                    </p>
                  </div>
                  {prod.vimeo_review_url && (
                    <a
                      href={prod.vimeo_review_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-brand-cyan hover:underline flex-shrink-0"
                    >
                      <ExternalLink size={12} />
                      Watch video
                    </a>
                  )}
                </div>

                {/* Revision notes from previous round */}
                {prod.revision_notes && (
                  <div className="alert-info mb-4 text-xs">
                    <strong>Revision notes applied:</strong> {prod.revision_notes}
                  </div>
                )}

                {/* Feedback input for revision */}
                <textarea
                  placeholder="If requesting revisions, describe what you'd like changed..."
                  value={feedback[prod.id] || ''}
                  onChange={e => setFeedback(prev => ({ ...prev, [prod.id]: e.target.value }))}
                  className="input-field text-sm mb-4 resize-none"
                  rows={3}
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => submitReview(prod.id, 'approved')}
                    disabled={submitting === prod.id}
                    className="btn-agency flex items-center gap-2 flex-1 justify-center"
                  >
                    {submitting === prod.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle size={14} />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => submitReview(prod.id, 'revision_requested')}
                    disabled={submitting === prod.id || !feedback[prod.id]?.trim()}
                    className="btn-secondary flex items-center gap-2 flex-1 justify-center"
                  >
                    <XCircle size={14} />
                    Request Revision
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All videos */}
      {other.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-slate-6 uppercase tracking-wide mb-3">
            All Videos
          </h2>
          <div className="panel-card divide-y divide-border-subtle">
            {other.map(prod => (
              <div key={prod.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white-0 truncate">{prod.title}</p>
                  <p className="text-xs text-slate-6 capitalize">{prod.format.replace(/_/g, ' ')}</p>
                </div>
                <div className="flex items-center gap-3">
                  {prod.youtube_url && (
                    <a
                      href={(prod as any).youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-cyan hover:underline"
                    >
                      Watch ↗
                    </a>
                  )}
                  <span className={`badge-${prod.status.replace(/_/g, '-')}`}>
                    {STATUS_LABELS[prod.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {productions.length === 0 && (
        <div className="panel-card py-12 text-center">
          <p className="text-sm text-slate-6">No video productions yet</p>
        </div>
      )}
    </div>
  );
}
