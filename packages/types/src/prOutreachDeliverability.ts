/**
 * PR Outreach Deliverability Types (Sprint S45)
 * Type definitions for email deliverability and engagement analytics
 */

/**
 * Email send status
 */
export type EmailMessageStatus = 'pending' | 'sent' | 'bounced' | 'complained' | 'failed';

/**
 * Email provider types
 */
export type EmailProvider = 'sendgrid' | 'mailgun' | 'ses' | 'stub';

/**
 * Provider event types
 */
export type ProviderEventType =
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained'
  | 'failed';

/**
 * Email message (individual sent email)
 */
export interface EmailMessage {
  id: string;
  orgId: string;

  // Relationship
  runId: string;
  sequenceId: string;
  stepNumber: number;
  journalistId: string;

  // Content
  subject: string;
  bodyHtml: string;
  bodyText: string;

  // Provider tracking
  providerMessageId: string | null;
  sendStatus: EmailMessageStatus;

  // Engagement timestamps
  sentAt: Date | null;
  deliveredAt: Date | null;
  openedAt: Date | null;
  clickedAt: Date | null;
  bouncedAt: Date | null;
  complainedAt: Date | null;

  // Raw data
  rawEvent: Record<string, unknown>;
  metadata: Record<string, unknown>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Engagement metrics for a journalist
 */
export interface EngagementMetrics {
  id: string;
  orgId: string;
  journalistId: string;

  // Counts
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalReplied: number;
  totalBounced: number;
  totalComplained: number;

  // Score
  engagementScore: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Provider event payload (webhook)
 */
export interface ProviderEventPayload {
  provider: EmailProvider;
  eventType: ProviderEventType;
  messageId: string; // Provider's message ID
  timestamp: Date;
  recipientEmail: string;
  metadata?: Record<string, unknown>;

  // Provider-specific data
  sendgrid?: {
    event: string;
    email: string;
    timestamp: number;
    'smtp-id': string;
    sg_event_id: string;
    sg_message_id: string;
  };

  mailgun?: {
    event: string;
    recipient: string;
    timestamp: number;
    'message-id': string;
  };

  ses?: {
    eventType: string;
    mail: {
      messageId: string;
      timestamp: string;
      destination: string[];
    };
  };
}

/**
 * Normalized webhook payload
 */
export interface WebhookPayload {
  messageId: string;
  eventType: ProviderEventType;
  timestamp: Date;
  recipientEmail: string;
  metadata: Record<string, unknown>;
}

/**
 * Deliverability summary stats
 */
export interface DeliverabilitySummary {
  totalMessages: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalComplained: number;
  totalFailed: number;

  // Rates
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

/**
 * Journalist engagement with detailed metrics
 */
export interface JournalistEngagement extends EngagementMetrics {
  journalist: {
    id: string;
    name: string;
    email: string;
    outlet: string | null;
  };

  // Calculated rates
  openRate: number;
  clickRate: number;
  replyRate: number;
  bounceRate: number;
}

/**
 * Input types
 */
export interface CreateEmailMessageInput {
  // Required for sequence-based emails, optional for direct sends (S98)
  runId?: string;
  sequenceId?: string;
  stepNumber?: number;
  // Always required
  journalistId: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  providerMessageId?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateEmailMessageInput {
  providerMessageId?: string;
  sendStatus?: EmailMessageStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  complainedAt?: Date;
  rawEvent?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface UpdateEngagementMetricsInput {
  totalSent?: number;
  totalOpened?: number;
  totalClicked?: number;
  totalReplied?: number;
  totalBounced?: number;
  totalComplained?: number;
  engagementScore?: number;
}

/**
 * Query types
 */
export interface ListEmailMessagesQuery {
  runId?: string;
  sequenceId?: string;
  journalistId?: string;
  sendStatus?: EmailMessageStatus;
  limit?: number;
  offset?: number;
}

export interface ListEngagementMetricsQuery {
  minScore?: number;
  maxScore?: number;
  limit?: number;
  offset?: number;
}

/**
 * Response types
 */
export interface EmailMessageListResponse {
  messages: EmailMessage[];
  total: number;
}

export interface EngagementMetricsListResponse {
  metrics: JournalistEngagement[];
  total: number;
}

/**
 * Sending email request
 */
export interface SendEmailRequest {
  to: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  metadata?: Record<string, unknown>;
}

/**
 * Send email response
 */
export interface SendEmailResponse {
  success: boolean;
  messageId: string | null;
  provider: EmailProvider;
  error?: string;
}

/**
 * Engagement score calculation result
 */
export interface EngagementScoreResult {
  score: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  bounceRate: number;
}

/**
 * Update metrics result
 */
export interface UpdateEngagementMetricResult {
  journalistId: string;
  previousScore: number;
  newScore: number;
  metricsUpdated: boolean;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  provider: EmailProvider;
  apiKey?: string;
  apiSecret?: string;
  domain?: string;
  fromEmail: string;
  fromName: string;
  /** Webhook verification key (SendGrid public key, Mailgun signing key, etc.) */
  webhookKey?: string;
}
