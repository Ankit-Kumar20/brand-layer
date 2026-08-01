"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { IngestPanel } from "./IngestPanel";
import { McpConnectPanel } from "./McpConnectPanel";
import { ProfilePanel } from "./ProfilePanel";
import { SearchPanel } from "./SearchPanel";
import {
  loadBrandId,
  loadBrandTag,
  loadLastDocumentId,
  saveBrandId,
  saveBrandTag,
  saveLastDocumentId,
} from "@/lib/playground/storage";
import { authClient } from "@/lib/auth-client";

export type PlaygroundBrand = {
  id: string;
  name: string;
  slug: string;
  brandTag: string;
  userId: string;
};

type PlaygroundProps = {
  user: { id: string; email: string; name: string };
};

export function Playground({ user }: PlaygroundProps) {
  const [brands, setBrands] = useState<PlaygroundBrand[]>([]);
  const [brandId, setBrandId] = useState("");
  const [brandTag, setBrandTag] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [newBrandName, setNewBrandName] = useState("");
  const [pending, startTransition] = useTransition();
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);

  const selected = brands.find((b) => b.id === brandId) ?? null;

  const refreshBrands = useCallback(async () => {
    const res = await fetch("/api/brands", { credentials: "include" });
    const data = (await res.json()) as {
      brands?: PlaygroundBrand[];
      error?: string;
      detail?: string;
    };
    if (!res.ok) {
      throw new Error(data.detail || data.error || `HTTP ${res.status}`);
    }
    return data.brands ?? [];
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await refreshBrands();
        if (cancelled) return;
        setBrands(list);

        const savedBrandId = loadBrandId();
        const savedTag = loadBrandTag();
        const match =
          list.find((b) => b.id === savedBrandId) ||
          list.find((b) => b.brandTag === savedTag) ||
          list[0] ||
          null;

        if (match) {
          setBrandId(match.id);
          setBrandTag(match.brandTag);
          saveBrandId(match.id);
          saveBrandTag(match.brandTag);
        }
        setDocumentId(loadLastDocumentId());
        setReady(true);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load brands",
          );
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshBrands]);

  function selectBrand(nextId: string) {
    const brand = brands.find((b) => b.id === nextId);
    if (!brand) return;
    setBrandId(brand.id);
    setBrandTag(brand.brandTag);
    setCreatedApiKey(null);
    saveBrandId(brand.id);
    saveBrandTag(brand.brandTag);
  }

  function createBrand() {
    const name = newBrandName.trim();
    if (!name) return;
    setLoadError(null);
    setCreatedApiKey(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/brands", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ name }),
        });
        const data = (await res.json()) as {
          brand?: PlaygroundBrand;
          apiKey?: { key?: string };
          error?: string;
          detail?: string;
        };
        if (!res.ok || !data.brand) {
          setLoadError(data.detail || data.error || `HTTP ${res.status}`);
          return;
        }
        const list = await refreshBrands();
        setBrands(list);
        setBrandId(data.brand.id);
        setBrandTag(data.brand.brandTag);
        saveBrandId(data.brand.id);
        saveBrandTag(data.brand.brandTag);
        setNewBrandName("");
        if (data.apiKey?.key) setCreatedApiKey(data.apiKey.key);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Create failed");
      }
    });
  }

  function handleDocumentId(id: string) {
    setDocumentId(id);
    saveLastDocumentId(id);
  }

  async function signOut() {
    await authClient.signOut();
    window.location.href = "/";
  }

  if (!ready) {
    return (
      <div className="playground-shell">
        <div className="mx-auto max-w-3xl px-5 py-16 font-mono text-sm text-[var(--muted)]">
          Loading playground…
        </div>
      </div>
    );
  }

  return (
    <div className="playground-shell">
      <header className="border-b border-[var(--line)]">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-5 py-8 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              brand-layer
            </p>
            <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
              <span className="truncate max-w-[14rem]">{user.email}</span>
              <Link
                href="/"
                className="underline underline-offset-2 hover:text-[var(--ink)]"
              >
                Home
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="underline underline-offset-2 hover:text-[var(--ink)]"
              >
                Sign out
              </button>
            </div>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
            Brand memory playground
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-[var(--muted)]">
            Ingest markdown, PDF, JSON tokens, web URLs, or SVG logos — then
            search, answer, or load the brand profile. Keep{" "}
            <code className="font-mono text-[var(--ink)]">bun run trigger:dev</code>{" "}
            running alongside the app.
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-10 px-5 py-10 sm:px-8">
        <div className="panel space-y-4">
          <div className="space-y-1.5">
            <span className="text-sm text-[var(--muted)]">Brand / brandTag</span>
            {brands.length > 0 ? (
              <select
                value={brandId}
                onChange={(e) => selectBrand(e.target.value)}
                className="field font-mono text-sm"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.brandTag})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                No brands yet — create one below to get a brandTag.
              </p>
            )}
            {selected ? (
              <p className="font-mono text-xs text-[var(--muted)]">
                brandTag={selected.brandTag}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="block flex-1 space-y-1.5">
              <span className="text-sm text-[var(--muted)]">Create brand</span>
              <input
                type="text"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="Trybloom"
                className="field text-sm"
              />
            </label>
            <button
              type="button"
              disabled={pending || !newBrandName.trim()}
              onClick={createBrand}
              className="rounded border border-[var(--line)] px-4 py-2 text-sm text-[var(--ink)] hover:bg-[var(--bg)] disabled:opacity-50"
            >
              {pending ? "Creating…" : "Create"}
            </button>
          </div>

          {createdApiKey ? (
            <div className="space-y-1.5 rounded border border-[var(--line)] bg-[var(--bg)] p-3">
              <p className="text-sm font-medium text-[var(--ink)]">
                API key created
              </p>
              <p className="text-xs text-[var(--muted)]">
                Encrypted at rest — you can reveal it again from Connect MCP.
              </p>
              <code className="block break-all font-mono text-xs text-[var(--ink)]">
                {createdApiKey}
              </code>
            </div>
          ) : null}

          {loadError ? (
            <p className="text-sm text-red-600" role="alert">
              {loadError}
            </p>
          ) : null}
        </div>

        {brandTag ? (
          <>
            <div className="panel">
              <IngestPanel
                brandTag={brandTag}
                documentId={documentId}
                onDocumentId={handleDocumentId}
              />
            </div>

            <div className="grid gap-10 lg:grid-cols-2">
              <div className="panel">
                <SearchPanel brandTag={brandTag} />
              </div>
              <div className="panel">
                <ProfilePanel brandTag={brandTag} />
              </div>
            </div>

            <McpConnectPanel brandTag={brandTag} />
          </>
        ) : null}
      </main>
    </div>
  );
}
