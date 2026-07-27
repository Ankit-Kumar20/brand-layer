"use client";

import Link from "next/link";

import { AuthModal } from "@/components/auth/auth-modal";
import { HeroIllustration } from "@/components/landing/hero-illustration/active";
import { Integrations } from "@/components/landing/integrations";
import { Button } from "@/components/ui/button";
import { Logos } from "@/components/ui/logos";

type HeroProps = {
  signedIn?: boolean;
};

const heroCtaClassName = "h-12 px-7 text-body font-medium leading-none";

export function Hero({ signedIn = false }: HeroProps) {
  return (
    <div className="sheet-pad animate-fade-up flex flex-col justify-center gap-8 py-8 sm:gap-10 sm:py-[var(--sheet-pad)] md:gap-12">
      <div className="grid items-center gap-10 sm:gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex max-w-xl flex-col gap-6 sm:gap-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-title font-medium text-pretty">
              Live brand context for every AI tool
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {signedIn ? (
              <Button
                asChild
                className={`${heroCtaClassName} w-full sm:w-auto`}
                size="lg"
              >
                <Link href="/playground">Open playground</Link>
              </Button>
            ) : (
              <AuthModal>
                <Button
                  className={`${heroCtaClassName} w-full sm:w-auto`}
                  size="lg"
                >
                  Connect your brand
                </Button>
              </AuthModal>
            )}
            <Button
              asChild
              className={`${heroCtaClassName} w-full has-[>svg]:gap-2 has-[>svg]:px-7 sm:w-auto [&_svg]:text-black [&_svg]:group-hover/btn:text-black`}
              size="lg"
              variant="secondary"
            >
              <Link href="#connect">
                <Logos.mcp className="size-4" />
                Connect MCP
              </Link>
            </Button>
          </div>

          <Integrations />
        </div>

        <HeroIllustration />
      </div>
    </div>
  );
}
