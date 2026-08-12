-- Migration 115: PR Outreach Reply Capture (inbound journalist replies)
--
-- Phase 1 of closed-loop outreach: capture a journalist's REPLY (via SendGrid
-- Inbound Parse) and forward it to the customer, while recording the reply as
-- the strongest positive relationship signal.
--
-- Flow: an outbound pitch sets reply-to = <token>@reply.pravado.io. The token
-- maps (in pr_outreach_reply_tokens) to the org / journalist / run and the
-- customer inbox to forward to. When the journalist replies, SendGrid Inbound
-- Parse POSTs to the inbound route, which resolves the token, dedupes, stores
-- the reply (pr_outreach_inbound_replies), bumps engagement, and forwards.
--
-- WRITE MODEL (SECURITY): mirrors migration 112 (pr_pitch_reviews). Rows are
-- written ONLY server-side via the Supabase SERVICE ROLE (bypasses RLS). RLS
-- stays ENABLED with org-scoped SELECT for org members (Phase 2 thread UI).
--
-- Additive / idempotent: safe to re-run.

-- ============================================================================
-- pr_outreach_reply_tokens — per-send reply-to token → routing + forward target
-- ============================================================================

CREATE TABLE IF NOT EXISTS pr_outreach_reply_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- The opaque token that is the local-part of the reply-to address
  -- (<token>@reply.pravado.io). Case-insensitive hex so mail relays that
  -- lowercase the local-part cannot break resolution.
  token text NOT NULL UNIQUE,

  -- Routing context (all nullable: the CRAFT pitch path is proposal-based with
  -- no run; the sequence path is run-based).
  journalist_id uuid,
  run_id uuid,
  message_id uuid,          -- pr_outreach_email_messages(id) when known
  proposal_id text,         -- CRAFT lifecycle id (not always uuid-shaped)

  -- The customer inbox a journalist reply is forwarded to (the address that
  -- was the reply-to before interception; resolved from the approver / org).
  forward_to text,
  -- Original pitch subject, for the forwarded "Re: ..." line.
  subject text,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pr_outreach_reply_tokens_org
  ON pr_outreach_reply_tokens (org_id, created_at DESC);

-- ============================================================================
-- pr_outreach_inbound_replies — received journalist replies (dedup + thread UI)
-- ============================================================================

CREATE TABLE IF NOT EXISTS pr_outreach_inbound_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  token_id uuid REFERENCES pr_outreach_reply_tokens(id) ON DELETE SET NULL,
  journalist_id uuid,
  run_id uuid,

  from_email text,
  subject text,
  body_text text,
  body_html text,

  -- The inbound Message-ID header — the dedup key (SendGrid may retry).
  inbound_message_id text,

  received_at timestamptz NOT NULL DEFAULT now(),
  forwarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Dedup: one row per (org, inbound Message-ID). Partial so NULL message-ids
-- (rare) do not collide.
CREATE UNIQUE INDEX IF NOT EXISTS uq_pr_outreach_inbound_replies_msgid
  ON pr_outreach_inbound_replies (org_id, inbound_message_id)
  WHERE inbound_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pr_outreach_inbound_replies_journalist
  ON pr_outreach_inbound_replies (org_id, journalist_id, received_at DESC);

-- ============================================================================
-- RLS — service-role writes; org members read (mirrors migration 112)
-- ============================================================================

ALTER TABLE pr_outreach_reply_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE pr_outreach_inbound_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org members can read reply tokens" ON pr_outreach_reply_tokens;
CREATE POLICY "org members can read reply tokens" ON pr_outreach_reply_tokens
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "service role can manage reply tokens" ON pr_outreach_reply_tokens;
CREATE POLICY "service role can manage reply tokens" ON pr_outreach_reply_tokens
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "org members can read inbound replies" ON pr_outreach_inbound_replies;
CREATE POLICY "org members can read inbound replies" ON pr_outreach_inbound_replies
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "service role can manage inbound replies" ON pr_outreach_inbound_replies;
CREATE POLICY "service role can manage inbound replies" ON pr_outreach_inbound_replies
  FOR ALL TO service_role USING (true) WITH CHECK (true);
