import type { BaseEntity, UUID, ApiResponse } from './common';

export interface User extends BaseEntity {
  id: UUID;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  user: User;
}

export interface SessionRequest {
  accessToken: string;
}

export interface SessionData {
  user: {
    id: UUID;
    email: string;
  };
}

export type SessionResponse = ApiResponse<SessionData>;

export interface UserSessionData {
  user: User;
  orgs: Org[];
  activeOrg: Org | null;
}

export type UserSessionResponse = ApiResponse<UserSessionData>;

export interface Org extends BaseEntity {
  name: string;
}

export type OrgMemberRole = 'owner' | 'admin' | 'member';

export interface OrgMember extends BaseEntity {
  orgId: UUID;
  userId: UUID;
  role: OrgMemberRole;
}

export interface OrgInvite extends BaseEntity {
  orgId: UUID;
  email: string;
  role: OrgMemberRole;
  token: UUID;
  expiresAt: string;
  createdBy: UUID;
  acceptedAt: string | null;
}

export interface Role extends BaseEntity {
  name: string;
  description: string | null;
}

export interface Permission extends BaseEntity {
  name: string;
  description: string | null;
  resource: string;
  action: string;
}

export interface RolePermission extends BaseEntity {
  roleId: UUID;
  permissionId: UUID;
}

export interface CreateOrgRequest {
  name: string;
}

export interface CreateOrgData {
  org: Org;
  membership: OrgMember;
}

export type CreateOrgResponse = ApiResponse<CreateOrgData>;

export interface CreateInviteRequest {
  email: string;
  role: OrgMemberRole;
}

export interface CreateInviteData {
  invite: OrgInvite;
}

export type CreateInviteResponse = ApiResponse<CreateInviteData>;

export interface JoinOrgRequest {
  token: UUID;
}

export interface JoinOrgData {
  org: Org;
  membership: OrgMember;
}

export type JoinOrgResponse = ApiResponse<JoinOrgData>;

export interface ListOrgsData {
  orgs: Array<Org & { role: OrgMemberRole }>;
}

export type ListOrgsResponse = ApiResponse<ListOrgsData>;

export interface ListMembersData {
  members: Array<OrgMember & { user: { id: UUID; fullName: string | null; avatarUrl: string | null; email: string } }>;
  invites: Array<OrgInvite & { createdByUser: { fullName: string | null } }>;
}

export type ListMembersResponse = ApiResponse<ListMembersData>;

export interface ResendInviteData {
  invite: OrgInvite;
}

export type ResendInviteResponse = ApiResponse<ResendInviteData>;
