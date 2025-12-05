/**
 * Press Release API Client (Sprint S38)
 * Client-side API helpers for press release generator
 */

import type {
  PRDetailResponse,
  PRGeneratedRelease,
  PRGenerationInput,
  PRGenerationResponse,
  PRListFilters,
  PRListResponse,
  PROptimizationResult,
  PRSimilarityResponse,
} from '@pravado/types';

// Re-export types for convenience
export type {
  PRDetailResponse,
  PRGeneratedRelease,
  PRGenerationInput,
  PRGenerationResponse,
  PRListFilters,
  PRListResponse,
  PROptimizationResult,
  PRSimilarityResponse,
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * API Response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Generate a new press release
 */
export async function generatePressRelease(
  input: PRGenerationInput
): Promise<PRGenerationResponse> {
  const response = await fetch(`${API_BASE}/api/v1/pr/releases/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  const result: ApiResponse<PRGenerationResponse> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to generate press release');
  }

  return result.data;
}

/**
 * List press releases
 */
export async function listPressReleases(
  filters?: PRListFilters
): Promise<PRListResponse> {
  const params = new URLSearchParams();

  if (filters?.status) params.set('status', filters.status);
  if (filters?.startDate) params.set('startDate', filters.startDate);
  if (filters?.endDate) params.set('endDate', filters.endDate);
  if (filters?.limit) params.set('limit', filters.limit.toString());
  if (filters?.offset) params.set('offset', filters.offset.toString());

  const response = await fetch(
    `${API_BASE}/api/v1/pr/releases?${params.toString()}`,
    {
      method: 'GET',
      credentials: 'include',
    }
  );

  const result: ApiResponse<PRListResponse> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to list press releases');
  }

  return result.data;
}

/**
 * Get a press release by ID
 */
export async function getPressRelease(id: string): Promise<PRDetailResponse> {
  const response = await fetch(`${API_BASE}/api/v1/pr/releases/${id}`, {
    method: 'GET',
    credentials: 'include',
  });

  const result: ApiResponse<PRDetailResponse> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to get press release');
  }

  return result.data;
}

/**
 * Optimize a press release
 */
export async function optimizePressRelease(id: string): Promise<PROptimizationResult> {
  const response = await fetch(`${API_BASE}/api/v1/pr/releases/${id}/optimize`, {
    method: 'POST',
    credentials: 'include',
  });

  const result: ApiResponse<PROptimizationResult> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to optimize press release');
  }

  return result.data;
}

/**
 * Find similar press releases
 */
export async function findSimilarPressReleases(
  id: string,
  limit: number = 5
): Promise<PRSimilarityResponse> {
  const response = await fetch(
    `${API_BASE}/api/v1/pr/releases/${id}/embeddings/similar?limit=${limit}`,
    {
      method: 'GET',
      credentials: 'include',
    }
  );

  const result: ApiResponse<PRSimilarityResponse> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to find similar releases');
  }

  return result.data;
}

/**
 * Get the SSE stream URL for generation progress
 */
export function getGenerationStreamUrl(id: string): string {
  return `${API_BASE}/api/v1/pr/releases/${id}/stream`;
}

/**
 * Subscribe to generation progress events via SSE
 */
export function subscribeToGenerationProgress(
  releaseId: string,
  callbacks: {
    onStart?: () => void;
    onProgress?: (step: string, progress: number) => void;
    onComplete?: (releaseId: string) => void;
    onError?: (error: string) => void;
    onDisconnect?: () => void;
  }
): () => void {
  const eventSource = new EventSource(getGenerationStreamUrl(releaseId), {
    withCredentials: true,
  });

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as {
        type: string;
        releaseId?: string;
        step?: string;
        progress?: number;
        error?: string;
      };

      switch (data.type) {
        case 'started':
          callbacks.onStart?.();
          break;

        case 'progress':
          callbacks.onProgress?.(data.step || '', data.progress || 0);
          break;

        case 'completed':
          callbacks.onComplete?.(data.releaseId || releaseId);
          eventSource.close();
          break;

        case 'failed':
          callbacks.onError?.(data.error || 'Generation failed');
          eventSource.close();
          break;
      }
    } catch (err) {
      console.error('Failed to parse SSE event:', err);
    }
  };

  eventSource.onerror = () => {
    callbacks.onDisconnect?.();
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
}

/**
 * Format news type for display
 */
export function formatNewsType(newsType: string): string {
  const mapping: Record<string, string> = {
    product_launch: 'Product Launch',
    company_milestone: 'Company Milestone',
    partnership: 'Partnership',
    acquisition: 'Acquisition',
    funding: 'Funding',
    executive_hire: 'Executive Hire',
    award: 'Award',
    event: 'Event',
    research: 'Research',
    other: 'Other',
  };
  return mapping[newsType] || newsType;
}

/**
 * Get status color for display
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'complete':
      return 'green';
    case 'generating':
      return 'blue';
    case 'draft':
      return 'gray';
    case 'failed':
      return 'red';
    default:
      return 'gray';
  }
}

/**
 * Get status label for display
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'complete':
      return 'Complete';
    case 'generating':
      return 'Generating';
    case 'draft':
      return 'Draft';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format relative time
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}
