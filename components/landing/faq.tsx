import { SectionRule } from "@/components/landing/section-rule";

const faqs = [
  {
    question: "What is desin?",
    answer:
      "A live brand brain other AI tools pull from. You store colors, voice, rules, and refs once - Claude, Cursor, and ChatGPT use them via MCP or API. We don't generate images on our site.",
  },
  {
    question: "Is desin free?",
    answer:
      "Yes. Connect MCP or the API, save your kit, and pull live brand context into the tools you already use - no subscription.",
  },
  {
    question: "How is this different from a brand.md file?",
    answer:
      "A file needs pasting and goes stale. desin auto-pulls via MCP, syncs for teams, switches multi-brand cleanly, and hosts logos and refs agents can fetch.",
  },
  {
    question: "Do I need an API key for MCP?",
    answer:
      "No. Add the connector URL, sign in once in the browser, and the client keeps the session. API keys are for product integrations that call the REST API directly.",
  },
  {
    question: "What's the difference between MCP and the REST API?",
    answer:
      "MCP plugs brand context into chat tools like Claude, Cursor, and ChatGPT. The REST API is for your own apps and workflows that need the same kit over HTTP.",
  },
  {
    question: "Where does creation happen?",
    answer:
      "In the tools you already use. We supply context; Claude, Cursor, ChatGPT, Midjourney (via export), or your own product does the generating.",
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
