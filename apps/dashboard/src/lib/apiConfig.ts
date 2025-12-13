/**
 * Centralized API Configuration (Sprint S99 Fix)
 *
 * Provides the API base URL for client-side requests.
 * Throws a clear error in production if NEXT_PUBLIC_API_URL is not set.
 */

function getApiBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // In production/staging, NEXT_PUBLIC_API_URL must be set
  if (!apiUrl) {
    // Check if we're in a browser environment and not localhost
    if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
      console.error(
        '[API Config] CRITICAL: NEXT_PUBLIC_API_URL is not set in production/staging environment. ' +
        'API calls will fail. Please set this environment variable in Vercel.'
      );
      // Return a placeholder that will cause clear errors rather than silent localhost calls
      return 'https://api-url-not-configured.invalid';
    }
    // In development, fall back to localhost:3001 (the correct local API port)
    return 'http://localhost:3001';
  }

  return apiUrl;
}

/**
 * The base URL for API requests.
 * In production: Uses NEXT_PUBLIC_API_URL (e.g., https://pravado-api-staging.onrender.com)
 * In development: Falls back to http://localhost:3001
 */
export const API_BASE_URL = getApiBaseUrl();

/**
 * Helper to construct full API URLs
 */
export function apiUrl(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
