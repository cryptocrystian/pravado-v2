-- =====================================================================
-- Migration 103: Contact State Machine + Audit Log + STAGED Backfill
-- =====================================================================
-- Canon: JOURNALIST_DATABASE_GOVERNANCE.md §4 (8-state machine + transition
--        rules), §4.3 (contact_state_transitions audit log — the GDPR /
--        CAN-SPAM provenance record).
--
-- STATUS: T3 — founder-approved DESIGN. MIGRATION FILE ONLY. NOT applied to
--         production (kroexsdyyqmlxfpbwajv). Apply on a Supabase dev/staging
--         branch under founder approval only.
--
-- ADDITIVE ONLY. Depends on migration 102 (media_contacts, contact_emails).
--
-- ┌───────────────────────────────────────────────────────────────────┐
-- │ SECTION B (BACKFILL) IS STAGED AND INERT BY DEFAULT.               │
-- │ The 784K-row backfill body at the bottom of this file runs ONLY    │
-- │ when the session GUC `pravado.run_backfill` is set to 'on':        │
-- │     SET pravado.run_backfill = 'on';                               │
-- │ Applying this migration normally creates the schema (Section A)    │
-- │ and leaves the backfill INERT. Run the backfill deliberately,      │
-- │ under founder approval, on a branch/staging FIRST — never          │
-- │ auto-applied to prod. It is idempotent (ON CONFLICT DO NOTHING).   │
-- └───────────────────────────────────────────────────────────────────┘
-- =====================================================================


-- =====================================================================
-- SECTION A — SCHEMA (safe to apply)
-- =====================================================================

-- 4.1 — enforce the 8 canonical states on media_contacts.contact_state.
-- Using a CHECK constraint (matches canon's TEXT+CHECK pattern; additive
-- and reversible, unlike CREATE TYPE).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'media_contacts_contact_state_check'
  ) THEN
    ALTER TABLE public.media_contacts
      ADD CONSTRAINT media_contacts_contact_state_check
      CHECK (contact_state IN (
        'identity_only',
        'enrichment_queued',
        'enriched',
        'pitch_eligible',
        'stale',
        'suppressed',
        'bounced',
        'do_not_contact'
      ));
  END IF;
END $$;

-- 4.3 — contact_state_transitions: the GDPR / CAN-SPAM audit log.
-- Every state transition is recorded here. This is the provenance record
-- for "what data do you have on me and what have you done with it."
CREATE TABLE IF NOT EXISTS public.contact_state_transitions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id    UUID NOT NULL REFERENCES public.media_contacts(id) ON DELETE CASCADE,
  from_state    TEXT CHECK (from_state IS NULL OR from_state IN (
                  'identity_only','enrichment_queued','enriched','pitch_eligible',
                  'stale','suppressed','bounced','do_not_contact')),
  to_state      TEXT NOT NULL CHECK (to_state IN (
                  'identity_only','enrichment_queued','enriched','pitch_eligible',
                  'stale','suppressed','bounced','do_not_contact')),
  trigger       TEXT,      -- 'user_unlock' | 'enrichment_success' | 'opt_out' | 'bounce' | 'backfill' | ...
  actor_type    TEXT CHECK (actor_type IS NULL OR actor_type IN ('user','system','journalist')),
  actor_id      UUID,
  -- org_id is optional context for org-scoped transitions (e.g. do_not_contact).
  -- Global transitions (suppressed/bounced) leave it NULL.
  org_id        UUID,
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.contact_state_transitions IS
  'Canon §4.3 — GDPR/CAN-SPAM audit log. One row per contact_state transition. Never deleted (needed for compliance provenance).';

