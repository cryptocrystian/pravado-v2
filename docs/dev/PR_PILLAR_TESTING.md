# PR Pillar Testing Guide

> Sprint S100.1: Testing PR Work Surface with Real Persistence

This guide explains how to test the PR Pillar end-to-end with real database persistence.

## URL Paths (basePath Aware)

The dashboard may be deployed with a basePath (e.g., `/app`). All API paths are relative to the Next.js app root, NOT the basePath.

| Deployment | basePath | API Path Example |
|------------|----------|------------------|
| Local dev | (none) | `http://localhost:3000/api/pr/_status` |
| Staging | `/app` | `https://staging.pravado.io/app/api/pr/_status` |
| Production | `/app` | `https://pravado.io/app/api/pr/_status` |

**Key insight**: In browser DevTools or curl, always include the basePath prefix when deployed.

## Quick Start

```bash
# 1. Set up environment variables
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

# 2. Seed the database with test data
cd apps/dashboard
pnpm seed:pr

# 3. Verify backend is operational
pnpm verify:pr

# 4. Start the dashboard
cd ../..
pnpm dev

# 5. Navigate to /app/pr
```

## Environment Flags

The PR Pillar uses two runtime flags to control behavior:

### `PRAVADO_STRICT_API=1`

- **Purpose**: Disables ALL mock fallback
- **Behavior**: Shows error/empty states when backend fails
- **Use for**: Production, staging, local testing with real data
- **Recommended**: Yes, for verifying real persistence

### `PRAVADO_DEMO_MODE=1`

- **Purpose**: Allows mock data fallback when API fails
- **Behavior**: Returns mock data if database query fails
- **Use for**: Demonstrations, offline development
- **Recommended**: No, except for demos

**Priority**: `PRAVADO_STRICT_API` overrides `PRAVADO_DEMO_MODE`. If both are set to 1, strict mode wins.

### Example `.env.local`

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# PR Pillar Flags
PRAVADO_STRICT_API=1
# PRAVADO_DEMO_MODE=1  # Uncomment for demo mode
```

## Seeding Test Data

The seed script creates realistic test data:

| Entity | Count | Description |
|--------|-------|-------------|
| `journalist_profiles` | 15 | Journalist contacts with varied profiles |
| `pr_pitch_sequences` | 5 | Pitch campaigns in various stages |
| `pr_pitch_contacts` | 5-15 | Contacts attached to sequences |
| `pr_pitch_events` | ~10 | Pitch event history |
| `journalist_activity_log` | 12 | Touch/activity records |
| `media_lists` | 4 | Saved journalist lists |
| `media_list_entries` | 12-20 | List membership records |

### Seed Commands

```bash
# Preview what will be created (dry run)
pnpm seed:pr:dry

# Actually insert data
pnpm seed:pr

# Clean existing seed data and re-insert
pnpm seed:pr:clean
```

### Seed Data Identification

All seeded data includes a marker for easy cleanup:
- `metadata.seed_marker = 'pravado_pr_seed_v1'`

This allows the `--clean` flag to remove only seeded data without affecting real user data.

## Verification Script

The verification script tests that:

1. Database tables are accessible
2. Seeded data exists
3. Queries return expected results
4. Manual send flow works (creates event, updates status)

### Running Verification

```bash
# Full verification (fails on error)
pnpm verify:pr

# Warn mode (for CI - reports but doesn't fail)
pnpm verify:pr --warn-only
```

### Expected Output

```
╔═══════════════════════════════════════════════════════════╗
║          PR Backend Verification Script                   ║
╚═══════════════════════════════════════════════════════════╝

📋 Testing Journalist Profiles...
  ✓ journalist_profiles table accessible
  ✓ journalist_profiles has data: 15 journalists found
  ✓ journalist has required fields: Sarah Chen (TechCrunch)

📋 Testing Pitch Sequences...
  ✓ pr_pitch_sequences table accessible
  ✓ pr_pitch_sequences has data: 5 sequences found
  ✓ sequence has required fields: "AI-Powered PR Platform Launch" [active]

...

