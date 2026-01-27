/**
 * PR Guardrails Evaluation API
 * Sprint S100.1: Enforces NON-NEGOTIABLE PR automation rules
 *
 * NON-NEGOTIABLES (server-enforced):
 * 1. Pitch sending is ALWAYS Manual-only (system enforced)
 * 2. Follow-up sending requires human review even in Copilot mode
 * 3. CiteMind audio generation is Manual-only in V1
 * 4. No spray-and-pray, no bulk blast // guardrail-allow: documentation
 *
 * Guardrail Rules:
 * - Personalization gate: <40% BLOCKED, 40-60% WARNING, >60% ENABLED
 * - Follow-up limits: Max 2 per journalist per 7 days
 * - Daily pitch caps: Starter=10, Growth=50, Pro=200
 *
 * @see /docs/canon/AUTOMATE_v2.md
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
 */

import { NextRequest, NextResponse } from 'next/server';

import { prBackendFetch, getErrorResponse } from '@/server/prBackendProxy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Plan-based pitch caps
const DAILY_PITCH_CAPS: Record<string, number> = {
  starter: 10,
  growth: 50,
  pro: 200,
  enterprise: 500,
  free: 5,
};

// Follow-up limits
const MAX_FOLLOWUPS_PER_CONTACT_PER_WEEK = 2;
const FOLLOWUP_WINDOW_DAYS = 7;

// Personalization thresholds
const PERSONALIZATION_BLOCKED_THRESHOLD = 40;
const PERSONALIZATION_WARNING_THRESHOLD = 60;

interface GuardrailRequest {
  action: 'send_pitch' | 'send_followup' | 'bulk_pitch' | 'auto_schedule' | 'generate_audio';
  journalistId?: string;
  pitchId?: string;
  personalizationScore?: number;
  batchSize?: number;
}

interface GuardrailViolation {
  code: string;
  message: string;
  severity: 'blocked' | 'warning';
  suggestion?: string;
}

interface GuardrailResponse {
  allowed: boolean;
  mode: 'manual' | 'copilot' | 'autopilot';
  modeCeiling: 'manual' | 'copilot' | 'autopilot';
  violations: GuardrailViolation[];
  rationale: string;
  limits: {
    dailyPitchCap: number;
    dailyPitchesUsed: number;
    dailyPitchesRemaining: number;
    followUpsThisWeek: number;
    maxFollowUpsPerWeek: number;
  };
}

// Get daily pitch count for the org
async function getDailyPitchCount(): Promise<number> {
  try {
    const response = await prBackendFetch<{ count: number }>('/api/v1/pr/pitches/daily-count');
    return response.count || 0;
  } catch {
    // If we can't get the count, assume 0 to not block the user
    return 0;
  }
}

