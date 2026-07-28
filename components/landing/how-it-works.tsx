import { SectionRule } from "@/components/landing/section-rule";
import {
  IsoReveal,
  STEP_ILLUSTRATIONS,
  type HowItWorksStepId,
} from "@/components/landing/step-illustration";

const steps = [
  {
    id: "01" as HowItWorksStepId,
    title: "Ingest from any source",
    description:
      "Point desin at your website, decks, Figma, socials, and references. Everything that defines the brand comes in.",
  },
  {
    id: "02" as HowItWorksStepId,
    title: "Systemise your brand",
    description:
      "desin unifies it into one live kit — palette, typography, voice, logos, and rules your team can keep current.",
  },
  {
    id: "03" as HowItWorksStepId,
    title: "Create everywhere",
    description:
      "Agents and apps pull the same brand truth. Pages, posts, emails, and campaigns stay on-brand wherever you work.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="relative py-12 sm:py-16 md:py-24" id="how-it-works">
      <div className="sheet-pad">
        <div className="mb-12 space-y-3 md:mb-16">
          <p className="text-label text-primary">Platform</p>
          <h2 className="text-title text-balance">
            Brand infrastructure in three steps
          </h2>
          <p className="text-body max-w-xl text-pretty text-muted-foreground">
            Stop pasting guidelines into every chat. Make brand callable —
            like code.
          </p>
        </div>

        <ol className="grid gap-10 md:grid-cols-3 md:gap-8 lg:gap-12">
          {steps.map((step) => {
            const Illustration = STEP_ILLUSTRATIONS[step.id];
            return (
              <li className="flex flex-col gap-6" key={step.id}>
                <div className="overflow-hidden border border-border">
                  <IsoReveal>
                    <Illustration />
                  </IsoReveal>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-label text-primary">{step.id}</p>
                  <h3 className="text-prose text-foreground">{step.title}</h3>
                  <p className="text-body text-pretty text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      <SectionRule className="bottom-0" />
    </section>
  );
}