╭─────────────────────────────────────────────────────────╮
│                      TEST SUMMARY                       │
├─────────────────────────────────────────────────────────┤
│  Passed:    17 ✓                                    │
│  Failed:     0 ✗                                    │
│  Warnings:   0 ⚠                                    │
╰─────────────────────────────────────────────────────────╯

✅ ALL TESTS PASSED
```

## API Endpoints

### Read Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pr/journalists` | GET | List journalist contacts |
| `/api/pr/lists` | GET | List media lists |
| `/api/pr/pitches/sequences` | GET | List pitch sequences |
| `/api/pr/inbox` | GET | Computed inbox items |
| `/api/pr/touches` | GET | Activity log |
| `/api/pr/status` | GET | Backend status (dev only) |

### Write Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pr/journalists` | POST | Create journalist |
| `/api/pr/lists` | POST | Create media list |
| `/api/pr/pitches/sequences` | POST | Create pitch sequence |
| `/api/pr/touches` | POST | Log a touch/activity |
| `/api/pr/pitches/manual-send` | POST | Manual pitch send (NON-NEGOTIABLE: Manual only) |

### Diagnostic Endpoints

#### `/api/whoami` - Routing Truth

Use this to verify which Next.js app is responding. Always returns 200, no auth required.

```bash
curl http://localhost:3000/api/whoami
```

Returns:
```json
{
  "appName": "pravado-dashboard",
  "version": "1.0.0-rc1",
  "gitSha": "abc12345",
  "nodeEnv": "development",
  "basePath": "",
  "hostname": "localhost",
  "hasCookie": true,
  "timestamp": "2026-01-20T12:00:00.000Z"
}
```

**Use for**: Confirming requests reach the correct app before debugging auth issues.

#### `/api/pr/status` - Backend Status

Always returns 200 for diagnostics. Includes auth status and x-pr-auth header.

```bash
curl -v http://localhost:3000/api/pr/status
```

Returns:
```json
{
  "timestamp": "2026-01-20T...",
  "environment": "development",
  "flags": {
    "demoMode": false,
    "strictApi": true,
    "allowMockFallback": false
  },
  "auth": {
    "status": "ok",       // or "missing_session", "no_org", "error"
    "userId": "uuid",
    "orgId": "uuid"
  },
  "supabase": { "connected": true, "hasServiceRole": true },
  "counts": {
    "journalists": 15,
    "sequences": 5,
    "mediaLists": 4,
    "inboxItems": 3
  },
  "summary": {
    "healthy": true,
    "issues": [],
    "message": "PR Backend is healthy and ready"
  }
}
```

**Response Header**: `x-pr-auth: ok` (or `missing_session`, `no_org`, etc.)

**Use for**: Diagnosing auth state without a 401/403 response code.

### x-pr-auth Debug Header

All PR API routes include a response header `x-pr-auth` that indicates auth status:

| Value | Meaning |
|-------|---------|
| `ok` | Authenticated with valid org |
| `missing_session` | No user session (401) |
| `no_org` | User has no org membership (403) |
| `forbidden` | Permission denied (403) |
| `error` | Server error (500) |

**How to view**: In browser DevTools → Network tab → Select request → Headers → Response Headers → `x-pr-auth`

## Manual Send Verification

The PR pillar supports **manual-only sending** of pitches. The system enforces that all outbound emails are sent manually by the user (no auto-send). This section details how to verify the Manual Send flow is working correctly.

### 1. Confirm Network Request

When clicking "Send Now (Manual)" in the Pitch Detail Panel:

**Expected Request:**
```http
POST /api/pr/pitches/manual-send
Content-Type: application/json

{
  "sequenceId": "seq_xxx",
  "contactId": "contact_xxx",
  "stepPosition": 1
}
```

**Verification Steps:**
1. Open browser DevTools → Network tab
2. Filter by "manual-send"
3. Click "Send Now (Manual)" button on a pending pitch
4. Confirm POST request to `/api/pr/pitches/manual-send`
5. Verify request body contains `sequenceId`, `contactId`, `stepPosition`
6. Verify response status is `200` or `201`

