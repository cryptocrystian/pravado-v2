# Supabase Auth Configuration - Sprint S82

> **Operator Instructions** for configuring Supabase Authentication for Pravado production deployment.

---

## Quick Reference

| Setting | Value |
|---------|-------|
| Production Site URL | `https://pravado-dashboard.vercel.app` |
| Callback URL | `https://pravado-dashboard.vercel.app/callback` |
| Sender Name | `Pravado` |
| Sender Email | `noreply@pravado.io` (or your verified domain) |

---

## Step-by-Step Configuration

### 1. Update Site URL

1. Go to **Supabase Dashboard** > **Authentication** > **URL Configuration**
2. Set **Site URL** to:
   ```
   https://pravado-dashboard.vercel.app
   ```
3. Click **Save**

### 2. Add Redirect URLs

1. In the same **URL Configuration** section, add these **Redirect URLs**:
   ```
   https://pravado-dashboard.vercel.app/callback
   https://pravado-dashboard.vercel.app/login
   ```
2. For local development, also add:
   ```
   http://localhost:3000/callback
   http://localhost:3000/login
   ```
3. Click **Save**

### 3. Configure Google OAuth Provider

1. Go to **Authentication** > **Providers** > **Google**
2. Enable the Google provider
3. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Create an **OAuth 2.0 Client ID** (Web application type)
   - Add authorized JavaScript origins:
     ```
     https://pravado-dashboard.vercel.app
     ```
   - Add authorized redirect URIs:
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
4. Copy the **Client ID** and **Client Secret** to Supabase
5. Click **Save**

### 4. Configure Microsoft (Azure) OAuth Provider

1. Go to **Authentication** > **Providers** > **Azure**
2. Enable the Azure provider
3. Register an application in [Azure Portal](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade):
   - Create a new registration
   - Set redirect URI to:
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
   - Under **Certificates & secrets**, create a new client secret
4. Copy the **Application (client) ID** and **Client Secret** to Supabase
5. Set the **Azure Tenant** to:
   - `common` for multi-tenant (recommended)
   - OR your specific tenant ID for single-tenant
6. Click **Save**

### 5. Configure Email Templates

1. Go to **Authentication** > **Email Templates**
2. For each template type, copy the HTML from `docs/SUPABASE_EMAIL_TEMPLATES_PRAVADO.md`:
   - **Confirm signup** (Email Confirmation)
   - **Reset password** (Password Reset)
   - **Magic link** (Passwordless Login)
3. Update the **Subject** lines as specified in the templates document
4. Click **Save** for each template

### 6. Configure Email Sender Settings

1. Go to **Project Settings** > **Auth** > **SMTP Settings**
2. Option A: Use Supabase's built-in email (limited):
   - Update **Sender name** to: `Pravado`
3. Option B: Configure custom SMTP (recommended for production):
   - Enable **Custom SMTP**
   - Enter your SMTP credentials:
     - **Host**: Your SMTP server (e.g., `smtp.mailgun.org`)
     - **Port**: `587` (TLS) or `465` (SSL)
     - **Username**: Your SMTP username
     - **Password**: Your SMTP password
     - **Sender email**: `noreply@pravado.io`
     - **Sender name**: `Pravado`
4. Click **Save**

### 7. Enable Additional Security (Recommended)

1. Go to **Authentication** > **Settings**
2. Enable these options:
   - **Enable email confirmations**: ✅ ON
   - **Enable password change requirement**: ✅ ON (for new users)
3. Set **Minimum password length**: `8`
4. Click **Save**

---

## Environment Variables Checklist

Ensure these are set in your Vercel dashboard:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJ...` |

**Note**: The anon key is safe to expose client-side. Never expose the service role key.

---

## Testing Checklist

After configuration, test each auth flow:

- [ ] **Email/Password Signup**
  - Create new account
  - Verify confirmation email received
  - Click confirmation link → redirects to `/callback` → redirects to `/app` or `/onboarding`

- [ ] **Email/Password Login**
  - Sign in with existing credentials
  - Verify redirect to dashboard

- [ ] **Google OAuth**
  - Click "Continue with Google" button
  - Complete Google sign-in
  - Verify redirect back to Pravado dashboard

- [ ] **Microsoft OAuth**
  - Click "Continue with Microsoft" button
  - Complete Microsoft sign-in
  - Verify redirect back to Pravado dashboard

- [ ] **Password Reset**
  - Request password reset
  - Verify reset email received
  - Click reset link → set new password → login succeeds

- [ ] **Logout**
  - Sign out from dashboard
  - Verify redirect to login page
  - Verify cannot access `/app` routes while logged out

---

## Troubleshooting

### "Email link is invalid or has expired"
- Check that your Site URL matches the production domain exactly
- Ensure redirect URLs include the `/callback` path
- Verify email templates use `{{ .ConfirmationURL }}` (not hardcoded URLs)

### OAuth redirect errors
- Ensure callback URLs in provider settings match:
  ```
  https://<your-project-ref>.supabase.co/auth/v1/callback
  ```
- Check that provider credentials are correct
- Verify the provider is enabled in Supabase dashboard

### Users not redirecting after auth
- Check that `redirectTo` in the code points to production URL
- Verify the callback page exists at `/callback`
- Check browser console for any JavaScript errors

### Emails not sending
- If using Supabase's built-in email, check rate limits
- For custom SMTP, verify credentials are correct
- Check spam folder for test emails
- Ensure sender domain has proper SPF/DKIM records

---

## Security Reminders

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- Store OAuth secrets securely (never in git)
- Regularly rotate OAuth secrets
- Monitor authentication logs for suspicious activity
- Enable 2FA for team members in Supabase dashboard
