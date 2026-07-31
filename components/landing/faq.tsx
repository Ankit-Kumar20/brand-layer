import { SectionRule } from "@/components/landing/section-rule";

const faqs = [
  {
    question: "What is desin?",
    answer:
      "desin is the brand layer for agents — a live system of your colors, voice, rules, logos, and references that any AI tool or product can call. Save the brand once; create on-brand everywhere.",
  },
  {
    question: "How does it work?",
    answer:
      "Ingest what defines your brand (site, decks, Figma, social, assets). desin systemises it into one kit. Agents and apps pull that kit via MCP or API so every output stays consistent.",
  },
  {
    question: "How is this different from a brand.md file?",
    answer:
      "A file needs pasting and goes stale. desin stays live, syncs for teams, switches multi-brand cleanly, and hosts logos and refs agents can fetch.",
  },
  {
    question: "How does pricing work?",
    answer:
      "Two plans: BYOK ($19/mo after a 14-day trial) runs generation on your keys. Pro is hosted — slide to pick monthly credits (50 to 1,000) and pay for that pack. 10% off yearly.",
  },
  {
    question: "Can I have multiple brands?",
    answer:
      "Yes. Keep as many brands as you need in one workspace — useful for agencies, portfolios, and multi-product companies.",
  },
  {
    question: "Do I need an API key for MCP?",
    answer:
      "No. Add the connector URL, sign in once in the browser, and the client keeps the session. API keys are for product integrations that call the REST API directly.",
  },
  {
    question: "Where does creation happen?",
    answer:
      "Wherever you already work. desin supplies the brand layer; Claude, Cursor, ChatGPT, or your own product does the generating.",
  },
] as const;

export function Faq() {
  return (
    <section className="relative py-12 sm:py-16 md:py-24" id="faq">
      <div className="sheet-pad">
        <div className="grid gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
          <div className="space-y-3 md:sticky md:top-28 md:self-start">
            <p className="text-label text-primary">FAQ</p>
            <h2 className="text-title text-balance">
              Frequently asked questions
            </h2>
          </div>

          <div className="flex flex-col gap-1">
            {faqs.map((faq) => (
              <details className="group" key={faq.question}>
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-3 marker:content-none sm:gap-6 [&::-webkit-details-marker]:hidden">
                  <span className="text-body text-pretty text-foreground">
                    {faq.question}
                  </span>
                  <span
                    aria-hidden
                    className="shrink-0 font-mono text-muted-foreground text-xs transition-transform duration-300 ease-[var(--ease-swift)] group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="text-body pb-3 text-pretty text-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>

      <SectionRule className="bottom-0" />
    </section>
  );
}
