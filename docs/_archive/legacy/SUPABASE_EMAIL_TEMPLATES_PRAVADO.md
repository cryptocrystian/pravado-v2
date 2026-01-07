# Pravado Email Templates for Supabase Auth

> **Sprint S82** - Email templates matching Pravado's brand voice: warm, energetic, executive-grade.

These templates should be configured in the Supabase Dashboard under **Authentication > Email Templates**.

---

## 1. Email Confirmation (Signup)

### Subject Line
```
Welcome to Pravado - Please Confirm Your Email
```

### Preview Text
```
You're one step away from AI-powered PR orchestration.
```

### HTML Body
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0B0F14;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #0B0F14;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; background-color: #121923; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 32px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.06);">
              <div style="font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #6A6FF9 0%, #38E1FF 50%, #D66DFF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                Pravado
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #EAF2F7; text-align: center;">
                Welcome to Pravado!
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #3B4E67; text-align: center;">
                You're joining a new era of AI-powered PR, content, and SEO orchestration. Let's confirm your email to get you started.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; background-color: #6A6FF9; color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px;">
                  Confirm Email Address
                </a>
              </div>

              <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #3B4E67; text-align: center;">
                This link expires in 24 hours. If you didn't create a Pravado account, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #3B4E67;">
                Pravado - AI-Powered Marketing Intelligence
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #3B4E67;">
                <a href="https://pravado.io" style="color: #38E1FF; text-decoration: none;">pravado.io</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Password Reset

### Subject Line
```
Reset Your Pravado Password
```

### Preview Text
```
We received a request to reset your password. Here's your secure link.
```

### HTML Body
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0B0F14;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #0B0F14;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; background-color: #121923; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 32px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.06);">
              <div style="font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #6A6FF9 0%, #38E1FF 50%, #D66DFF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                Pravado
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #EAF2F7; text-align: center;">
                Reset Your Password
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #3B4E67; text-align: center;">
                We received a request to reset your Pravado password. Click the button below to create a new password.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; background-color: #6A6FF9; color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px;">
                  Reset Password
                </a>
              </div>

              <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #3B4E67; text-align: center;">
                This link expires in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
              </p>
            </td>
          </tr>

          <!-- Security Note -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <div style="background-color: rgba(90, 200, 250, 0.1); border: 1px solid rgba(90, 200, 250, 0.2); border-radius: 12px; padding: 16px;">
                <p style="margin: 0; font-size: 14px; color: #5AC8FA; text-align: center;">
                  <strong>Security Tip:</strong> Never share this link with anyone. Pravado will never ask for your password.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #3B4E67;">
                Pravado - AI-Powered Marketing Intelligence
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #3B4E67;">
                <a href="https://pravado.io" style="color: #38E1FF; text-decoration: none;">pravado.io</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Magic Link (Passwordless Login)

### Subject Line
```
Your Pravado Sign-In Link
```

### Preview Text
```
Click to sign in instantly - no password needed.
```

### HTML Body
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Magic Link Sign In</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0B0F14;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #0B0F14;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; background-color: #121923; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 32px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.06);">
              <div style="font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #6A6FF9 0%, #38E1FF 50%, #D66DFF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                Pravado
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #EAF2F7; text-align: center;">
                Sign In to Pravado
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #3B4E67; text-align: center;">
                Click the button below to sign in instantly. No password required.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; background-color: #38E1FF; color: #0B0F14; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px;">
                  Sign In Now
                </a>
              </div>

              <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #3B4E67; text-align: center;">
                This link expires in 10 minutes and can only be used once. If you didn't request this link, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #3B4E67;">
                Pravado - AI-Powered Marketing Intelligence
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #3B4E67;">
                <a href="https://pravado.io" style="color: #38E1FF; text-decoration: none;">pravado.io</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Design System Notes

All email templates follow the Pravado Design System v2:

| Element | Value |
|---------|-------|
| Background (page) | `#0B0F14` (--slate-0) |
| Card Background | `#121923` (--slate-2) |
| Border | `rgba(255,255,255,0.06)` |
| Primary Text | `#EAF2F7` (--white-0) |
| Muted Text | `#3B4E67` (--slate-6) |
| Primary Button | `#6A6FF9` (--brand-iris) |
| Secondary Button | `#38E1FF` (--brand-cyan) |
| Info Accent | `#5AC8FA` (--semantic-info) |
| Border Radius | `24px` (cards), `12px` (buttons) |
| Font | Inter (fallback to system fonts) |

---

## Configuration Checklist

Before deploying:

- [ ] Copy each HTML template to Supabase Dashboard > Authentication > Email Templates
- [ ] Update subject lines for each template type
- [ ] Test emails by triggering each flow (signup, password reset, magic link)
- [ ] Verify links resolve to production URL (`https://pravado-dashboard.vercel.app`)
- [ ] Check email rendering in Gmail, Outlook, and Apple Mail
