-- ========================================
-- PR PILLAR SCHEMA MIGRATION
-- Sprint S100.1: Creates tables required for PR Pillar
--
-- Run this SQL in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ========================================

-- ========================================
-- ENUMS (Safe - checks for existence)
-- ========================================

DO $$ BEGIN
  CREATE TYPE public.pr_pitch_sequence_status AS ENUM ('draft', 'active', 'paused', 'completed', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.pr_pitch_contact_status AS ENUM ('queued', 'sending', 'sent', 'opened', 'replied', 'bounced', 'opted_out', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.pr_pitch_event_type AS ENUM ('queued', 'sent', 'opened', 'clicked', 'replied', 'bounced', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- 1. PR PITCH SEQUENCES
-- ========================================

CREATE TABLE IF NOT EXISTS public.pr_pitch_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status public.pr_pitch_sequence_status NOT NULL DEFAULT 'draft',
  default_subject TEXT,
  default_preview_text TEXT,
  settings JSONB NOT NULL DEFAULT '{
    "sendWindow": {"startHour": 9, "endHour": 17, "timezone": "America/New_York"},
    "followUpDelayDays": 3,
    "maxAttempts": 3,
    "excludeWeekends": true
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pr_pitch_sequences_org ON public.pr_pitch_sequences(org_id);
CREATE INDEX IF NOT EXISTS idx_pr_pitch_sequences_org_status ON public.pr_pitch_sequences(org_id, status);
CREATE INDEX IF NOT EXISTS idx_pr_pitch_sequences_user ON public.pr_pitch_sequences(user_id);

ALTER TABLE public.pr_pitch_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pr_pitch_sequences_select_policy ON public.pr_pitch_sequences;
CREATE POLICY pr_pitch_sequences_select_policy ON public.pr_pitch_sequences
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS pr_pitch_sequences_insert_policy ON public.pr_pitch_sequences;
CREATE POLICY pr_pitch_sequences_insert_policy ON public.pr_pitch_sequences
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS pr_pitch_sequences_update_policy ON public.pr_pitch_sequences;
CREATE POLICY pr_pitch_sequences_update_policy ON public.pr_pitch_sequences
  FOR UPDATE USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS pr_pitch_sequences_delete_policy ON public.pr_pitch_sequences;
CREATE POLICY pr_pitch_sequences_delete_policy ON public.pr_pitch_sequences
  FOR DELETE USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

-- ========================================
-- 2. PR PITCH CONTACTS
-- ========================================

CREATE TABLE IF NOT EXISTS public.pr_pitch_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES public.pr_pitch_sequences(id) ON DELETE CASCADE,
  journalist_id UUID NOT NULL REFERENCES public.journalist_profiles(id) ON DELETE CASCADE,
  status public.pr_pitch_contact_status NOT NULL DEFAULT 'queued',
  current_step_position INT NOT NULL DEFAULT 1,
  last_event_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sequence_id, journalist_id)
);

CREATE INDEX IF NOT EXISTS idx_pr_pitch_contacts_org ON public.pr_pitch_contacts(org_id);
CREATE INDEX IF NOT EXISTS idx_pr_pitch_contacts_sequence ON public.pr_pitch_contacts(sequence_id);
CREATE INDEX IF NOT EXISTS idx_pr_pitch_contacts_journalist ON public.pr_pitch_contacts(journalist_id);
CREATE INDEX IF NOT EXISTS idx_pr_pitch_contacts_status ON public.pr_pitch_contacts(status);

ALTER TABLE public.pr_pitch_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pr_pitch_contacts_select_policy ON public.pr_pitch_contacts;
CREATE POLICY pr_pitch_contacts_select_policy ON public.pr_pitch_contacts
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS pr_pitch_contacts_insert_policy ON public.pr_pitch_contacts;
CREATE POLICY pr_pitch_contacts_insert_policy ON public.pr_pitch_contacts
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS pr_pitch_contacts_update_policy ON public.pr_pitch_contacts;
CREATE POLICY pr_pitch_contacts_update_policy ON public.pr_pitch_contacts
  FOR UPDATE USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS pr_pitch_contacts_delete_policy ON public.pr_pitch_contacts;
CREATE POLICY pr_pitch_contacts_delete_policy ON public.pr_pitch_contacts
  FOR DELETE USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

-- ========================================
-- 3. PR PITCH EVENTS
-- ========================================

CREATE TABLE IF NOT EXISTS public.pr_pitch_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.pr_pitch_contacts(id) ON DELETE CASCADE,
  step_position INT NOT NULL,
  event_type public.pr_pitch_event_type NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pr_pitch_events_org ON public.pr_pitch_events(org_id);
CREATE INDEX IF NOT EXISTS idx_pr_pitch_events_contact ON public.pr_pitch_events(contact_id);
CREATE INDEX IF NOT EXISTS idx_pr_pitch_events_type ON public.pr_pitch_events(event_type);
CREATE INDEX IF NOT EXISTS idx_pr_pitch_events_created ON public.pr_pitch_events(created_at DESC);

ALTER TABLE public.pr_pitch_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pr_pitch_events_select_policy ON public.pr_pitch_events;
CREATE POLICY pr_pitch_events_select_policy ON public.pr_pitch_events
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS pr_pitch_events_insert_policy ON public.pr_pitch_events;
CREATE POLICY pr_pitch_events_insert_policy ON public.pr_pitch_events
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

-- ========================================
-- 4. JOURNALIST ACTIVITY LOG
-- ========================================

CREATE TABLE IF NOT EXISTS public.journalist_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  journalist_id UUID NOT NULL REFERENCES public.journalist_profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  source_system TEXT,
  source_id UUID,
  activity_data JSONB DEFAULT '{}'::jsonb,
  sentiment TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journalist_activity_log_org ON public.journalist_activity_log(org_id);
CREATE INDEX IF NOT EXISTS idx_journalist_activity_log_journalist ON public.journalist_activity_log(journalist_id);
CREATE INDEX IF NOT EXISTS idx_journalist_activity_log_type ON public.journalist_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_journalist_activity_log_occurred ON public.journalist_activity_log(occurred_at DESC);

ALTER TABLE public.journalist_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS journalist_activity_log_select_policy ON public.journalist_activity_log;
CREATE POLICY journalist_activity_log_select_policy ON public.journalist_activity_log
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS journalist_activity_log_insert_policy ON public.journalist_activity_log;
CREATE POLICY journalist_activity_log_insert_policy ON public.journalist_activity_log
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

-- ========================================
-- 5. MEDIA LISTS
-- ========================================

CREATE TABLE IF NOT EXISTS public.media_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  input_topic TEXT NOT NULL DEFAULT '',
  input_keywords TEXT[] DEFAULT '{}',
  input_market TEXT,
  input_geography TEXT,
  input_product TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_lists_org ON public.media_lists(org_id);
CREATE INDEX IF NOT EXISTS idx_media_lists_created_by ON public.media_lists(created_by);

ALTER TABLE public.media_lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS media_lists_select_policy ON public.media_lists;
CREATE POLICY media_lists_select_policy ON public.media_lists
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS media_lists_insert_policy ON public.media_lists;
CREATE POLICY media_lists_insert_policy ON public.media_lists
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS media_lists_update_policy ON public.media_lists;
CREATE POLICY media_lists_update_policy ON public.media_lists
  FOR UPDATE USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS media_lists_delete_policy ON public.media_lists;
CREATE POLICY media_lists_delete_policy ON public.media_lists
  FOR DELETE USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

-- ========================================
-- 6. MEDIA LIST ENTRIES
-- ========================================

CREATE TABLE IF NOT EXISTS public.media_list_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.media_lists(id) ON DELETE CASCADE,
  journalist_id UUID NOT NULL REFERENCES public.journalist_profiles(id) ON DELETE CASCADE,
  fit_score FLOAT DEFAULT 0.0,
  tier TEXT DEFAULT 'C',
  reason TEXT,
  fit_breakdown JSONB DEFAULT '{}'::jsonb,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(list_id, journalist_id)
);

