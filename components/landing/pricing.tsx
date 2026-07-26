import Link from "next/link";

import { AuthModal } from "@/components/auth/auth-modal";
import { SectionRule } from "@/components/landing/section-rule";
import { Button } from "@/components/ui/button";

const included = [
  "Live brand kits (MCP + API)",
  "Multi-brand switching",
  "Team sync & permissions",
  "Hosted logos & refs",
  "Task-specific context packs",
  "One-click export prompts",
  "Up to 5 seats",
  "Email support",
] as const;

export function Pricing() {
  return (
    <section className="relative py-12 sm:py-16 md:py-24" id="pricing">
      <div className="sheet-pad">
        <div className="mb-10 space-y-3 md:mb-12">
          <p className="text-label text-primary">Pricing</p>
          <h2 className="text-title text-balance">
            Pay for brand access, not pixels
          </h2>
        </div>

        <div className="grid grid-cols-1 border border-border md:grid-cols-2">
          <div className="flex flex-col justify-between gap-8 border-b border-border p-5 sm:p-6 md:border-r md:border-b-0 md:p-8 lg:p-10">
            <div className="space-y-4">
              <p className="text-label text-muted-foreground">Workspace</p>
              <div className="space-y-2">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="font-display text-5xl tracking-[-1px] lg:text-6xl">
                    $39
                  </span>
                  <span className="text-body text-muted-foreground">/mo</span>
                </div>
                <p className="text-body text-muted-foreground">Billed monthly</p>
              </div>
              <p className="text-body max-w-sm text-pretty text-muted-foreground">
                For teams and agencies that create in AI tools weekly and need
                one source of brand truth.
              </p>
            </div>

            <div className="space-y-3">
              <AuthModal>
                <Button className="h-11 w-full font-medium">
                  Start 14-day trial
                </Button>
              </AuthModal>
              <p className="text-[12px] text-muted-foreground">
                Full MCP + API access · Cancel anytime
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center p-5 sm:p-6 md:p-8 lg:p-10">
            <p className="text-label mb-4 text-muted-foreground">Included</p>
            <ul className="flex flex-col gap-3">
              {included.map((item) => (
                <li
                  className="text-body flex items-start gap-2.5 text-foreground/90"
                  key={item}
                >
                  <svg
                    aria-hidden
                    className="mt-0.5 size-3.5 shrink-0 text-signal"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    viewBox="0 0 16 16"
                  >
                    <path
                      d="M3.5 8.5l3 3 6-6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-body text-muted-foreground">
              Embedding brand into your product?{" "}
              <Link
                className="text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
                href="#get-started"
              >
                Talk to us about API
              </Link>
            </p>
          </div>
        </div>
      </div>

      <SectionRule className="bottom-0" />
    </section>
  );
}
