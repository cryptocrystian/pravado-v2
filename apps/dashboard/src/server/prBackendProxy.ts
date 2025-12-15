/**
 * PR Backend Proxy - Server-Only Fetch Wrapper
 * Sprint S100: The ONLY way to call the staging API from route handlers
 *
 * RULES:
 * - This module is server-only
 * - Only route handlers should import this
 * - Pages and components must NEVER import this
 * - All staging API calls go through prBackendFetch()
 */

import 'server-only';

import { getServerAccessToken, ServerAuthError } from './supabaseServerAuth';

// ============================================================================
// Configuration
// ============================================================================

function getApiBaseUrl(): string {
  // Check multiple env var names for compatibility
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
    || process.env.PRAVADO_API_BASE_URL
    || process.env.API_BASE_URL;

  if (!apiUrl) {
    console.error('[prBackendProxy] CRITICAL: No API base URL configured');
    console.error('[prBackendProxy] Set NEXT_PUBLIC_API_URL, PRAVADO_API_BASE_URL, or API_BASE_URL');
    throw new Error('API_URL_MISSING: No API base URL environment variable configured');
  }

  return apiUrl;
}

const DEBUG_AUTH = process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true';

// ============================================================================
// Error Types
// ============================================================================

export interface ProxyError {
  status: number;
  message: string;
  path: string;
  code?: string;
}

export class BackendProxyError extends Error {
  status: number;
  path: string;
  code?: string;

  constructor(error: ProxyError) {
    super(error.message);
    this.name = 'BackendProxyError';
    this.status = error.status;
    this.path = error.path;
    this.code = error.code;
  }
}

// ============================================================================
// Debug Logging
// ============================================================================

function debugLog(message: string, data?: Record<string, unknown>) {
  if (DEBUG_AUTH) {
    console.log(`[prBackendProxy] ${message}`, data || '');
  }
}

// ============================================================================
// Backend Fetch
// ============================================================================

/**
 * Make an authenticated request to the staging API.
 * This is the ONLY function that should call the staging API.
 *
 * @param path - API path (e.g., '/api/v1/journalist-graph/profiles')
 * @param init - Fetch init options
 * @returns Parsed JSON response
 * @throws ServerAuthError if no auth token
 * @throws BackendProxyError if API returns non-2xx
 */
export async function prBackendFetch<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const apiBaseUrl = getApiBaseUrl();
  const token = await getServerAccessToken();

  const url = `${apiBaseUrl}${path}`;
  const method = init.method || 'GET';

  debugLog('Making backend request', {
    url,
    method,
    hasBody: !!init.body,
  });

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    ...(init.headers as Record<string, string>),
  };

  // Set Content-Type for requests with body
  if (init.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  debugLog('Backend response', {
    status: response.status,
    ok: response.ok,
    path,
  });

  if (!response.ok) {
    let errorMessage = `Backend API error: ${response.status} ${response.statusText}`;
    let errorCode: string | undefined;

    try {
      const errorBody = await response.json();
      if (errorBody.error?.message) {
        errorMessage = errorBody.error.message;
        errorCode = errorBody.error.code;
      } else if (errorBody.message) {
        errorMessage = errorBody.message;
      }
    } catch {
      // Ignore JSON parse errors
    }

    throw new BackendProxyError({
      status: response.status,
      message: errorMessage,
      path,
      code: errorCode,
    });
  }

  const data = await response.json();

  // Handle wrapped responses { success: true, data: ... }
  if (data && typeof data === 'object' && 'success' in data) {
    if (!data.success) {
      throw new BackendProxyError({
        status: 500,
        message: data.error?.message || 'API returned success: false',
        path,
        code: data.error?.code,
      });
    }
    return data.data as T;
  }

  return data as T;
}

/**
 * Helper to convert ServerAuthError or BackendProxyError to HTTP response info
 */
export function getErrorResponse(error: unknown): { status: number; message: string; code?: string } {
  if (error instanceof ServerAuthError) {
    return {
      status: 401,
      message: 'Authentication required',
      code: error.code,
    };
  }

  if (error instanceof BackendProxyError) {
    return {
      status: error.status,
      message: error.message,
      code: error.code,
    };
  }

  const message = error instanceof Error ? error.message : 'Unknown error';
  return {
    status: 500,
    message,
  };
}
