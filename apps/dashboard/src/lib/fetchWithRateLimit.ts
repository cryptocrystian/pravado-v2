/**
 * Rate-Limit-Aware Fetch Wrapper (Sprint S-INT-08)
 *
 * Wraps client-side fetch calls to gracefully handle 429 responses.
 * Logs a warning and returns null instead of throwing.
 */

export class RateLimitError extends Error {
  retryAfter: number;

  constructor(retryAfter: number) {
    super(`Rate limit exceeded. Try again in ${retryAfter} seconds.`);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Fetch wrapper that handles 429 responses gracefully.
 * Throws RateLimitError if the server returns 429.
 */
export async function fetchWithRateLimit(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(url, init);

  if (response.status === 429) {
    let retryAfter = 60;
    try {
      const data = await response.json();
      retryAfter = data.retryAfter ?? 60;
    } catch {
      // Use default
    }
    throw new RateLimitError(retryAfter);
  }

  return response;
}
