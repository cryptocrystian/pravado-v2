# ADMIN-01 — Admin Dashboard Phase 1

**Date**: 2026-03-17
**Scope**: Admin dashboard with Overview, Platform Health, and Beta Management

---

## Task 1 — Database Migration

**File**: `apps/api/supabase/migrations/88_admin_tables.sql`

Creates:
- `profiles` table (id, is_admin, full_name, avatar_url) with RLS
- `admin_audit_log` table with indexes
- `intelligence_quality_snapshots` table with unique constraint
- `beta_invite_codes` table

**STATUS: REQUIRES MANUAL APPLICATION**

Apply via Supabase SQL Editor (dashboard.supabase.com):
1. Open SQL Editor for project `kroexsdyyqmlxfpbwajv`
2. Paste contents of `apps/api/supabase/migrations/88_admin_tables.sql`
3. Run
4. Then run: `INSERT INTO profiles (id, is_admin) VALUES ('3d702f06-d4c5-44f7-a9f5-cafdc8587912', true);`
   (This is cdibrell@gmail.com's auth.users ID)

## Task 2 — Fastify Admin Routes

**File**: `apps/api/src/routes/admin/index.ts`

Endpoints:
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/admin/` | Platform overview (org counts, LLM usage, SAGE stats, beta pending) |
| GET | `/api/v1/admin/platform/queues` | BullMQ queue health (graceful Redis fallback) |
| GET | `/api/v1/admin/beta/waitlist` | Paginated beta requests with status filter |
| POST | `/api/v1/admin/beta/approve` | Approve beta request + audit log |
| POST | `/api/v1/admin/beta/invite` | Generate PRAVADO-XXXXXXXX invite code + audit log |
| GET | `/api/v1/admin/beta/codes` | Recent invite codes |
| GET | `/api/v1/admin/orgs` | Paginated org list with member count + EVI score |

All endpoints:
- Protected by admin auth hook (Bearer token + profiles.is_admin check)
- Use service role key (bypass RLS)
- Log actions to admin_audit_log

Registered in `server.ts` at prefix `/api/v1/admin`.

## Task 3 — Middleware + Layout

**Middleware** (`apps/dashboard/src/middleware.ts`):
- Added admin route guard: `/app/admin/*` requires `profiles.is_admin = true`
- Non-admins redirected to `/app/command-center`

**Admin Layout** (`apps/dashboard/src/app/app/admin/layout.tsx`):
- Server component with auth + admin role check
- Redirects non-admins

**Admin Shell** (`apps/dashboard/src/components/admin/AdminShell.tsx`):
- Dark sidebar (#13131A) with 7 nav links
- "ADMIN" badge, user email, "Back to App" link
- Active state highlighting

## Task 4 — Admin Pages

### Overview (`/app/admin`)
- System status pills (API/Database/Redis)
- Metric cards: Total Orgs, Onboarding Complete, SAGE Acceptance Rate, LLM Spend, Pending Beta
- Auto-refresh every 60 seconds
- Warning banner when any system is degraded

### Platform Health (`/app/admin/platform`)
- BullMQ queue table: name, waiting, active, failed, completed, status badge
- Redis unavailable info banner when queues disabled

### Beta Management (`/app/admin/beta`)
- Two tabs: Waitlist | Invite Codes
- Waitlist: filterable table with Approve + Invite actions
- Invite modal: confirm email, generate code
- Codes tab: recent codes with used status
- Toast notifications on actions

## Task 5 — Admin Link in Sidebar

**File**: `apps/dashboard/src/components/layout/AppSidebar.tsx`
- Added `isAdmin` state, probes `/api/admin/overview` on mount
- Conditionally renders subtle "Admin" link at sidebar bottom
- Only visible to admin users

## API Proxy Routes

7 Next.js API routes created under `apps/dashboard/src/app/api/admin/`:
- `overview/route.ts`, `platform/queues/route.ts`
- `beta/waitlist/route.ts`, `beta/approve/route.ts`, `beta/invite/route.ts`, `beta/codes/route.ts`
- `orgs/route.ts`

All use `backendFetch`/`getErrorResponse` proxy pattern.

---

## Exit Criteria

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Migration 88 created | Done — needs manual SQL Editor application |
| 2 | is_admin set on admin user | Pending migration application |
| 3 | 7 admin API endpoints created | Done |
| 4 | /app/admin redirects non-admins | Done |
| 5 | Admin layout with sidebar | Done |
| 6 | Overview page with auto-refresh | Done |
| 7 | Platform page with queue status | Done |
| 8 | Beta page with Approve + Invite | Done |
| 9 | Admin link in sidebar (admin-only) | Done |
| 10 | Zero TypeScript errors | Verified |
| 11 | Sprint summary | This file |

## Post-Sprint: Manual Steps Required

1. Apply migration 88 via Supabase SQL Editor
2. Insert admin profile: `INSERT INTO profiles (id, is_admin) VALUES ('3d702f06-d4c5-44f7-a9f5-cafdc8587912', true);`
3. Commit and push to trigger Render auto-deploy
