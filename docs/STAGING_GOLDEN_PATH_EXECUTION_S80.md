# Staging Golden Path Execution Checklist (S80)

This checklist guides you through validating a first-time staging deployment of Pravado. Complete all steps to verify the system is working correctly.

**Estimated Time:** 45-60 minutes

---

## Prerequisites

Before starting, ensure:

- [ ] Dashboard deployed to Vercel (see [Vercel Setup Guide](VERCEL_STAGING_SETUP_S80.md))
- [ ] API deployed to Render (see [API Setup Guide](API_STAGING_SETUP_S80.md))
- [ ] Supabase project active with migrations applied (77 migrations: 0-76)
- [ ] Demo data seeded (optional but recommended)

---

## Stage 1: Infrastructure Health

### 1.1 API Health Checks

Run these commands (replace with your staging URL):

```bash
# Set your staging API URL
API_URL="https://pravado-api-staging.onrender.com"

# Liveness check
curl -s "$API_URL/health/live" | jq
# Expected: {"alive":true,"timestamp":"..."}

# Readiness check
curl -s "$API_URL/health/ready" | jq
# Expected: {"ready":true,"version":"1.0.0-rc1",...}

# Info check
curl -s "$API_URL/health/info" | jq
# Expected: Full app configuration (safe fields)
```

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| `/health/live` returns 200 | `{"alive":true}` | | [ ] |
| `/health/ready` returns 200 | `{"ready":true,"version":"1.0.0-rc1"}` | | [ ] |
| `/health/info` returns config | JSON with features, environment | | [ ] |
| Version matches RC1 | `1.0.0-rc1` | | [ ] |

### 1.2 Dashboard Availability

| Check | URL | Expected | Pass |
|-------|-----|----------|------|
| Landing page loads | `/` | Page renders, no errors | [ ] |
| Login page loads | `/login` | Supabase auth UI or login form | [ ] |
| No console errors | - | DevTools console is clean | [ ] |

### 1.3 Database Connectivity

```bash
# Via API health info
curl -s "$API_URL/health/info" | jq '.database'
# Expected: {"connected":true} or similar
```

| Check | Expected | Pass |
|-------|----------|------|
| Database connected | No connection errors in logs | [ ] |
| Migrations count | 77 migrations applied | [ ] |

---

## Stage 2: Authentication Flow

### 2.1 Sign Up (New User)

1. Go to dashboard `/login`
2. Click "Sign Up" or "Create Account"
3. Enter test email: `staging-test@yourdomain.com`
4. Complete sign up flow

| Check | Expected | Pass |
|-------|----------|------|
| Sign up form appears | Form with email/password fields | [ ] |
| Sign up submits successfully | Confirmation or redirect | [ ] |
| Confirmation email (if enabled) | Email received | [ ] |

### 2.2 Sign In (Existing User)

Use demo credentials if seeded, or your test user:

| Check | Expected | Pass |
|-------|----------|------|
| Login form accepts credentials | No validation errors | [ ] |
| Login succeeds | Redirects to `/app` | [ ] |
| Session persists on refresh | Remains logged in | [ ] |

### 2.3 Sign Out

| Check | Expected | Pass |
|-------|----------|------|
| Sign out button visible | In navbar or menu | [ ] |
| Sign out clears session | Redirects to login | [ ] |
| Cannot access `/app` after logout | Redirected to login | [ ] |

---

## Stage 3: Core Navigation

### 3.1 Main Dashboard

After login, verify:

| Check | Route | Expected | Pass |
|-------|-------|----------|------|
| Dashboard home | `/app` | Main dashboard renders | [ ] |
| Sidebar visible | - | Navigation menu shows | [ ] |
| User info visible | - | Email/name in header | [ ] |

### 3.2 Primary Navigation

Visit each main section:

