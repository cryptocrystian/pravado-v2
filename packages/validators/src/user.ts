/**
 * User validation schemas
 */

import { z } from 'zod';

export const userRoleSchema = z.enum(['admin', 'user', 'guest']);

export const userStatusSchema = z.enum(['active', 'inactive', 'suspended']);

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: userRoleSchema,
  tenantId: z.string().uuid(),
  status: userStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
