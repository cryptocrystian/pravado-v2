import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../lib/api';

interface ContentItem {
  id: string;
  title: string;
  content_type: string;
  status: string;
  word_count: number;
  citemind_score?: number;
  citemind_gate?: 'passed' | 'warning' | 'blocked';
  updated_at: string;
  created_at: string;
}

export function useContent(statusFilter?: string) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const data = await apiFetch<ContentItem[]>(`/content/items${params}`).catch(() => []);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { refresh(); }, [refresh]);

  return { items, loading, error, refresh };
}
