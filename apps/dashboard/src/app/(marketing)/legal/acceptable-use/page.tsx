import {
  LegalDoc,
  H2,
  H3,
  P,
  UL,
  LegalLink,
  HR,
} from '@/components/legal/LegalDoc';

export const metadata = { title: 'Acceptable Use Policy | Pravado' };

export default function AcceptableUsePage() {
  return (
    <LegalDoc title="Acceptable Use Policy" lastUpdated="March 15, 2026">
      <P>
        This Acceptable Use Policy (&quot;AUP&quot;) governs your use of the
        Pravado platform at{' '}
        <LegalLink href="https://app.pravado.io">app.pravado.io</LegalLink>{' '}
        and all associated services (the &quot;Service&quot;) provided by
        Saipien Labs LLC (&quot;Pravado&quot;, &quot;we&quot;, &quot;us&quot;, or
        &quot;our&quot;). This AUP supplements our{' '}
        <LegalLink href="/legal/terms">Terms of Service</LegalLink> and is
        incorporated therein by reference.
      </P>
      <P>
        By using the Service, you agree to comply with this AUP. Violations may
        result in suspension or termination of your account.
      </P>

      <HR />

      {/* 1 */}
      <H2>1. Prohibited Uses</H2>
      <P>
        You may not use the Service for any of the following purposes:
      </P>

      <H3>1.1 Spam and Unsolicited Communications</H3>
      <UL>
        <li>
          Sending unsolicited bulk emails, messages, or pitches to journalists,
          media contacts, or any other individuals.
        </li>
        <li>
          Using the Service to generate or facilitate spam, chain letters, or
          phishing campaigns.
        </li>
        <li>
          Harvesting email addresses or contact information from the Service for
          the purpose of sending unsolicited communications.
        </li>
      </UL>

      <H3>1.2 Unauthorized Data Collection</H3>
      <UL>
        <li>
          Scraping, crawling, or using automated means to extract data from the
          Service beyond the APIs and interfaces we expressly provide.
        </li>
        <li>
          Collecting, storing, or processing other users&apos; personal
          information without their explicit consent.
        </li>
        <li>
          Building databases from data obtained through the Service for purposes
          unrelated to your legitimate use of the platform.
        </li>
      </UL>

      <H3>1.3 AI Model Training</H3>
      <UL>
        <li>
          Using any content, data, outputs, or AI-generated materials from the
          Service to train, fine-tune, evaluate, or develop AI or machine
          learning models.
        </li>
        <li>
          Feeding Service outputs into competing AI systems or tools that
          replicate Pravado&apos;s functionality.
        </li>
        <li>
          Systematically extracting AI-generated content for the purpose of
          building alternative datasets.
        </li>
      </UL>

      <H3>1.4 Reverse Engineering</H3>
      <UL>
        <li>
          Reverse engineering, decompiling, disassembling, or otherwise
          attempting to derive the source code, algorithms, or underlying
          architecture of the Service.
        </li>
        <li>
          Attempting to discover the proprietary logic behind EVI scoring, SAGE
          recommendations, CiteMind analysis, or CRAFT orchestration.
        </li>
        <li>
          Probing, testing, or benchmarking the Service&apos;s AI outputs to
          reconstruct model prompts or system instructions.
        </li>
      </UL>

      <H3>1.5 Account Sharing and Unauthorized Access</H3>
      <UL>
        <li>
          Sharing your login credentials with individuals who are not authorized
          users on your account.
        </li>
        <li>
          Creating multiple accounts to circumvent usage limits, feature
          restrictions, or billing.
        </li>
        <li>
          Accessing the Service using another user&apos;s credentials without
          explicit authorization.
        </li>
        <li>
          Attempting to gain unauthorized access to other users&apos; accounts,
          data, or organizational workspaces.
        </li>
      </UL>

      <H3>1.6 System Abuse</H3>
      <UL>
        <li>
          Circumventing or attempting to circumvent rate limits, usage quotas,
          API throttling, or other technical restrictions.
        </li>
        <li>
          Uploading or transmitting malware, viruses, trojans, worms, or other
          harmful code.
        </li>
        <li>
          Launching denial-of-service attacks or other activities intended to
          disrupt or degrade the Service.
        </li>
        <li>
          Using the Service in a manner that could damage, disable, overburden,
          or impair our infrastructure or interfere with other users&apos;
          access.
        </li>
      </UL>

      <H3>1.7 Illegal Activity</H3>
      <UL>
        <li>
          Using the Service in violation of any applicable local, state,
          national, or international law or regulation.
        </li>
        <li>
          Creating, distributing, or promoting content that is defamatory,
          obscene, harassing, threatening, or that incites violence.
        </li>
        <li>
          Using the Service to facilitate fraud, money laundering, or any other
          criminal activity.
        </li>
      </UL>

      <H3>1.8 Impersonation</H3>
      <UL>
        <li>
          Impersonating any person or entity, or falsely claiming an affiliation
          with any person or entity.
        </li>
        <li>
          Misrepresenting AI-generated content as human-authored in contexts
          where disclosure is legally required.
        </li>
        <li>
          Using the Service to create misleading press releases, fake news, or
          disinformation campaigns.
        </li>
      </UL>

      <HR />

      {/* 2 */}
      <H2>2. API Fair Use</H2>
      <P>
        If you access the Service through our APIs, the following additional
        rules apply:
      </P>
      <UL>
        <li>
          Respect all published rate limits and usage quotas for your
          subscription tier.
        </li>
        <li>
          Use appropriate caching to minimize redundant API calls.
        </li>
        <li>
          Identify your integration with a descriptive{' '}
          <code className="text-white">User-Agent</code> header.
        </li>
        <li>
          Do not use the API to replicate or substitute for the Service&apos;s
          core functionality in a competing product.
        </li>
        <li>
          Report any API vulnerabilities or bugs to us promptly at{' '}
          <LegalLink href="mailto:legal@pravado.io">legal@pravado.io</LegalLink>{' '}
          rather than exploiting them.
        </li>
      </UL>

      <HR />

      {/* 3 */}
      <H2>3. Content Standards</H2>
      <P>
        Content you create, upload, or publish through the Service must comply
        with the following standards:
      </P>
      <UL>
        <li>
          You must have the legal right to use all content you submit to the
          Service.
        </li>
        <li>
          Content must not infringe on the intellectual property rights of any
          third party, including copyrights, trademarks, and trade secrets.
        </li>
        <li>
          Content must not contain false or misleading claims that could cause
          harm to individuals, businesses, or the public.
        </li>
        <li>
          Content must comply with applicable advertising, marketing, and
          disclosure regulations.
        </li>
        <li>
          Press releases and media materials must be truthful and not
          intentionally deceptive.
        </li>
      </UL>

      <HR />

      {/* 4 */}
      <H2>4. AI Output Use Restrictions</H2>
      <P>
        When using AI-generated content from the Service, you must:
      </P>
      <UL>
        <li>
          Review all AI-generated outputs for accuracy, completeness, and
          appropriateness before publication or distribution.
        </li>
        <li>
          Not represent AI-generated content as exclusively human-authored where
          disclosure is legally or ethically required.
        </li>
        <li>
          Not use AI-generated outputs to create content that violates any law,
          regulation, or third-party rights.
        </li>
        <li>
          Accept full responsibility for any AI-generated content you choose to
          publish, distribute, or act upon.
        </li>
        <li>
          Not use AI features to generate high volumes of low-quality or
          misleading content.
        </li>
      </UL>

      <HR />

      {/* 5 */}
      <H2>5. Enforcement</H2>
      <P>
        We enforce this AUP through a graduated response system. Depending on
        the severity and nature of the violation, we may take one or more of the
        following actions:
      </P>

      <H3>5.1 Warning</H3>
      <P>
        For first-time or minor violations, we will issue a written warning
        specifying the violation and required corrective action. You will be
        given a reasonable time to address the issue.
      </P>

      <H3>5.2 Suspension</H3>
      <P>
        For repeated violations or more serious offenses, we may temporarily
        suspend your access to the Service. During suspension, your data remains
        intact but inaccessible. We will notify you of the suspension reason and
        any steps required to restore access.
      </P>

      <H3>5.3 Termination</H3>
      <P>
        For severe violations, persistent non-compliance, or illegal activity,
        we may permanently terminate your account. Upon termination, you will
        have 90 days to request an export of your data, after which it will be
        permanently deleted.
      </P>
      <P>
        We reserve the right to skip graduated enforcement and proceed directly
        to suspension or termination in cases involving illegal activity,
        security threats, or imminent harm.
      </P>

      <HR />

      {/* 6 */}
      <H2>6. Reporting Violations</H2>
      <P>
        If you become aware of any violation of this AUP, please report it to us
        at{' '}
        <LegalLink href="mailto:legal@pravado.io">legal@pravado.io</LegalLink>.
        Please include:
      </P>
      <UL>
        <li>A description of the violation.</li>
        <li>
          Any relevant evidence or screenshots.
        </li>
        <li>The date and time the violation occurred, if known.</li>
        <li>Your contact information for follow-up.</li>
      </UL>
      <P>
        We will investigate all reports promptly and take appropriate action. We
        may not be able to disclose the outcome of investigations due to privacy
        obligations.
      </P>

      <HR />

      {/* 7 */}
      <H2>7. Contact</H2>
      <P>
        If you have questions about this Acceptable Use Policy, please contact
        us at:
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
