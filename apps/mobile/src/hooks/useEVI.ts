import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../lib/api';

interface EVIData {
  score: number;
  delta_7d: number;
  delta_30d: number;
  status: 'at_risk' | 'emerging' | 'competitive' | 'dominant';
  trend: 'up' | 'down' | 'flat';
  sparkline: number[];
  drivers: Array<{
    type: string;
    label: string;
    score: number;
    delta_7d: number;
    weight: number;
  }>;
}

interface EVIHistory {
  points: Array<{ date: string; score: number }>;
}

export function useEVI(period = '30d') {
  const [data, setData] = useState<EVIData | null>(null);
  const [history, setHistory] = useState<EVIHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [current, hist] = await Promise.all([
        apiFetch<EVIData>('/evi/current').catch(() => null),
        apiFetch<EVIHistory>(`/evi/history?period=${period}`).catch(() => null),
      ]);
      if (current) setData(current);
      if (hist) setHistory(hist);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load EVI');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, history, loading, error, refresh };
}
