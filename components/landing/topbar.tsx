"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AuthModal } from "@/components/auth/auth-modal";
import { BrandLogo } from "@/components/logo/brand-logo";
import { SectionRule } from "@/components/landing/section-rule";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TopBarProps = {
  signedIn?: boolean;
};

const navLinks = [
  { href: "/#how-it-works", label: "Platform" },
  { href: "/#connect", label: "Connect" },
  { href: "/#faq", label: "FAQ" },
] as const;

export function TopBar({ signedIn = false }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    function onResize() {
      if (window.matchMedia("(min-width: 768px)").matches) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-sheet/90 backdrop-blur-md">
      <div className="sheet relative">
        <div className="sheet-pad relative flex h-14 items-center justify-between gap-3 md:h-16">
          <BrandLogo size="md" />

          <nav className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                className="text-body font-medium text-muted-foreground transition-colors duration-300 ease-[var(--ease-swift)] hover:text-foreground"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {signedIn ? (
              <Button asChild size="sm">
                <Link href="/playground">Playground</Link>
              </Button>
            ) : (
              <AuthModal>
                <Button size="sm">Sign in</Button>
              </AuthModal>
            )}

            <button
              aria-controls="mobile-nav"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="inline-flex size-8 items-center justify-center text-foreground transition-colors duration-300 ease-[var(--ease-swift)] hover:text-muted-foreground md:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              type="button"
            >
              <MenuIcon open={menuOpen} />
            </button>
          </div>
          <SectionRule animate className="bottom-0" />
        </div>

        <nav
          className={cn(
            "absolute inset-x-0 top-full z-50 border-b border-border bg-sheet/95 shadow-[0_12px_24px_-16px_rgba(0,0,0,0.18)] backdrop-blur-md md:hidden",
            menuOpen ? "block" : "hidden",
          )}
          id="mobile-nav"
        >
          <ul className="sheet-pad flex flex-col py-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  className="flex min-h-11 items-center text-body font-medium text-muted-foreground transition-colors duration-300 ease-[var(--ease-swift)] hover:text-foreground"
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.75"
      viewBox="0 0 16 16"
    >
      {open ? (
        <>
          <path d="M3.5 3.5 12.5 12.5" />
          <path d="M12.5 3.5 3.5 12.5" />
        </>
      ) : (
        <>
          <path d="M2.5 4.5h11" />
          <path d="M2.5 8h11" />
          <path d="M2.5 11.5h11" />
        </>
      )}
    </svg>
  );
}
