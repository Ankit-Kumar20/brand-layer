"use client";

import { Slot } from "@radix-ui/react-slot";
import {
  useState,
  type FormEvent,
  type MouseEvent,
  type ReactElement,
} from "react";

import { BrandLogo } from "@/components/logo/brand-logo";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Logos } from "@/components/ui/logos";

const fieldClassName =
  "rounded-[2px] border border-border bg-background-50 px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-[3px] focus:ring-ring/50";

type AuthModalProps = {
  children: ReactElement;
};

export function AuthModal({ children }: AuthModalProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setEmail("");
    }
  }

  function handleTriggerClick(event: MouseEvent) {
    const childProps = children.props as {
      onClick?: (event: MouseEvent) => void;
    };
    childProps.onClick?.(event);
    if (!event.defaultPrevented) {
      handleOpenChange(true);
    }
  }

  function onContinueWithGoogle() {
    // Google OAuth will be wired once the backend provider is configured.
  }

  function onContinueWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Email auth will be wired once the backend flow is ready.
  }

  return (
    <>
      <Slot onClick={handleTriggerClick}>{children}</Slot>

      <Dialog
        description="Sign in or create an account to continue."
        onOpenChange={handleOpenChange}
        open={open}
        title="Welcome to desin"
      >
        <div className="flex flex-col gap-4">
          <BrandLogo className="mb-1 self-start" href={false} markOnly size="lg" />
          <Button
            className="h-11 w-full border-border bg-white font-medium text-black hover:bg-background-100 hover:text-black"
            onClick={onContinueWithGoogle}
            type="button"
            variant="outline"
          >
            <Logos.google className="size-4" />
            Continue with Google
          </Button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono text-[11px] text-muted-foreground tracking-[0.14em]">
              OR
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form className="flex flex-col gap-3" onSubmit={onContinueWithEmail}>
            <label className="flex flex-col gap-1.5 text-sm">
              Email
              <input
                autoComplete="email"
                className={fieldClassName}
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                required
                type="email"
                value={email}
              />
            </label>
            <Button
              className="h-11 w-full bg-transparent font-medium hover:bg-background-100"
              type="submit"
              variant="outline"
            >
              Continue with email
            </Button>
          </form>
        </div>
      </Dialog>
    </>
  );
}
