/**
 * API-specific types
 */

/**
 * Health-check response shape returned by `GET /health` on apps/api and
 * `GET /health` on apps/dashboard. Plan 03 added `deps` (downstream-SDK
 * init status — no real outbound calls) and standardized `version` to
 * the running git SHA.
 *
 * Safety: this object is broadcast over an unauthenticated endpoint that
 * uptime monitors poll. The shape is deliberately a fixed allowlist of
 * primitives — never spread errors or env into it. See
 * apps/api/tests/health.test.ts for the leak assertions.
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  version: string;
  timestamp: string;
  /**
   * Downstream dependency SDK init status. Plan 03 only checks whether
   * the SDK can construct with its required env (key present + non-empty)
   * — it does NOT make real API calls (those would turn /health into a
   * paid poll target).
   */
  deps?: {
    supabase?: DepStatus;
    resend?: DepStatus;
    stripe?: DepStatus;
  };
  /**
   * Live infrastructure checks. `database` and `redis` issue real
   * lightweight pings; `not_configured` means the env var is unset (treated
   * as ok for /health aggregation).
   */
  checks: Record<string, string>;
}

/**
 * Downstream-dep status. `ok` = SDK initialized with required env;
 * `not_configured` = env var absent (treated as ok at aggregation time);
 * `degraded` = SDK init failed or env present but malformed.
 *
 * NOTE: Plan 03 deliberately omits error messages from this struct so
 * health responses cannot leak stack traces or key fragments.
 */
export type DepStatus = 'ok' | 'not_configured' | 'degraded';

export interface CheckStatus {
  status: 'up' | 'down';
  responseTime?: number;
  message?: string;
}

export interface ApiConfig {
  port: number;
  host: string;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  rateLimit?: {
    max: number;
    windowMs: number;
  };
}
