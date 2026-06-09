# Phase 0.5 / Plan 04 — Scheduled CI Cron on Main

**Sprint:** Phase 0.5 Observability
**Status:** in flight
**Date opened:** 2026-06-09

## Why this exists

The Phase 0 24h watch surfaced that a scheduled-task agent firing CI workflows doesn't always land the dispatch — the Run 3 trigger silently failed and had to be re-fired manually. Without a permanent automated heartbeat, we don't know if main breaks until the next PR opens (which can be days).

Plan 04 ships a GitHub Actions cron that runs the full CI suite every 12 hours against main, and emails the architect on failure.

## Scope

### File changes

| File                                 | Action                                                                                                                                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/ci-scheduled.yml` | NEW — `schedule: cron '0 */12 * * *'` (every 12h, minute 0). Runs the same Lint / Type Check / Test / Build jobs as `ci.yml`. Adds a `notify-on-failure` job that fires when any prior job fails. |

### Failure notification — email only (architect refinement)

Per architect spec for Phase 0.5:

- Channel: **email only** (Slack deferred to Phase 1)
- Recipient: `christian@saipienlabs.com`
- Action: `dawidd6/action-send-mail@v3`
- SMTP env vars: **MUST reuse the existing apps/api SMTP variable names** (no duplicate secrets per architect). Names in `.env.local` confirmed: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`. Will use GitHub Actions secrets with the same names.

## Verification

- [ ] `actionlint` (`actionlint .github/workflows/ci-scheduled.yml`) passes locally
- [ ] `gh workflow run ci-scheduled.yml --ref main` manually fires (proves the manual-dispatch path works — addresses the Phase 0 scheduled-task observation)
- [ ] Introduce a deliberate `pnpm typecheck` failure on a throwaway test branch, force-push to a temp tag, fire the cron, confirm email lands to `christian@saipienlabs.com`
- [ ] All 16 CI checks green on the PR itself

## Risks

- **GitHub Actions cron schedules are best-effort + can delay by ~10 min on shared runners.** Acceptable for a 12h heartbeat.
- **Email notification fatigue.** 12h cadence + failure-only → at most 2/day. Comfortable.
- **SMTP secrets must exist on the GitHub repository.** Architect adds them via `gh secret set` or repo settings; **secrets cannot be added by Claude**. Will surface during implementation if missing.

## Out of scope

- PagerDuty / on-call rotation — Phase 1
- Slack notification — Phase 1
- Multi-channel routing — Phase 1

## Coordination

- **Plan 01 (Sentry)** independent.
- **Plan 02 (already merged)** — no interaction.
- **Plan 03 (/health)** independent.
- **Plan 05 (pre-commit)** independent.
- **Plan 06c (`@types/node`)** independent.

## DECISIONS_LOG entries

- DECISION (Plan 04 — scheduled CI cron on main, every 12h)
- DECISION (Plan 04 — email-only failure channel, christian@saipienlabs.com, dawidd6/action-send-mail, reusing existing SMTP\_\* secret names)