**Expected Response:**
```json
{
  "success": true,
  "eventId": "evt_xxx",
  "contactStatus": "active",
  "stepSent": 1
}
```

### 2. Confirm Stage Change and DB Persistence

After successful send, the pitch contact should transition:

| Before | After |
|--------|-------|
| `status: pending` | `status: active` |
| `last_step_sent: 0` | `last_step_sent: 1` |
| `sent_at: null` | `sent_at: <timestamp>` |

**Database Verification (Supabase SQL Editor):**
```sql
-- Check sequence contact status after send
SELECT
  id,
  sequence_id,
  journalist_id,
  status,
  last_step_sent,
  sent_at,
  updated_at
FROM pr_sequence_contacts
WHERE id = '<contact_id>'
ORDER BY updated_at DESC
LIMIT 1;

-- Check that a pitch event was created
SELECT
  id,
  sequence_id,
  contact_id,
  event_type,
  created_at
FROM pr_pitch_events
WHERE contact_id = '<contact_id>'
  AND event_type = 'sent'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Results:**
- `pr_sequence_contacts.status` = `'active'`
- `pr_sequence_contacts.last_step_sent` = step position sent
- `pr_sequence_contacts.sent_at` = timestamp of send
- `pr_pitch_events` has new row with `event_type = 'sent'`

### 3. Verify Attribution Payload

The manual send API includes attribution data for tracking and audit:

**Expected Attribution in Event:**
```json
{
  "attribution": {
    "source": "manual-send",
    "user_id": "<current_user_id>",
    "timestamp": "<ISO8601>",
    "client": "dashboard",
    "ip_address": "<client_ip>",
    "user_agent": "<browser_user_agent>"
  }
}
```

**Verification via Database:**
```sql
-- Check attribution on the pitch event
SELECT
  id,
  metadata->>'attribution' as attribution
FROM pr_pitch_events
WHERE contact_id = '<contact_id>'
  AND event_type = 'sent'
ORDER BY created_at DESC
LIMIT 1;
```

**API Endpoint Validation:**
- Check server logs for the `/api/pr/pitches/manual-send` route
- Verify attribution metadata is stored with the outreach record
- Confirm audit trail shows user who triggered the send

### 4. UI Feedback Verification

The Manual Send button provides clear feedback at each state:

| State | UI Behavior |
|-------|-------------|
| Idle | "Send Now (Manual)" button visible, enabled |
| Loading | Button shows spinner, disabled, text "Sending..." |
| Success | Toast appears: "Email sent successfully" |
| Error | Toast appears: "Failed to send email" with reason |

**Test Scenarios:**

#### Happy Path
1. Navigate to PR → Pipeline
2. Select a pitch in "draft" or "pending" stage
3. Click "Send Now (Manual)" button
4. Verify loading state (spinner, disabled button)
5. Verify success toast appears
6. Verify pitch moves to "sent"/"active" stage in UI
7. Verify SWR cache revalidates (list refreshes automatically)

#### Error Cases
| Scenario | Expected Behavior |
|----------|-------------------|
| Missing sequence ID | Error toast: "Missing sequence or contact ID" |
| Missing contact ID | Error toast: "Missing sequence or contact ID" |
| Network failure | Error toast with retry option |
| Auth error (401) | Redirect to login page |
| Permission denied (403) | Error toast: "Permission denied" |
| Server error (500) | Error toast with retry option |

### 5. Manual Send CI Verification

Add to CI pipeline for automated verification:

```bash
# Static check: Ensure manual send route exists
grep -r "pitches/manual-send" apps/dashboard/src/app/api/ || echo "FAIL: Route missing"

# Static check: Ensure UI has manual send handler
grep -r "handleManualSend" apps/dashboard/src/components/pr-work-surface/ || echo "FAIL: Handler missing"

# Integration test (requires running server)
curl -X POST http://localhost:3000/api/pr/pitches/manual-send \
  -H "Content-Type: application/json" \
  -d '{"sequenceId": "test", "contactId": "test", "stepPosition": 1}' \
  -w "\nHTTP Status: %{http_code}\n"