| Section | Route | Expected | Pass |
|---------|-------|----------|------|
| Playbooks | `/app/playbooks` | List page renders | [ ] |
| Content | `/app/content` | Content section renders | [ ] |
| PR | `/app/pr` | PR section renders | [ ] |
| SEO | `/app/seo` | SEO section renders | [ ] |
| Team | `/app/team` | Team section renders | [ ] |
| Agents | `/app/agents` | Agents section renders | [ ] |

### 3.3 Executive Intelligence (if available)

| Section | Route | Expected | Pass |
|---------|-------|----------|------|
| Command Center | `/app/exec` | Executive view | [ ] |
| Digests | `/app/exec/digests` | Digest list | [ ] |
| Board Reports | `/app/exec/board-reports` | Reports list | [ ] |
| Investors | `/app/exec/investors` | IR section | [ ] |
| Strategy | `/app/exec/strategy` | Strategy view | [ ] |

### 3.4 Advanced Intelligence (S70-S74)

| Section | Route | Expected | Pass |
|---------|-------|----------|------|
| Unified Narratives | `/app/unified-narratives` | Narrative list | [ ] |
| Scenarios | `/app/scenarios` | Scenario list | [ ] |
| AI Simulations | `/app/scenarios/simulations` | Simulation view | [ ] |
| Orchestrations | `/app/scenarios/orchestrations` | Orchestration view | [ ] |
| Reality Maps | `/app/reality-maps` | Reality map viz | [ ] |
| Insight Conflicts | `/app/insight-conflicts` | Conflict list | [ ] |

---

## Stage 4: API Integration

### 4.1 Data Fetching

Open browser DevTools → Network tab and verify:

| Check | Expected | Pass |
|-------|----------|------|
| API requests to correct URL | Requests go to staging API | [ ] |
| No CORS errors | No cross-origin blocks | [ ] |
| 200 responses on data fetch | Successful responses | [ ] |
| JSON data returned | Valid JSON payloads | [ ] |

### 4.2 Authenticated Requests

| Check | Expected | Pass |
|-------|----------|------|
| Auth header sent | `Authorization: Bearer ...` | [ ] |
| Session cookie present | Supabase session cookie | [ ] |
| 401 on invalid token | Proper auth error | [ ] |

---

## Stage 5: LLM Integration (if configured)

### 5.1 Check LLM Status

```bash
curl -s "$API_URL/health/info" | jq '.llm'
# Expected: {"provider":"anthropic","configured":true} or similar
```

| Check | Expected | Pass |
|-------|----------|------|
| LLM provider configured | Not `stub` in production | [ ] |
| API key present | `configured: true` | [ ] |

### 5.2 Test AI Generation

Navigate to a feature that uses AI:

| Feature | Action | Expected | Pass |
|---------|--------|----------|------|
| Brief Generator | Generate a brief | AI content appears | [ ] |
| Playbook Run | Execute AI step | Step completes | [ ] |
| Content Rewrite | Request rewrite | AI suggestion shown | [ ] |

---

## Stage 6: Feature Verification

### 6.1 Playbooks

| Check | Expected | Pass |
|-------|----------|------|
| Playbook list loads | Shows existing playbooks | [ ] |
| Can view playbook details | Detail page renders | [ ] |
| Can create new playbook | Form works | [ ] |
| Can run playbook | Execution starts | [ ] |

### 6.2 Content Intelligence

| Check | Expected | Pass |
|-------|----------|------|
| Content list loads | Shows content items | [ ] |
| Can create content brief | Brief generator works | [ ] |
| Quality scores display | Metrics visible | [ ] |

### 6.3 PR & Media

| Check | Expected | Pass |
|-------|----------|------|
| Media sources display | List of sources | [ ] |
| Mentions/coverage show | Media mentions | [ ] |
| Press releases accessible | PR list | [ ] |

---

## Stage 7: Error Handling

### 7.1 Error Boundary

Intentionally trigger an error (if possible) or verify:

| Check | Expected | Pass |
|-------|----------|------|
| Error boundary exists | Catches render errors | [ ] |
| Error logged to `/api/v1/logs/client` | Error captured | [ ] |
| Fallback UI appears | "Something went wrong" | [ ] |
| Retry button works | Attempts recovery | [ ] |

