# Sprint S100: PR Auth & Data Execution Lock

## Status: IMPLEMENTED

## Problem Statement

Previous attempts (S99.1, S99.2) to fix PR pillar authentication issues did not produce consistent authenticated requests. Pages were still returning "Authentication required" 401 errors when users navigated to PR drilldown pages.

### Root Cause

The fundamental issue was that React Server Components (RSC) and the App Router have unreliable access to authentication tokens during server-side rendering. The previous approach of having Server Components call `prDataServer.ts` directly during SSR was failing because:

1. Cookie access in RSC is context-dependent
2. Auth token availability varies based on hydration state
3. Server-side auth session retrieval is not deterministic

## Solution: Route Handler Lock

Sprint S100 implements a strict architectural constraint:

**ALL authenticated PR data requests MUST go through Next.js Route Handlers under `/api/pr/*`**

### Core Invariants

1. **NO PR page may call the staging API directly**
2. **NO client component may inject Bearer tokens**
3. **Route Handlers are the ONLY code path for authenticated PR data**

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
├─────────────────────────────────────────────────────────────────┤
│  PR Page (page.tsx)          PR Client Component                │
│  - Renders shell             - Fetches via /api/pr/*            │
│  - NO data fetching          - NO direct API calls              │
│  - NO prDataServer import    - NO Bearer token injection        │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  │ fetch('/api/pr/...')
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Route Handler                                 │
│                  /api/pr/*/route.ts                             │
│                                                                  │
│  - Uses prBackendFetch()                                        │
│  - Handles auth errors                                          │
│  - Returns typed JSON                                           │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  │ prBackendFetch(path)
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   prBackendProxy.ts                              │
│                   (server-only)                                  │
│                                                                  │
│  - Calls getServerAccessToken()                                 │
│  - Injects Authorization header                                 │
│  - Makes authenticated request                                  │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  │ getServerAccessToken()
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                 supabaseServerAuth.ts                            │
│                   (server-only)                                  │
│                                                                  │
│  - Canonical auth token retrieval                               │
│  - Uses @supabase/ssr createServerClient                        │
│  - Reads cookies via next/headers                               │
└─────────────────────────────────────────────────────────────────┘
                  │
                  │ Bearer token
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Staging API                                   │
│                 (backend server)                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Files

### Core Server Modules

| File | Purpose |
|------|---------|
| `src/server/supabaseServerAuth.ts` | Canonical auth token extraction |
| `src/server/prBackendProxy.ts` | Authenticated fetch wrapper |

### Route Handlers

| Route | Endpoint |
|-------|----------|
| `/api/pr/journalists` | Journalist profiles |
| `/api/pr/releases` | Press releases list |
| `/api/pr/releases/[id]` | Single press release |
| `/api/pr/releases/generate` | Generate new release |
| `/api/pr/deliverability/summary` | Deliverability stats |
| `/api/pr/deliverability/messages` | Email messages |
| `/api/pr/deliverability/top-engaged` | Top engaged journalists |
| `/api/pr/outreach/stats` | Outreach statistics |
| `/api/pr/pitches/sequences` | Pitch sequences |

### Refactored Pages

| Page | Change |
|------|--------|
| `/app/pr/journalists/page.tsx` | Removed prDataServer import, renders client shell |
| `/app/pr/generator/page.tsx` | Removed prDataServer import, renders client shell |
| `/app/pr/deliverability/page.tsx` | Removed prDataServer import, renders client shell |

## Debug Logging

Set `NEXT_PUBLIC_DEBUG_AUTH=true` to enable detailed auth logging:

```
[Server Auth] Cookie count: X
[Server Auth] Auth cookies found: sb-..., sb-...
[Server Auth] Session retrieved successfully
[PR Backend] GET /api/v1/... -> 200
```

## Regression Guard

Run the regression check script to verify the invariants:

```bash
cd apps/dashboard
./scripts/check-pr-no-direct-api.sh
```

This script checks:
1. No PR page imports from `@/server/prDataServer`
2. All expected route handlers exist
3. Page components are not async (no SSR data fetching)

Add to CI pipeline:
```yaml
- name: Check PR Auth Invariants
  run: cd apps/dashboard && ./scripts/check-pr-no-direct-api.sh
```

## Error Handling

### Auth Errors

The system handles auth errors with specific codes:

| Code | Description |
|------|-------------|
| `AUTH_MISSING` | No session or access token found |
| `AUTH_SESSION_ERROR` | Failed to retrieve session |

Client components should handle 401 responses by showing auth required UI.

### Backend Errors

Backend errors are wrapped in `BackendProxyError` with:
- HTTP status code
- Error message
- Optional error code

## Migration Notes

### Deprecated

- `prDataServer.ts` - Should NOT be imported by PR pages anymore
- Direct `fetchJournalistProfiles`, `fetchPressReleases`, etc. calls from pages

### New Pattern

```tsx
// page.tsx - Simple client shell
import MyClient from './MyClient';

export default function MyPage() {
  return <MyClient initialData={[]} />;
}

// MyClient.tsx - Fetches via internal API
'use client';

useEffect(() => {
  fetch('/api/pr/my-endpoint')
    .then(res => res.json())
    .then(data => setData(data));
}, []);
```

## Verification Checklist

- [ ] All PR pages load without 401 errors
- [ ] Network tab shows requests to `/api/pr/*` (not staging directly)
- [ ] Auth errors display user-friendly messages
- [ ] Refresh after login restores data access
- [ ] Regression script passes

## Rollback Plan

If issues arise:
1. Revert to S99.2 commit
2. Update route handlers to use legacy auth approach
3. Investigate cookie/session issues in route handler context

## Related Documentation

- S99.2: Canonical Auth Execution Layer (attempted fix)
- S98: PR Intelligence End-to-End Execution
- Next.js Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
