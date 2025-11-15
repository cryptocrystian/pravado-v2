/**
 * User and authentication types
 */

import type { BaseEntity, UUID } from './common';

export interface User extends BaseEntity {
  email: string;
  name: string;
  role: UserRole;
  tenantId: UUID;
  status: UserStatus;
}

export type UserRole = 'admin' | 'user' | 'guest';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: AuthToken;
}