# Expected: 401 (auth required) or 200/201 (success with auth)
# Failure: 404 (route doesn't exist) or 500 (route broken)
```

---

## Non-Negotiables

1. **Pitch sending is Manual-only** - The system enforces this. There is no auto-send.
2. **Follow-up requires human review** - Even in Copilot mode, follow-ups need approval.
3. **No bulk blast / spray-and-pray** - Each pitch requires explicit user action.

These guardrails are enforced at both the API and service level.

## Confirming Cookies Are Sent

Browser API calls must include auth cookies. Here's how to verify:

### In Browser DevTools

1. Open DevTools (F12)
2. Go to **Network** tab
3. Make a request (e.g., refresh `/app/pr`)
4. Click on an `/api/pr/*` request
5. Check **Headers** → **Request Headers**
6. Look for `Cookie:` header containing `sb-*` tokens

If cookies are missing, check:
- You're logged in (auth cookies exist in Application → Cookies)
- Request is same-origin (no CORS issues)
- `credentials: 'include'` is set in fetch calls

### Using curl with Cookies

To test authenticated endpoints from command line:

```bash
# 1. Extract cookies from browser
#    DevTools → Application → Cookies → Copy the sb-* cookie values

# 2. Make authenticated request
curl -v \
  -H "Cookie: sb-access-token=eyJ...; sb-refresh-token=eyJ..." \
  http://localhost:3000/api/pr/_status
```

### Common Cookie Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| `x-pr-auth: missing_session` | No cookies sent | Check same-origin, credentials mode |
| `x-pr-auth: no_org` | Authenticated but no org | User needs org membership |
| Cookies present but 401 | Expired tokens | Log out and back in |

## Troubleshooting

### "No organization found"

The user is not authenticated or not a member of any organization.

**Fix**: Log in and ensure the user has org membership.

### "No journalists found" after seeding

The seed script requires an existing org and user.

**Fix**:
1. Ensure migrations are applied
2. Create an org and user first
3. Re-run `pnpm seed:pr`

### Inbox shows no items

Inbox items are computed from DB state:
- **Relationship decay**: Journalists with `engagement_score < 0.4` and `last_activity_at > 30 days ago`
- **Follow-ups**: Active sequences created 5-7 days ago
- **Approvals**: Draft sequences

**Fix**: Check that seeded journalists have low engagement scores and old activity dates.

### "Mock data" indicator in UI

You're running with `PRAVADO_DEMO_MODE=1` or the backend failed silently.

**Fix**: Set `PRAVADO_STRICT_API=1` to see actual errors.

## Visual Regression Testing

The PR Pillar includes visual regression tests to prevent typography and design regressions.

### Running Visual Tests

```bash
cd apps/dashboard

# Run visual tests (compare against baselines)
pnpm test:visual

# Update baseline snapshots
pnpm test:visual:update

# Run with UI for debugging
pnpm test:e2e:ui
```

### Pages Covered

| Page | Test File |
|------|-----------|
| Command Center | `tests/visual/ds3-visual-regression.spec.ts` |
| PR Inbox | `tests/visual/ds3-visual-regression.spec.ts` |
| PR Database | `tests/visual/ds3-visual-regression.spec.ts` |
| PR Pitches | `tests/visual/ds3-visual-regression.spec.ts` |

### Typography CI Check

```bash
# Check for typography violations (fails on NEW violations)
pnpm check:typography

# See all violations including grandfathered
pnpm check:typography:all

# Update baseline allowlist
pnpm check:typography:update
```

## CI Integration

Add to your CI pipeline:

```yaml
# Backend verification
- name: Verify PR Backend
  run: pnpm --filter @pravado/dashboard verify:pr --warn-only
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}

# Typography enforcement
- name: Check DS v3 Typography
  run: pnpm --filter @pravado/dashboard check:typography

# Visual regression (requires baseline snapshots)
- name: Visual Regression Tests
  run: pnpm --filter @pravado/dashboard test:visual
```

The `--warn-only` flag prevents CI failures while still reporting issues.

## Definition of Done

With `PRAVADO_STRICT_API=1` and after running `pnpm seed:pr`:

- [ ] Database tab shows real contacts (not mock)
- [ ] Pitches tab shows real sequences
- [ ] Inbox shows at least 3 computed items
- [ ] Manual send creates a pitch_event and moves an item in the pipeline
- [ ] No mock fallback occurs; errors are visible when backend fails

---

## Strict Mode Testing

### Overview

Strict Mode (`PRAVADO_STRICT_API=1`) ensures the PR Pillar never silently falls back to mock/demo data. When enabled:

- API routes return errors (not mock data) when the database fails
- UI shows blocking error states with "Retry" and diagnostic links
- Demo mode is completely disabled, even if `PRAVADO_DEMO_MODE=1`

### Running the Strict Mode Smoke Test

```bash
cd apps/dashboard

# Run full smoke test (network + static scan)
PRAVADO_STRICT_API=1 pnpm check:pr-strict-smoke

# Run static scan only (no network calls)
pnpm check:pr-strict-smoke --static

# Warn mode (don't fail CI)
pnpm check:pr-strict-smoke --warn
```

### What the Smoke Test Validates

1. **Status Endpoint** (`/api/pr/status`)
   - Returns 200 with auth status
   - Includes `x-pr-auth` response header

2. **Route Existence** (no 404/500)
   - `/api/pr/journalists?limit=1`
   - `/api/pr/lists`
   - `/api/pr/pitches/sequences?limit=1`
   - Acceptable responses: 200, 401, 403 (route exists)
   - Failure responses: 404, 500 (route missing or broken)

3. **Static Code Scan**
   - Scans `src/components/pr-work-surface` and `src/app/app/pr`
   - Detects demo/mock import patterns
   - Detects mock generator function usage
   - Ensures PR UI code doesn't depend on demo data

### CI Integration

Add to your CI pipeline:

```yaml
# Strict mode smoke test
- name: PR Strict Mode Check
  run: pnpm --filter @pravado/dashboard check:pr-strict-smoke --static
  # Static-only doesn't require running server

# With live server (requires Supabase)
- name: PR Strict Mode Live Check
  run: |
    pnpm --filter @pravado/dashboard dev &
    sleep 10
    PRAVADO_STRICT_API=1 pnpm --filter @pravado/dashboard check:pr-strict-smoke
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
```

### Strict Mode Error States

When strict mode is enabled and the backend fails, the UI should display:

1. **Error Panel** with clear message explaining the failure
2. **Retry Button** to attempt the request again
3. **Status Link** pointing to `/api/pr/status` for diagnostics

Example error component pattern:

```tsx
{error && config.isStrictApi && (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
    <h3 className="font-medium text-red-800">Unable to load data</h3>
    <p className="text-sm text-red-600 mt-1">{error.message}</p>
    <div className="flex gap-2 mt-3">
      <button onClick={retry}>Retry</button>
      <a href="/api/pr/status" target="_blank">Open Status</a>
    </div>
  </div>
)}
```

### Environment Variables Reference

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `PRAVADO_STRICT_API` | `1`, `true` | `0` | Disables ALL mock fallback |
| `PRAVADO_DEMO_MODE` | `1`, `true` | `0` | Enables mock fallback (when strict is off) |
| `NEXT_PUBLIC_BASE_URL` | URL | `http://localhost:3000` | Base URL for smoke test API calls |
| `NEXT_PUBLIC_BASE_PATH` | Path | `` | Base path if app is mounted at subpath |

### Troubleshooting Strict Mode

#### "Mock data returned with PRAVADO_STRICT_API=1"

The API route is still returning `_mock: true` even in strict mode.

**Fix**: Check that the route correctly reads `getPRConfig().allowMockFallback` and returns an error instead of mock data.

#### "Route returned 500"

The API route is crashing, likely due to a database error.

**Fix**: Check Supabase connection and RLS policies. View `/api/pr/status` for diagnostics.

#### "Static scan found violations"

PR UI code is importing from demo/mock modules.

**Fix**: Remove the import or add a `// strict-allow:` comment if the usage is intentional (e.g., in a test file).
