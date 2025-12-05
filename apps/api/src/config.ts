/**
 * Centralized API Configuration Module (Sprint S76)
 *
 * This module provides a typed configuration object for the API.
 * All modules should import config from here instead of reading process.env directly.
 */

import { validateEnv, apiEnvSchema, type ApiEnv } from '@pravado/validators';

/**
 * Validated environment configuration.
 * Validated once at import time and cached.
 */
let _config: ApiEnv | null = null;

/**
 * Get the validated configuration object.
 * Validates on first call and caches the result.
 */
export function getConfig(): ApiEnv {
  if (!_config) {
    _config = validateEnv(apiEnvSchema);
  }
  return _config;
}

/**
 * API configuration - eagerly validated.
 * Import this for typed access to all env variables.
 */
export const config = getConfig();

/**
 * Environment helpers
 */
export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';

/**
 * Platform freeze mode (S78)
 * When enabled, blocks all write operations to core intelligence domains.
 * Controlled by PLATFORM_FREEZE environment variable.
 */
export const platformFreeze = config.PLATFORM_FREEZE;

/**
 * App version - read from package.json or fallback
 */
export const APP_VERSION = process.env.npm_package_version || '0.0.0-dev';

/**
 * Build info for health endpoints
 */
export const BUILD_INFO = {
  version: APP_VERSION,
  nodeEnv: config.NODE_ENV,
  buildTime: new Date().toISOString(),
};
