# S99.2 PR Auth Architecture Fix

## Problem Statement

PR pillar drilldown pages (`/app/pr/journalists`, `/app/pr/generator`, `/app/pr/deliverability`) were failing in staging with 401 "Authentication required" errors.

### Root Cause

The PR pages were `'use client'` components that called API clients using `supabase.auth.getSession()` from the browser client. When these components rendered on the server (during SSR), the browser client's `getSession()` could not access cookies from the request context, returning null and causing unauthenticated API calls.

## Solution: Canonical Server Auth Execution Layer

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      PR Pages                                │
│  (Server Components - async page.tsx)                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│               prDataServer.ts                                │
│  - server-only module                                        │
│  - reads cookies via next/headers                            │
│  - builds Supabase server client                             │
│  - extracts access token                                     │
│  - injects Authorization header                              │
│  - calls backend API_BASE_URL                                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│            Backend API (pravado-api-staging)                 │
└─────────────────────────────────────────────────────────────┘
```

### Key Files

1. **`/src/server/prDataServer.ts`** - Canonical server auth layer
   - Uses `import 'server-only'` to prevent client-side usage
   - Creates request-scoped Supabase client with cookie access
   - Throws `AUTH_MISSING` error if token unavailable (hard failure, not silent)
   - Exports typed data fetchers for all PR endpoints

2. **PR Pages (Server Components)**
   - `/app/pr/journalists/page.tsx` - Async server component
   - `/app/pr/generator/page.tsx` - Async server component
   - `/app/pr/deliverability/page.tsx` - Async server component

3. **Client Components (for interactivity)**
   - `JournalistsClient.tsx` - Receives initial data as props
   - `GeneratorClient.tsx` - Receives initial data as props
   - `DeliverabilityClient.tsx` - Receives initial data as props

4. **Route Handlers (for client-side mutations/searches)**
   - `/api/pr/journalists/route.ts`
   - `/api/pr/releases/route.ts`
   - `/api/pr/deliverability/*` routes

### Rules

1. **PR pages must NEVER call `fetch()` to the backend API directly**
2. **PR pages must NEVER attempt client-side Bearer injection for staging API calls**
3. **All authenticated PR backend calls must go through `prDataServer.ts`**

### Debug Logging

Enable debug logging by setting:
```
NEXT_PUBLIC_DEBUG_AUTH=true
```

This logs:
- Token presence (yes/no)
- Token length (not actual token)
- API_BASE_URL being used

### Extending to Other Pillars

To extend this pattern to other pillars (SEO, Content, etc.):

1. Create a new server module: `/src/server/{pillar}DataServer.ts`
2. Import `'server-only'` at the top
3. Use `createRequestScopedSupabaseClient()` pattern from prDataServer
4. Export typed data fetchers for the pillar's endpoints
5. Refactor pages to be async Server Components
6. Pass initial data to Client Components as props
7. Create Route Handlers for client-side mutations

## What Was Refactored

### Before (Broken)
- `'use client'` pages called API clients directly
- API clients used browser Supabase client
- Browser client couldn't access cookies during SSR
- Result: 401 errors on all PR drilldown pages

### After (Fixed)
- Server Components fetch initial data via `prDataServer`
- `prDataServer` reads cookies in request scope
- Proper Authorization header injected
- Client components receive data as props
- Route handlers used for client-side interactivity

## Verification Checklist

- [ ] `/app/pr/journalists` loads real data (200, not "auth required")
- [ ] KPI drilldowns work with filters applied
- [ ] `/app/pr/generator` can list releases and generate
- [ ] Deliverability endpoints work
- [ ] No localhost usage
- [ ] No vercel `/api/v1/*` proxy calls to fake endpoints
- [ ] All API calls use `API_BASE_URL` (https://pravado-api-staging.onrender.com)
