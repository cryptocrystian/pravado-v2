# Organization Model

## Overview

Pravado implements a multi-tenant organization model where users can belong to multiple organizations with different roles. Organizations are the primary unit of data isolation and access control.

## Database Schema

### Tables

#### orgs

Primary organization entity.

```sql
CREATE TABLE public.orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Fields**:
- `id`: Unique identifier
- `name`: Organization display name
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

**Indexes**:
- Primary key on `id`

#### org_members

Junction table for user-organization relationships with roles.

```sql
CREATE TYPE org_member_role AS ENUM ('owner', 'admin', 'member');

CREATE TABLE public.org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role org_member_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_org_user UNIQUE (org_id, user_id)
);
```

**Fields**:
- `id`: Unique identifier
- `org_id`: Reference to organization
- `user_id`: Reference to user
- `role`: User's role in this organization
- `created_at`: Timestamp when user joined
- `updated_at`: Timestamp of last update

**Constraints**:
- `unique_org_user`: Prevents duplicate memberships
- Cascading deletes when org or user is deleted

**Indexes**:
- Primary key on `id`
- Composite unique index on `(org_id, user_id)`
- Foreign key indexes on `org_id` and `user_id`

#### org_invites

Invitation system for adding users to organizations.

```sql
CREATE TABLE public.org_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role org_member_role NOT NULL DEFAULT 'member',
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Fields**:
- `id`: Unique identifier
- `org_id`: Organization being joined
- `email`: Invitee's email address
- `role`: Role to be assigned upon acceptance
- `token`: Secure random token for invite URL
- `created_by`: User who created the invite
- `accepted_at`: Timestamp when invite was accepted (NULL if pending)
- `expires_at`: Expiration timestamp (7 days from creation)
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

**Constraints**:
- `token` must be unique
- Cascading deletes when org or creator is deleted

## Role Hierarchy

### Roles

```
owner (level 3)
  └─ Can do everything
  └─ Transfer ownership
  └─ Delete organization

admin (level 2)
  └─ Invite users
  └─ Remove members
  └─ Manage org settings

member (level 1)
  └─ View org resources
  └─ Basic access
```

### Permission Inheritance

Higher roles inherit all permissions of lower roles. The hierarchy is enforced in `apps/api/src/middleware/requireRole.ts`:

```typescript
const roleHierarchy: Record<OrgRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};
```

## Row-Level Security (RLS)

### orgs Table

**SELECT Policy**: Users can view organizations they are members of
```sql
CREATE POLICY "Users can view orgs they are members of"
  ON public.orgs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = orgs.id
      AND org_members.user_id = auth.uid()
    )
  );
```

**INSERT Policy**: Authenticated users can create organizations
```sql
CREATE POLICY "Authenticated users can create orgs"
  ON public.orgs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

**UPDATE Policy**: Only owners can update organizations
```sql
CREATE POLICY "Owners can update their orgs"
  ON public.orgs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = orgs.id
      AND org_members.user_id = auth.uid()
      AND org_members.role = 'owner'
    )
  );
```

**DELETE Policy**: Only owners can delete organizations
```sql
CREATE POLICY "Owners can delete their orgs"
  ON public.orgs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = orgs.id
      AND org_members.user_id = auth.uid()
      AND org_members.role = 'owner'
    )
  );
```

### org_members Table

**SELECT**: Members can view all members of their orgs
**INSERT**: Service role only (via API)
**UPDATE**: Admins and owners can update roles
**DELETE**: Admins and owners can remove members

### org_invites Table

**SELECT**: Members can view invites for their orgs
**INSERT**: Service role only (via API with role check)
**UPDATE**: Service role only (for accepting invites)
**DELETE**: Admins and owners can delete invites

## API Endpoints

### POST /api/v1/orgs

Create a new organization. User becomes owner.

**Auth**: Requires authenticated user

**Request**:
```json
{
  "name": "Acme Corporation"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "org": {
      "id": "uuid",
      "name": "Acme Corporation",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    },
    "membership": {
      "id": "uuid",
      "orgId": "uuid",
      "userId": "uuid",
      "role": "owner",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  }
}
```

**Errors**:
- `401`: Not authenticated
- `500`: Failed to create org or membership

### POST /api/v1/orgs/:id/invite

Invite a user to join organization.

**Auth**: Requires admin role or higher

**Request**:
```json
{
  "email": "newuser@example.com",
  "role": "member"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "invite": {
      "id": "uuid",
      "orgId": "uuid",
      "email": "newuser@example.com",
      "role": "member",
      "token": "a1b2c3d4e5f6...",
      "expiresAt": "2024-01-22T10:00:00Z",
      "createdBy": "uuid",
      "acceptedAt": null,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  }
}
```

**Errors**:
- `401`: Not authenticated
- `403`: Not a member or insufficient role
- `500`: Failed to create invite

**Note**: Invite expires after 7 days

### POST /api/v1/orgs/:id/join

Accept an invitation and join organization.

**Auth**: Requires authenticated user

**Request**:
```json
{
  "token": "a1b2c3d4e5f6..."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "org": {
      "id": "uuid",
      "name": "Acme Corporation",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    },
    "membership": {
      "id": "uuid",
      "orgId": "uuid",
      "userId": "uuid",
      "role": "member",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  }
}
```

**Errors**:
- `401`: Not authenticated
- `404`: Invite not found or already used
- `400`: Invite expired
- `500`: Failed to create membership

## Organization Lifecycle

### Creation Flow

```
1. User calls POST /api/v1/orgs
   ↓
