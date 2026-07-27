"use client";

import Link from "next/link";

import { AuthModal } from "@/components/auth/auth-modal";
import { BrandLogo } from "@/components/logo/brand-logo";
import { Logos } from "@/components/ui/logos";

const footerLinks = [
  { href: "/#how-it-works", label: "Platform" },
  { href: "/#connect", label: "Connect" },
  { href: "/#faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export function Footer() {
  return (
    <footer className="relative py-10 md:py-12">
      <div className="sheet sheet-pad grid gap-8 sm:grid-cols-2 sm:gap-12">
        <div className="space-y-3">
          <BrandLogo href={false} size="md" />
          <p className="text-body max-w-sm text-pretty text-muted-foreground">
            Live brand context for AI tools. Save once - create on-brand
            anywhere. We sell the source of truth, not the pixels.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:items-end sm:text-right">
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:justify-end">
            {footerLinks.map((link) => (
              <Link
                className="text-label text-muted-foreground transition-colors duration-300 ease-[var(--ease-swift)] hover:text-foreground"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
            <a
              aria-label="X"
              className="inline-flex items-center text-muted-foreground transition-colors duration-300 ease-[var(--ease-swift)] hover:text-foreground"
              href="https://x.com/desinapp"
              rel="noopener noreferrer"
              target="_blank"
            >
              <Logos.x className="size-3.5" />
            </a>
            <AuthModal>
              <button
                className="text-label text-muted-foreground transition-colors duration-300 ease-[var(--ease-swift)] hover:text-foreground"
                type="button"
              >
                Sign in
              </button>
            </AuthModal>
          </nav>
          <p className="text-label text-muted-foreground/70">
            © {new Date().getFullYear()} desin
          </p>
        </div>
      </div>
    </footer>
  );
}
