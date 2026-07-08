-- Migration 97: Backfill org_billing_state rows for orgs missing one
--
-- Context (Finding A / F35+F36 P0): checkout.session.completed and the
-- subscription/invoice webhook handlers wrote billing state with a bare
-- `.update().eq('org_id')`. Supabase `update()` on a non-existent row affects
-- 0 rows and returns error=null, so a paid checkout was reported as success
-- while nothing persisted. Measured on 2026-07-08: 12 orgs, only 1 had an
-- org_billing_state row (11 missing, 92%).
--
-- The code fix upserts going forward. This migration heals the existing gap by
-- creating a default (trialing, no plan) row for every org that lacks one, so
-- historical orgs also have a billing row.
--
-- Deferred (post-beta P2, per architect): a DB trigger to auto-create the row
-- at org creation. Not added here.
--
-- Idempotent: WHERE NOT EXISTS + ON CONFLICT DO NOTHING — re-running inserts
-- nothing. Additive only; touches no existing row.
--
-- Columns left to their table defaults on insert:
--   billing_status      -> 'trial'      (NOT NULL default)
--   subscription_status -> 'incomplete' (default)
--   plan_id / stripe_customer_id / stripe_subscription_id -> NULL

INSERT INTO public.org_billing_state (
  org_id,
  plan_id,
  stripe_customer_id,
  stripe_subscription_id,
  created_at,
  updated_at
)
SELECT
  o.id,
  NULL,
  NULL,
  NULL,
  COALESCE(o.created_at, NOW()),
  NOW()
FROM public.orgs o
LEFT JOIN public.org_billing_state obs ON obs.org_id = o.id
WHERE obs.org_id IS NULL
ON CONFLICT (org_id) DO NOTHING;

-- Post-condition (verify manually / in PR):
--   SELECT (SELECT count(*) FROM public.orgs) AS orgs,
--          (SELECT count(*) FROM public.org_billing_state) AS billing_rows;
--   -- orgs should equal billing_rows.
