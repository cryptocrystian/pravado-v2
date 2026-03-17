import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../lib/api';

interface Pitch {
  id: string;
  subject: string;
  journalist_name: string;
  outlet_name: string;
  status: string;
  sent_at?: string;
  created_at: string;
}

interface Coverage {
  id: string;
  publication: string;
  headline: string;
  url: string;
  evi_impact: number;
  published_at: string;
}

interface Journalist {
  id: string;
  name: string;
  outlet_name: string;
  beat: string;
  relationship: 'warm' | 'cold' | 'active';
}

export function usePR() {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [coverage, setCoverage] = useState<Coverage[]>([]);
  const [journalists, setJournalists] = useState<Journalist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [p, c, j] = await Promise.all([
        apiFetch<Pitch[]>('/pr/pitches').catch(() => []),
        apiFetch<Coverage[]>('/pr/coverage').catch(() => []),
        apiFetch<Journalist[]>('/journalists').catch(() => []),
      ]);
      setPitches(Array.isArray(p) ? p : []);
      setCoverage(Array.isArray(c) ? c : []);
      setJournalists(Array.isArray(j) ? j : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load PR data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { pitches, coverage, journalists, loading, error, refresh };
}
