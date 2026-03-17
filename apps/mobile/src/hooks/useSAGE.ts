import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../lib/api';

interface Proposal {
  id: string;
  title: string;
  rationale: string;
  pillar: 'PR' | 'Content' | 'SEO';
  priority: 'critical' | 'high' | 'medium' | 'low';
  evi_impact_estimate: number;
  confidence: number;
  status: string;
  mode: string;
  deep_link?: { href: string; label: string };
  reasoning_trace?: Record<string, unknown>;
  created_at: string;
}

interface ActionStream {
  items: Proposal[];
  daily_brief?: string | null;
  generated_at: string;
}

export function useSAGE() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [dailyBrief, setDailyBrief] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<ActionStream>('/command-center/action-stream').catch(() => null);
      if (data) {
        setProposals(data.items || []);
        setDailyBrief(data.daily_brief || null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const pendingCount = proposals.filter(p => p.status === 'active' || p.status === 'ready').length;

  const approve = useCallback(async (id: string) => {
    setProposals(prev => prev.filter(p => p.id !== id));
    try {
      await apiFetch(`/command-center/proposals/${id}/execute`, { method: 'POST' });
    } catch {
      refresh();
    }
  }, [refresh]);

  const dismiss = useCallback(async (id: string) => {
    setProposals(prev => prev.filter(p => p.id !== id));
    try {
      await apiFetch(`/command-center/proposals/${id}/dismiss`, { method: 'POST' });
    } catch {
      refresh();
    }
  }, [refresh]);

  return { proposals, pendingCount, dailyBrief, loading, error, approve, dismiss, refresh };
}
