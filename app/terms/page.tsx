import type { Metadata } from "next";
import Link from "next/link";

import { ProseSection, ProseStack } from "@/components/site/prose-sections";
import { SiteShell } from "@/components/site/site-shell";

export const metadata: Metadata = {
  title: "Terms of Service - desin",
  description:
    "Terms governing your use of desin, the live brand context platform for AI tools.",
};

const UPDATED = "July 26, 2026";

export default function TermsPage() {
  return (
    <SiteShell
      description={`Last updated ${UPDATED}. By using desin you agree to these terms.`}
      eyebrow="Legal"
      title="Terms of Service"
    >
      <ProseStack>
        <ProseSection title="1. Agreement">
          <p>
            These Terms of Service (&quot;Terms&quot;) are a binding agreement
            between you and desin (&quot;desin,&quot; &quot;we,&quot;
            &quot;us&quot;) governing access to and use of desin.ai, our MCP
            connectors, APIs, and related services (the &quot;Service&quot;).
          </p>
          <p>
            If you use the Service on behalf of an organization, you represent
            that you have authority to bind that organization, and
            &quot;you&quot; includes that organization.
          </p>
        </ProseSection>

        <ProseSection title="2. The Service">
          <p>
            desin provides live brand context — colors, voice, rules, logos, and
            related assets — that AI tools and applications can pull via MCP or
            API. We supply brand truth for tools you already use; we do not
            generate images or creative output on our site as the primary
            product.
          </p>
          <p>
            Features, availability, and free access may change. We may modify,
            suspend, or discontinue parts of the Service with reasonable notice
            when practicable.
          </p>
        </ProseSection>

        <ProseSection title="3. Accounts">
          <p>
            You must provide accurate account information and keep credentials
            and sessions secure. You are responsible for activity under your
            account, including MCP and API access tied to it.
          </p>
          <p>
            You must be at least 16 years old (or the minimum age required in
            your jurisdiction) to use the Service.
          </p>
        </ProseSection>

        <ProseSection title="4. Your content">
          <p>
            You retain ownership of brand kits, logos, rules, references, and
            other materials you upload or configure (&quot;Customer
            Content&quot;). You grant desin a limited license to host, process,
            transmit, and display Customer Content solely to operate and improve
            the Service for you — including serving context to connected AI
            clients you authorize.
          </p>
          <p>
            You represent that you have the rights needed to use Customer
            Content with the Service and that it does not infringe others&apos;
            rights or violate law.
          </p>
        </ProseSection>

        <ProseSection title="5. Acceptable use">
          <p>You agree not to:</p>
          <ul>
            <li>
              Use the Service for unlawful, harmful, or deceptive purposes
            </li>
            <li>
              Upload content you do not have rights to, or that is abusive,
              infringing, or malware
            </li>
            <li>
              Probe, scrape, or overload the Service beyond normal documented
              use, or attempt unauthorized access
            </li>
            <li>
              Resell, sublicense, or misrepresent desin as your own product
              without permission
            </li>
            <li>
              Interfere with other users&apos; access or reverse engineer the
              Service except where permitted by law
            </li>
          </ul>
        </ProseSection>

        <ProseSection title="6. API and MCP access">
          <p>
            API keys, OAuth sessions, and MCP connectors are for your authorized
            use. Keep them confidential. Rate limits and fair-use constraints may
            apply. We may revoke access that threatens the Service or violates
            these Terms.
          </p>
        </ProseSection>

        <ProseSection title="7. Third-party tools">
          <p>
            The Service integrates with third-party AI tools and identity
            providers (for example Google or GitHub). Their terms and privacy
            practices govern your use of those products. desin is not responsible
            for third-party services.
          </p>
        </ProseSection>

        <ProseSection title="8. Intellectual property">
          <p>
            desin, the Service, and related branding, software, and documentation
            are owned by desin or its licensors. Except for the limited rights
            granted in these Terms, no license is granted to you.
          </p>
        </ProseSection>

        <ProseSection title="9. Disclaimers">
          <p>
            The Service is provided &quot;as is&quot; and &quot;as
            available.&quot; To the fullest extent permitted by law, we disclaim
            warranties of merchantability, fitness for a particular purpose,
            and non-infringement. We do not warrant that brand context served to
            third-party tools will always be complete, current, or error-free.
          </p>
        </ProseSection>

        <ProseSection title="10. Limitation of liability">
          <p>
            To the fullest extent permitted by law, desin and its affiliates will
            not be liable for indirect, incidental, special, consequential, or
            punitive damages, or any loss of profits, data, or goodwill, arising
            from your use of the Service. Our aggregate liability for claims
            relating to the Service will not exceed the greater of one hundred
            U.S. dollars (US $100) or the amounts you paid us for the Service in
            the twelve months before the claim.
          </p>
        </ProseSection>

        <ProseSection title="11. Termination">
          <p>
            You may stop using the Service at any time. We may suspend or
            terminate access if you violate these Terms or if we discontinue the
            Service. Provisions that by nature should survive (including
            ownership, disclaimers, and liability limits) will survive
            termination.
          </p>
        </ProseSection>

        <ProseSection title="12. Changes">
          <p>
            We may update these Terms. Material changes will be posted on this
            page with an updated date. Continued use after changes become
            effective constitutes acceptance.
          </p>
        </ProseSection>

        <ProseSection title="13. Contact">
          <p>
            Questions about these Terms:{" "}
            <Link href="/contact">Contact us</Link> or email{" "}
            <a href="mailto:support@desin.app">support@desin.app</a>.
          </p>
        </ProseSection>
      </ProseStack>
    </SiteShell>
  );
}
