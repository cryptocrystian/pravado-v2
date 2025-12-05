-- 33_create_user_orgs_view.sql
-- Purpose: Provide a stable user_orgs view used by RLS policies in migrations 11–32

BEGIN;

-- Create a simple mapping view from users to orgs based on org_members
CREATE OR REPLACE VIEW public.user_orgs AS
SELECT
  om.user_id,
  om.org_id
FROM public.org_members AS om;

COMMENT ON VIEW public.user_orgs IS
  'Convenience view mapping users to orgs for RLS policies. Backed by org_members.';

COMMIT;
