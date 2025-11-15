/**
 * Email template builders
 */

import type { InviteEmailContext } from '@pravado/types';

/**
 * Generate HTML email for organization invite
 */
export function buildInviteEmailHtml(context: InviteEmailContext): string {
  const roleLabel = context.role.charAt(0).toUpperCase() + context.role.slice(1);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been invited to ${context.orgName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                You've been invited to join ${context.orgName}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 20px 40px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
              <p style="margin: 0 0 20px;">
                ${context.inviterName || context.inviterEmail} has invited you to join
                <strong>${context.orgName}</strong> on Pravado as a <strong>${roleLabel}</strong>.
              </p>
              <p style="margin: 0 0 20px;">
                Click the button below to accept the invitation and get started:
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 20px 40px; text-align: center;">
              <a href="${context.inviteLink}"
                 style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                Accept Invitation
              </a>
            </td>
          </tr>

          <!-- Link fallback -->
          <tr>
            <td style="padding: 20px 40px; color: #6b7280; font-size: 14px; line-height: 1.6;">
              <p style="margin: 0;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0; word-break: break-all;">
                <a href="${context.inviteLink}" style="color: #2563eb;">
                  ${context.inviteLink}
                </a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; color: #9ca3af; font-size: 13px; text-align: center; border-top: 1px solid #e5e7eb; margin-top: 20px;">
              <p style="margin: 0;">
                This invitation was sent to ${context.recipientEmail}
              </p>
              <p style="margin: 10px 0 0;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>

        <!-- Branding -->
        <table width="600" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">
                Sent by <strong>Pravado</strong> - AI-Powered PR & Content Platform
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of invite email
 */
export function buildInviteEmailText(context: InviteEmailContext): string {
  const roleLabel = context.role.charAt(0).toUpperCase() + context.role.slice(1);

  return `
You've been invited to join ${context.orgName}

${context.inviterName || context.inviterEmail} has invited you to join ${context.orgName} on Pravado as a ${roleLabel}.

Accept your invitation by visiting:
${context.inviteLink}

This invitation was sent to ${context.recipientEmail}

If you didn't expect this invitation, you can safely ignore this email.

---
Sent by Pravado - AI-Powered PR & Content Platform
  `.trim();
}
