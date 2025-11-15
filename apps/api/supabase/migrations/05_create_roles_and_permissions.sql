-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_resource_action UNIQUE (resource, action)
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id)
);

-- Add trigger for roles updated_at
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Roles policies (read-only for authenticated users)
CREATE POLICY "Authenticated users can view roles"
  ON public.roles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Permissions policies (read-only for authenticated users)
CREATE POLICY "Authenticated users can view permissions"
  ON public.permissions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Role permissions policies (read-only for authenticated users)
CREATE POLICY "Authenticated users can view role permissions"
  ON public.role_permissions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Create indexes
CREATE INDEX idx_roles_name ON public.roles(name);
CREATE INDEX idx_permissions_resource ON public.permissions(resource);
CREATE INDEX idx_permissions_action ON public.permissions(action);
CREATE INDEX idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions(permission_id);

-- Insert default roles
INSERT INTO public.roles (name, description) VALUES
  ('super_admin', 'Full system access'),
  ('org_owner', 'Organization owner'),
  ('org_admin', 'Organization administrator'),
  ('org_member', 'Organization member');

-- Insert default permissions
INSERT INTO public.permissions (name, description, resource, action) VALUES
  ('org.create', 'Create organizations', 'org', 'create'),
  ('org.read', 'Read organization details', 'org', 'read'),
  ('org.update', 'Update organization', 'org', 'update'),
  ('org.delete', 'Delete organization', 'org', 'delete'),
  ('org.invite', 'Invite members to organization', 'org', 'invite'),
  ('org_member.read', 'Read organization members', 'org_member', 'read'),
  ('org_member.update', 'Update member roles', 'org_member', 'update'),
  ('org_member.delete', 'Remove members', 'org_member', 'delete');

-- Assign permissions to roles
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'super_admin';

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'org_owner';

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'org_admin'
AND p.name IN ('org.read', 'org.update', 'org.invite', 'org_member.read', 'org_member.update');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'org_member'
AND p.name IN ('org.read', 'org_member.read');
