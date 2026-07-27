import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Logos } from "@/components/ui/logos";
import { SiteShell } from "@/components/site/site-shell";

export const metadata: Metadata = {
  title: "Contact - desin",
  description: "Get in touch with the desin team for support, privacy, and product questions.",
};

const channels: {
  label: string;
  detail: string;
  href: string;
  cta: string;
  mark?: ReactNode;
}[] = [
  {
    label: "Support",
    detail: "Help with accounts, MCP setup, API access, or privacy requests.",
    href: "mailto:support@desin.app",
    cta: "support@desin.app",
  },
  {
    label: "Feedback",
    detail: "Product ideas, partnerships, and everything else.",
    href: "mailto:feedback@desin.app",
    cta: "feedback@desin.app",
  },
  {
    label: "X",
    detail: "Updates, shipping notes, and public conversation.",
    href: "https://x.com/desinapp",
    cta: "@desinapp",
    mark: <Logos.x aria-hidden className="size-3.5" />,
  },
];

export default function ContactPage() {
  return (
    <SiteShell
      description="We read every message. Reach us by email."
      eyebrow="Support"
      title="Contact us"
    >
      <div className="flex flex-col gap-10">
        {channels.map((channel) => (
          <div
            className="grid gap-3 sm:grid-cols-[140px_1fr] sm:gap-8"
            key={channel.label}
          >
            {channel.mark ? (
              <p
                className="flex h-[1.5em] items-center text-label text-primary"
                title={channel.label}
              >
                <span className="sr-only">{channel.label}</span>
                {channel.mark}
              </p>
            ) : (
              <p className="text-label text-primary">{channel.label}</p>
            )}
            <div className="flex flex-col gap-3">
              <p className="text-body text-pretty text-muted-foreground">
                {channel.detail}
              </p>
              <div>
                <Button asChild size="sm" variant="secondary">
                  <a
                    href={channel.href}
                    {...(channel.href.startsWith("http")
                      ? { rel: "noopener noreferrer", target: "_blank" }
                      : {})}
                  >
                    {channel.cta}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        ))}

        <div className="grid gap-3 sm:grid-cols-[140px_1fr] sm:gap-8">
          <p className="text-label text-primary">Policies</p>
          <p className="text-body text-pretty text-muted-foreground">
            Review our{" "}
            <Link
              className="text-foreground underline underline-offset-2 transition-colors duration-300 ease-[var(--ease-swift)] hover:text-primary"
              href="/privacy"
            >
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link
              className="text-foreground underline underline-offset-2 transition-colors duration-300 ease-[var(--ease-swift)] hover:text-primary"
              href="/terms"
            >
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </div>
    </SiteShell>
  );
}
