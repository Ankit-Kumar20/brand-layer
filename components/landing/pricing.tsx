"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthModal } from "@/components/auth/auth-modal";
import { SectionRule } from "@/components/landing/section-rule";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Billing = "monthly" | "annual";

type Feature = {
  label: string;
  included: boolean;
};

const ANNUAL_DISCOUNT = 0.1;

const plans = [
  {
    id: "byok",
    name: "BYOK",
    tagline: "Your keys.",
    monthlyPrice: 19,
    cta: "Start free trial",
    variant: "default" as const,
    features: [
      { label: "14-day free trial", included: true },
      { label: "Generation on your keys", included: true },
      { label: "Multi-brand workspaces", included: true },
      { label: "Team seats included", included: true },
    ] satisfies Feature[],
  },
  {
    id: "starter",
    name: "Starter",
    tagline: "Get started.",
    monthlyPrice: 20,
    cta: "Get Starter",
    variant: "secondary" as const,
    features: [
      { label: "100 credits/mo", included: true },
      { label: "Multi-brand workspaces", included: true },
      { label: "Hosted generation", included: true },
      { label: "No team seats", included: false },
    ] satisfies Feature[],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Ship weekly.",
    monthlyPrice: 50,
    cta: "Get Pro",
    variant: "secondary" as const,
    features: [
      { label: "350 credits/mo", included: true },
      { label: "Multi-brand workspaces", included: true },
      { label: "Team seats included", included: true },
      { label: "Priority support", included: true },
    ] satisfies Feature[],
  },
] as const;

function FeatureIcon({ included }: { included: boolean }) {
  if (included) {
    return (
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
    );
  }

  return (
    <svg
      aria-hidden
      className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      viewBox="0 0 16 16"
    >
      <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
    </svg>
  );
}

export function Pricing() {
  const [billing, setBilling] = useState<Billing>("annual");

  return (
    <section className="relative py-12 sm:py-16 md:py-24" id="pricing">
      <div className="sheet-pad">
        <div className="mb-10 flex flex-col gap-6 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-label text-primary">Pricing</p>
            <h2 className="text-title text-balance">Simple plans</h2>
          </div>

          <div
            aria-label="Billing period"
            className="inline-flex w-fit border border-border p-0.5"
            role="group"
          >
            {(["monthly", "annual"] as const).map((option) => (
              <button
                className={cn(
                  "h-8 px-3 text-[12px] font-medium transition-colors duration-300 ease-[var(--ease-swift)]",
                  billing === option
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
                key={option}
                onClick={() => setBilling(option)}
                type="button"
              >
                {option === "monthly" ? "Monthly" : "Yearly"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 border border-border md:grid-cols-3">
          {plans.map((plan, index) => {
            const showAnnual = billing === "annual";
            const displayPrice = showAnnual
              ? Math.round(plan.monthlyPrice * (1 - ANNUAL_DISCOUNT))
              : plan.monthlyPrice;
            const isByok = plan.id === "byok";

            return (
              <div
                className={cn(
                  "flex flex-col gap-8 p-5 sm:p-6 md:p-8",
                  index < plans.length - 1 &&
                    "border-b border-border md:border-r md:border-b-0",
                )}
                key={plan.id}
              >
                <div className="flex flex-1 flex-col gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <p className="text-label text-muted-foreground">
                        {plan.name}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="font-display text-5xl tracking-[-1px] lg:text-6xl">
                          ${displayPrice}
                        </span>
                        <span className="text-body text-muted-foreground">
                          /mo
                        </span>
                        {showAnnual ? (
                          <span className="text-body text-muted-foreground line-through">
                            ${plan.monthlyPrice}
                          </span>
                        ) : null}
                      </div>
                      <p
                        className={cn(
                          "text-body",
                          showAnnual ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {isByok
                          ? showAnnual
                            ? "14-day trial · then yearly · 10% off"
                            : "14-day free trial · first brand"
                          : showAnnual
                            ? "Billed yearly · 10% off"
                            : "Billed monthly"}
                      </p>
                    </div>

                    <p className="text-body text-foreground">{plan.tagline}</p>
                  </div>

                  <ul className="flex flex-col gap-3">
                    {plan.features.map((feature) => (
                      <li
                        className={cn(
                          "text-body flex items-start gap-2.5",
                          feature.included
                            ? "text-foreground/90"
                            : "text-muted-foreground",
                        )}
                        key={feature.label}
                      >
                        <FeatureIcon included={feature.included} />
                        <span>{feature.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <AuthModal>
                  <Button
                    className="h-11 w-full font-medium"
                    variant={plan.variant}
                  >
                    {plan.cta}
                  </Button>
                </AuthModal>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-body text-muted-foreground">
          Need more volume?{" "}
          <Link
            className="text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            href="/contact"
          >
            Contact for API
          </Link>
        </p>
      </div>

      <SectionRule className="bottom-0" />
    </section>
  );
}
