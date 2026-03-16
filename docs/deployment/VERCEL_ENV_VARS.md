# Vercel Environment Variables — Production

Set these in the Vercel Dashboard for the `dashboard` project, environment: **Production**.

## Required Variables

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://kroexsdyyqmlxfpbwajv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtyb2V4c2R5eXFtbHhmcGJ3YWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzIxNjEsImV4cCI6MjA3ODcwODE2MX0.nGkVwgMTjujQeD7Bg1zHEXAAhoDTUOdF-PLc7IKuGb4` |
| `NEXT_PUBLIC_API_URL` | `https://pravado-api.onrender.com` |
| `NEXT_PUBLIC_APP_URL` | `https://pravado-dashboard.vercel.app` |
| `NEXT_PUBLIC_POSTHOG_KEY` | `phc_wdqaiLHbxLMFjvaTj974ZoJvtf5ShAbax2EO7UCMAAE` |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://app.posthog.com` |
| `NEXT_PUBLIC_SENTRY_DSN` | `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` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_51SPxftHoFSOg4IClQu0iowFn7AgwvgXbvK60Jvg4u2xHF858MuNkQvkeEz7aCZ8M9DBA61w7GfH2yieGrmnPYovW00rBBno46x` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `571948787117-jrkf7p0rf0q79pri7u8r5oa40gqo1mjf.apps.googleusercontent.com` |
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
