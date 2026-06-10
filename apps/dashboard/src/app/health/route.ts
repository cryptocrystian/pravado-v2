/**
 * Dashboard /health endpoint (Phase 0.5 Plan 03)
 *
 * Public, unauthenticated. Purpose:
 *   - UptimeRobot (and any other monitor) gets a deterministic shape it
 *     can parse: {status, version, vercel:{...}, deps:{supabase}}.
 *   - Returns 200 when healthy, 503 when degraded.
 *   - `version` is the running git SHA (VERCEL_GIT_COMMIT_SHA), so a curl
 *     against the endpoint tells you exactly which deploy is serving.
 *   - `vercel.env` / `deployment` / `region` lets us cross-reference a
 *     specific Vercel deployment when an alert fires.
 *   - `deps.supabase` is a shape check — does `createClient` succeed —
 *     NOT an authenticated round-trip. We deliberately do not exercise
 *     real Supabase queries from a public endpoint.
 *
 * Security: this body is broadcast over an unauthenticated endpoint.
 * It MUST NOT include API key fragments, internal URLs, or stack-trace
 * content. The output shape is a fixed allowlist; the Playwright smoke
 * spec (apps/dashboard/tests/smoke/health.spec.ts) verifies no leaks
 * against the production deploy.
 *
 * Spec: docs/sprints/PHASE-0-5-OBSERVABILITY/03-health.md
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { serverLogger } from '@/lib/serverLogger';

// Always run on the Node.js runtime — Edge runtime can't load the
// supabase-js client cleanly, and /health doesn't benefit from Edge
// (it's polled, not interactive).
export const runtime = 'nodejs';
// Disable static optimization — health must reflect the live deploy.
export const dynamic = 'force-dynamic';

type DepStatus = 'ok' | 'not_configured' | 'degraded';

interface HealthBody {
  status: 'healthy' | 'unhealthy';
  version: string;
  timestamp: string;
  vercel: {
    env: string;
    deployment: string;
    region: string;
  };
  deps: {
    supabase: DepStatus;
  };
}

/**
 * Resolve the deploy SHA for the running process.
 *
 * Vercel sets VERCEL_GIT_COMMIT_SHA on every deploy; we also accept
 * RENDER_GIT_COMMIT for parity with the api side (helpful if dashboard
 * is ever proxied through a Render preview). Truncated to 12 chars.
 */
function resolveDeployVersion(): string {
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA || process.env.RENDER_GIT_COMMIT;
  if (sha && sha.length > 0) {
    return sha.slice(0, 12);
  }
  return 'unknown';
}

/**
 * Verify the Supabase SDK can construct with the configured public URL
 * and anon key. No outbound API call — just SDK init.
 */
function checkSupabaseInit(): DepStatus {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return 'not_configured';
  }
  try {
    createClient(url, key);
    return 'ok';
  } catch (err) {
    serverLogger.child('health').warn('supabase init threw', { err });
    return 'degraded';
  }
}

/**
 * Vercel injects a small set of env vars on every deploy. We expose
 * only the non-sensitive subset:
 *   - VERCEL_ENV: 'production' | 'preview' | 'development'
 *   - VERCEL_DEPLOYMENT_ID: short id for cross-ref in the Vercel UI
 *   - VERCEL_REGION: which edge region served the request
 *
 * All three are SAFE to broadcast — they are not secrets. We
 * deliberately do NOT expose VERCEL_URL, VERCEL_BRANCH_URL, or
 * VERCEL_PROJECT_PRODUCTION_URL (those leak preview URLs that may
 * have weak auth).
 */
function resolveVercelMeta(): HealthBody['vercel'] {
  return {
    env: process.env.VERCEL_ENV || 'unknown',
    deployment: process.env.VERCEL_DEPLOYMENT_ID || 'unknown',
    region: process.env.VERCEL_REGION || 'unknown',
  };
}

export async function GET() {
  const supabaseDep = checkSupabaseInit();
  const allOk = supabaseDep === 'ok' || supabaseDep === 'not_configured';

  const body: HealthBody = {
    status: allOk ? 'healthy' : 'unhealthy',
    version: resolveDeployVersion(),
    timestamp: new Date().toISOString(),
    vercel: resolveVercelMeta(),
    deps: {
      supabase: supabaseDep,
    },
  };

  return NextResponse.json(body, {
    status: allOk ? 200 : 503,
    headers: {
      // Disable any intermediate caching — monitors must see live state.
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
