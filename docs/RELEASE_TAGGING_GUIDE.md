# Pravado Release Tagging Guide

This guide documents the release tagging process for Pravado versioning.

---

## Current Release

**Version:** `1.0.0-rc1`
**Tag:** `v1.0.0-rc1`
**Status:** Release Candidate 1

---

## Creating the RC1 Tag

### Step 1: Ensure Clean State

```bash
# Verify you're on main branch
git checkout main

# Pull latest changes
git pull origin main

# Verify no uncommitted changes
git status
```

### Step 2: Verify Version Files

```bash
# Check VERSION.txt
cat VERSION.txt
# Should output: 1.0.0-rc1

# Verify package versions
grep '"version"' package.json
grep '"version"' apps/api/package.json
grep '"version"' apps/dashboard/package.json
grep '"version"' packages/*/package.json
# All should show: "1.0.0-rc1"
```

### Step 3: Create Annotated Tag

```bash
# Create the annotated tag
git tag -a v1.0.0-rc1 -m "Pravado v1.0.0 Release Candidate 1

Release Candidate 1 includes:
- Complete AI Playbook Engine
- Full PR & Media Intelligence
- Executive Intelligence Suite
- Scenario & Reality Maps
- Insight Conflict Resolution
- Production deployment pipeline
- Platform freeze mechanism

See RELEASE_NOTES_RC1.md for full details."

# Verify tag was created
git tag -l "v1.0.0*"
```

### Step 4: Push Tag to Remote

```bash
# Push the tag
git push origin v1.0.0-rc1

# Verify tag is on remote
git ls-remote --tags origin | grep v1.0.0-rc1
```

---

## CI/CD Tag Trigger Notes

### GitHub Actions

When the `v1.0.0-rc1` tag is pushed:

1. **deploy-api.yml** will NOT auto-trigger (requires manual dispatch for production)
2. **deploy-dashboard.yml** will NOT auto-trigger (requires manual dispatch for production)

To deploy RC1:
1. Go to GitHub Actions
2. Select "Deploy API" or "Deploy Dashboard"
3. Click "Run workflow"
4. Select environment: `production`
5. Confirm deployment

### Vercel (Dashboard)

If using Vercel GitHub integration:
- Preview deployments trigger on PR/branch pushes
- Production deployments trigger on main branch
- Tag pushes do NOT auto-deploy

### Render/Fly/Railway (API)

Configure your platform to:
- Watch for tags matching `v*`
- Or trigger via deploy webhook after tag push

---

## Release Progression

### RC1 → RC2 → GA Process

```
v1.0.0-rc1  →  v1.0.0-rc2  →  v1.0.0 (GA)
     ↓              ↓              ↓
  Testing      Bug fixes      Production
  Staging      Validation     Release
```

### Creating RC2 (if needed)

```bash
# Update VERSION.txt
echo "1.0.0-rc2" > VERSION.txt

# Update all package.json versions
# (use sed or manual edit)

# Commit changes
git add -A
git commit -m "chore: bump version to 1.0.0-rc2"

# Create tag
git tag -a v1.0.0-rc2 -m "Pravado v1.0.0 Release Candidate 2

Fixes from RC1:
- [List fixes here]"

# Push
git push origin main
git push origin v1.0.0-rc2
```

### Creating GA Release

```bash
# Update VERSION.txt
echo "1.0.0" > VERSION.txt

# Update all package.json versions
# Remove "releaseCandidate": true field

# Commit changes
git add -A
git commit -m "chore: release v1.0.0"

# Create tag
git tag -a v1.0.0 -m "Pravado v1.0.0 General Availability

First stable release of Pravado Platform.
See RELEASE_NOTES.md for full changelog."

# Push
git push origin main
git push origin v1.0.0
```

---

## Rollback Procedure

If RC1 has critical issues:

```bash
# Revert to previous state
git checkout <previous-commit-sha>

# Create hotfix branch
git checkout -b hotfix/rc1-issue-fix

# Apply fixes, commit, and merge to main

# Create new RC tag (RC2)
git tag -a v1.0.0-rc2 -m "..."
```

---

## Tag Naming Convention

| Tag Pattern | Meaning |
|-------------|---------|
| `v1.0.0-rc1` | Release Candidate 1 |
| `v1.0.0-rc2` | Release Candidate 2 |
| `v1.0.0` | General Availability |
| `v1.0.1` | Patch release |
| `v1.1.0` | Minor release |
| `v2.0.0` | Major release |

---

## Verification Commands

```bash
# List all tags
git tag -l

# Show tag details
git show v1.0.0-rc1

# Compare tags
git log v1.0.0-rc1..HEAD --oneline

# Delete local tag (if needed)
git tag -d v1.0.0-rc1

# Delete remote tag (if needed)
git push origin :refs/tags/v1.0.0-rc1
```

---

## Related Documentation

- [Release Notes RC1](RELEASE_NOTES_RC1.md)
- [RC1 Operations Guide](RC1_OPERATIONS_GUIDE.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