// Get follow-up count for a journalist in the last 7 days
async function getFollowUpCount(journalistId: string): Promise<number> {
  try {
    const response = await prBackendFetch<{ count: number }>(
      `/api/v1/pr/journalists/${journalistId}/followup-count?days=${FOLLOWUP_WINDOW_DAYS}`
    );
    return response.count || 0;
  } catch {
    // If we can't get the count, assume 0 to not block the user
    return 0;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: GuardrailRequest = await request.json();
    const { action, journalistId, personalizationScore, batchSize: _batchSize } = body;

    const violations: GuardrailViolation[] = [];
    let modeCeiling: 'manual' | 'copilot' | 'autopilot' = 'autopilot';
    let rationale = '';

    // Get current usage stats
    const dailyPitchCount = await getDailyPitchCount();
    const plan = 'growth'; // TODO: Get from org settings
    const dailyPitchCap = DAILY_PITCH_CAPS[plan] || DAILY_PITCH_CAPS.free;
    const dailyPitchesRemaining = Math.max(0, dailyPitchCap - dailyPitchCount);

    let followUpsThisWeek = 0;
    if (journalistId) {
      followUpsThisWeek = await getFollowUpCount(journalistId);
    }

    // NON-NEGOTIABLE: All pitch sending is Manual-only
    if (action === 'send_pitch' || action === 'send_followup') {
      modeCeiling = 'manual';
      rationale = 'Pitch and follow-up sending always requires manual execution to maintain relationship quality.';

      // Check personalization score
      if (personalizationScore !== undefined) {
        if (personalizationScore < PERSONALIZATION_BLOCKED_THRESHOLD) {
          violations.push({
            code: 'PERSONALIZATION_BELOW_MINIMUM',
            message: `Personalization score ${personalizationScore}% is below 40% minimum`,
            severity: 'blocked',
            suggestion: 'Add more personalized content referencing recent articles or beats',
          });
        } else if (personalizationScore < PERSONALIZATION_WARNING_THRESHOLD) {
          violations.push({
            code: 'PERSONALIZATION_LOW',
            message: `Personalization score ${personalizationScore}% is below recommended 60%`,
            severity: 'warning',
            suggestion: 'Consider adding more specific references to improve engagement',
          });
        }
      }

      // Check daily pitch cap
      if (dailyPitchesRemaining <= 0) {
        violations.push({
          code: 'DAILY_PITCH_CAP_REACHED',
          message: `Daily pitch cap of ${dailyPitchCap} reached`,
          severity: 'blocked',
          suggestion: 'Wait until tomorrow or upgrade your plan for higher limits',
        });
      }
    }

    // NON-NEGOTIABLE: Follow-ups require human review
    if (action === 'send_followup') {
      modeCeiling = 'manual';

      // Check follow-up limits
      if (journalistId && followUpsThisWeek >= MAX_FOLLOWUPS_PER_CONTACT_PER_WEEK) {
        violations.push({
          code: 'FOLLOWUP_LIMIT_REACHED',
          message: `Maximum ${MAX_FOLLOWUPS_PER_CONTACT_PER_WEEK} follow-ups per contact per week reached`,
          severity: 'blocked',
          suggestion: 'This contact has received the maximum follow-ups for this week. Wait before sending more.',
        });
      }
    }

    // NON-NEGOTIABLE: No bulk blasts // guardrail-allow: enforcement code
    if (action === 'bulk_pitch') {
      violations.push({
        code: 'BULK_BLAST_BLOCKED', // guardrail-allow: error code
        message: 'Bulk pitch blasts are not allowed',
        severity: 'blocked',
        suggestion: 'Use individual personalized pitches through the pitch pipeline',
      });
      modeCeiling = 'manual';
    }

    // NON-NEGOTIABLE: CiteMind audio is Manual-only in V1
    if (action === 'generate_audio') {
      modeCeiling = 'manual';
      rationale = 'Audio generation requires manual review and approval in V1.';
    }

    // NON-NEGOTIABLE: No auto-scheduling without human approval
    if (action === 'auto_schedule') {
      modeCeiling = 'copilot';
      rationale = 'Scheduling requires human review. SAGE can suggest times but cannot auto-schedule.';
    }

    // Determine if action is allowed
    const hasBlockingViolation = violations.some(v => v.severity === 'blocked');
    const allowed = !hasBlockingViolation;

    const response: GuardrailResponse = {
      allowed,
      mode: modeCeiling,
      modeCeiling,
      violations,
      rationale: rationale || (violations.length > 0
        ? violations.map(v => v.message).join('; ')
        : 'Action is permitted within guardrails'),
      limits: {
        dailyPitchCap,
        dailyPitchesUsed: dailyPitchCount,
        dailyPitchesRemaining,
        followUpsThisWeek,
        maxFollowUpsPerWeek: MAX_FOLLOWUPS_PER_CONTACT_PER_WEEK,
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/guardrails/evaluate] POST Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}

// GET endpoint to retrieve current guardrail status
export async function GET() {
  try {
    const dailyPitchCount = await getDailyPitchCount();
    const plan = 'growth'; // TODO: Get from org settings
    const dailyPitchCap = DAILY_PITCH_CAPS[plan] || DAILY_PITCH_CAPS.free;

    return NextResponse.json({
      plan,
      limits: {
        dailyPitchCap,
        dailyPitchesUsed: dailyPitchCount,
        dailyPitchesRemaining: Math.max(0, dailyPitchCap - dailyPitchCount),
        maxFollowUpsPerContactPerWeek: MAX_FOLLOWUPS_PER_CONTACT_PER_WEEK,
      },
      thresholds: {
        personalization: {
          blocked: PERSONALIZATION_BLOCKED_THRESHOLD,
          warning: PERSONALIZATION_WARNING_THRESHOLD,
        },
      },
      nonNegotiables: [ // guardrail-allow: documentation array
        'Pitch sending is ALWAYS Manual-only',
        'Follow-up sending requires human review',
        'CiteMind audio generation is Manual-only in V1',
        'No spray-and-pray, no bulk blast', // guardrail-allow: policy text
      ],
    });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/guardrails/evaluate] GET Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}
