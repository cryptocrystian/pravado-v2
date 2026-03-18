import {
  LegalDoc,
  H2,
  H3,
  P,
  UL,
  LegalLink,
  HR,
} from '@/components/legal/LegalDoc';

export const metadata = { title: 'Terms of Service | Pravado' };

export default function TermsPage() {
  return (
    <LegalDoc title="Terms of Service" lastUpdated="March 15, 2026">
      <P>
        These Terms of Service (&quot;Terms&quot;) constitute a legally binding
        agreement between you (&quot;you&quot;, &quot;your&quot;, or
        &quot;User&quot;) and Saipien Labs LLC (&quot;Pravado&quot;,
        &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), governing your
        access to and use of the Pravado platform available at{' '}
        <LegalLink href="https://app.pravado.io">app.pravado.io</LegalLink>{' '}
        and all associated services, APIs, and documentation (collectively, the
        &quot;Service&quot;).
      </P>

      <HR />

      {/* 1 */}
      <H2>1. Acceptance of Terms</H2>
      <P>
        By creating an account, accessing, or using the Service, you acknowledge
        that you have read, understood, and agree to be bound by these Terms and
        our{' '}
        <LegalLink href="/legal/privacy">Privacy Policy</LegalLink>. If you are
        using the Service on behalf of an organization, you represent and warrant
        that you have authority to bind that organization to these Terms, and
        &quot;you&quot; refers to both you individually and that organization.
      </P>
      <P>
        If you do not agree to these Terms, you must not access or use the
        Service.
      </P>

      <HR />

      {/* 2 */}
      <H2>2. Description of Service</H2>
      <P>
        Pravado is an AI-native Visibility Operating System -- a B2B SaaS
        platform that unifies PR Intelligence, Content Hub, and SEO/AEO Command
        into a single integrated system. The platform includes, but is not
        limited to, the following proprietary systems:
      </P>
      <UL>
        <li>
          <strong className="text-white">EVI (Earned Visibility Index)</strong>{' '}
          -- A composite scoring system that measures and forecasts your
          organization&apos;s overall visibility across PR, content, and
          search/AI channels.
        </li>
        <li>
          <strong className="text-white">SAGE</strong> -- An AI strategy engine
          that analyzes cross-pillar signals and generates prioritized
          recommendations for visibility improvement.
        </li>
        <li>
          <strong className="text-white">AUTOMATE</strong> -- A governed
          execution layer that turns strategic recommendations into traceable,
          mode-aware tasks with three operational modes (Manual, Copilot, and
          Autopilot).
        </li>
        <li>
          <strong className="text-white">CiteMind</strong> -- A citation
          intelligence engine that monitors how AI models reference your brand,
          qualifies content for citability, and tracks your Share of Model across
          large language models.
        </li>
      </UL>
      <P>
        The Service is designed for businesses and marketing professionals. It is
        not intended for personal, non-commercial use.
      </P>

      <HR />

      {/* 3 */}
      <H2>3. Beta Program</H2>
      <P>
        Portions of the Service may be designated as &quot;Beta&quot; or
        &quot;Early Access.&quot; By participating in any Beta program, you
        acknowledge and agree that:
      </P>
      <UL>
        <li>
          Access to Beta features is by invitation only and may be revoked at any
          time.
        </li>
        <li>
          Beta features are provided &quot;as is&quot; and may contain bugs,
          errors, or incomplete functionality.
        </li>
        <li>
          We may modify, suspend, or discontinue any Beta feature without prior
          notice.
        </li>
        <li>
          Beta features may not be covered by our standard support or uptime
          commitments.
        </li>
        <li>
          Any feedback you provide regarding Beta features may be used by us
          without restriction or compensation.
        </li>
      </UL>

      <HR />

      {/* 4 */}
      <H2>4. Account Registration</H2>
      <P>To use the Service, you must create an account. You agree to:</P>
      <UL>
        <li>
          Provide accurate, current, and complete information during
          registration.
        </li>
        <li>
          Maintain and promptly update your account information to keep it
          accurate and complete.
        </li>
        <li>
          Maintain the security and confidentiality of your login credentials.
        </li>
        <li>Not share your account credentials with any third party.</li>
        <li>
          Immediately notify us of any unauthorized access to or use of your
          account.
        </li>
        <li>
          Accept responsibility for all activities that occur under your account.
        </li>
      </UL>
      <P>
        We reserve the right to suspend or terminate accounts that contain
        inaccurate information or that we reasonably believe are being used in
        violation of these Terms.
      </P>

      <HR />

      {/* 5 */}
      <H2>5. Subscriptions and Billing</H2>

      <H3>5.1 Plans</H3>
      <P>
        The Service is offered under multiple subscription tiers, including but
        not limited to Starter, Pro, and Growth plans. Each plan provides
        different levels of access to features, usage limits, and support. Plan
        details and current pricing are available on our website.
      </P>

      <H3>5.2 Payment</H3>
      <P>
        All payments are processed securely through Stripe. By subscribing to a
        paid plan, you authorize us to charge the payment method on file for all
        applicable fees. You represent and warrant that you are authorized to use
        the designated payment method.
      </P>

      <H3>5.3 Auto-Renewal</H3>
      <P>
        Subscriptions automatically renew at the end of each billing period
        (monthly or annual, as selected) unless you cancel before the renewal
        date. You will be charged the then-current rate for your plan at each
        renewal.
      </P>

      <H3>5.4 Cancellation</H3>
      <P>
        You may cancel your subscription at any time through your account
        settings. Cancellation takes effect at the end of the current billing
        period. No refunds are provided for partial billing periods. Upon
        cancellation, you will retain access to the Service until the end of
        your paid period, after which your account will revert to a limited free
        tier (if available) or be deactivated.
      </P>

      <H3>5.5 Price Changes</H3>
      <P>
        We reserve the right to change our pricing at any time. We will provide
        at least 30 days&apos; notice of any price increase via email or
        in-product notification. Continued use of the Service after the price
        change takes effect constitutes acceptance of the new pricing.
      </P>

      <H3>5.6 Taxes</H3>
      <P>
        All fees are exclusive of applicable taxes. You are responsible for all
        taxes, levies, or duties imposed by taxing authorities in connection with
        your subscription, excluding taxes based on our net income.
      </P>

      <HR />

      {/* 6 */}
      <H2>6. Acceptable Use</H2>
      <P>
        You agree not to use the Service to, or in any manner that would:
      </P>
      <UL>
        <li>
          Send unsolicited messages, spam, or bulk communications to journalists,
          media contacts, or any other individuals.
        </li>
        <li>
          Scrape, crawl, or use automated means to extract data from the Service
          beyond the APIs and interfaces we provide.
        </li>
        <li>
          Use any content, data, or outputs from the Service to train, fine-tune,
          or develop competing AI or machine learning models.
        </li>
        <li>
          Reverse engineer, decompile, disassemble, or otherwise attempt to
          derive the source code, algorithms, or underlying architecture of the
          Service.
        </li>
        <li>
          Share, transfer, or grant access to your account credentials to
          unauthorized individuals.
        </li>
        <li>
          Upload, transmit, or distribute any malware, viruses, trojans, or
          other harmful code.
        </li>
        <li>
          Circumvent or attempt to circumvent any rate limits, usage quotas,
          security measures, or access controls.
        </li>
        <li>
          Violate any applicable local, state, national, or international law or
          regulation.
        </li>
        <li>
          Impersonate any person or entity, or falsely claim an affiliation with
          any person or entity.
        </li>
        <li>
          Use the Service in any way that could damage, disable, overburden, or
          impair our infrastructure.
        </li>
      </UL>
      <P>
        For detailed usage guidelines, please review our{' '}
        <LegalLink href="/legal/acceptable-use">
          Acceptable Use Policy
        </LegalLink>
        .
      </P>

      <HR />

      {/* 7 */}
      <H2>7. Data Ownership and License</H2>

      <H3>7.1 Your Content</H3>
      <P>
        You retain all ownership rights in and to the content, data, and
        materials you upload, create, or submit through the Service
        (&quot;Your Content&quot;). Nothing in these Terms transfers ownership of
        Your Content to us.
      </P>

      <H3>7.2 License to Process</H3>
      <P>
        By using the Service, you grant us a limited, non-exclusive, worldwide
        license to access, process, store, and display Your Content solely for
        the purpose of providing and improving the Service to you. This license
        terminates when you delete Your Content or your account.
      </P>

      <H3>7.3 No AI Training on Your Data</H3>
      <P>
        We do not use Your Content to train, fine-tune, or improve general-purpose
        AI or machine learning models. Your data is used exclusively to deliver
        the Service to you. AI features within the Service (such as SAGE
        recommendations and CiteMind analysis) process your data in real time
        and do not retain it for model training purposes.
      </P>

      <H3>7.4 Aggregate Data</H3>
      <P>
        We may create anonymized, aggregated, and de-identified data derived from
        your use of the Service (&quot;Aggregate Data&quot;). Aggregate Data does
        not identify you or any individual and may be used by us for any
        purpose, including product improvement, research, and benchmarking.
      </P>

      <HR />

      {/* 8 */}
      <H2>8. AI-Generated Content Disclaimer</H2>
      <P>
        The Service incorporates artificial intelligence features that generate
        content, recommendations, analysis, and other outputs. You acknowledge
        and agree that:
      </P>
      <UL>
        <li>
          AI-generated outputs are suggestions only and should not be treated as
          professional, legal, financial, or strategic advice.
        </li>
        <li>
          AI outputs may contain inaccuracies, errors, or biases and should be
          reviewed by qualified humans before publication or reliance.
        </li>
        <li>
          You are solely responsible for reviewing, editing, and approving all
          AI-generated content before use.
        </li>
        <li>
          We make no representations or warranties regarding the accuracy,
          completeness, or fitness of AI-generated outputs for any particular
          purpose.
        </li>
        <li>
          AI model behavior may change over time as underlying models are updated
          by their providers.
        </li>
      </UL>

      <HR />

      {/* 9 */}
      <H2>9. Intellectual Property</H2>

      <H3>9.1 Pravado IP</H3>
      <P>
        The Service, including all software, algorithms, user interfaces,
        designs, documentation, and proprietary systems -- including but not
        limited to EVI, SAGE, CiteMind, and AUTOMATE -- are the exclusive
        property of Saipien Labs LLC and are protected by intellectual property
        laws. Nothing in these Terms grants you any right, title, or interest in
        our intellectual property except the limited right to use the Service as
        expressly permitted.
      </P>

      <H3>9.2 Trade Secrets</H3>
      <P>
        The following constitute valuable trade secrets of Saipien Labs LLC
        protected under the Defend Trade Secrets Act (18 U.S.C. § 1836) and
        applicable state law: (a) the EVI (Earned Visibility Index) scoring
        formula, component weights, and calculation methodology; (b) the
        CiteMind content quality scoring algorithm, factor weights, and
        citation-pattern analysis logic; (c) the SAGE signal scoring,
        opportunity ranking, and proposal generation systems; and (d) any
        other proprietary methodologies, algorithms, or data models underlying
        the Service. You agree not to attempt to discover, derive, reconstruct,
        or reproduce any such trade secrets through reverse engineering,
        benchmarking, systematic querying, or any other means. Any outputs
        returned by the Service (scores, recommendations, reports) are provided
        for your business use only and may not be used to build competing
        systems or to infer the underlying methodologies.
      </P>

      <H3>9.3 Trademark</H3>
      <P>
        &quot;Pravado,&quot; &quot;Earned Visibility Index,&quot;
        &quot;EVI,&quot; &quot;CiteMind,&quot; &quot;SAGE,&quot; and the
        Pravado logo are trademarks or pending trademarks of Saipien Labs LLC.
        You may not use these marks without our prior written consent.
      </P>

      <H3>9.4 Feedback</H3>
      <P>
        If you provide suggestions, ideas, enhancement requests, or other
        feedback regarding the Service (&quot;Feedback&quot;), you grant us a
        perpetual, irrevocable, worldwide, royalty-free license to use,
        incorporate, modify, and commercialize such Feedback without restriction
        or compensation.
      </P>

      <HR />

      {/* 10 */}
      <H2>10. Confidentiality</H2>
      <P>
        Each party agrees to maintain the confidentiality of any non-public
        information received from the other party that is designated as
        confidential or that reasonably should be understood to be confidential
        (&quot;Confidential Information&quot;). Confidential Information shall
        not be disclosed to third parties except as necessary to perform
        obligations under these Terms, and shall be protected with at least the
        same degree of care used to protect the receiving party&apos;s own
        confidential information.
      </P>
      <P>
        Confidential Information does not include information that: (a) is or
        becomes publicly available through no fault of the receiving party; (b)
        was known to the receiving party prior to disclosure; (c) is
        independently developed without use of Confidential Information; or (d)
        is lawfully obtained from a third party without restriction.
      </P>

      <HR />

      {/* 11 */}
      <H2>11. Warranty Disclaimer</H2>
      <P>
        <strong className="text-white">
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;
          WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR
          OTHERWISE. TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, WE
          DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED
          WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
          NON-INFRINGEMENT, AND QUIET ENJOYMENT. WE DO NOT WARRANT THAT THE
          SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR THAT ANY
          DEFECTS WILL BE CORRECTED. WE MAKE NO WARRANTY REGARDING THE
          ACCURACY, RELIABILITY, OR COMPLETENESS OF ANY CONTENT OR INFORMATION
          PROVIDED THROUGH THE SERVICE, INCLUDING AI-GENERATED OUTPUTS.
        </strong>
      </P>

      <HR />

      {/* 12 */}
      <H2>12. Limitation of Liability</H2>
      <P>
        <strong className="text-white">
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL
          SAIPIEN LABS LLC, ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES,
          AGENTS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
          CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS
          OF PROFITS, DATA, BUSINESS OPPORTUNITIES, GOODWILL, OR OTHER
          INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF
          OR INABILITY TO USE THE SERVICE, REGARDLESS OF THE THEORY OF
          LIABILITY (CONTRACT, TORT, STRICT LIABILITY, OR OTHERWISE), EVEN IF
          ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
        </strong>
      </P>
      <P>
        <strong className="text-white">
          OUR TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THESE
          TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE TOTAL
          FEES PAID BY YOU TO US DURING THE TWELVE (12) MONTHS IMMEDIATELY
          PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR (B) ONE HUNDRED
          U.S. DOLLARS ($100).
        </strong>
      </P>

      <HR />

      {/* 13 */}
      <H2>13. Indemnification</H2>
      <P>
        You agree to indemnify, defend, and hold harmless Saipien Labs LLC and
        its affiliates, officers, directors, employees, and agents from and
        against any and all claims, damages, losses, liabilities, costs, and
        expenses (including reasonable attorneys&apos; fees) arising out of or
        relating to: (a) your use of the Service; (b) Your Content; (c) your
        violation of these Terms; or (d) your violation of any third-party
        rights, including intellectual property rights.
      </P>

      <HR />

      {/* 14 */}
      <H2>14. Termination</H2>

      <H3>14.1 Termination by You</H3>
      <P>
        You may terminate your account at any time by contacting us at{' '}
        <LegalLink href="mailto:legal@pravado.io">legal@pravado.io</LegalLink>{' '}
        or through the account settings in the Service.
      </P>

      <H3>14.2 Termination by Us</H3>
      <P>
        We may suspend or terminate your access to the Service immediately, with
        or without notice, if we reasonably believe you have violated these
        Terms, engaged in fraudulent or illegal activity, or if required by law.
        We may also terminate the Service or any feature at any time with 30
        days&apos; notice.
      </P>

      <H3>14.3 Effect of Termination</H3>
      <P>
        Upon termination, your right to access and use the Service ceases
        immediately. We will retain Your Content for a period of 90 days
        following termination, during which you may request an export of your
        data. After the 90-day retention period, Your Content will be
        permanently deleted from our systems, except as required by law or for
        legitimate business purposes (such as fraud prevention).
      </P>

      <HR />

      {/* 15 */}
      <H2>15. Dispute Resolution</H2>

      <H3>15.1 Informal Resolution</H3>
      <P>
        Before initiating any formal dispute resolution proceeding, you agree to
        first contact us at{' '}
        <LegalLink href="mailto:legal@pravado.io">legal@pravado.io</LegalLink>{' '}
        and attempt to resolve the dispute informally for at least 30 days.
      </P>

      <H3>15.2 Binding Arbitration</H3>
      <P>
        If the dispute cannot be resolved informally, you and Saipien Labs LLC
        agree that any dispute, claim, or controversy arising out of or relating
        to these Terms or the Service shall be resolved by binding arbitration
        administered by the American Arbitration Association (&quot;AAA&quot;)
        under its Commercial Arbitration Rules. The arbitration shall take place
        in Austin, Texas. The arbitrator&apos;s decision shall be final and
        binding and may be entered as a judgment in any court of competent
        jurisdiction.
      </P>

      <H3>15.3 Class Action Waiver</H3>
      <P>
        <strong className="text-white">
          YOU AND SAIPIEN LABS LLC AGREE THAT EACH MAY BRING CLAIMS AGAINST THE
          OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF
          OR CLASS MEMBER IN ANY PURPORTED CLASS, CONSOLIDATED, OR
          REPRESENTATIVE PROCEEDING.
        </strong>{' '}
        The arbitrator may not consolidate more than one person&apos;s claims
        and may not otherwise preside over any form of a class or representative
        proceeding.
      </P>

      <H3>15.4 Exceptions</H3>
      <P>
        Notwithstanding the foregoing, either party may seek injunctive or other
        equitable relief in any court of competent jurisdiction to protect its
        intellectual property rights or confidential information.
      </P>

      <HR />

      {/* 16 */}
      <H2>16. Governing Law</H2>
      <P>
        These Terms shall be governed by and construed in accordance with the
        laws of the State of Texas, United States, without regard to its conflict
        of law principles. To the extent that any lawsuit or court proceeding is
        permitted hereunder, you and Saipien Labs LLC agree to submit to the
        personal and exclusive jurisdiction of the state and federal courts
        located in Travis County, Texas.
      </P>

      <HR />

      {/* 17 */}
      <H2>17. General Provisions</H2>

      <H3>17.1 Changes to Terms</H3>
      <P>
        We reserve the right to modify these Terms at any time. We will provide
        at least 30 days&apos; notice of material changes via email or
        in-product notification. Your continued use of the Service after the
        effective date of any changes constitutes acceptance of the updated
        Terms. If you do not agree to the updated Terms, you must stop using the
        Service and cancel your account.
      </P>

      <H3>17.2 Entire Agreement</H3>
      <P>
        These Terms, together with our Privacy Policy and any other policies
        referenced herein, constitute the entire agreement between you and
        Saipien Labs LLC regarding the Service and supersede all prior or
        contemporaneous agreements, communications, and proposals.
      </P>

      <H3>17.3 Severability</H3>
      <P>
        If any provision of these Terms is found to be unenforceable or invalid,
        that provision shall be limited or eliminated to the minimum extent
        necessary, and the remaining provisions shall remain in full force and
        effect.
      </P>

      <H3>17.4 Waiver</H3>
      <P>
        Our failure to enforce any right or provision of these Terms shall not
        constitute a waiver of such right or provision. Any waiver must be in
        writing and signed by an authorized representative of Saipien Labs LLC.
      </P>

      <H3>17.5 Assignment</H3>
      <P>
        You may not assign or transfer these Terms or your rights under them
        without our prior written consent. We may assign these Terms without
        restriction, including in connection with a merger, acquisition, or sale
        of assets.
      </P>

      <H3>17.6 Contact</H3>
      <P>
        If you have questions about these Terms, please contact us at:
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
