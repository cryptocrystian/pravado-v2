import { z } from 'zod';

export const orgMemberRoleSchema = z.enum(['owner', 'admin', 'member']);

export const sessionRequestSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
});

export const createOrgSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100),
});

export const createInviteSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: orgMemberRoleSchema.default('member'),
});

export const joinOrgSchema = z.object({
  token: z.string().uuid('Valid invite token is required'),
});

export const userSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const orgSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const orgMemberSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  userId: z.string().uuid(),
  role: orgMemberRoleSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const orgInviteSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  email: z.string().email(),
  role: orgMemberRoleSchema,
  token: z.string().uuid(),
  expiresAt: z.string().datetime(),
  createdBy: z.string().uuid(),
  acceptedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
