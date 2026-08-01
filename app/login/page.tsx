"use client";

import { CircleNotch } from "@phosphor-icons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Logos } from "@/components/ui/logos";
import { authClient } from "@/lib/auth-client";

type AuthProvider = "google" | "github";

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

function LoginForm() {
  const searchParams = useSearchParams();
  const [loadingProvider, setLoadingProvider] = useState<AuthProvider | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const isOauthResume = Boolean(searchParams.get("client_id"));

  async function signInWithProvider(provider: AuthProvider) {
    setError(null);
    setLoadingProvider(provider);
    try {
      // Stay on /login so Better Auth's MCP hook can resume authorize after
      // the session cookie is set (oidc_login_prompt cookie).
      const callbackURL = isOauthResume
        ? `/login?${searchParams.toString()}`
        : searchParams.get("next") || "/workspace";

      const result = await authClient.signIn.social({
        provider,
        callbackURL,
        errorCallbackURL: `/login?${searchParams.toString()}`,
      });
      if (result.error) {
        setError(result.error.message || `${provider} sign-in failed`);
        setLoadingProvider(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `${provider} sign-in failed`,
      );
      setLoadingProvider(null);
    }
  }

  const isLoading = loadingProvider !== null;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <div className="space-y-2 text-center">
        <p className="text-label text-primary">desin</p>
        <h1 className="text-title text-balance">Sign in</h1>
        <p className="text-body text-pretty text-muted-foreground">
          {isOauthResume
            ? "Sign in to connect your brand kit to this MCP client."
            : "Continue with a provider to open your workspace."}
        </p>
      </div>

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
      </div>

      <p className="text-pretty text-center text-xs text-muted-foreground">
        By continuing, you agree to our{" "}
        <Link className="underline underline-offset-2" href="/terms">
          Terms
        </Link>{" "}
        and{" "}
        <Link className="underline underline-offset-2" href="/privacy">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-16">
      <Suspense
        fallback={
          <p className="text-body text-muted-foreground">Loading…</p>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
