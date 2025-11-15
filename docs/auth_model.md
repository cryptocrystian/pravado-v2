# Authentication Model

## Overview

Pravado uses Supabase Auth for user authentication with a custom session management layer. The system implements secure, cookie-based sessions with HttpOnly cookies to prevent XSS attacks.

## Architecture

### Components

1. **Supabase Auth**: Handles user registration, login, and token generation
2. **API Auth Plugin**: Validates tokens and attaches user context to requests
3. **Dashboard Auth Flow**: Manages client-side auth state and redirects
4. **Middleware Stack**: Enforces authentication and authorization

### Authentication Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. User signs in
       ▼
┌─────────────────────────┐
│  Supabase Auth (OAuth)  │
└──────────┬──────────────┘
           │
           │ 2. Returns access token
           ▼
┌─────────────────────────┐
│  POST /api/v1/auth/     │
│       session           │
└──────────┬──────────────┘
           │
           │ 3. Sets HttpOnly cookie
           │    sb-access-token
           ▼
┌─────────────────────────┐
│    /callback redirect   │
└──────────┬──────────────┘
           │
           │ 4. Checks user orgs
           ▼
     ┌─────┴─────┐
     │  Has org? │
     └─────┬─────┘
           │
      ┌────┴────┐
      │         │
   Yes│         │No
      │         │
      ▼         ▼
   /app    /onboarding
```

## Token Management

### Access Tokens

- **Storage**: HttpOnly cookie (`sb-access-token`)
- **Lifetime**: 7 days
- **Security**:
  - HttpOnly prevents JavaScript access
  - Secure flag in production (HTTPS only)
  - SameSite=Lax prevents CSRF

### Token Validation

The API auth plugin (`apps/api/src/plugins/auth.ts`) validates tokens on every request:

```typescript
server.addHook('onRequest', async (request) => {
  const token = request.cookies?.['sb-access-token'];

  if (!token) return;

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (!error && user) {
    request.user = { id: user.id, email: user.email };
  }
});
```

## Middleware Chain

### 1. requireUser

**Location**: `apps/api/src/middleware/requireUser.ts`

**Purpose**: Ensures request has an authenticated user

**Usage**:
```typescript
server.get('/protected',
  { preHandler: requireUser },
  async (request, reply) => {
    // request.user is guaranteed to exist
  }
);
```

### 2. requireOrg

**Location**: `apps/api/src/middleware/requireOrg.ts`

**Purpose**: Verifies user is a member of the organization in the URL

**Usage**:
```typescript
server.post('/orgs/:id/resource',
  { preHandler: [requireUser, requireOrg] },
  async (request, reply) => {
    // request.orgId and request.orgRole are set
  }
);
```

**Behavior**:
- Extracts `orgId` from route params
- Queries `org_members` table
- Sets `request.orgId` and `request.orgRole`
- Throws 403 if user is not a member

### 3. requireRole

**Location**: `apps/api/src/middleware/requireRole.ts`

**Purpose**: Enforces minimum role requirement using hierarchy

**Role Hierarchy**:
```
owner (3) > admin (2) > member (1)
```

**Usage**:
```typescript
server.post('/orgs/:id/invite',
  { preHandler: [requireUser, requireOrg, requireRole('admin')] },
  async (request, reply) => {
    // User is guaranteed to be admin or owner
  }
);
```

## API Endpoints

### POST /api/v1/auth/session

Create session from Supabase access token

**Request**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    }
  }
}
```

**Side Effects**:
- Sets `sb-access-token` HttpOnly cookie

### GET /api/v1/auth/me

Get current user profile and organizations

**Headers**:
```
Authorization: Bearer <token>
Cookie: sb-access-token=<token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "fullName": "John Doe",
      "avatarUrl": "https://...",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    },
    "orgs": [
      {
        "id": "uuid",
        "name": "Acme Corp",
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z"
      }
    ],
    "activeOrg": {
      "id": "uuid",
      "name": "Acme Corp",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  }
}
```

## Dashboard Auth Flow

### Middleware

**Location**: `apps/dashboard/src/middleware.ts`

**Routes**:
- **Public**: `/login`, `/callback`
- **Protected**: `/app/*`, `/onboarding`

**Behavior**:
- Unauthenticated users → redirect to `/login`
- Authenticated users on `/login` → redirect to `/callback`
- `/callback` determines next route based on org membership

### Pages

#### /login

- Email/password sign in
- Email/password sign up
- Sets session cookie via API
- Redirects to `/callback`

#### /callback

- Server-side redirect handler
- Fetches user session
- Routes based on org membership:
  - Has orgs → `/app`
  - No orgs → `/onboarding`

#### /onboarding

- Create first organization
- Only accessible to authenticated users without orgs
- Redirects to `/app` after creation

#### /app

- Main dashboard
- Requires authentication + active org
- Displays user and org info

## Security Considerations

### Token Security

1. **HttpOnly Cookies**: Prevents XSS token theft
2. **Secure Flag**: HTTPS-only in production
3. **SameSite=Lax**: CSRF protection
4. **7-day Expiry**: Balances security and UX

### Session Validation

- Every API request validates token with Supabase
- Expired/invalid tokens return 401
- No token → request.user is undefined

### Authorization Layers

1. **Authentication**: requireUser middleware
2. **Organization Access**: requireOrg middleware
3. **Role-Based**: requireRole middleware

### Database Security

- User sessions stored in Supabase Auth
- Access tokens validated server-side
- No client-side token storage (except HttpOnly cookie)

## Environment Variables

### API
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
COOKIE_SECRET=your-secret-key
```

### Dashboard
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Testing

See `apps/api/tests/auth.test.ts` for comprehensive auth flow tests.

## Future Enhancements

- Refresh token rotation
- Multi-factor authentication (MFA)
- OAuth providers (Google, GitHub)
- Session management UI
- Activity logs
