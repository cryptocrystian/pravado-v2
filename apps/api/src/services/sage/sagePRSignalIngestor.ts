/**
 * SAGE PR Signal Ingestor (Sprint S-INT-02)
 *
 * Scans PR pillar data for actionable signals:
 * 1. Pitched journalists not followed up (sent > 5 days ago, no reply)
 * 2. High-engagement journalists never pitched by this org
 * 3. Recent relationship events that create pitch windows
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from '@pravado/utils';

const logger = createLogger('sage:pr-ingestor');

export interface PRSignal {
  signal_type: string;
  source_table: string;
  source_id: string | null;
  signal_data: Record<string, unknown>;
  evi_impact_estimate: number;
  confidence: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  expires_at: string | null;
}

/**
 * Ingest all PR signals for a given org.
 */
export async function ingestPRSignals(
  supabase: SupabaseClient,
  orgId: string
): Promise<PRSignal[]> {
  const signals: PRSignal[] = [];

  const [staleFollowUps, highValueUnpitched, recentWindows] = await Promise.all([
    findStaleFollowUps(supabase, orgId),
    findHighValueUnpitchedJournalists(supabase, orgId),
    findRecentPitchWindows(supabase, orgId),
  ]);

  signals.push(...staleFollowUps, ...highValueUnpitched, ...recentWindows);
  logger.info(`PR ingestor found ${signals.length} signals for org ${orgId}`);
  return signals;
}

/**
 * Signal 1: Pitched journalists not followed up.
 * Finds pr_pitch_contacts with status 'sent' where the pitch sequence was created > 5 days ago
 * and no 'replied' event exists in pr_outreach_events.
 */
async function findStaleFollowUps(
  supabase: SupabaseClient,
  orgId: string
): Promise<PRSignal[]> {
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

  // Get pitch contacts that were sent but never got a reply
  const { data: staleContacts } = await supabase
    .from('pr_pitch_contacts')
    .select(`
      id,
      journalist_id,
      status,
      sequence_id,
      pr_pitch_sequences!inner (id, org_id, subject, created_at)
    `)
    .eq('pr_pitch_sequences.org_id', orgId)
    .eq('status', 'sent')
    .lt('pr_pitch_sequences.created_at', fiveDaysAgo);

  if (!staleContacts?.length) return [];

  // Check which of these have no reply event
  const signals: PRSignal[] = [];
  for (const contact of staleContacts) {
    const { count } = await supabase
      .from('pr_outreach_events')
      .select('*', { count: 'exact', head: true })
      .eq('contact_id', contact.id)
      .eq('event_type', 'replied');

    if ((count ?? 0) === 0) {
      const seq = contact.pr_pitch_sequences as unknown as {
        id: string;
        subject: string;
        created_at: string;
      };
      signals.push({
        signal_type: 'pr_stale_followup',
        source_table: 'pr_pitch_contacts',
        source_id: contact.id,
        signal_data: {
          journalist_id: contact.journalist_id,
          sequence_id: contact.sequence_id,
          subject: seq?.subject,
          sent_at: seq?.created_at,
          days_since_sent: Math.floor(
            (Date.now() - new Date(seq?.created_at || '').getTime()) / (24 * 60 * 60 * 1000)
          ),
        },
        evi_impact_estimate: 2.5,
        confidence: 0.7,
        priority: 'medium',
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  }

  return signals;
}

/**
 * Signal 2: High-engagement journalists never pitched by this org.
 * Finds journalist_profiles with high engagement_score that have no corresponding
 * pr_pitch_contacts entries for this org.
 */
async function findHighValueUnpitchedJournalists(
  supabase: SupabaseClient,
  orgId: string
): Promise<PRSignal[]> {
  // Get journalist_profiles with high engagement or relevance scores
  const { data: highValueJournalists } = await supabase
    .from('journalist_profiles')
    .select('id, journalist_id, engagement_score, responsiveness_score, relevance_score')
    .eq('org_id', orgId)
    .gt('engagement_score', 70);

  if (!highValueJournalists?.length) return [];

  // Get all journalist_ids already pitched by this org
  const { data: pitchedContacts } = await supabase
    .from('pr_pitch_contacts')
    .select(`
      journalist_id,
      pr_pitch_sequences!inner (org_id)
    `)
    .eq('pr_pitch_sequences.org_id', orgId);

  const pitchedJournalistIds = new Set(
    (pitchedContacts ?? []).map((c: { journalist_id: string }) => c.journalist_id)
  );

  const signals: PRSignal[] = [];
  for (const jp of highValueJournalists) {
    if (!pitchedJournalistIds.has(jp.journalist_id)) {
      signals.push({
        signal_type: 'pr_high_value_unpitched',
        source_table: 'journalist_profiles',
        source_id: jp.id,
        signal_data: {
          journalist_id: jp.journalist_id,
          engagement_score: jp.engagement_score,
          responsiveness_score: jp.responsiveness_score,
          relevance_score: jp.relevance_score,
        },
        evi_impact_estimate: 4.0,
        confidence: 0.6,
        priority: 'high',
        expires_at: null,
      });
    }
  }

  return signals;
}

/**
 * Signal 3: Recent relationship events that create pitch windows.
 * Finds journalist_relationship_events from the last 7 days with positive sentiment
 * that indicate an opportunity to pitch.
 */
async function findRecentPitchWindows(
  supabase: SupabaseClient,
  orgId: string
): Promise<PRSignal[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: recentEvents } = await supabase
    .from('journalist_relationship_events')
    .select('id, journalist_id, event_type, relevance_score, relationship_impact, sentiment, created_at')
    .eq('org_id', orgId)
    .gte('created_at', sevenDaysAgo)
    .in('sentiment', ['positive', 'very_positive'])
    .gt('relationship_impact', 0);

  if (!recentEvents?.length) return [];

  return recentEvents.map((event) => ({
    signal_type: 'pr_pitch_window',
    source_table: 'journalist_relationship_events',
    source_id: event.id,
    signal_data: {
      journalist_id: event.journalist_id,
      event_type: event.event_type,
      relevance_score: event.relevance_score,
      relationship_impact: event.relationship_impact,
      sentiment: event.sentiment,
      event_date: event.created_at,
    },
    evi_impact_estimate: 3.5,
    confidence: 0.65,
    priority: 'high' as const,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}
