/**
 * PR Outreach Deliverability API Client (Sprint S45)
 * Frontend API functions for email deliverability and engagement analytics
 *
 * S100.1 Fix: Use internal route handlers only (same-origin)
 * Browser calls ONLY /api/pr/* - NO direct staging API calls
 */

import type {
  DeliverabilitySummary,
  EmailMessage,
  EmailMessageListResponse,
  EngagementMetricsListResponse,
  JournalistEngagement,
  ListEmailMessagesQuery,
  ListEngagementMetricsQuery,
  SendEmailRequest,
  SendEmailResponse,
  UpdateEmailMessageInput,
  UpdateEngagementMetricResult,
} from '@pravado/types';

/**
 * Build query string from object
 */
function buildQueryString(params: object): string {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * S100.1: Internal route helper - browser calls same-origin only
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(endpoint, {
    ...options,
    credentials: 'include',
    headers,
  });

  return response.json();
}

// =============================================
// Email Messages
// =============================================

/**
 * List email messages
 */
export async function listEmailMessages(
  query: ListEmailMessagesQuery = {}
): Promise<EmailMessageListResponse> {
  const queryString = buildQueryString(query);
  const result = await fetchApi<EmailMessageListResponse>(`/api/pr/deliverability/messages${queryString}`);

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to list email messages');
  }

  return result.data;
}

/**
 * Get a single email message
 */
export async function getEmailMessage(messageId: string): Promise<EmailMessage> {
  const result = await fetchApi<EmailMessage>(`/api/pr/deliverability/messages/${messageId}`);

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to get email message');
  }

  return result.data;
}

/**
 * Update an email message
 */
export async function updateEmailMessage(
  messageId: string,
  input: UpdateEmailMessageInput
): Promise<EmailMessage> {
  const result = await fetchApi<EmailMessage>(`/api/pr/deliverability/messages/${messageId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to update email message');
  }

  return result.data;
}

/**
 * Delete an email message
 */
export async function deleteEmailMessage(messageId: string): Promise<void> {
  const result = await fetchApi<null>(`/api/pr/deliverability/messages/${messageId}`, {
    method: 'DELETE',
  });

  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to delete email message');
  }
}

// =============================================
// Engagement Metrics
// =============================================

/**
 * List engagement metrics
 */
export async function listEngagementMetrics(
  query: ListEngagementMetricsQuery = {}
): Promise<EngagementMetricsListResponse> {
  const queryString = buildQueryString(query);
  const result = await fetchApi<EngagementMetricsListResponse>(`/api/pr/deliverability/engagement${queryString}`);

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to list engagement metrics');
  }

  return result.data;
}

/**
 * Get engagement metrics for a journalist
 */
export async function getJournalistEngagement(
  journalistId: string
): Promise<JournalistEngagement> {
  const result = await fetchApi<JournalistEngagement>(`/api/pr/deliverability/engagement/${journalistId}`);

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to get journalist engagement');
  }

  return result.data;
}

/**
 * Recalculate engagement metrics for a journalist
 */
export async function recalculateEngagementMetrics(
  journalistId: string
): Promise<UpdateEngagementMetricResult> {
  const result = await fetchApi<UpdateEngagementMetricResult>(
    `/api/pr/deliverability/engagement/${journalistId}/recalculate`,
    {
      method: 'POST',
    }
  );

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to recalculate engagement metrics');
  }

  return result.data;
}

// =============================================
// Statistics
// =============================================

/**
 * Get deliverability summary statistics
 */
export async function getDeliverabilitySummary(): Promise<DeliverabilitySummary> {
  const result = await fetchApi<DeliverabilitySummary>('/api/pr/deliverability/summary');

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to get deliverability summary');
  }

  return result.data;
}

/**
 * Get top engaged journalists
 */
export async function getTopEngagedJournalists(
  limit: number = 10
): Promise<JournalistEngagement[]> {
  const queryString = buildQueryString({ limit });
  const result = await fetchApi<JournalistEngagement[]>(`/api/pr/deliverability/top-engaged${queryString}`);

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to get top engaged journalists');
  }

  return result.data;
}

// =============================================
// Testing & Development
// =============================================

/**
 * Test email sending (development only)
 */
export async function testSendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
  const result = await fetchApi<SendEmailResponse>('/api/pr/deliverability/test-send', {
    method: 'POST',
    body: JSON.stringify(request),
  });

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to send test email');
  }

  return result.data;
}
