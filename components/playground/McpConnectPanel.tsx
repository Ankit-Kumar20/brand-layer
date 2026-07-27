"use client";

import { useState, useTransition } from "react";

type ClientId = "claude" | "cursor";

const clients: {
  id: ClientId;
  label: string;
  steps: { title: string; body: string }[];
}[] = [
  {
    id: "claude",
    label: "Claude",
    steps: [
      {
        title: "Generate a brand API key",
        body: "Use the button below to mint a brand-scoped key (sm_…) for this containerTag.",
      },
      {
        title: "Add a custom connector",
        body: "Claude → Settings → Connectors → Add custom connector. Paste the MCP URL below.",
      },
      {
        title: "Attach your API key",
        body: "Set Authorization: Bearer sm_…. Claude can then call brandContext / getBrandProfile.",
      },
    ],
  },
  {
    id: "cursor",
    label: "Cursor",
    steps: [
      {
        title: "Generate a brand API key",
        body: "Use the button below to mint a brand-scoped key (sm_…) for this containerTag.",
      },
      {
        title: "Open MCP settings",
        body: "Cursor → Settings → MCP, or edit mcp.json.",
      },
      {
        title: "Paste URL + Bearer header",
        body: "Copy the mcp.json snippet (includes your key) or set Authorization manually.",
      },
    ],
  },
];

function cursorConfig(url: string, apiKey: string) {
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

function resolveMcpUrl() {
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:3000/api/mcp";
  }
  return "https://desin.ai/api/mcp";
}

export function McpConnectPanel({ containerTag }: { containerTag: string }) {
  const [active, setActive] = useState<ClientId>("cursor");
  const [copied, setCopied] = useState<"url" | "config" | "key" | null>(null);
  const [mcpUrl] = useState(resolveMcpUrl);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [keyMeta, setKeyMeta] = useState<{
    brandId: string;
    containerTag: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const client = clients.find((c) => c.id === active) ?? clients[0];
  const configSnippet =
    active === "cursor" ? cursorConfig(mcpUrl, apiKey ?? "") : undefined;

  async function copyText(value: string, kind: "url" | "config" | "key") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  }

  function generateKey() {
    if (!containerTag.trim()) {
      setError("Set a containerTag above first.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/playground/api-keys", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ containerTag: containerTag.trim() }),
        });
        const data = (await res.json()) as {
          key?: string;
          brandId?: string;
          containerTag?: string;
          error?: string;
          detail?: string;
        };
        if (!res.ok || !data.key) {
          setError(data.detail || data.error || `HTTP ${res.status}`);
          return;
        }
        setApiKey(data.key);
        setKeyMeta({
          brandId: data.brandId ?? "",
          containerTag: data.containerTag ?? containerTag.trim(),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to mint key");
      }
    });
  }

  return (
    <div className="panel space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
          Connect MCP
        </h2>
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          Wire this brand into Claude or Cursor with a brand API key.
          {containerTag.trim() ? (
            <>
              {" "}
              Current tag:{" "}
              <code className="font-mono text-[var(--ink)]">{containerTag}</code>
            </>
          ) : null}
        </p>
      </div>

      <div className="space-y-3 rounded border border-[var(--line)] bg-[var(--bg)] p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--ink)]">API key</p>
            <p className="text-xs text-[var(--muted)]">
              Brand-scoped · shown once · store it before leaving this page
            </p>
          </div>
          <button
            type="button"
            disabled={pending || !containerTag.trim()}
            onClick={generateKey}
            className="rounded border border-[var(--line)] bg-[var(--sheet)] px-3 py-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--bg)] disabled:opacity-50"
          >
            {pending ? "Generating…" : apiKey ? "Generate new key" : "Generate API key"}
          </button>
        </div>

        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : null}

        {apiKey ? (
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="field min-w-0 flex-1 break-all font-mono text-xs">
                {apiKey}
              </code>
              <button
                type="button"
                onClick={() => copyText(apiKey, "key")}
                className="rounded border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink)] hover:bg-[var(--sheet)]"
              >
                {copied === "key" ? "Copied" : "Copy key"}
              </button>
            </div>
            {keyMeta ? (
              <p className="font-mono text-[11px] text-[var(--muted)]">
                brandId={keyMeta.brandId} · containerTag={keyMeta.containerTag}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">
            No key yet. Generate one to fill the Cursor config below.
          </p>
        )}
      </div>

      <div
        className="flex flex-wrap gap-2 border-b border-[var(--line)] pb-3"
        role="tablist"
        aria-label="MCP client"
      >
        {clients.map((c) => {
          const selected = c.id === active;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(c.id)}
              className={
                selected
                  ? "rounded px-3 py-1.5 text-sm font-medium bg-[var(--ink)] text-[var(--sheet)]"
                  : "rounded px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--ink)]"
              }
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <ol className="space-y-5">
        {client.steps.map((step, index) => (
          <li key={step.title} className="space-y-1">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
              {String(index + 1).padStart(2, "0")}
            </p>
            <p className="text-sm font-medium text-[var(--ink)]">{step.title}</p>
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              {step.body}
            </p>
          </li>
        ))}
      </ol>

      <div className="space-y-2">
        <p className="text-sm text-[var(--muted)]">Connector URL</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="field min-w-0 flex-1 truncate font-mono text-xs">
            {mcpUrl}
          </code>
          <button
            type="button"
            onClick={() => copyText(mcpUrl, "url")}
            className="rounded border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink)] hover:bg-[var(--bg)]"
          >
            {copied === "url" ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {configSnippet ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-[var(--muted)]">mcp.json</p>
            <button
              type="button"
              onClick={() => copyText(configSnippet, "config")}
              className="rounded border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--ink)] hover:bg-[var(--bg)]"
            >
              {copied === "config" ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="overflow-x-auto rounded border border-[var(--line)] bg-[var(--bg)] p-3 font-mono text-[11px] leading-relaxed text-[var(--ink)]">
            {configSnippet}
          </pre>
        </div>
      ) : (
        <p className="text-sm text-[var(--muted)]">
          Header:{" "}
          <code className="font-mono text-[var(--ink)]">
            Authorization: Bearer {apiKey || "sm_…"}
          </code>
        </p>
      )}
    </div>
  );
}
