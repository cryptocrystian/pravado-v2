import {
  LegalDoc,
  H2,
  H3,
  P,
  UL,
  LegalLink,
  HR,
} from '@/components/legal/LegalDoc';

export const metadata = { title: 'Cookie Policy | Pravado' };

export default function CookiesPage() {
  return (
    <LegalDoc title="Cookie Policy" lastUpdated="March 15, 2026">
      <P>
        This Cookie Policy explains how Saipien Labs LLC (&quot;Pravado&quot;,
        &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) uses cookies and
        similar tracking technologies when you use the Pravado platform at{' '}
        <LegalLink href="https://app.pravado.io">app.pravado.io</LegalLink>{' '}
        (the &quot;Service&quot;). This policy should be read alongside our{' '}
        <LegalLink href="/legal/privacy">Privacy Policy</LegalLink>.
      </P>

      <HR />

      {/* 1 */}
      <H2>1. What Are Cookies?</H2>
      <P>
        Cookies are small text files stored on your device when you visit a
        website. They are widely used to make websites work efficiently, provide
        reporting information, and assist with personalization. We also use
        similar technologies such as local storage and session storage,
        collectively referred to as &quot;cookies&quot; in this policy.
      </P>

      <HR />

      {/* 2 */}
      <H2>2. Cookies We Use</H2>

      <H3>2.1 Strictly Necessary Cookies</H3>
      <P>
        These cookies are essential for the Service to function and cannot be
        disabled without breaking core functionality.
      </P>
      <div
        className="overflow-x-auto rounded-lg border my-4"
        style={{ borderColor: '#1F1F28' }}
      >
        <table className="w-full text-sm" style={{ color: '#A0A0B0' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <th className="text-left px-4 py-2 text-white font-medium">
                Cookie
              </th>
              <th className="text-left px-4 py-2 text-white font-medium">
                Provider
              </th>
              <th className="text-left px-4 py-2 text-white font-medium">
                Purpose
              </th>
              <th className="text-left px-4 py-2 text-white font-medium">
                Duration
              </th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderTop: '1px solid #1F1F28' }}>
              <td className="px-4 py-2">
                <code className="text-white">sb-*-auth-token</code>
              </td>
              <td className="px-4 py-2">Supabase</td>
              <td className="px-4 py-2">
                Authentication session management. Maintains your login state.
              </td>
              <td className="px-4 py-2">Session / 1 year</td>
            </tr>
            <tr style={{ borderTop: '1px solid #1F1F28' }}>
              <td className="px-4 py-2">
                <code className="text-white">sb-*-auth-token-code-verifier</code>
              </td>
              <td className="px-4 py-2">Supabase</td>
              <td className="px-4 py-2">
                PKCE authentication flow verification.
              </td>
              <td className="px-4 py-2">Session</td>
            </tr>
          </tbody>
        </table>
      </div>

      <H3>2.2 Functional Cookies</H3>
      <P>
        These cookies remember your preferences and settings to provide a better
        experience.
      </P>
      <div
        className="overflow-x-auto rounded-lg border my-4"
        style={{ borderColor: '#1F1F28' }}
      >
        <table className="w-full text-sm" style={{ color: '#A0A0B0' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <th className="text-left px-4 py-2 text-white font-medium">
                Storage
              </th>
              <th className="text-left px-4 py-2 text-white font-medium">
                Type
              </th>
              <th className="text-left px-4 py-2 text-white font-medium">
                Purpose
              </th>
              <th className="text-left px-4 py-2 text-white font-medium">
                Duration
              </th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderTop: '1px solid #1F1F28' }}>
              <td className="px-4 py-2">
                <code className="text-white">pravado-sidebar-state</code>
              </td>
              <td className="px-4 py-2">localStorage</td>
              <td className="px-4 py-2">Remembers sidebar expanded/collapsed state.</td>
              <td className="px-4 py-2">Persistent</td>
            </tr>
            <tr style={{ borderTop: '1px solid #1F1F28' }}>
              <td className="px-4 py-2">
                <code className="text-white">pravado-theme</code>
              </td>
              <td className="px-4 py-2">localStorage</td>
              <td className="px-4 py-2">Stores theme preference.</td>
              <td className="px-4 py-2">Persistent</td>
            </tr>
          </tbody>
        </table>
      </div>

      <H3>2.3 Analytics Cookies</H3>
      <P>
        These cookies help us understand how users interact with the Service so
        we can improve it.
      </P>
      <div
        className="overflow-x-auto rounded-lg border my-4"
        style={{ borderColor: '#1F1F28' }}
      >
        <table className="w-full text-sm" style={{ color: '#A0A0B0' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <th className="text-left px-4 py-2 text-white font-medium">
                Cookie
              </th>
              <th className="text-left px-4 py-2 text-white font-medium">
                Provider
              </th>
              <th className="text-left px-4 py-2 text-white font-medium">
                Purpose
              </th>
              <th className="text-left px-4 py-2 text-white font-medium">
                Duration
              </th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderTop: '1px solid #1F1F28' }}>
              <td className="px-4 py-2">
                <code className="text-white">ph_*</code>
              </td>
              <td className="px-4 py-2">PostHog</td>
              <td className="px-4 py-2">
                Product analytics: page views, feature usage, session recording.
              </td>
              <td className="px-4 py-2">1 year</td>
            </tr>
          </tbody>
        </table>
      </div>

      <H3>2.4 Advertising Cookies</H3>
      <P>
        <strong className="text-white">
          We do not use any advertising or third-party tracking cookies.
        </strong>{' '}
        We do not participate in ad networks, retargeting programs, or
        cross-site tracking. No data from the Service is shared with
        advertisers.
      </P>

      <HR />

      {/* 3 */}
      <H2>3. How to Opt Out</H2>
      <P>You can control cookies in the following ways:</P>

      <H3>3.1 Analytics Opt-Out</H3>
      <P>
        PostHog analytics respects the{' '}
        <code className="text-white">Do Not Track</code> signal from your
        browser. You can also opt out of PostHog tracking by enabling Do Not
        Track in your browser settings.
      </P>

      <H3>3.2 Browser Controls</H3>
      <P>
        Most browsers allow you to manage cookies through their settings. You
        can typically:
      </P>
      <UL>
        <li>View and delete existing cookies.</li>
        <li>Block all cookies or only third-party cookies.</li>
        <li>Set preferences for specific websites.</li>
        <li>Enable &quot;Do Not Track&quot; signals.</li>
      </UL>
      <P>
        Please note that blocking strictly necessary cookies will prevent you
        from logging in and using the Service.
      </P>

      <H3>3.3 Browser-Specific Instructions</H3>
      <UL>
        <li>
          <strong className="text-white">Chrome</strong> -- Settings &gt;
          Privacy and security &gt; Cookies and other site data
        </li>
        <li>
          <strong className="text-white">Firefox</strong> -- Settings &gt;
          Privacy &amp; Security &gt; Cookies and Site Data
        </li>
        <li>
          <strong className="text-white">Safari</strong> -- Preferences &gt;
          Privacy &gt; Manage Website Data
        </li>
        <li>
          <strong className="text-white">Edge</strong> -- Settings &gt; Cookies
          and site permissions &gt; Manage and delete cookies
        </li>
      </UL>

      <HR />

      {/* 4 */}
      <H2>4. Updates to This Policy</H2>
      <P>
        We may update this Cookie Policy to reflect changes in our practices or
        for operational, legal, or regulatory reasons. The &quot;Last
        updated&quot; date at the top of this policy indicates the most recent
        revision.
      </P>

      <HR />

      {/* 5 */}
      <H2>5. Contact Us</H2>
      <P>
        If you have questions about our use of cookies or this Cookie Policy,
        please contact us at:
      </P>
      <P>
        Saipien Labs LLC
        <br />
        Email:{' '}
        <LegalLink href="mailto:legal@pravado.io">legal@pravado.io</LegalLink>
      </P>
    </LegalDoc>
  );
}
