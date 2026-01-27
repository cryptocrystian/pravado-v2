/**
 * PR Pillar Runtime Configuration
 * Sprint S100.1: Environment flags for demo mode and strict API behavior
 *
 * FLAGS:
 * - PRAVADO_DEMO_MODE=1: Allows mock data fallback when backend fails
 * - PRAVADO_STRICT_API=1: Disables ALL mock fallback, shows error/empty UI states
 *
 * RULES:
 * - STRICT_API overrides DEMO_MODE (strict wins)
 * - Default behavior: strict API mode (no implicit fallbacks)
 * - Demo mode is opt-in for demonstrations only
 */

export interface PRConfig {
  /**
   * When true, allows mock data fallback when backend API fails.
   * Useful for demonstrations and offline development.
   */
  isDemoMode: boolean;

  /**
   * When true, disables ALL mock fallback.
   * Shows error/empty states when backend fails.
   * This takes precedence over demo mode.
   */
  isStrictApi: boolean;

  /**
   * Computed: should the system fall back to mocks?
   * Only true if: isDemoMode=true AND isStrictApi=false
   */
  allowMockFallback: boolean;

  /**
   * Computed: should the system show verbose backend status logs?
   */
  showBackendStatus: boolean;

  /**
   * Environment indicator for UI
   */
  environment: 'development' | 'staging' | 'production';
}

/**
 * Parse environment flags and return PR configuration.
 * This function is safe to call on both client and server.
 */
export function getPRConfig(): PRConfig {
  // Check environment variables
  const demoModeRaw = process.env.PRAVADO_DEMO_MODE || process.env.NEXT_PUBLIC_PRAVADO_DEMO_MODE;
  const strictApiRaw = process.env.PRAVADO_STRICT_API || process.env.NEXT_PUBLIC_PRAVADO_STRICT_API;

  const isDemoMode = demoModeRaw === '1' || demoModeRaw === 'true';
  const isStrictApi = strictApiRaw === '1' || strictApiRaw === 'true';

  // STRICT_API overrides DEMO_MODE
  const allowMockFallback = isDemoMode && !isStrictApi;

  // Show backend status in development or when strict mode is enabled
  const nodeEnv = process.env.NODE_ENV;
  const showBackendStatus = nodeEnv === 'development' || isStrictApi;

  // Determine environment
  const vercelEnv = process.env.VERCEL_ENV;
  let environment: 'development' | 'staging' | 'production' = 'development';
  if (vercelEnv === 'production') {
    environment = 'production';
  } else if (vercelEnv === 'preview') {
    environment = 'staging';
  } else if (nodeEnv === 'production') {
    environment = 'production';
  }

  return {
    isDemoMode,
    isStrictApi,
    allowMockFallback,
    showBackendStatus,
    environment,
  };
}

/**
 * Singleton instance for consistent config access
 */
let cachedConfig: PRConfig | null = null;

export function getPRConfigCached(): PRConfig {
  if (!cachedConfig) {
    cachedConfig = getPRConfig();
  }
  return cachedConfig;
}

/**
 * Log PR configuration status (server-side only)
 */
export function logPRConfig(): void {
  const config = getPRConfig();
  console.log('[PR Config] Environment flags:');
  console.log(`  - PRAVADO_DEMO_MODE: ${config.isDemoMode ? 'ENABLED' : 'disabled'}`);
  console.log(`  - PRAVADO_STRICT_API: ${config.isStrictApi ? 'ENABLED' : 'disabled'}`);
  console.log(`  - Allow mock fallback: ${config.allowMockFallback}`);
  console.log(`  - Environment: ${config.environment}`);
}

/**
 * Validate configuration for production
 */
export function validatePRConfig(): { valid: boolean; warnings: string[] } {
  const config = getPRConfig();
  const warnings: string[] = [];

  if (config.environment === 'production' && config.allowMockFallback) {
    warnings.push('WARNING: PRAVADO_DEMO_MODE is enabled in production. Mock data may be served.');
  }

  if (!config.isStrictApi && config.environment === 'production') {
    warnings.push('WARNING: PRAVADO_STRICT_API is not enabled in production. Consider enabling for data integrity.');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
