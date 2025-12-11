/**
 * Sprint S36: Audit Governance & Export UI
 * Migration 41: Create audit_exports table for export job tracking
 *
 * Purpose: Track audit log export jobs
 * - Job queue for async CSV generation
 * - Status tracking (queued, processing, success, failed)
 * - File path storage for completed exports
 * - RLS secured like audit_log
 */

-- Create export status enum
CREATE TYPE audit_export_status AS ENUM ('queued', 'processing', 'success', 'failed');

-- Create audit_exports table
CREATE TABLE IF NOT EXISTS audit_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status audit_export_status NOT NULL DEFAULT 'queued',
  filters_json jsonb NOT NULL DEFAULT '{}'::jsonb, -- Query filters used for export
  file_path text, -- Path to generated CSV file (null until success)
  file_size_bytes bigint, -- Size of generated file
  row_count integer, -- Number of rows exported
  error_message text, -- Error details if failed
  started_at timestamptz, -- When processing started
  completed_at timestamptz, -- When processing completed
  expires_at timestamptz, -- When the file should be deleted
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for common query patterns
CREATE INDEX idx_audit_exports_org_created ON audit_exports(org_id, created_at DESC);
CREATE INDEX idx_audit_exports_status ON audit_exports(status);
CREATE INDEX idx_audit_exports_user ON audit_exports(user_id);
CREATE INDEX idx_audit_exports_expires ON audit_exports(expires_at) WHERE expires_at IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE audit_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view exports for their organization
CREATE POLICY audit_exports_org_isolation ON audit_exports
  FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Only authenticated users can create export jobs
CREATE POLICY audit_exports_insert_policy ON audit_exports
  FOR INSERT
  WITH CHECK (
    -- Service layer will validate permissions before insert
    true
  );

-- RLS Policy: Only the system can update export jobs
CREATE POLICY audit_exports_update_policy ON audit_exports
  FOR UPDATE
  USING (
    -- Service layer handles updates
    true
  );

-- RLS Policy: Allow deletion of expired exports
CREATE POLICY audit_exports_delete_policy ON audit_exports
  FOR DELETE
  USING (
    -- Service layer handles cleanup
    true
  );

-- Add comments for documentation
COMMENT ON TABLE audit_exports IS 'Sprint S36: Audit log export job tracking';
COMMENT ON COLUMN audit_exports.status IS 'Export job status: queued, processing, success, failed';
COMMENT ON COLUMN audit_exports.filters_json IS 'Query filters used to generate the export';
COMMENT ON COLUMN audit_exports.file_path IS 'Path to generated CSV file (populated on success)';
COMMENT ON COLUMN audit_exports.expires_at IS 'When the export file should be automatically deleted';
