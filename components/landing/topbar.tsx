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
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  userImage?: string | null;
  hideBrandName?: boolean;
  actionNav?: "playground" | "profile";
  hideNav?: boolean;
};

const navLinks = [
  { href: "/#how-it-works", label: "Platform" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#connect", label: "Connect" },
  { href: "/#faq", label: "FAQ" },
] as const;

export function TopBar({
  signedIn = false,
  user,
  userImage,
  hideBrandName = false,
  actionNav = "playground",
  hideNav = false,
}: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const avatarSrc = user?.image || userImage;

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
          <BrandLogo
            href={signedIn ? "/workspace" : "/"}
            markOnly={hideBrandName}
            size="md"
          />

          {!hideNav && (
            <nav className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 md:flex">
              {navLinks.map((link) => (
                <Button
                  asChild
                  className="text-body font-medium text-muted-foreground transition-colors duration-300 ease-[var(--ease-swift)] hover:bg-background-100 hover:text-foreground"
                  key={link.href}
                  size="sm"
                  variant="ghost"
                >
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
            </nav>
          )}

          <div className="flex shrink-0 items-center gap-2">
            {signedIn || user ? (
              actionNav === "profile" ? (
                <Button
                  asChild
                  size="icon"
                  variant="ghost"
                  className="size-8 md:size-9 shrink-0 overflow-hidden rounded border-none bg-background-100 p-0 text-foreground transition-colors duration-200 hover:bg-background-200 focus-visible:ring-primary"
                  title={user?.name || user?.email || "Profile"}
                >
                  <Link href="/app/profile">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={user?.name || "User profile"}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center">
                        <svg
                          aria-hidden
                          className="size-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" />
                          <path d="M4 20.4c0-3.5 3.6-5.9 8-5.9s8 2.4 8 5.9V21H4v-.6Z" />
                        </svg>
                      </span>
                    )}
                  </Link>
                </Button>
              ) : (
                <Button asChild size="sm">
                  <Link href="/workspace">Workspace</Link>
                </Button>
              )
            ) : (
              <AuthModal>
                <Button size="sm">Sign in</Button>
              </AuthModal>
            )}

            {!hideNav && (
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
            )}
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
          <ul className="sheet-pad flex flex-col items-center gap-2 py-3">
            {navLinks.map((link) => (
              <li className="w-full text-center" key={link.href}>
                <Button
                  asChild
                  className="w-full justify-center text-body font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setMenuOpen(false)}
                  size="sm"
                  variant="ghost"
                >
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              </li>
            ))}
            {signedIn && (
              <li className="w-full border-t border-border/50 pt-2 text-center">
                <Button
                  asChild
                  className="w-full justify-center"
                  onClick={() => setMenuOpen(false)}
                  size="sm"
                >
                  <Link
                    href={
                      actionNav === "profile" ? "/app/profile" : "/workspace"
                    }
                  >
                    {actionNav === "profile" ? "Profile" : "Workspace"}
                  </Link>
                </Button>
              </li>
            )}
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
