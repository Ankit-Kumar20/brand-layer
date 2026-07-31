"use client";

import { Slot } from "@radix-ui/react-slot";
import { CircleNotch } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useState,
  type MouseEvent,
  type ReactElement,
} from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Logos } from "@/components/ui/logos";
import { authClient } from "@/lib/auth-client";

type AuthProvider = "google" | "github";

type AuthModalProps = {
  children: ReactElement;
};

function ProviderIcon({
  loading,
  children,
}: {
  loading: boolean;
  children: ReactElement;
}) {
  if (loading) {
    return (
      <CircleNotch
        aria-hidden
        className="size-4 animate-spin !text-primary"
      />
    );
  }

  return children;
}

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
  const [loadingProvider, setLoadingProvider] = useState<AuthProvider | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("auth") === "1") {
      queueMicrotask(() => setOpen(true));
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
      setLoadingProvider(null);
      setError(null);
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

  async function signInWithProvider(provider: AuthProvider) {
    setError(null);
    setLoadingProvider(provider);

    try {
      const next = searchParams.get("next") || "/workspace";
      const result = await authClient.signIn.social({
        provider,
        callbackURL: next,
        errorCallbackURL: `/?auth=1&next=${encodeURIComponent(next)}`,
      });
      if (result.error) {
        setError(result.error.message || `${provider} sign-in failed`);
        setLoadingProvider(null);
      }
      // On success Better Auth redirects to the provider / callbackURL.
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `${provider} sign-in failed`,
      );
      setLoadingProvider(null);
    }
  }

  const isLoading = loadingProvider !== null;

  return (
    <>
      <Slot onClick={handleTriggerClick}>{children}</Slot>

      <Dialog
        className="max-w-sm gap-4 p-5 sm:p-5"
        description="Continue with a provider to get started."
        onOpenChange={handleOpenChange}
        open={open}
        title="Sign in"
      >
        <div className="flex flex-col gap-2.5">
          <Button
            aria-busy={loadingProvider === "google"}
            className="h-10 w-full font-medium"
            disabled={isLoading}
            onClick={() => void signInWithProvider("google")}
            type="button"
            variant="secondary"
          >
            <ProviderIcon loading={loadingProvider === "google"}>
              <Logos.google className="size-4" />
            </ProviderIcon>
            Continue with Google
          </Button>

          <Button
            aria-busy={loadingProvider === "github"}
            className="h-10 w-full font-medium"
            disabled={isLoading}
            onClick={() => void signInWithProvider("github")}
            type="button"
            variant="secondary"
          >
            <ProviderIcon loading={loadingProvider === "github"}>
              <Logos.github className="size-4" />
            </ProviderIcon>
            Continue with GitHub
          </Button>

          {error ? (
            <p className="text-center text-xs text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <p className="mt-1 text-pretty text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link
              className="underline underline-offset-2 transition-colors duration-300 ease-[var(--ease-swift)] hover:text-foreground"
              href="/terms"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              className="underline underline-offset-2 transition-colors duration-300 ease-[var(--ease-swift)] hover:text-foreground"
              href="/privacy"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </Dialog>
    </>
  );
}
