# Database Migration Instructions

## Sprint S1 Migrations

The database migrations for Sprint S1 are located in `apps/api/supabase/migrations/`:

1. `01_create_orgs.sql` - Organizations table with RLS
2. `02_create_users.sql` - Users table and auth trigger
3. `03_create_org_members.sql` - Organization memberships with roles
4. `04_create_org_invites.sql` - Invitation system
5. `05_create_roles_and_permissions.sql` - RLS policies

## Option 1: Supabase CLI (Recommended)

You need your database password from the Supabase dashboard.

```bash
cd apps/api

# Link to your project (if not already linked)
supabase link --project-ref kroexsdyyqmlxfpbwajv

# Push migrations to remote database
supabase db push
# You will be prompted for your database password
```

## Option 2: Supabase Dashboard SQL Editor

1. Go to https://supabase.com/dashboard/project/kroexsdyyqmlxfpbwajv/sql/new
2. Copy and paste each migration file contents in order (01, 02, 03, 04, 05)
3. Run each one sequentially

## Option 3: psql Command Line

If you have the database connection string with password:

```bash
cd apps/api

# Combine all migrations
cat supabase/migrations/*.sql > /tmp/s1_migrations.sql

# Run via psql
psql "postgresql://postgres.kroexsdyyqmlxfpbwajv:[YOUR-DB-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:6543/postgres" -f /tmp/s1_migrations.sql
```

## Getting Your Database Password

1. Go to https://supabase.com/dashboard/project/kroexsdyyqmlxfpbwajv/settings/database
2. Find the "Database Password" section
3. Use "Reset Database Password" if you don't have it

## Verification

After running migrations, verify they were applied:

```bash
# Via Supabase CLI
supabase db diff --linked

# Or query the database
psql "postgresql://..." -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
```

You should see these tables:
- orgs
- users
- org_members
- org_invites

## Next Steps

After migrations are applied, the API and dashboard should be fully functional with:
- User authentication
- Organization management
- Member invitations
- Role-based access control