### 7.2 API Error Handling

| Check | Expected | Pass |
|-------|----------|------|
| 404 on invalid route | Proper error page | [ ] |
| 500 errors handled | Error message shown | [ ] |
| Network errors handled | Retry or error state | [ ] |

---

## Stage 8: Performance

### 8.1 Load Times

Measure using browser DevTools:

| Page | Target | Actual | Pass |
|------|--------|--------|------|
| Login | < 2s | | [ ] |
| Dashboard | < 3s | | [ ] |
| Playbooks list | < 2s | | [ ] |
| Content list | < 2s | | [ ] |

### 8.2 Core Web Vitals

Run Lighthouse or similar:

| Metric | Target | Actual | Pass |
|--------|--------|--------|------|
| LCP | < 2.5s | | [ ] |
| FID/INP | < 100ms | | [ ] |
| CLS | < 0.1 | | [ ] |

---

## Stage 9: Cross-Browser

Test in at least two browsers:

| Browser | Version | Login | Navigation | Data | Pass |
|---------|---------|-------|------------|------|------|
| Chrome | 90+ | [ ] | [ ] | [ ] | [ ] |
| Firefox | 88+ | [ ] | [ ] | [ ] | [ ] |
| Safari | 14+ | [ ] | [ ] | [ ] | [ ] |

---

## Stage 10: Mobile Responsiveness

Test on mobile viewport (or actual device):

| Check | Expected | Pass |
|-------|----------|------|
| Login works on mobile | Touch-friendly | [ ] |
| Sidebar collapses | Hamburger menu | [ ] |
| Content readable | No horizontal scroll | [ ] |
| Buttons tappable | Adequate touch targets | [ ] |

---

## Final Sign-Off

### Summary

| Stage | Status |
|-------|--------|
| 1. Infrastructure Health | [ ] PASS / [ ] FAIL |
| 2. Authentication Flow | [ ] PASS / [ ] FAIL |
| 3. Core Navigation | [ ] PASS / [ ] FAIL |
| 4. API Integration | [ ] PASS / [ ] FAIL |
| 5. LLM Integration | [ ] PASS / [ ] FAIL / [ ] N/A |
| 6. Feature Verification | [ ] PASS / [ ] FAIL |
| 7. Error Handling | [ ] PASS / [ ] FAIL |
| 8. Performance | [ ] PASS / [ ] FAIL |
| 9. Cross-Browser | [ ] PASS / [ ] FAIL |
| 10. Mobile Responsiveness | [ ] PASS / [ ] FAIL |

### Issues Found

| Issue | Severity | Resolution |
|-------|----------|------------|
| | | |
| | | |

### Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Tester | | | |
| Developer | | | |
| Product Owner | | | |

---

## Rollback Plan

If staging validation fails:

1. **Dashboard Issues:**
   - Revert to previous Vercel deployment
   - Check Vercel → Deployments → Promote previous

2. **API Issues:**
   - Check Render logs for errors
   - Verify environment variables
   - Rollback to previous deploy if needed

3. **Database Issues:**
   - Check Supabase status
   - Verify migrations applied correctly
   - Contact Supabase support if needed

---

## Next Steps After Validation

If all checks pass:

1. [ ] Document any configuration changes needed
2. [ ] Update environment variable documentation
3. [ ] Schedule production deployment
4. [ ] Notify stakeholders of staging success

---

## Related Documents

- [Vercel Staging Setup](VERCEL_STAGING_SETUP_S80.md)
- [API Staging Setup](API_STAGING_SETUP_S80.md)
- [Environment Matrix](ENVIRONMENT_MATRIX_S80.md)
- [Golden Path #1 (Executive)](GOLDEN_PATH_EXEC_NARRATIVE.md)
- [Golden Path #2 (Crisis)](GOLDEN_PATH_CRISIS_REALITY_CONFLICTS.md)
- [UAT Checklist](UAT_CHECKLIST_V1.md)
