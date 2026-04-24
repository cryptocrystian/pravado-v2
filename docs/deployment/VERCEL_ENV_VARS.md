# Vercel Environment Variables — Production

> **Note:** This document lists environment variable names and purposes. Live values are managed in Vercel's dashboard and should never be committed to this repository. If you need a live value, retrieve it from the Vercel project's Environment Variables settings.

Set these in the Vercel Dashboard for the `dashboard` project, environment: **Production**.

## Required Variables

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `<NEXT_PUBLIC_SUPABASE_URL from Vercel env>` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `<NEXT_PUBLIC_SUPABASE_ANON_KEY from Vercel env>` |
| `NEXT_PUBLIC_API_URL` | `<NEXT_PUBLIC_API_URL from Vercel env>` |
| `NEXT_PUBLIC_APP_URL` | `<NEXT_PUBLIC_APP_URL from Vercel env>` |
| `NEXT_PUBLIC_POSTHOG_KEY` | `<NEXT_PUBLIC_POSTHOG_KEY from Vercel env>` |
| `NEXT_PUBLIC_POSTHOG_HOST` | `<NEXT_PUBLIC_POSTHOG_HOST from Vercel env>` |
| `NEXT_PUBLIC_SENTRY_DSN` | `<NEXT_PUBLIC_SENTRY_DSN from Vercel env>` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `<NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY from Vercel env>` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `<NEXT_PUBLIC_GOOGLE_CLIENT_ID from Vercel env>` |
| `NEXT_PUBLIC_BETA_INVITE_REQUIRED` | `true` |
| `NEXT_PUBLIC_MSW_ENABLED` | `false` |

## Notes

- All variables are `NEXT_PUBLIC_` prefixed — they are embedded at build time into the client bundle
- The Supabase anon key is a public key; Supabase RLS enforces row-level security
- `NEXT_PUBLIC_API_URL` points to the Render-hosted Fastify API
- `NEXT_PUBLIC_MSW_ENABLED=false` ensures no mock service worker in production
- `NEXT_PUBLIC_BETA_INVITE_REQUIRED=true` gates signup behind invite codes

## How to Set

1. Go to https://vercel.com → project `dashboard` → Settings → Environment Variables
2. For each variable above, add it with scope **Production** (and optionally Preview)
3. Redeploy after setting all variables
