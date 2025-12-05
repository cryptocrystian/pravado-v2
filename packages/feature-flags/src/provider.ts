/**
 * Feature flag provider with environment variable overrides
 */

import { FLAGS, type FlagName } from './flags';

export class FeatureFlagProvider {
  private flags: Map<FlagName, boolean>;

  constructor() {
    this.flags = new Map();
    this.loadFlags();
  }

  private loadFlags(): void {
    // Load default flags
    Object.entries(FLAGS).forEach(([name, defaultValue]) => {
      const envValue = process.env[name];
      const value =
        envValue !== undefined ? envValue === 'true' : defaultValue;
      this.flags.set(name as FlagName, value);
    });
  }

  /**
   * Check if a feature flag is enabled
   */
  isEnabled(flagName: FlagName): boolean {
    return this.flags.get(flagName) ?? false;
  }

  /**
   * Set a feature flag value (runtime override)
   */
  setFlag(flagName: FlagName, value: boolean): void {
    this.flags.set(flagName, value);
  }

  /**
   * Get all flags and their values
   */
  getAllFlags(): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    this.flags.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Reset all flags to default values
   */
  reset(): void {
    this.loadFlags();
  }
}

// Singleton instance
let instance: FeatureFlagProvider | null = null;

export function getFeatureFlagProvider(): FeatureFlagProvider {
  if (!instance) {
    instance = new FeatureFlagProvider();
  }
  return instance;
}

/**
 * Check if a feature flag is enabled (convenience function)
 */
export function isEnabled(flagName: FlagName): boolean {
  return getFeatureFlagProvider().isEnabled(flagName);
}

/**
 * Alias for isEnabled (alternative naming convention)
 */
export const isFeatureEnabled = isEnabled;
