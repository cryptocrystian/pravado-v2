/**
 * Feature flag definitions
 * All flags are defined here with their default values
 */

export const FLAGS = {
  // API flags
  ENABLE_API_V2: false,
  ENABLE_RATE_LIMITING: false,
  ENABLE_WEBHOOKS: false,

  // Dashboard flags
  ENABLE_DARK_MODE: false,
  ENABLE_ANALYTICS: false,
  ENABLE_ADVANCED_SEARCH: false,

  // Mobile flags
  ENABLE_PUSH_NOTIFICATIONS: false,
  ENABLE_BIOMETRICS: false,
  ENABLE_OFFLINE_MODE: false,

  // System flags
  ENABLE_DEBUG_MODE: false,
  ENABLE_MAINTENANCE_MODE: false,
} as const;

export type FlagName = keyof typeof FLAGS;
export type FlagValue = (typeof FLAGS)[FlagName];
