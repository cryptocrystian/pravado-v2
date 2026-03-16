# Google OAuth Production Checklist

## OAuth Client

- **Client ID**: `571948787117-jrkf7p0rf0q79pri7u8r5oa40gqo1mjf.apps.googleusercontent.com`
- **Console URL**: https://console.cloud.google.com/apis/credentials

## Steps

1. Go to [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on the OAuth 2.0 Client ID listed above
3. Add the following under **Authorized JavaScript origins**:

```
https://pravado-dashboard.vercel.app
```

4. Add the following under **Authorized redirect URIs**:

```
https://pravado-dashboard.vercel.app/auth/callback
```

5. Click **Save**

## Verify

After saving, the full list of authorized origins should include:
- `http://localhost:3000` (development)
- `https://pravado-dashboard.vercel.app` (production)

And redirect URIs should include:
- `http://localhost:3000/auth/callback` (development)
- `https://pravado-dashboard.vercel.app/auth/callback` (production)

## Supabase Configuration

Also update the Supabase Auth settings to allow the production redirect URL:

1. Go to https://supabase.com/dashboard → project `kroexsdyyqmlxfpbwajv` → Authentication → URL Configuration
2. Add `https://pravado-dashboard.vercel.app` to **Site URL** (or set as the primary)
3. Add `https://pravado-dashboard.vercel.app/auth/callback` to **Redirect URLs**
