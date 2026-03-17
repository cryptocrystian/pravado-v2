-- Admin audit log: every admin action recorded
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Intelligence quality snapshots: daily cron writes here
CREATE TABLE IF NOT EXISTS intelligence_quality_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  metric_type TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  value NUMERIC NOT NULL,
  status TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(snapshot_date, metric_type, metric_key)
);

-- Profiles table (stores admin flag and user metadata)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin BOOLEAN DEFAULT false,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: users can read their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
CREATE POLICY "Service role can manage profiles"
  ON profiles FOR ALL
  USING (true)
  WITH CHECK (true);

-- Beta invite codes table (if not exists)
CREATE TABLE IF NOT EXISTS beta_invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  email TEXT,
  used BOOLEAN DEFAULT false,
  used_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: admin_audit_log readable only by admins
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read audit log"
  ON admin_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- RLS: intelligence_quality_snapshots readable only by admins
ALTER TABLE intelligence_quality_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read quality snapshots"
  ON intelligence_quality_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Index for fast audit log queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at
  ON admin_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_intelligence_quality_snapshots_date
  ON intelligence_quality_snapshots(snapshot_date DESC, metric_type);
