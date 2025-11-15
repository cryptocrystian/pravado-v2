/**
 * Email types for mailer abstraction
 */

import type { UUID } from './common';

export interface MailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface InviteEmailContext {
  orgName: string;
  inviteLink: string;
  inviterName: string | null;
  inviterEmail: string;
  role: 'owner' | 'admin' | 'member';
  recipientEmail: string;
}

export interface OrgMemberWithUser {
  id: UUID;
  orgId: UUID;
  userId: UUID;
  role: 'owner' | 'admin' | 'member';
  createdAt: string;
  updatedAt: string;
  user: {
    id: UUID;
    fullName: string | null;
    avatarUrl: string | null;
    email?: string;
  };
}

export interface OrgInviteWithCreator {
  id: UUID;
  orgId: UUID;
  email: string;
  role: 'owner' | 'admin' | 'member';
  token: string;
  expiresAt: string;
  createdBy: UUID;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: UUID;
    fullName: string | null;
    email?: string;
  };
}
