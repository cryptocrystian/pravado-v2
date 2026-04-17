# Pre-Launch QA Checklist

Run before every production deploy. Automated tests handle route/API checks.
This checklist covers what automation cannot.

---

## Email Flows (Manual)
- [ ] Magic link email arrives within 60 seconds
- [ ] Email renders correctly (white background, readable text)
- [ ] From address shows "Pravado" or "hello@pravado.io" (not "Supabase Auth")
- [ ] Confirmation link lands on /app (not /login loop)
- [ ] Beta request confirmation email ("You're on the Pravado waitlist") arrives
- [ ] Beta approval invite code email arrives with correct code
- [ ] Invite code in email matches invite code in admin panel

## Third-Party Integrations (Manual)
- [ ] Google OAuth completes → lands on /app/command-center
- [ ] Microsoft OAuth completes → lands on /app/command-center
- [ ] GSC "Connect" button → opens Google authorization page
- [ ] Sign out → lands on /login (no redirect loop)
- [ ] Stripe billing page loads when navigating to /app/billing

## AI Features (Manual — requires LLM_PROVIDER=anthropic)
- [ ] Press release generation produces >150 words of original prose
- [ ] Press release does NOT echo announcement text verbatim
- [ ] Quote attribution uses the provided spokesperson name (not generic)
- [ ] Pitch generation produces personalized content mentioning journalist
- [ ] SAGE proposals load on Command Center with EVI impact scores
- [ ] CiteMind score appears on content items

## New Account First Experience (Manual)
- [ ] New user after onboarding lands on /app/command-center (not error)
- [ ] EVI shows 0 or initialization state (not broken/NaN)
- [ ] Action Stream shows empty state ("No actions yet") not crash
- [ ] Strategy Panel shows "proposals generating" state not blank
- [ ] Intelligence Canvas shows "Connect GSC" CTA
- [ ] All topbar navigation links work (PR, Content, SEO, Calendar, Analytics)
- [ ] Settings page loads with Account/Organization/Integrations tabs
- [ ] UserMenu dropdown opens with Sign Out option

## Analytics & Reports (Manual)
- [ ] Export CSV downloads a valid .csv file on each tab
- [ ] "vs prior" toggle changes headline metrics display
- [ ] EVI Growth chart responds to date range changes (7d/30d/60d/90d)
- [ ] Generate PDF → print dialog opens with report content visible
- [ ] All 4 report templates trigger print dialog

## Visual/Design (Manual)
- [ ] No white/light backgrounds on dark-theme pages
- [ ] Logo is Nexus-P icon + "PRAVADO" monospace on all surfaces
- [ ] OmniTray opens on right-edge click (not on mouse proximity)
- [ ] OmniTray closes on ESC and backdrop click
- [ ] Mobile (375px): segmented tabs on Command Center work

## Automated Smoke Tests

Run:
```bash
cd apps/dashboard
PLAYWRIGHT_BASE_URL=https://app.pravado.io npx playwright test tests/smoke/ --project=chromium
```

Tests cover:
- Auth: login page renders, OAuth redirects, callback error handling, protected route guards
- Beta: form renders, work email validation, API endpoint responds
- Navigation: all public routes return 200, all protected routes redirect to /login, API health
- API: critical endpoints respond (not 500), health checks pass
- Critical flows: login interactions, beta form, legal pages, root redirect, error handling

---

## Run Schedule

| When | What |
|------|------|
| Every PR | Automated smoke tests (CI) |
| Before deploy | Full manual checklist |
| Weekly | AI feature spot-check (press release + pitch quality) |
| After env var changes | Auth + email flows |

## Brand Name Verification
- [ ] SAGE™ appears with ™ on first use in every major view
- [ ] CRAFT™ appears with ™ on first use in every major view
- [ ] CiteMind™ appears with ™ on first use in every major view
- [ ] EVI™ appears with ™ in Strategy Panel header
- [ ] No instances of "AUTOMATE" remain in user-facing copy
- [ ] Telemetry panel shows SAGE™/CRAFT™/CiteMind™ labels
- [ ] Legal pages (Terms, Acceptable Use) reference CRAFT not AUTOMATE
- [ ] Billing plan descriptions reference CRAFT not AUTOMATE
