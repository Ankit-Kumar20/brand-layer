"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { useBrands } from "@/components/workspace/settings/use-brands";

function ConsentContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { brands, loading: brandsLoading, error: brandsError } = useBrands();
  const [brandId, setBrandId] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const consentCode = params.get("consent_code") ?? "";
  const clientId = params.get("client_id") ?? "";
  const scope = params.get("scope") ?? "openid profile email offline_access";

  useEffect(() => {
    if (!brandId && brands[0]) {
      setBrandId(brands[0].id);
    }
  }, [brands, brandId]);

  function submit(accept: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        if (accept) {
          if (!brandId) {
            setError("Select a brand to continue.");
            return;
          }
          const brand = brands.find((b) => b.id === brandId);
          if (!brand) {
            setError("Selected brand not found.");
            return;
          }
          if (clientId) {
            const scopeRes = await fetch("/api/mcp/oauth-brand", {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                clientId,
                brandId: brand.id,
                brandTag: brand.brandTag,
              }),
            });
            if (!scopeRes.ok) {
              const data = (await scopeRes.json().catch(() => ({}))) as {
                error?: string;
                detail?: string;
              };
              throw new Error(
                data.detail || data.error || "Could not save brand selection",
              );
            }
          }
        }

        const res = await fetch("/api/auth/oauth2/consent", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            accept,
            ...(consentCode ? { consent_code: consentCode } : {}),
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          redirectURI?: string;
          error?: string;
          message?: string;
        };
        if (!res.ok) {
          throw new Error(
            data.message || data.error || `Consent failed (${res.status})`,
          );
        }
        if (data.redirectURI) {
          window.location.href = data.redirectURI;
          return;
        }
        router.push("/workspace");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Consent failed");
      }
    });
  }

  if (!consentCode && !clientId) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <h1 className="text-title">Invalid consent request</h1>
        <p className="text-body text-muted-foreground">
          Start the connection again from ChatGPT, Claude, or your MCP client.
        </p>
        <Button asChild variant="secondary">
          <Link href="/workspace">Back to workspace</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="space-y-2 text-center">
        <p className="text-label text-primary">MCP connect</p>
        <h1 className="text-title text-balance">Allow access?</h1>
        <p className="text-body text-pretty text-muted-foreground">
          An MCP client wants to read and write your brand kit
          {clientId ? (
            <>
              {" "}
              (<code className="font-mono text-xs">{clientId.slice(0, 12)}…</code>
              )
            </>
          ) : null}
          .
        </p>
      </div>

      <div className="space-y-2 rounded border border-border p-4">
        <p className="text-xs text-muted-foreground">Scopes</p>
        <p className="font-mono text-xs text-foreground">{scope}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-muted-foreground" htmlFor="brand">
          Brand for this connection
        </label>
        <select
          className="h-10 rounded bg-background-100 px-3 text-sm text-foreground outline-none disabled:opacity-50"
          disabled={brandsLoading || brands.length === 0 || pending}
          id="brand"
          onChange={(event) => setBrandId(event.target.value)}
          value={brandId}
        >
          {brands.length === 0 ? (
            <option value="">No brands — create one in workspace</option>
          ) : (
            brands.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.brandTag})
              </option>
            ))
          )}
        </select>
        {brandsError ? (
          <p className="text-xs text-red-600">{brandsError}</p>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          className="flex-1"
          disabled={pending || brands.length === 0}
          onClick={() => submit(true)}
          type="button"
        >
          {pending ? "Working…" : "Allow"}
        </Button>
        <Button
          className="flex-1"
          disabled={pending}
          onClick={() => submit(false)}
          type="button"
          variant="secondary"
        >
          Deny
        </Button>
      </div>
    </div>
  );
}

export default function OAuthConsentPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-16">
      <Suspense
        fallback={
          <p className="text-body text-muted-foreground">Loading…</p>
        }
      >
        <ConsentContent />
      </Suspense>
    </main>
  );
}
