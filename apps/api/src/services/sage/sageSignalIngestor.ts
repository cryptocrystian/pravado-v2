/**
 * SAGE Master Signal Ingestor (Sprint S-INT-02)
 *
 * Orchestrates all three pillar-specific ingestors and writes
 * scored signals to the sage_signals table.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from '@pravado/utils';

import { ingestPRSignals } from './sagePRSignalIngestor';
import { ingestContentSignals } from './sageContentSignalIngestor';
import { ingestSEOSignals } from './sageSEOSignalIngestor';

const logger = createLogger('sage:ingestor');

interface RawSignal {
  signal_type: string;
  source_table: string;
  source_id: string | null;
  signal_data: Record<string, unknown>;
  evi_impact_estimate: number;
  confidence: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  expires_at: string | null;
}

export interface ScanResult {
  org_id: string;
  signals_found: number;
  signals_written: number;
  by_pillar: { PR: number; Content: number; SEO: number };
  errors: string[];
  scanned_at: string;
}

/**
 * Run a full SAGE signal scan for a given org.
 * Calls all three pillar ingestors, deduplicates against existing signals,
 * and writes new signals to sage_signals.
 */
export async function runSignalScan(
  supabase: SupabaseClient,
  orgId: string
): Promise<ScanResult> {
  const errors: string[] = [];
  const byPillar = { PR: 0, Content: 0, SEO: 0 };

  // Run all three ingestors in parallel
  const [prSignals, contentSignals, seoSignals] = await Promise.allSettled([
    ingestPRSignals(supabase, orgId),
    ingestContentSignals(supabase, orgId),
    ingestSEOSignals(supabase, orgId),
  ]);

  const allSignals: Array<RawSignal & { pillar: 'PR' | 'Content' | 'SEO' }> = [];

  if (prSignals.status === 'fulfilled') {
    for (const s of prSignals.value) {
      allSignals.push({ ...s, pillar: 'PR' });
    }
    byPillar.PR = prSignals.value.length;
  } else {
    errors.push(`PR ingestor error: ${prSignals.reason}`);
    logger.error(`PR ingestor failed for org ${orgId}:`, prSignals.reason);
  }

  if (contentSignals.status === 'fulfilled') {
    for (const s of contentSignals.value) {
      allSignals.push({ ...s, pillar: 'Content' });
    }
    byPillar.Content = contentSignals.value.length;
  } else {
    errors.push(`Content ingestor error: ${contentSignals.reason}`);
    logger.error(`Content ingestor failed for org ${orgId}:`, contentSignals.reason);
  }

  if (seoSignals.status === 'fulfilled') {
    for (const s of seoSignals.value) {
      allSignals.push({ ...s, pillar: 'SEO' });
    }
    byPillar.SEO = seoSignals.value.length;
  } else {
    errors.push(`SEO ingestor error: ${seoSignals.reason}`);
    logger.error(`SEO ingestor failed for org ${orgId}:`, seoSignals.reason);
  }

  if (allSignals.length === 0) {
    logger.info(`No signals found for org ${orgId}`);
    return {
      org_id: orgId,
      signals_found: 0,
      signals_written: 0,
      by_pillar: byPillar,
      errors,
      scanned_at: new Date().toISOString(),
    };
  }

  // Deduplicate: remove signals that already exist (same org, signal_type, source_table, source_id)
  const deduped = await deduplicateSignals(supabase, orgId, allSignals);

  // Write new signals to sage_signals
  let signalsWritten = 0;
  if (deduped.length > 0) {
    const rows = deduped.map((s) => ({
      org_id: orgId,
      signal_type: s.signal_type,
      pillar: s.pillar,
      source_table: s.source_table,
      source_id: s.source_id,
      signal_data: s.signal_data,
      evi_impact_estimate: s.evi_impact_estimate,
      confidence: s.confidence,
      priority: s.priority,
      expires_at: s.expires_at,
    }));

    const { error, count } = await supabase
      .from('sage_signals')
      .insert(rows);

    if (error) {
      errors.push(`Write error: ${error.message}`);
      logger.error(`Failed to write signals for org ${orgId}: ${error.message}`);
    } else {
      signalsWritten = count ?? rows.length;
    }
  }

  logger.info(
    `SAGE scan complete for org ${orgId}: found=${allSignals.length}, written=${signalsWritten}`
  );

  return {
    org_id: orgId,
    signals_found: allSignals.length,
    signals_written: signalsWritten,
    by_pillar: byPillar,
    errors,
    scanned_at: new Date().toISOString(),
  };
}

/**
 * Remove signals that already exist in sage_signals for this org.
 * Matches on (signal_type, source_table, source_id) where source_id is not null.
 */
async function deduplicateSignals<T extends RawSignal>(
  supabase: SupabaseClient,
  orgId: string,
  signals: T[]
): Promise<T[]> {
  // Get existing signals for dedup (last 7 days to avoid stale matches)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await supabase
    .from('sage_signals')
    .select('signal_type, source_table, source_id')
    .eq('org_id', orgId)
    .gte('scored_at', sevenDaysAgo);

  if (!existing?.length) return signals;

  const existingKeys = new Set(
    existing.map(
      (e: { signal_type: string; source_table: string; source_id: string | null }) =>
        `${e.signal_type}:${e.source_table}:${e.source_id}`
    )
  );

  return signals.filter((s) => {
    if (!s.source_id) return true; // Signals without source_id are always new
    const key = `${s.signal_type}:${s.source_table}:${s.source_id}`;
    return !existingKeys.has(key);
  });
}
