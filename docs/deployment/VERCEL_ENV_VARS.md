# Vercel Environment Variables — Production

Set these in the Vercel Dashboard for the `dashboard` project, environment: **Production**.

## Required Variables

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://kroexsdyyqmlxfpbwajv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `REDACTED-JWT-1` |
| `NEXT_PUBLIC_API_URL` | `https://pravado-api.onrender.com` |
| `NEXT_PUBLIC_APP_URL` | `https://pravado-dashboard.vercel.app` |
| `NEXT_PUBLIC_POSTHOG_KEY` | `REDACTED-POSTHOG-1` |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://app.posthog.com` |
| `NEXT_PUBLIC_SENTRY_DSN` | `REDACTED-SENTRY-1` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `REDACTED-STRIPE_PUB-1` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `REDACTED-GOOGLE_CLIENT-1` |
| `NEXT_PUBLIC_BETA_INVITE_REQUIRED` | `true` |
| `NEXT_PUBLIC_MSW_ENABLED` | `false` |

## Notes

- All variables are `NEXT_PUBLIC_` prefixed — they are embedded at build time into the client bundle
- The Supabase anon key is safe to expose (it's a public key, RLS enforces security)
- `NEXT_PUBLIC_API_URL` points to the Render-hosted Fastify API
- `NEXT_PUBLIC_MSW_ENABLED=false` ensures no mock service worker in production
- `NEXT_PUBLIC_BETA_INVITE_REQUIRED=true` gates signup behind invite codes

## How to Set

1. Go to https://vercel.com → project `dashboard` → Settings → Environment Variables
2. For each variable above, add it with scope **Production** (and optionally Preview)
3. Redeploy after setting all variables
