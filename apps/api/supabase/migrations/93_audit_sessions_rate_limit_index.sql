-- Composite index supporting the per-email 24-hour rate-limit lookup
-- on /api/audit/scan.
--
-- The route runs:
--   SELECT 1 FROM audit_sessions
--    WHERE email = $1 AND created_at > now() - interval '24 hours'
--    LIMIT 1
-- Postgres uses this composite (email, created_at DESC) for both the
-- equality probe on email and the range scan on created_at.
--
-- A partial index with a literal `WHERE created_at > now() - interval '24 hours'`
-- predicate is not possible: index predicates must be IMMUTABLE, and now()
-- is STABLE. A composite B-tree gives the same effective performance for
-- the rate-limit query without that constraint.
--
-- The pre-existing single-column idx_audit_sessions_email (migration 92)
-- is left in place — it still serves drip-campaign lookups that don't
-- filter on created_at.

CREATE INDEX IF NOT EXISTS idx_audit_sessions_email_created_at
  ON public.audit_sessions(email, created_at DESC);