2. Create org record
   ↓
3. Create org_members record with role='owner'
   ↓
4. Return org + membership
```

**Transaction Safety**: If membership creation fails, org is deleted (rollback).

### Invitation Flow

```
1. Admin calls POST /api/v1/orgs/:id/invite
   ↓
2. Verify admin role via middleware
   ↓
3. Create org_invites record
   ↓
4. Generate secure token
   ↓
5. Set expires_at = now() + 7 days
   ↓
6. Return invite with token

   [Send invite email - future sprint]

7. User receives invite link with token
   ↓
8. User calls POST /api/v1/orgs/:id/join
   ↓
9. Validate token and expiry
   ↓
10. Create org_members record
    ↓
11. Mark invite as accepted (set accepted_at)
    ↓
12. Return org + membership
```

### Member Management

**Current Sprint (S1)**:
- Create org (owner)
- Invite users (admin+)
- Join via invite (any authenticated user)

**Future Sprints**:
- Update member roles (owner only)
- Remove members (admin+)
- Transfer ownership (owner only)
- Leave organization (any member)

## Multi-Tenancy Patterns

### Data Isolation

All tenant-scoped data should reference `org_id`:

```sql
CREATE TABLE resources (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  -- other fields
);

-- RLS Policy
CREATE POLICY "Members can access their org's resources"
  ON resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = resources.org_id
      AND org_members.user_id = auth.uid()
    )
  );
```

### API Pattern

Use middleware chain for org-scoped endpoints:

```typescript
server.post('/orgs/:id/resources',
  {
    preHandler: [
      requireUser,      // Ensure authenticated
      requireOrg,       // Verify org membership
      requireRole('admin')  // Check minimum role
    ]
  },
  async (request, reply) => {
    // request.orgId is set by requireOrg
    // request.orgRole is set by requireOrg

    const resource = await createResource({
      orgId: request.orgId,
      // ...
    });

    return { success: true, data: { resource } };
  }
);
```

## Best Practices

### Always Use Middleware

Never manually check org membership - use middleware:

```typescript
// ❌ Bad
server.get('/orgs/:id/data', async (request) => {
  const { id } = request.params;
  const membership = await checkMembership(id, request.user.id);
  if (!membership) throw new Error('Forbidden');
  // ...
});

// ✅ Good
server.get('/orgs/:id/data',
  { preHandler: [requireUser, requireOrg] },
  async (request) => {
    // Membership already verified
    const data = await fetchData(request.orgId);
    // ...
  }
);
```

### Role Checks

Use `requireRole()` for permission enforcement:

```typescript
// ❌ Bad
server.post('/orgs/:id/sensitive', async (request) => {
  if (request.orgRole !== 'owner') {
    throw new Error('Forbidden');
  }
  // ...
});

// ✅ Good
server.post('/orgs/:id/sensitive',
  { preHandler: [requireUser, requireOrg, requireRole('owner')] },
  async (request) => {
    // Role already verified
    // ...
  }
);
```

### RLS First

Always enable RLS on org-scoped tables:

```sql
-- ❌ Bad
CREATE TABLE resources (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES orgs(id)
);
-- No RLS = any user can access any resource

// ✅ Good
CREATE TABLE resources (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES orgs(id)
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_can_access"
  ON resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = resources.org_id
      AND org_members.user_id = auth.uid()
    )
  );
```

## Testing

See `apps/api/tests/orgs.test.ts` for comprehensive org flow tests.

## Future Enhancements

- Organization settings and customization
- Team management (sub-groups within orgs)
- Usage quotas per organization
- Organization transfer
- Billing integration
- Audit logs
- Custom roles and permissions
