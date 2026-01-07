# Staging Quick Validation Checklist

**Version:** 1.0.0-rc1 | **Updated:** S81

15-minute validation checklist for staging deployment. For comprehensive testing, see [Staging Golden Path](STAGING_GOLDEN_PATH_EXECUTION_S80.md).

---

## 1. API Health (2 min)

```bash
API_URL="https://your-api.onrender.com"

# Quick health check
curl -s "$API_URL/health/ready" | jq
```

**Pass Criteria:**
- [ ] Returns `{"ready":true,"version":"1.0.0-rc1",...}`

---

## 2. Dashboard Access (2 min)

| Check | URL | Pass |
|-------|-----|------|
| Landing loads | `/` | [ ] |
| Login renders | `/login` | [ ] |
| No console errors | DevTools | [ ] |

---

## 3. Authentication Flow (3 min)

| Step | Expected | Pass |
|------|----------|------|
| Click login | Auth form appears | [ ] |
| Enter credentials | Redirects to `/app` | [ ] |
| Refresh page | Still logged in | [ ] |
| Click logout | Redirects to login | [ ] |

---

## 4. Core Navigation (3 min)

Visit each route, verify it loads:

| Route | Expected | Pass |
|-------|----------|------|
| `/app` | Dashboard home | [ ] |
| `/app/playbooks` | Playbooks list | [ ] |
| `/app/content` | Content section | [ ] |
| `/app/pr` | PR section | [ ] |
| `/app/exec` | Executive view | [ ] |

---

## 5. API Integration (3 min)

With DevTools Network tab open:

| Check | Expected | Pass |
|-------|----------|------|
| API URL correct | Requests to staging API | [ ] |
| 200 responses | No 4xx/5xx errors | [ ] |
| Auth header sent | `Authorization: Bearer ...` | [ ] |

---

## 6. Data Display (2 min)

If demo data is seeded:

| Check | Expected | Pass |
|-------|----------|------|
| Playbooks list shows data | 3+ playbooks | [ ] |
| PR section shows mentions | Data visible | [ ] |
| Exec digests show | At least 1 digest | [ ] |

---

## Quick Result

| Section | Status |
|---------|--------|
| API Health | [ ] PASS / [ ] FAIL |
| Dashboard Access | [ ] PASS / [ ] FAIL |
| Authentication | [ ] PASS / [ ] FAIL |
| Navigation | [ ] PASS / [ ] FAIL |
| API Integration | [ ] PASS / [ ] FAIL |
| Data Display | [ ] PASS / [ ] FAIL |

**Overall:** [ ] READY FOR TESTING / [ ] NEEDS FIXES

---

## If Issues Found

1. **API not responding:** Check Render logs, verify env vars
2. **Dashboard 500 errors:** Check Vercel function logs
3. **Auth not working:** Verify Supabase URL/key
4. **CORS errors:** Verify API CORS config includes dashboard domain
5. **No data:** Run seed script: `pnpm --filter @pravado/api seed:demo`

---

## Seed Demo Data

```bash
# Set env vars first
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run seed
pnpm --filter @pravado/api seed:demo
```

---

## Related

- [Full Golden Path](STAGING_GOLDEN_PATH_EXECUTION_S80.md)
- [Render Runbook](RENDER_OPERATOR_RUNBOOK.md)
- [Vercel Runbook](VERCEL_OPERATOR_RUNBOOK.md)
