import {
  LegalDoc,
  H2,
  H3,
  P,
  UL,
  LegalLink,
  HR,
} from '@/components/legal/LegalDoc';

export const metadata = { title: 'Privacy Policy | Pravado' };

export default function PrivacyPage() {
  return (
    <LegalDoc title="Privacy Policy" lastUpdated="March 15, 2026">
      <P>
        Saipien Labs LLC (&quot;Pravado&quot;, &quot;we&quot;, &quot;us&quot;, or
        &quot;our&quot;) is committed to protecting your privacy. This Privacy
        Policy explains how we collect, use, disclose, and safeguard your
        information when you use the Pravado platform at{' '}
        <LegalLink href="https://app.pravado.io">app.pravado.io</LegalLink>{' '}
        and all associated services (the &quot;Service&quot;).
      </P>
      <P>
        By using the Service, you consent to the data practices described in
        this Privacy Policy. If you do not agree with this policy, please do not
        use the Service.
      </P>

      <HR />

      {/* 1 */}
      <H2>1. Introduction</H2>
      <P>
        Pravado is an AI-native Visibility Operating System designed for
        businesses and marketing professionals. This policy applies to all users
        of the Service, including account holders, team members, and anyone who
        interacts with our platform. We process data as a controller for account
        and usage data, and as a processor for content you create and manage
        through the Service.
      </P>

      <HR />

      {/* 2 */}
      <H2>2. Information We Collect</H2>

      <H3>2.1 Account Information</H3>
      <P>
        When you register for an account, we collect your name, email address,
        organization name, job title, and password. If you sign up through a
        third-party authentication provider, we receive the information you
        authorize that provider to share.
      </P>

      <H3>2.2 Usage Data</H3>
      <P>
        We automatically collect information about how you interact with the
        Service, including pages visited, features used, actions taken,
        timestamps, session duration, click patterns, and navigation paths. This
        data helps us understand how the Service is used and how to improve it.
      </P>

      <H3>2.3 Content Data</H3>
      <P>
        We store and process content you create, upload, or manage through the
        Service, including articles, press releases, pitch drafts, SEO analyses,
        keyword research, journalist contact information, and any other materials
        you input into the platform.
      </P>

      <H3>2.4 Integration Data</H3>
      <P>
        If you connect third-party services (such as Google Search Console,
        email providers, or CRM systems), we collect data from those
        integrations as authorized by you. This may include website analytics,
        search performance data, email engagement metrics, and contact
        information.
      </P>

      <H3>2.5 Device and Technical Data</H3>
      <P>
        We collect information about the device and browser you use to access the
        Service, including IP address, browser type and version, operating
        system, screen resolution, language preferences, and referring URLs.
      </P>

      <H3>2.6 Communications</H3>
      <P>
        We retain records of communications between you and our support team,
        including emails, chat messages, and any feedback or survey responses you
        provide.
      </P>

      <HR />

      {/* 3 */}
      <H2>3. How We Use Your Information</H2>
      <P>We use the information we collect for the following purposes:</P>
      <UL>
        <li>
          <strong className="text-white">Service Delivery</strong> -- To
          provide, operate, maintain, and improve the Service, including AI
          features such as SAGE recommendations, CiteMind analysis, and content
          generation.
        </li>
        <li>
          <strong className="text-white">AI Features</strong> -- To power
          AI-driven analysis, recommendations, and content generation within the
          Service. Your content is processed in real time by AI models to deliver
          personalized insights and suggestions.
        </li>
        <li>
          <strong className="text-white">Payments</strong> -- To process
          subscription payments, manage billing, and prevent fraud through our
          payment processor, Stripe.
        </li>
        <li>
          <strong className="text-white">Product Communications</strong> -- To
          send you transactional emails (account confirmations, billing
          receipts, security alerts), product updates, and, with your consent,
          marketing communications.
        </li>
        <li>
          <strong className="text-white">Fraud Detection and Security</strong>{' '}
          -- To detect, prevent, and respond to fraud, unauthorized access, and
          other security threats.
        </li>
        <li>
          <strong className="text-white">Legal Compliance</strong> -- To comply
          with applicable laws, regulations, legal processes, or enforceable
          governmental requests.
        </li>
        <li>
          <strong className="text-white">Analytics and Improvement</strong> --
          To analyze usage patterns, conduct research, and improve the
          Service&apos;s features, performance, and user experience.
        </li>
      </UL>

      <HR />

      {/* 4 */}
      <H2>4. How We Share Your Information</H2>
      <P>
        We do not sell your personal information. We share data only in the
        following limited circumstances:
      </P>

      <H3>4.1 AI Service Providers</H3>
      <P>
        We use third-party AI providers to power certain features of the
        Service. Content you submit may be processed by:
      </P>
      <UL>
        <li>
          <strong className="text-white">OpenAI</strong> -- For content
          generation, analysis, and natural language processing.
        </li>
        <li>
          <strong className="text-white">Anthropic</strong> -- For AI reasoning,
          strategy recommendations, and content analysis.
        </li>
        <li>
          <strong className="text-white">Perplexity</strong> -- For citation
          tracking and AI search intelligence.
        </li>
      </UL>
      <P>
        These providers process data per our instructions and are contractually
        prohibited from using your data for their own model training purposes.
      </P>

      <H3>4.2 Infrastructure Providers</H3>
      <UL>
        <li>
          <strong className="text-white">Supabase</strong> -- Database hosting
          and authentication.
        </li>
        <li>
          <strong className="text-white">Render</strong> -- API hosting and
          compute.
        </li>
        <li>
          <strong className="text-white">Vercel</strong> -- Frontend hosting and
          edge network.
        </li>
      </UL>

      <H3>4.3 Analytics Providers</H3>
      <UL>
        <li>
          <strong className="text-white">PostHog</strong> -- Product analytics
          and feature usage tracking.
        </li>
        <li>
          <strong className="text-white">Sentry</strong> -- Error monitoring and
          performance tracking.
        </li>
      </UL>

      <H3>4.4 Billing</H3>
      <P>
        <strong className="text-white">Stripe</strong> processes all payment
        transactions. We do not store your full credit card number on our
        servers. Stripe&apos;s privacy policy governs its handling of your
        payment information.
      </P>

      <H3>4.5 Legal Requirements</H3>
      <P>
        We may disclose your information if required to do so by law, or if we
        believe in good faith that such action is necessary to: (a) comply with
        a legal obligation; (b) protect and defend our rights or property; (c)
        prevent fraud; (d) act in urgent circumstances to protect the personal
        safety of users or the public.
      </P>

      <H3>4.6 Business Transfers</H3>
      <P>
        In the event of a merger, acquisition, reorganization, bankruptcy, or
        sale of assets, your information may be transferred as part of that
        transaction. We will notify you via email or prominent notice on the
        Service before your information is transferred and becomes subject to a
        different privacy policy.
      </P>

      <HR />

      {/* 5 */}
      <H2>5. Data Retention</H2>
      <P>
        We retain your personal information and content data for as long as your
        account is active and as needed to provide the Service. Upon account
        termination or deletion, we retain your data for a period of 90 days to
        allow you to request data export. After the 90-day retention period, your
        data is permanently deleted from our systems.
      </P>
      <P>
        We may retain certain information beyond the 90-day period where
        required by law, for legitimate business purposes (such as fraud
        prevention), or to resolve disputes. Aggregate, anonymized data that
        does not identify you may be retained indefinitely.
      </P>

      <HR />

      {/* 6 */}
      <H2>6. Your Rights</H2>
      <P>
        Depending on your jurisdiction, you may have the following rights
        regarding your personal information:
      </P>
      <UL>
        <li>
          <strong className="text-white">Access</strong> -- Request a copy of
          the personal information we hold about you.
        </li>
        <li>
          <strong className="text-white">Correction</strong> -- Request
          correction of inaccurate or incomplete personal information.
        </li>
        <li>
          <strong className="text-white">Deletion</strong> -- Request deletion
          of your personal information, subject to certain exceptions.
        </li>
        <li>
          <strong className="text-white">Data Export</strong> -- Request a
          portable copy of your data in a commonly used, machine-readable
          format.
        </li>
        <li>
          <strong className="text-white">Objection</strong> -- Object to the
          processing of your personal information for certain purposes.
        </li>
        <li>
          <strong className="text-white">Restriction</strong> -- Request that we
          restrict the processing of your personal information under certain
          circumstances.
        </li>
        <li>
          <strong className="text-white">Withdrawal of Consent</strong> -- Where
          processing is based on your consent, you may withdraw consent at any
          time without affecting the lawfulness of prior processing.
        </li>
      </UL>
      <P>
        To exercise any of these rights, contact us at{' '}
        <LegalLink href="mailto:legal@pravado.io">legal@pravado.io</LegalLink>.
        We will respond within 30 days (or as required by applicable law).
      </P>

      <HR />

      {/* 7 */}
      <H2>7. Cookies and Tracking Technologies</H2>

      <H3>7.1 Strictly Necessary Cookies</H3>
      <P>
        We use essential cookies required for the Service to function, including
        authentication session cookies managed by Supabase (prefixed{' '}
        <code className="text-white">sb-*</code>). These cannot be disabled
        without breaking the Service.
      </P>

      <H3>7.2 Analytics Cookies</H3>
      <P>
        We use PostHog for product analytics, which sets cookies prefixed{' '}
        <code className="text-white">ph_*</code>. These cookies help us
        understand how users interact with the Service and identify areas for
        improvement.
      </P>

      <H3>7.3 No Advertising Cookies</H3>
      <P>
        We do not use advertising or third-party tracking cookies. We do not
        participate in ad networks or sell data to advertisers.
      </P>

      <H3>7.4 Managing Cookies</H3>
      <P>
        You can manage cookies through your browser settings. Note that
        disabling strictly necessary cookies may prevent you from using the
        Service. For more details, see our{' '}
        <LegalLink href="/legal/cookies">Cookie Policy</LegalLink>.
      </P>

      <HR />

      {/* 8 */}
      <H2>8. Security</H2>
      <P>
        We implement industry-standard security measures to protect your
        information, including:
      </P>
      <UL>
        <li>
          <strong className="text-white">Encryption in transit</strong> -- All
          data transmitted between your browser and our servers is encrypted
          using TLS (Transport Layer Security).
        </li>
        <li>
          <strong className="text-white">Encryption at rest</strong> -- Stored
          data is encrypted using AES-256 encryption.
        </li>
        <li>
          <strong className="text-white">Row-Level Security (RLS)</strong> --
          Database access is governed by row-level security policies ensuring
          that users can only access their own organization&apos;s data.
        </li>
      </UL>
      <P>
        While we strive to protect your information, no method of transmission
        or storage is 100% secure. We cannot guarantee absolute security.
      </P>

      <HR />

      {/* 9 */}
      <H2>9. International Data Transfers</H2>
      <P>
        Pravado is operated from the United States. If you access the Service
        from outside the United States, your information will be transferred to
        and processed in the United States, where data protection laws may
        differ from those in your jurisdiction. By using the Service, you
        consent to the transfer of your information to the United States.
      </P>

      <HR />

      {/* 10 */}
      <H2>10. California Privacy Rights (CCPA)</H2>
      <P>
        If you are a California resident, you have the following additional
        rights under the California Consumer Privacy Act (CCPA):
      </P>
      <UL>
        <li>
          <strong className="text-white">Right to Know</strong> -- You may
          request that we disclose the categories and specific pieces of
          personal information we have collected about you.
        </li>
        <li>
          <strong className="text-white">Right to Delete</strong> -- You may
          request deletion of your personal information, subject to certain
          exceptions.
        </li>
        <li>
          <strong className="text-white">Right to Opt-Out</strong> -- We do not
          sell personal information. If this changes, we will provide a
          &quot;Do Not Sell My Personal Information&quot; option.
        </li>
        <li>
          <strong className="text-white">Non-Discrimination</strong> -- We will
          not discriminate against you for exercising your CCPA rights.
        </li>
      </UL>
      <P>
        To exercise your CCPA rights, contact us at{' '}
        <LegalLink href="mailto:legal@pravado.io">legal@pravado.io</LegalLink>.
      </P>

      <HR />

      {/* 11 */}
      <H2>11. Children&apos;s Privacy</H2>
      <P>
        The Service is not intended for use by anyone under the age of 16. We do
        not knowingly collect personal information from children under 16. If we
        become aware that we have collected personal information from a child
        under 16, we will take steps to promptly delete that information. If you
        believe a child under 16 has provided us with personal information,
        please contact us at{' '}
        <LegalLink href="mailto:legal@pravado.io">legal@pravado.io</LegalLink>.
      </P>

      <HR />

      {/* 12 */}
      <H2>12. Changes to This Policy</H2>
      <P>
        We may update this Privacy Policy from time to time. We will provide at
        least 30 days&apos; notice of material changes via email or in-product
        notification. The &quot;Last updated&quot; date at the top of this policy
        indicates when it was last revised. Your continued use of the Service
        after the effective date of any changes constitutes acceptance of the
        updated policy.
      </P>

      <HR />

      {/* 13 */}
      <H2>13. Contact Us</H2>
      <P>
        If you have questions, concerns, or requests regarding this Privacy
        Policy or our data practices, please contact us at:
      </P>
      <P>
        Saipien Labs LLC
        <br />
        Email:{' '}
        <LegalLink href="mailto:legal@pravado.io">legal@pravado.io</LegalLink>
        <br />
        Product:{' '}
        <LegalLink href="https://app.pravado.io">app.pravado.io</LegalLink>
      </P>
    </LegalDoc>
  );
}
