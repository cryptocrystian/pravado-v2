/**
 * CiteMind Publish Gate Service (Sprint S-INT-04)
 *
 * Enforces the publish gate for content items.
 * Checks the latest CiteMind score and determines if publishing is allowed.
 *
 * Gate rules:
 * - overall >= 75: passed (publish allowed)
 * - overall >= 55: warning (publish allowed with acknowledgment)
 * - overall <  55: blocked (must improve before publish)
 *
 * If ENABLE_CITEMIND flag is false: always allows publishing.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from '@pravado/utils';
import { FLAGS } from '@pravado/feature-flags';

const logger = createLogger('citemind:gate');

// ============================================================================
// Types
// ============================================================================

export interface GateCheckResult {
  allowed: boolean;
  score: number | null;
  gate_status: 'pending' | 'passed' | 'warning' | 'blocked' | 'analyzing';
  recommendations: string[];
  factor_breakdown?: Record<string, unknown>;
  scored_at?: string;
}

export interface GateAcknowledgeResult {
  acknowledged: boolean;
  content_item_id: string;
}

// ============================================================================
// Gate Check
// ============================================================================

/**
 * Check whether a content item is allowed to publish.
 */
export async function checkGate(
  supabase: SupabaseClient,
  contentItemId: string,
  orgId: string
): Promise<GateCheckResult> {
  // Feature flag check
  if (!FLAGS.ENABLE_CITEMIND) {
    return {
      allowed: true,
      score: null,
      gate_status: 'passed',
      recommendations: [],
    };
  }

  // Get the latest score for this content item
  const { data: scores, error } = await supabase
    .from('citemind_scores')
    .select('*')
    .eq('content_item_id', contentItemId)
    .eq('org_id', orgId)
    .order('scored_at', { ascending: false })
    .limit(1);

  if (error) {
    logger.error(`Failed to fetch CiteMind score: ${error.message}`);
    // Graceful degradation: allow publish if we can't check
    return {
      allowed: true,
      score: null,
      gate_status: 'pending',
      recommendations: [],
    };
  }

  if (!scores || scores.length === 0) {
    // No score yet — pending status
    return {
      allowed: true, // Don't block if never scored
      score: null,
      gate_status: 'pending',
      recommendations: ['Run CiteMind analysis before publishing for best AI citation results.'],
    };
  }

  const latestScore = scores[0];
  const gateStatus = latestScore.gate_status as 'passed' | 'warning' | 'blocked';

  return {
    allowed: gateStatus !== 'blocked',
    score: Number(latestScore.overall_score),
    gate_status: gateStatus,
    recommendations: (latestScore.recommendations as string[]) || [],
    factor_breakdown: latestScore.factor_breakdown as Record<string, unknown>,
    scored_at: latestScore.scored_at,
  };
}

// ============================================================================
// Gate Acknowledge (Warning Override)
// ============================================================================

/**
 * Allow a user to acknowledge warnings and proceed with publishing.
 * Logs the override to audit_logs for traceability.
 */
export async function acknowledgeGate(
  supabase: SupabaseClient,
  contentItemId: string,
  orgId: string,
  userId?: string
): Promise<GateAcknowledgeResult> {
  // Log the acknowledgment to audit_logs if the table exists
  try {
    await supabase.from('audit_logs').insert({
      org_id: orgId,
      user_id: userId || null,
      action: 'citemind_gate_override',
      resource_type: 'content_item',
      resource_id: contentItemId,
      details: {
        gate_action: 'acknowledge_warning',
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    // audit_logs table may not exist yet — non-critical
    logger.warn(`Could not log gate override to audit_logs for content ${contentItemId}`);
  }

  logger.info(`Gate acknowledged for content ${contentItemId} by user ${userId || 'unknown'}`);

  return {
    acknowledged: true,
    content_item_id: contentItemId,
  };
}

// ============================================================================
// Get Latest Score
// ============================================================================

/**
 * Get the latest CiteMind score for a content item.
 */
export async function getLatestScore(
  supabase: SupabaseClient,
  contentItemId: string,
  orgId: string
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from('citemind_scores')
    .select('*')
    .eq('content_item_id', contentItemId)
    .eq('org_id', orgId)
    .order('scored_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0] as Record<string, unknown>;
}

/**
 * List scores for an org with optional filtering.
 */
export async function listScoresForOrg(
  supabase: SupabaseClient,
  orgId: string,
  filters?: { gate_status?: string; limit?: number }
): Promise<Array<Record<string, unknown>>> {
  let query = supabase
    .from('citemind_scores')
    .select('*')
    .eq('org_id', orgId)
    .order('scored_at', { ascending: false })
    .limit(filters?.limit || 50);

  if (filters?.gate_status) {
    query = query.eq('gate_status', filters.gate_status);
  }

  const { data, error } = await query;

  if (error) {
    logger.error(`Failed to list scores for org ${orgId}: ${error.message}`);
    return [];
  }

  return (data || []) as Array<Record<string, unknown>>;
}
