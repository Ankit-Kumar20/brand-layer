"use client";

import Link from "next/link";

import { AuthModal } from "@/components/auth/auth-modal";
import { HeroIllustration } from "@/components/landing/hero-illustration/active";
import { Integrations } from "@/components/landing/integrations";
import { Button } from "@/components/ui/button";

type HeroProps = {
  signedIn?: boolean;
};

const heroCtaClassName = "h-12 px-7 text-body font-medium leading-none";

export function Hero({ signedIn = false }: HeroProps) {
  return (
    <div className="sheet-pad animate-fade-up flex flex-col justify-center gap-8 py-8 sm:gap-10 sm:py-[var(--sheet-pad)] md:gap-12">
      <div className="grid items-center gap-10 sm:gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex max-w-xl flex-col gap-6 sm:gap-8">
          <div className="flex flex-col gap-4">
            <h1 className="text-title font-medium text-pretty">
              Create on-brand images, posts, and campaigns
            </h1>
            <p className="text-prose text-pretty text-foreground/80">
              Set up your brand once. Everything you make looks like you. In
              chat, or from your own AI tools.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {signedIn ? (
              <Button
                asChild
                className={`${heroCtaClassName} w-full sm:w-auto`}
                size="lg"
              >
                <Link href="/playground">Open workspace</Link>
              </Button>
            ) : (
              <AuthModal>
                <Button
                  className={`${heroCtaClassName} w-full sm:w-auto`}
                  size="lg"
                >
                  Get started
                </Button>
              </AuthModal>
            )}
            <Button
              asChild
              className={`${heroCtaClassName} w-full sm:w-auto`}
              size="lg"
              variant="secondary"
            >
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </div>

          <Integrations />
        </div>

        <HeroIllustration />
      </div>
    </div>
  );
}
