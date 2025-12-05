/**
 * Sprint S35: Audit Logging & Compliance Ledger
 * Migration 40: Create audit_log table with RLS
 *
 * Purpose: Track all critical events across PRAVADO platform
 * - User actions
 * - Billing events
 * - LLM activity
 * - Playbook executions
 * - Admin actions
 * - PR, SEO, Content operations
 */

-- Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_type text NOT NULL, -- 'user', 'system', 'agent'
  event_type text NOT NULL, -- e.g. 'login', 'billing.plan_change', 'playbook.execution_start'
  severity text NOT NULL, -- 'info', 'warning', 'error', 'critical'
  context jsonb NOT NULL DEFAULT '{}'::jsonb, -- Structured payload with event-specific data
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add constraint for actor_type
ALTER TABLE audit_log
  ADD CONSTRAINT audit_log_actor_type_check
  CHECK (actor_type IN ('user', 'system', 'agent'));

-- Add constraint for severity
ALTER TABLE audit_log
  ADD CONSTRAINT audit_log_severity_check
  CHECK (severity IN ('info', 'warning', 'error', 'critical'));

-- Create indexes for common query patterns
CREATE INDEX idx_audit_log_org_id ON audit_log(org_id);
CREATE INDEX idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX idx_audit_log_created_at_desc ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_severity ON audit_log(severity);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_log_actor_type ON audit_log(actor_type);

-- Composite index for common query combinations
CREATE INDEX idx_audit_log_org_time ON audit_log(org_id, created_at DESC);
CREATE INDEX idx_audit_log_org_event ON audit_log(org_id, event_type);

-- GIN index for JSONB context field (for efficient querying)
CREATE INDEX idx_audit_log_context_gin ON audit_log USING GIN (context);

-- Enable Row Level Security
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view audit logs for their organization
CREATE POLICY audit_log_org_isolation ON audit_log
  FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Only authenticated users/systems can insert audit logs
-- This allows the service layer to write logs
CREATE POLICY audit_log_insert_policy ON audit_log
  FOR INSERT
  WITH CHECK (
    -- Service layer will validate org_id before insert
    true
  );

-- RLS Policy: NO UPDATES allowed (audit logs are immutable)
-- This policy explicitly denies all updates
CREATE POLICY audit_log_no_updates ON audit_log
  FOR UPDATE
  USING (false);

-- RLS Policy: NO DELETES allowed (audit logs are permanent)
-- This policy explicitly denies all deletes
CREATE POLICY audit_log_no_deletes ON audit_log
  FOR DELETE
  USING (false);

-- Add comment for documentation
COMMENT ON TABLE audit_log IS 'Sprint S35: Immutable audit trail for all critical platform events';
COMMENT ON COLUMN audit_log.actor_type IS 'Type of actor: user (authenticated user), system (automated process), agent (AI agent)';
COMMENT ON COLUMN audit_log.event_type IS 'Hierarchical event identifier (e.g., billing.plan_change, playbook.execution_start)';
COMMENT ON COLUMN audit_log.severity IS 'Event severity level: info, warning, error, critical';
COMMENT ON COLUMN audit_log.context IS 'Event-specific structured data (JSONB)';
COMMENT ON COLUMN audit_log.ip_address IS 'IP address of the actor (if applicable)';
COMMENT ON COLUMN audit_log.user_agent IS 'User agent string (if applicable)';
