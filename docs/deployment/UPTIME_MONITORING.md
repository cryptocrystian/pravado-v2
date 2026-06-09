# Uptime Monitoring — UptimeRobot Configuration

**Owner:** Architect (christian@saipienlabs.com)
**Status:** Active (Phase 0.5 / Plan 03)
**Last updated:** 2026-06-09

This doc is the canonical copy-paste config for the two UptimeRobot
monitors that watch the Pravado production fleet. UptimeRobot itself is
managed in the architect's account — this file exists so the _config_
is in the repo, reviewable, and reproducible if the account is migrated.

The corresponding `/health` endpoint implementations live in:

- `apps/api/src/routes/health.ts` (Fastify route, served at
  `https://pravado-api.onrender.com/health`)
- `apps/dashboard/src/app/health/route.ts` (Next.js Route Handler,
  served at `https://app.pravado.io/health`)

Both implementations share the same response invariants — see Plan 03
spec (`docs/sprints/PHASE-0-5-OBSERVABILITY/03-health.md`) and the
leak-assertion tests for the exact shape.

---

## Monitor 1 — apps/api on Render

| Field                           | Value                                                           |
| ------------------------------- | --------------------------------------------------------------- |
| Monitor name                    | `Pravado API — production /health`                              |
| Monitor type                    | HTTP(s)                                                         |
| URL                             | `https://pravado-api.onrender.com/health`                       |
| Monitoring interval             | 5 minutes                                                       |
| Monitor timeout                 | 30 seconds                                                      |
| HTTP method                     | GET                                                             |
| HTTP status codes considered up | 200                                                             |
| Alert contacts                  | `christian@saipienlabs.com` (Email)                             |
| Alert when down for             | 1 failure (no debounce — the cron heartbeat catches transients) |
| SSL expiration alerts           | Enabled, 30-day warning                                         |
| Maintenance windows             | None                                                            |

### Why 200-only

The /health endpoint returns 503 when any tracked dep is degraded. A 503
is not "the host is down" — it's "the host is up and telling us
something is wrong." Treating 503 as up would mask the very signal the
endpoint exists to surface. If you ever change this monitor to treat 503
as up, you've defeated the point of the dep checks.

### Verification

```bash
curl -sS https://pravado-api.onrender.com/health | jq
# Expected (healthy):
# {
#   "status": "healthy",
#   "version": "<12-char SHA>",
#   "timestamp": "<ISO 8601>",
#   "deps":   { "supabase": "ok", "resend": "ok", "stripe": "ok" },
#   "checks": { "database": "ok", "redis": "ok" | "not_configured" }
# }
```

---

## Monitor 2 — apps/dashboard on Vercel

| Field                           | Value                                    |
| ------------------------------- | ---------------------------------------- |
| Monitor name                    | `Pravado Dashboard — production /health` |
| Monitor type                    | HTTP(s)                                  |
| URL                             | `https://app.pravado.io/health`          |
| Monitoring interval             | 5 minutes                                |
| Monitor timeout                 | 30 seconds                               |
| HTTP method                     | GET                                      |
| HTTP status codes considered up | 200                                      |
| Alert contacts                  | `christian@saipienlabs.com` (Email)      |
| Alert when down for             | 1 failure                                |
| SSL expiration alerts           | Enabled, 30-day warning                  |
| Maintenance windows             | None                                     |

### Verification

```bash
curl -sS https://app.pravado.io/health | jq
# Expected (healthy):
# {
#   "status": "healthy",
#   "version": "<12-char SHA>",
#   "timestamp": "<ISO 8601>",
#   "vercel": { "env": "production", "deployment": "<id>", "region": "<id>" },
#   "deps":   { "supabase": "ok" }
# }
```

---

## Alert routing

All alerts go to `christian@saipienlabs.com`. This matches the
ci-scheduled.yml (Plan 04) failure email recipient and the Sentry alert
inbox (Plan 01). No SMS, no Slack — single channel by intent during
Phase 0.5. Add a routing rule via a Phase 1 Work Order.

---

## Setup checklist (one-time)

- [ ] Log into UptimeRobot as the architect (christian@saipienlabs.com)
- [ ] Add Email alert contact for christian@saipienlabs.com (if not present)
- [ ] Create Monitor 1 per the table above
- [ ] Create Monitor 2 per the table above
- [ ] Trigger a deliberate 503 on staging (`pravado-api-staging.onrender.com`)
      and confirm an Email alert lands within ~6 minutes
- [ ] Restore staging, confirm "back up" Email lands
- [ ] Record completion in `docs/canon/DECISIONS_LOG.md` (Plan 03 entry)

## What this monitor will NOT catch

- Slow responses below the 30s timeout but above acceptable p95 — Phase
  1 will layer Sentry performance + a dedicated latency probe.
- Partial regressions where the endpoint returns 200 but a specific dep
  is `degraded`. The /health body is the source of truth; UptimeRobot
  only checks the HTTP status. Layer a content-match probe in Phase 1
  if you need this.
- API correctness regressions — that's what Playwright smoke tests and
  the scheduled CI cron (Plan 04) are for.

## Out of scope (Phase 1)

- SLO definitions, error budget burn alerts
- Synthetic transactions (login, post-content)
- Per-region monitoring (UptimeRobot Pro)
- StatusPage / public status surface