CREATE INDEX IF NOT EXISTS idx_media_list_entries_list ON public.media_list_entries(list_id);
CREATE INDEX IF NOT EXISTS idx_media_list_entries_journalist ON public.media_list_entries(journalist_id);
CREATE INDEX IF NOT EXISTS idx_media_list_entries_fit_score ON public.media_list_entries(fit_score DESC);

ALTER TABLE public.media_list_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS media_list_entries_select_policy ON public.media_list_entries;
CREATE POLICY media_list_entries_select_policy ON public.media_list_entries
  FOR SELECT USING (list_id IN (
    SELECT id FROM public.media_lists WHERE org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  ));

DROP POLICY IF EXISTS media_list_entries_insert_policy ON public.media_list_entries;
CREATE POLICY media_list_entries_insert_policy ON public.media_list_entries
  FOR INSERT WITH CHECK (list_id IN (
    SELECT id FROM public.media_lists WHERE org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  ));

DROP POLICY IF EXISTS media_list_entries_delete_policy ON public.media_list_entries;
CREATE POLICY media_list_entries_delete_policy ON public.media_list_entries
  FOR DELETE USING (list_id IN (
    SELECT id FROM public.media_lists WHERE org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  ));

-- ========================================
-- GRANTS
-- ========================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pr_pitch_sequences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pr_pitch_contacts TO authenticated;
GRANT SELECT, INSERT ON public.pr_pitch_events TO authenticated;
GRANT SELECT, INSERT ON public.journalist_activity_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_lists TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.media_list_entries TO authenticated;

-- ========================================
-- UPDATED_AT TRIGGERS
-- ========================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['pr_pitch_sequences', 'pr_pitch_contacts', 'media_lists'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
  END LOOP;
END $$;

-- ========================================
-- VERIFICATION QUERY (run after migration)
-- ========================================

SELECT 'Migration complete. Tables created:' as status;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'pr_pitch_sequences',
  'pr_pitch_contacts',
  'pr_pitch_events',
  'journalist_activity_log',
  'media_lists',
  'media_list_entries'
)
ORDER BY table_name;
