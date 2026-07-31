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

const CREDIT_PACKS = [
  {
    credits: 50,
    monthlyPrice: 12,
    estimate: "~20 generations",
  },
  {
    credits: 100,
    monthlyPrice: 20,
    estimate: "~40 generations",
  },
  {
    credits: 200,
    monthlyPrice: 35,
    estimate: "~80 generations",
  },
  {
    credits: 350,
    monthlyPrice: 50,
    estimate: "~140 generations",
  },
  {
    credits: 500,
    monthlyPrice: 70,
    estimate: "~200 generations",
  },
  {
    credits: 1000,
    monthlyPrice: 120,
    estimate: "~400 generations",
  },
] as const;

const DEFAULT_PACK_INDEX = 3;

const byokFeatures = [
  { label: "14-day free trial", included: true },
  { label: "Generation on your keys", included: true },
  { label: "Multi-brand workspaces", included: true },
  { label: "Team seats included", included: true },
] satisfies Feature[];

const proFeatures = [
  { label: "Hosted generation", included: true },
  { label: "Multi-brand workspaces", included: true },
  { label: "Team seats included", included: true },
  { label: "Priority support", included: true },
] satisfies Feature[];

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

function PriceBlock({
  monthlyPrice,
  billing,
  footnote,
}: {
  monthlyPrice: number;
  billing: Billing;
  footnote: string;
}) {
  const showAnnual = billing === "annual";
  const displayPrice = showAnnual
    ? Math.round(monthlyPrice * (1 - ANNUAL_DISCOUNT))
    : monthlyPrice;

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-display text-5xl tracking-[-1px] lg:text-6xl">
          ${displayPrice}
        </span>
        <span className="text-body text-muted-foreground">/mo</span>
        {showAnnual ? (
          <span className="text-body text-muted-foreground line-through">
            ${monthlyPrice}
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "text-body",
          showAnnual ? "text-primary" : "text-muted-foreground",
        )}
      >
        {footnote}
      </p>
    </div>
  );
}

function FeatureList({ features }: { features: Feature[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {features.map((feature) => (
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
  );
}

export function Pricing() {
  const [billing, setBilling] = useState<Billing>("annual");
  const [packIndex, setPackIndex] = useState(DEFAULT_PACK_INDEX);
  const pack = CREDIT_PACKS[packIndex] ?? CREDIT_PACKS[DEFAULT_PACK_INDEX];
  const showAnnual = billing === "annual";
  const fillPercent =
    CREDIT_PACKS.length > 1
      ? (packIndex / (CREDIT_PACKS.length - 1)) * 100
      : 0;

  return (
    <section className="relative py-12 sm:py-16 md:py-24" id="pricing">
      <div className="sheet-pad">
        <div className="mb-10 flex flex-col gap-6 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-label text-primary">Pricing</p>
            <h2 className="text-title text-balance">Two plans</h2>
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

        <div className="grid grid-cols-1 border border-border md:grid-cols-2">
          {/* BYOK */}
          <div className="flex flex-col gap-8 border-b border-border p-5 sm:p-6 md:border-r md:border-b-0 md:p-8">
            <div className="flex flex-1 flex-col gap-6">
              <div className="space-y-4">
                <p className="text-label text-muted-foreground">BYOK</p>
                <PriceBlock
                  billing={billing}
                  footnote={
                    showAnnual
                      ? "14-day trial · then yearly · 10% off"
                      : "14-day free trial · first brand"
                  }
                  monthlyPrice={19}
                />
                <p className="text-body text-foreground">Your keys.</p>
              </div>
              <FeatureList features={byokFeatures} />
            </div>

            <AuthModal>
              <Button className="h-11 w-full font-medium" variant="default">
                Start free trial
              </Button>
            </AuthModal>
          </div>

          {/* Pro */}
          <div className="flex flex-col gap-8 p-5 sm:p-6 md:p-8">
            <div className="flex flex-1 flex-col gap-6">
              <div className="space-y-4">
                <p className="text-label text-muted-foreground">Pro</p>
                <PriceBlock
                  billing={billing}
                  footnote={
                    showAnnual
                      ? "Billed yearly · 10% off"
                      : "Billed monthly"
                  }
                  monthlyPrice={pack.monthlyPrice}
                />
                <p className="text-body text-foreground">
                  Pick the credits you need.
                </p>

                <div className="relative pt-1 pb-7">
                  <div className="relative mx-2 h-5">
                    <div
                      aria-hidden
                      className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 bg-background-200"
                    />
                    <div
                      aria-hidden
                      className="absolute top-1/2 left-0 h-1.5 -translate-y-1/2 bg-primary transition-[width] duration-300 ease-[var(--ease-swift)]"
                      style={{ width: `${fillPercent}%` }}
                    />
                    <div
                      aria-hidden
                      className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded border border-border bg-sheet transition-[left] duration-300 ease-[var(--ease-swift)]"
                      style={{ left: `${fillPercent}%` }}
                    />
                    <input
                      aria-label="Credits per month"
                      aria-valuemax={CREDIT_PACKS.length - 1}
                      aria-valuemin={0}
                      aria-valuenow={packIndex}
                      aria-valuetext={`${pack.credits} credits`}
                      className="absolute inset-0 z-10 w-full cursor-pointer opacity-0"
                      max={CREDIT_PACKS.length - 1}
                      min={0}
                      onChange={(event) =>
                        setPackIndex(Number(event.target.value))
                      }
                      step={1}
                      type="range"
                      value={packIndex}
                    />
                  </div>

                  <div className="pointer-events-none absolute inset-x-2 bottom-0 h-5">
                    {CREDIT_PACKS.map((item, index) => {
                      const stop =
                        CREDIT_PACKS.length > 1
                          ? (index / (CREDIT_PACKS.length - 1)) * 100
                          : 0;
                      return (
                        <button
                          className={cn(
                            "pointer-events-auto absolute top-0 -translate-x-1/2 cursor-pointer text-label transition-colors duration-300 ease-[var(--ease-swift)]",
                            index === packIndex
                              ? "text-primary"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                          key={item.credits}
                          onClick={() => setPackIndex(index)}
                          style={{ left: `${stop}%` }}
                          type="button"
                        >
                          {item.credits >= 1000
                            ? `${item.credits / 1000}k`
                            : item.credits}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <FeatureList
                features={[
                  {
                    label: `${pack.credits.toLocaleString()} credits/mo`,
                    included: true,
                  },
                  ...proFeatures,
                ]}
              />
            </div>

            <AuthModal>
              <Button className="h-11 w-full font-medium" variant="secondary">
                Get Pro
              </Button>
            </AuthModal>
          </div>
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
