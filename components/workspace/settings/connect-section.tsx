"use client";

import { useEffect, useState, useTransition } from "react";
import { useQueryStates } from "nuqs";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBrands } from "@/components/workspace/settings/use-brands";
import { workspaceSearchParams } from "@/lib/workspace/search-params";

function resolveMcpUrl() {
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:3000/api/mcp";
  }
  return "https://desin.ai/api/mcp";
}

function sharedConfig(url: string, apiKey: string) {
  return `{
  "mcpServers": {
    "desin": {
      "url": "${url}",
      "headers": {
        "Authorization": "Bearer ${apiKey || "sm_…"}"
      }
    }
  }
}`;
}

function claudeDesktopConfig(url: string, apiKey: string) {
  const key = apiKey || "sm_…";
  return `{
  "mcpServers": {
    "desin": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "${url}",
        "--header",
        "Authorization:Bearer ${key}"
      ]
    }
  }
}`;
}

function chatgptSteps(url: string) {
  return `1. Open ChatGPT (web) → Settings → Security and login → enable Developer mode.
2. Go to ChatGPT Plugins / Apps → Create (Developer mode).
3. Paste MCP URL:
   ${url}
4. Authentication: OAuth (not API key). Sign in to desin and pick a brand if prompted.
5. In a chat, choose Developer mode and ask to call whoAmI or brandContext.

Docs: https://developers.openai.com/api/docs/guides/developer-mode`;
}

export function ConnectSection() {
  const { brands, loading: brandsLoading } = useBrands();
  const [{ settingsBrand: brandId, mcp: client }, setParams] = useQueryStates({
    settingsBrand: workspaceSearchParams.settingsBrand,
    mcp: workspaceSearchParams.mcp,
  });
  const [mcpUrl] = useState(resolveMcpUrl);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState<"url" | "config" | "key" | null>(null);

  const brand = brands.find((item) => item.id === brandId) ?? brands[0];

  useEffect(() => {
    if (!brandId && brands[0]) {
      void setParams({ settingsBrand: brands[0].id });
    }
  }, [brands, brandId, setParams]);

  useEffect(() => {
    setApiKey(null);
    setError(null);
  }, [brandId]);

  function revealKey(forceNew = false) {
    if (!brandId) return;
    setError(null);
    startTransition(async () => {
      try {
        if (forceNew) {
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
          setApiKey(data.key);
          return;
        }

        const res = await fetch(
          `/api/brands/${brandId}/api-keys?reveal=1`,
          {
            credentials: "include",
            headers: { Accept: "application/json" },
          },
        );
        const data = (await res.json()) as {
          revealed?: { key?: string } | null;
          error?: string;
          detail?: string;
        };
        if (!res.ok || !data.revealed?.key) {
          setError(data.detail || data.error || `HTTP ${res.status}`);
          return;
        }
        setApiKey(data.revealed.key);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load key");
      }
    });
  }

  async function copyText(value: string, kind: "url" | "config" | "key") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  }

  const config =
    client === "claude"
      ? claudeDesktopConfig(mcpUrl, apiKey ?? "")
      : client === "chatgpt"
        ? chatgptSteps(mcpUrl)
        : sharedConfig(mcpUrl, apiKey ?? "");

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-medium tracking-tight text-foreground sm:text-2xl">
        Connect
      </h2>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Brand</span>
          <select
            className="h-10 rounded bg-background-100 px-3 text-sm text-foreground outline-none disabled:opacity-50"
            disabled={brandsLoading || brands.length === 0}
            onChange={(event) => {
              void setParams({ settingsBrand: event.target.value || null });
            }}
            value={brand?.id ?? ""}
          >
            {brands.length === 0 ? (
              <option value="">No brands</option>
            ) : (
              brands.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={pending || !brand}
              onClick={() => revealKey(false)}
              type="button"
              variant="secondary"
            >
              {pending ? "Loading…" : apiKey ? "Reveal key" : "Reveal / create key"}
            </Button>
            {apiKey ? (
              <Button
                disabled={pending || !brand}
                onClick={() => revealKey(true)}
                type="button"
                variant="secondary"
              >
                Generate new
              </Button>
            ) : null}
          </div>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          {apiKey ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="min-w-0 flex-1 break-all rounded bg-background-100 px-3 py-2.5 font-mono text-xs text-foreground">
                {apiKey}
              </code>
              <Button
                onClick={() => void copyText(apiKey, "key")}
                size="sm"
                type="button"
                variant="secondary"
              >
                {copied === "key" ? "Copied" : "Copy"}
              </Button>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">MCP URL</span>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 truncate rounded bg-background-100 px-3 py-2.5 font-mono text-xs text-foreground">
              {mcpUrl}
            </code>
            <Button
              onClick={() => void copyText(mcpUrl, "url")}
              size="sm"
              type="button"
              variant="secondary"
            >
              {copied === "url" ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>

        <div className="flex gap-1">
          {(
            [
              { id: "cursor", label: "Cursor" },
              { id: "claude", label: "Claude" },
              { id: "chatgpt", label: "ChatGPT" },
            ] as const
          ).map((item) => (
            <button
              className={cn(
                "h-8 rounded px-3 text-sm transition-colors",
                client === item.id
                  ? "bg-background-100 text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              key={item.id}
              onClick={() => {
                void setParams({ mcp: item.id });
              }}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {client === "claude"
                ? "Claude Desktop config"
                : client === "chatgpt"
                  ? "ChatGPT setup"
                  : "mcp.json"}
            </span>
            <Button
              onClick={() => void copyText(config, "config")}
              size="sm"
              type="button"
              variant="secondary"
            >
              {copied === "config" ? "Copied" : "Copy"}
            </Button>
          </div>
          <pre className="overflow-x-auto rounded bg-background-100 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-foreground">
            {config}
          </pre>
        </div>
      </div>
    </div>
  );
}
