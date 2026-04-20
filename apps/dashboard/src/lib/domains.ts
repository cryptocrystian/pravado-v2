/**
 * Domain URL helpers
 * Use these throughout the app instead of hardcoded URLs
 * so dev/preview/production all resolve correctly.
 */

export const DOMAINS = {
  marketing: process.env.NEXT_PUBLIC_MARKETING_URL || 'https://pravado.io',
  app: process.env.NEXT_PUBLIC_APP_URL || 'https://app.pravado.io',
} as const;

/** Build a full URL pointing to the marketing site */
export function marketingUrl(path: string): string {
  return `${DOMAINS.marketing}${path}`;
}

/** Build a full URL pointing to the app/dashboard */
export function appUrl(path: string): string {
  return `${DOMAINS.app}${path}`;
}