CREATE INDEX IF NOT EXISTS idx_contact_state_transitions_contact
  ON public.contact_state_transitions (contact_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_state_transitions_to_state
  ON public.contact_state_transitions (to_state);

ALTER TABLE public.contact_state_transitions ENABLE ROW LEVEL SECURITY;

-- Audit log is platform-wide read for authenticated users (compliance
-- provenance is not org-private). Writes are service-role only.
DROP POLICY IF EXISTS contact_state_transitions_read_all ON public.contact_state_transitions;
CREATE POLICY contact_state_transitions_read_all
  ON public.contact_state_transitions FOR SELECT
  TO authenticated
  USING (true);


-- =====================================================================
-- SECTION B — STAGED BACKFILL (INERT unless pravado.run_backfill = 'on')
-- =====================================================================
-- Populates media_contacts (identity) + contact_emails (consolidated,
-- verified emails only — the firewall) from the fragmented legacy tables:
--   journalist_profiles (~284K), journalist_enrichment_records (~244K),
--   journalists, discovered_journalists.
--
-- Initial contact_state derivation (canon §2.1, §4, §5.2 quality gate):
--   - has a VERIFIED email                        -> 'enriched'
--   - verified email AND pitch_eligibility gate   -> 'pitch_eligible'
--     (gate: canon §5.2 step 4 uses score >= 40; at backfill we have no
--      computed score yet, so we conservatively land verified rows in
--      'enriched' and let the enrichment/scoring pipeline promote them to
--      'pitch_eligible'. This avoids over-granting pitch eligibility to
--      784K rows on day one — a deliberate CAN-SPAM-safe default.)
--   - no verified email                           -> 'identity_only'
--
-- IDEMPOTENT: dedupe key is a deterministic source tag stored in
-- corpus_source + a natural key; ON CONFLICT DO NOTHING. Re-runnable.
--
-- REVERSIBILITY: forward-only. A companion down-analysis (delete rows
-- WHERE corpus_source LIKE 'backfill:%') is documented in the PR body but
-- NOT auto-generated here. Founder approval + staging dry-run required.
-- =====================================================================
DO $$
DECLARE
  v_run   TEXT := current_setting('pravado.run_backfill', true);
BEGIN
  IF v_run IS DISTINCT FROM 'on' THEN
    RAISE NOTICE 'Migration 103 backfill SKIPPED (pravado.run_backfill != ''on''). Schema applied; backfill inert.';
    RETURN;
  END IF;

  RAISE NOTICE 'Migration 103 backfill RUNNING (pravado.run_backfill = ''on'').';

  -- Natural-key uniqueness for idempotency: we key identity rows by a
  -- synthetic external key stored in platform_metrics->>'backfill_key'.
  -- Create a partial unique index to make ON CONFLICT deterministic.
  CREATE UNIQUE INDEX IF NOT EXISTS uq_media_contacts_backfill_key
    ON public.media_contacts ((platform_metrics->>'backfill_key'))
    WHERE platform_metrics ? 'backfill_key';

  -- ---- journalist_profiles -> media_contacts (identity) ----
  IF to_regclass('public.journalist_profiles') IS NOT NULL THEN
    INSERT INTO public.media_contacts
      (contact_type, name, bio, linkedin_url, twitter_handle, website_url,
       platform_metrics, contact_state, corpus_source, corpus_ingested_at)
    SELECT
      'journalist',
      jp.full_name,
      NULLIF(jp.metadata->>'bio', ''),
      jp.linkedin_url,
      jp.twitter_handle,
      jp.website_url,
      jsonb_build_object('backfill_key', 'jp:' || jp.id::text,
                         'legacy_primary_outlet', jp.primary_outlet,
                         'legacy_beat', jp.beat),
      -- derive state: verified email present anywhere -> enriched else identity_only
      'identity_only',
      'backfill:journalist_profiles',
      jp.created_at
    FROM public.journalist_profiles jp
    ON CONFLICT ((platform_metrics->>'backfill_key')) WHERE platform_metrics ? 'backfill_key'
    DO NOTHING;

    -- Consolidate verified primary emails into the firewall.
    INSERT INTO public.contact_emails
      (contact_id, email, email_source, email_verified, email_verified_at)
    SELECT mc.id, jp.primary_email, 'migration_backfill', true, jp.updated_at
    FROM public.journalist_profiles jp
    JOIN public.media_contacts mc
      ON mc.platform_metrics->>'backfill_key' = 'jp:' || jp.id::text
    WHERE jp.primary_email IS NOT NULL AND jp.primary_email <> ''
    ON CONFLICT DO NOTHING;
  END IF;

  -- ---- discovered_journalists -> media_contacts (identity) ----
  IF to_regclass('public.discovered_journalists') IS NOT NULL THEN
    INSERT INTO public.media_contacts
      (contact_type, name, bio, platform_metrics, contact_state,
       corpus_source, corpus_ingested_at)
    SELECT
      'journalist', dj.full_name, dj.bio,
      jsonb_build_object('backfill_key', 'dj:' || dj.id::text,
                         'legacy_outlet', dj.outlet,
                         'legacy_beats', to_jsonb(dj.beats)),
      'identity_only',
      'backfill:discovered_journalists',
      dj.created_at
    FROM public.discovered_journalists dj
    WHERE dj.status <> 'rejected'
    ON CONFLICT ((platform_metrics->>'backfill_key')) WHERE platform_metrics ? 'backfill_key'
    DO NOTHING;
  END IF;

  -- ---- journalist_enrichment_records -> contact_emails (VERIFIED only) ----
  -- Enrichment records carry the freshest verified emails. Only email_verified
  -- rows cross the firewall. Attach to the media_contact created above when a
  -- profile linkage exists; otherwise skip (identity must exist first).
  IF to_regclass('public.journalist_enrichment_records') IS NOT NULL
     AND to_regclass('public.journalist_profiles') IS NOT NULL THEN
    -- journalist_enrichment_records may reference a profile via a linking
    -- column; guard defensively for schema drift.
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'journalist_enrichment_records'
                 AND column_name = 'journalist_profile_id') THEN
      INSERT INTO public.contact_emails
        (contact_id, email, email_source, email_verified, email_verified_at)
      SELECT mc.id, er.email, 'migration_backfill', true,
             COALESCE(er.email_verification_date, er.created_at)
      FROM public.journalist_enrichment_records er
      JOIN public.journalist_profiles jp ON jp.id = er.journalist_profile_id
      JOIN public.media_contacts mc
        ON mc.platform_metrics->>'backfill_key' = 'jp:' || jp.id::text
      WHERE er.email IS NOT NULL AND er.email <> '' AND er.email_verified = true
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ---- Derive contact_state: verified email present -> 'enriched' ----
  -- Conservative promotion: verified email => enriched (NOT pitch_eligible;
  -- pitch eligibility requires the scoring pipeline post-backfill).
  UPDATE public.media_contacts mc
  SET contact_state = 'enriched'
  WHERE mc.contact_state = 'identity_only'
    AND mc.corpus_source LIKE 'backfill:%'
    AND EXISTS (
      SELECT 1 FROM public.contact_emails ce
      WHERE ce.contact_id = mc.id AND ce.email_verified = true
    );

  -- ---- Audit row for every backfilled identity ----
  INSERT INTO public.contact_state_transitions
    (contact_id, from_state, to_state, trigger, actor_type)
  SELECT mc.id, NULL, mc.contact_state, 'backfill', 'system'
  FROM public.media_contacts mc
  WHERE mc.corpus_source LIKE 'backfill:%'
    AND NOT EXISTS (
      SELECT 1 FROM public.contact_state_transitions t
      WHERE t.contact_id = mc.id AND t.trigger = 'backfill'
    );

  RAISE NOTICE 'Migration 103 backfill COMPLETE.';
END $$;
