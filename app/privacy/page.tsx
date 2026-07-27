import type { Metadata } from "next";
import Link from "next/link";

import { ProseSection, ProseStack } from "@/components/site/prose-sections";
import { SiteShell } from "@/components/site/site-shell";

export const metadata: Metadata = {
  title: "Privacy Policy - desin",
  description:
    "How desin collects, uses, and protects personal and brand data.",
};

const UPDATED = "July 26, 2026";

export default function PrivacyPage() {
  return (
    <SiteShell
      description={`Last updated ${UPDATED}. This policy explains what we collect and how we use it.`}
      eyebrow="Legal"
      title="Privacy Policy"
    >
      <ProseStack>
        <ProseSection title="1. Who we are">
          <p>
            desin (&quot;desin,&quot; &quot;we,&quot; &quot;us&quot;) operates
            desin.ai — a service that stores live brand context and serves it to
            AI tools via MCP and API. This Privacy Policy describes how we handle
            personal information and brand data when you use the Service.
          </p>
          <p>
            Questions: <a href="mailto:support@desin.app">support@desin.app</a> or our{" "}
            <Link href="/contact">contact page</Link>.
          </p>
        </ProseSection>

        <ProseSection title="2. Information we collect">
          <p>
            <strong>Account information.</strong> When you sign in we may
            collect your name, email address, profile image, and authentication
            identifiers from you or from providers such as Google or GitHub.
          </p>
          <p>
            <strong>Brand and workspace content.</strong> Colors, voice rules,
            logos, references, and other materials you save in desin
            (&quot;Brand Data&quot;). This may include personal data if you
            choose to include it.
          </p>
          <p>
            <strong>Usage and technical data.</strong> IP address, user agent,
            device and browser type, timestamps, pages or API/MCP requests, and
            similar diagnostics needed to operate and secure the Service.
          </p>
          <p>
            <strong>Session cookies.</strong> We use cookies and similar
            technologies for authentication and session continuity (including
            after you connect an MCP client in the browser).
          </p>
        </ProseSection>

        <ProseSection title="3. How we use information">
          <p>We use information to:</p>
          <ul>
            <li>Provide, maintain, and secure the Service</li>
            <li>
              Authenticate you and authorize MCP / API access to your Brand Data
            </li>
            <li>Serve brand context to tools and apps you connect</li>
            <li>Communicate about the Service, security, and material changes</li>
            <li>Debug, monitor abuse, and improve reliability and product</li>
            <li>Comply with law and enforce our Terms</li>
          </ul>
          <p>
            We do not sell your personal information. We do not use Brand Data to
            train foundation models for unrelated third parties.
          </p>
        </ProseSection>

        <ProseSection title="4. How we share information">
          <p>We may share information with:</p>
          <ul>
            <li>
              <strong>Service providers</strong> who host infrastructure,
              authentication, email, or analytics on our behalf under
              confidentiality obligations
            </li>
            <li>
              <strong>Connected tools</strong> you authorize (for example Claude,
              Cursor, or ChatGPT via MCP) — they receive Brand Data you choose to
              expose through those connections
            </li>
            <li>
              <strong>Legal and safety</strong> recipients when required by law,
              or to protect rights, users, or the Service
            </li>
            <li>
              <strong>Business transfers</strong> in connection with a merger,
              acquisition, or asset sale, subject to appropriate protections
            </li>
          </ul>
        </ProseSection>

        <ProseSection title="5. Retention">
          <p>
            We retain account and Brand Data while your account is active and as
            needed to provide the Service. We may retain limited logs and records
            for security, legal, and operational purposes for a reasonable period
            after deletion.
          </p>
        </ProseSection>

        <ProseSection title="6. Security">
          <p>
            We use administrative, technical, and organizational measures
            appropriate to the nature of the data — including encrypted transport
            (HTTPS) and access controls. No method of transmission or storage is
            perfectly secure; please protect your account credentials.
          </p>
        </ProseSection>

        <ProseSection title="7. Your choices and rights">
          <p>
            Depending on your location, you may have rights to access, correct,
            delete, or export personal information, or to object to or restrict
            certain processing. To make a request, email{" "}
            <a href="mailto:support@desin.app">support@desin.app</a>.
          </p>
          <p>
            You can disconnect third-party auth providers and stop using MCP
            clients at any time. To request account deletion, contact us; we will
            delete or anonymize personal data except where retention is required
            by law.
          </p>
        </ProseSection>

        <ProseSection title="8. Children">
          <p>
            The Service is not directed to children under 16. We do not knowingly
            collect personal information from children. If you believe a child
            has provided us data, contact us and we will take appropriate steps.
          </p>
        </ProseSection>

        <ProseSection title="9. International transfers">
          <p>
            We may process information in the United States and other countries
            where we or our providers operate. Where required, we use appropriate
            safeguards for cross-border transfers.
          </p>
        </ProseSection>

        <ProseSection title="10. Changes">
          <p>
            We may update this Policy. Material changes will be posted here with
            a new &quot;Last updated&quot; date. Continued use of the Service
            after changes take effect means you acknowledge the updated Policy.
          </p>
        </ProseSection>

        <ProseSection title="11. Contact">
          <p>
            Privacy inquiries:{" "}
            <a href="mailto:support@desin.app">support@desin.app</a> ·{" "}
            <Link href="/contact">Contact</Link> ·{" "}
            <Link href="/terms">Terms of Service</Link>
          </p>
        </ProseSection>
      </ProseStack>
    </SiteShell>
  );
}
