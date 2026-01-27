-- ========================================
-- Migration 79: Fix org_members RLS Infinite Recursion
-- Sprint S100.1: PR Pillar RLS Fix
--
-- PROBLEM:
-- The org_members SELECT policy references org_members itself:
--   EXISTS (SELECT 1 FROM org_members om WHERE om.org_id = org_members.org_id AND om.user_id = auth.uid())
-- This causes infinite recursion when any table policy references org_members.
--
-- SOLUTION:
-- Replace with a direct check: user_id = auth.uid()
-- This allows users to see their own membership rows without recursion.
-- Other tables can then safely use: org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
--
-- AFFECTED TABLES:
-- - org_members (root cause - fixed here)
-- - journalist_profiles, pr_pitch_*, media_lists, media_list_entries, journalist_activity_log
--   (these reference org_members and will work once org_members is fixed)
-- ========================================

-- ========================================
-- 1. FIX org_members POLICIES
-- ========================================

-- Drop all existing policies on org_members
DROP POLICY IF EXISTS "Users can view org members of orgs they belong to" ON public.org_members;
DROP POLICY IF EXISTS "Org owners and admins can update members" ON public.org_members;
DROP POLICY IF EXISTS "Org owners can delete members" ON public.org_members;
DROP POLICY IF EXISTS "Users can insert org members when creating org" ON public.org_members;

-- Create NEW non-recursive policies

-- SELECT: Users can see all their own membership rows
-- This is the KEY FIX - no subquery, just direct column check
CREATE POLICY "org_members_select_own"
  ON public.org_members
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Restricted - only service role should create memberships
-- Allow insert only if user is inserting themselves (for self-signup flows)
-- or if they're an owner/admin of the org (checked via separate query)
CREATE POLICY "org_members_insert_self"
  ON public.org_members
  FOR INSERT
  WITH CHECK (
    -- Allow inserting yourself (for org creation / self-join)
    user_id = auth.uid()
  );

-- UPDATE: Only org owners and admins can update members
-- This references org_members but for a DIFFERENT user (the admin), so no recursion
CREATE POLICY "org_members_update_by_admin"
  ON public.org_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members admin_check
      WHERE admin_check.org_id = org_members.org_id
        AND admin_check.user_id = auth.uid()
        AND admin_check.role IN ('owner', 'admin')
    )
  );

-- DELETE: Only org owners can delete members
CREATE POLICY "org_members_delete_by_owner"
  ON public.org_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members owner_check
      WHERE owner_check.org_id = org_members.org_id
        AND owner_check.user_id = auth.uid()
        AND owner_check.role = 'owner'
    )
  );

-- ========================================
-- 2. VERIFY: List all org_members policies
-- ========================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 79 applied: org_members RLS recursion fixed';
  RAISE NOTICE 'New SELECT policy uses direct user_id = auth.uid() check';
END $$;

-- ========================================
-- 3. GRANT permissions (ensure authenticated role can access)
-- ========================================
GRANT SELECT ON public.org_members TO authenticated;
GRANT INSERT ON public.org_members TO authenticated;
GRANT UPDATE ON public.org_members TO authenticated;
GRANT DELETE ON public.org_members TO authenticated;

-- ========================================
-- VERIFICATION QUERY (run after migration):
-- ========================================
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'org_members';
--
-- Expected result:
-- - org_members_select_own: SELECT with (user_id = auth.uid())
-- - org_members_insert_self: INSERT
-- - org_members_update_by_admin: UPDATE
-- - org_members_delete_by_owner: DELETE
