"use client";

import { useEffect, useState, useTransition } from "react";
import { useQueryState } from "nuqs";

import { Button } from "@/components/ui/button";
import type { ApiKeyMeta } from "@/components/workspace/settings/types";
import { useBrands } from "@/components/workspace/settings/use-brands";
import { workspaceSearchParams } from "@/lib/workspace/search-params";

export function ApiKeysSection() {
  const { brands, loading: brandsLoading } = useBrands();
  const [brandId, setBrandId] = useQueryState(
    "settingsBrand",
    workspaceSearchParams.settingsBrand,
  );
  const [keys, setKeys] = useState<ApiKeyMeta[]>([]);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!brandId && brands[0]) void setBrandId(brands[0].id);
  }, [brands, brandId, setBrandId]);

  useEffect(() => {
    if (!brandId) {
      setKeys([]);
      setRevealed(null);
      return;
    }

    let cancelled = false;
    setError(null);
    setRevealed(null);

    void (async () => {
      try {
        const res = await fetch(`/api/brands/${brandId}/api-keys`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        const data = (await res.json()) as {
          keys?: ApiKeyMeta[];
          error?: string;
          detail?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.detail || data.error || `HTTP ${res.status}`);
          setKeys([]);
          return;
        }
        setKeys(data.keys ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load keys");
          setKeys([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [brandId]);

  function revealKey(keyId?: string) {
    if (!brandId) return;
    setError(null);
    startTransition(async () => {
      try {
        const params = new URLSearchParams({ reveal: "1" });
        if (keyId) params.set("keyId", keyId);
        const res = await fetch(
          `/api/brands/${brandId}/api-keys?${params}`,
          {
            credentials: "include",
            headers: { Accept: "application/json" },
          },
        );
        const data = (await res.json()) as {
          keys?: ApiKeyMeta[];
          revealed?: { key?: string } | null;
          error?: string;
          detail?: string;
        };
        if (!res.ok || !data.revealed?.key) {
          setError(data.detail || data.error || `HTTP ${res.status}`);
          return;
        }
        if (data.keys) setKeys(data.keys);
        setRevealed(data.revealed.key);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reveal key");
      }
    });
  }

  function createKey() {
    if (!brandId) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/brands/${brandId}/api-keys`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ name: "default" }),
        });
        const data = (await res.json()) as {
          key?: string;
          error?: string;
          detail?: string;
        };
        if (!res.ok || !data.key) {
          setError(data.detail || data.error || `HTTP ${res.status}`);
          return;
        }
        setRevealed(data.key);
        const listRes = await fetch(`/api/brands/${brandId}/api-keys`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        const listData = (await listRes.json()) as { keys?: ApiKeyMeta[] };
        if (listRes.ok) setKeys(listData.keys ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create key");
      }
    });
  }

  async function copyKey() {
    if (!revealed) return;
    try {
      await navigator.clipboard.writeText(revealed);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-medium tracking-tight text-foreground sm:text-2xl">
        API keys
      </h2>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Brand</span>
          <select
            className="h-10 rounded bg-background-100 px-3 text-sm text-foreground outline-none disabled:opacity-50"
            disabled={brandsLoading || brands.length === 0}
            onChange={(event) => {
              void setBrandId(event.target.value || null);
            }}
            value={brandId}
          >
            {brands.length === 0 ? (
              <option value="">No brands</option>
            ) : (
              brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))
            )}
          </select>
        </div>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-2">
          {keys.map((key) => (
            <div
              className="flex items-center justify-between gap-3 rounded bg-background-100 px-3 py-2.5"
              key={key.id}
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{key.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {key.prefix}…
                </p>
              </div>
              <Button
                disabled={pending || !key.recoverable}
                onClick={() => revealKey(key.id)}
                size="sm"
                type="button"
                variant="secondary"
              >
                Reveal
              </Button>
            </div>
          ))}
          {!brandsLoading && brandId && keys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No keys for this brand.</p>
          ) : null}
        </div>

        {revealed ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 break-all rounded bg-background-100 px-3 py-2.5 font-mono text-xs text-foreground">
              {revealed}
            </code>
            <Button onClick={() => void copyKey()} size="sm" type="button" variant="secondary">
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={pending || !brandId}
            onClick={() => revealKey()}
            type="button"
            variant="secondary"
          >
            Reveal / create
          </Button>
          <Button
            disabled={pending || !brandId}
            onClick={createKey}
            type="button"
            variant="secondary"
          >
            Generate new
          </Button>
        </div>
      </div>
    </div>
  );
}
