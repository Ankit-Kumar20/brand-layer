"use client";

import { Slot } from "@radix-ui/react-slot";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useState,
  type FormEvent,
  type MouseEvent,
  type ReactElement,
} from "react";

import { BrandLogo } from "@/components/logo/brand-logo";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Logos } from "@/components/ui/logos";
import { authClient } from "@/lib/auth-client";

const fieldClassName =
  "rounded-[2px] border border-border bg-background-50 px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-[3px] focus:ring-ring/50";

type AuthModalProps = {
  children: ReactElement;
};

export function AuthModal({ children }: AuthModalProps) {
  return (
    <Suspense fallback={<Slot>{children}</Slot>}>
      <AuthModalInner>{children}</AuthModalInner>
    </Suspense>
  );
}

function AuthModalInner({ children }: AuthModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (searchParams.get("auth") === "1") {
      setOpen(true);
    }
  }, [searchParams]);

  function clearAuthQuery() {
    if (searchParams.get("auth") !== "1") return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("auth");
    const qs = next.toString();
    const path = window.location.pathname;
    router.replace(qs ? `${path}?${qs}` : path);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setEmail("");
      setPassword("");
      setName("");
      setError(null);
      setMode("sign-in");
      clearAuthQuery();
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

  async function onContinueWithGoogle() {
    setError(null);
    setPending(true);
    try {
      const next = searchParams.get("next") || "/playground";
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: next,
        errorCallbackURL: `/?auth=1&next=${encodeURIComponent(next)}`,
      });
      if (result.error) {
        setError(result.error.message || "Google sign-in failed");
        setPending(false);
      }
      // On success Better Auth redirects to Google / callbackURL.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
      setPending(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      if (mode === "sign-up") {
        const result = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.trim().split("@")[0] || "User",
        });
        if (result.error) {
          setError(result.error.message || "Sign up failed");
          return;
        }
      } else {
        const result = await authClient.signIn.email({
          email: email.trim(),
          password,
        });
        if (result.error) {
          setError(result.error.message || "Sign in failed");
          return;
        }
      }

      const next = searchParams.get("next") || "/playground";
      setOpen(false);
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setPending(false);
    }
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
            disabled={pending}
            onClick={onContinueWithGoogle}
            type="button"
            variant="outline"
          >
            <Logos.google className="size-4" />
            {pending ? "Redirecting…" : "Continue with Google"}
          </Button>

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono text-[11px] text-muted-foreground tracking-[0.14em]">
              OR
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form className="flex flex-col gap-3" onSubmit={onSubmit}>
            {mode === "sign-up" ? (
              <label className="flex flex-col gap-1.5 text-sm">
                Name
                <input
                  autoComplete="name"
                  className={fieldClassName}
                  name="name"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Alex"
                  type="text"
                  value={name}
                />
              </label>
            ) : null}
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
            <label className="flex flex-col gap-1.5 text-sm">
              Password
              <input
                autoComplete={
                  mode === "sign-up" ? "new-password" : "current-password"
                }
                className={fieldClassName}
                minLength={8}
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                type="password"
                value={password}
              />
            </label>
            <Button
              className="h-11 w-full bg-transparent font-medium hover:bg-background-100"
              disabled={pending}
              type="submit"
              variant="outline"
            >
              {pending
                ? "Please wait…"
                : mode === "sign-up"
                  ? "Create account"
                  : "Sign in with email"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "sign-in" ? (
              <>
                No account?{" "}
                <button
                  className="underline underline-offset-2 hover:text-foreground"
                  onClick={() => {
                    setMode("sign-up");
                    setError(null);
                  }}
                  type="button"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  className="underline underline-offset-2 hover:text-foreground"
                  onClick={() => {
                    setMode("sign-in");
                    setError(null);
                  }}
                  type="button"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </Dialog>
    </>
  );
}
