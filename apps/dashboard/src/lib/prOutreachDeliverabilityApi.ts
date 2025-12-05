/**
 * PR Outreach Deliverability API Client (Sprint S45)
 * Frontend API functions for email deliverability and engagement analytics
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const API_PREFIX = '/api/v1/pr-outreach-deliverability';

/**
 * Helper to make authenticated API requests
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  const response = await fetch(`${API_BASE}${API_PREFIX}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  return response.json();
}

/**
 * Build query string from object
 */
function buildQueryString(params: Record<string, any>): string {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
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
  const result = await apiRequest<EmailMessageListResponse>(`/messages${queryString}`);

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to list email messages');
  }

  return result.data;
}

/**
 * Get a single email message
 */
export async function getEmailMessage(messageId: string): Promise<EmailMessage> {
  const result = await apiRequest<EmailMessage>(`/messages/${messageId}`);

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
  const result = await apiRequest<EmailMessage>(`/messages/${messageId}`, {
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
  const result = await apiRequest<null>(`/messages/${messageId}`, {
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
  const result = await apiRequest<EngagementMetricsListResponse>(`/engagement${queryString}`);

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
  const result = await apiRequest<JournalistEngagement>(`/engagement/${journalistId}`);

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
  const result = await apiRequest<UpdateEngagementMetricResult>(
    `/engagement/${journalistId}/recalculate`,
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
  const result = await apiRequest<DeliverabilitySummary>('/stats/deliverability');

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
  const result = await apiRequest<JournalistEngagement[]>(`/stats/top-engaged${queryString}`);

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
  const result = await apiRequest<SendEmailResponse>('/test-send', {
    method: 'POST',
    body: JSON.stringify(request),
  });

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to send test email');
  }

  return result.data;
}
