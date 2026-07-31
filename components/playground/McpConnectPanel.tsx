"use client";

import { useEffect, useState, useTransition } from "react";

type ClientId = "claude" | "cursor";
type CopyKind = "url" | "config" | "key" | "desktop" | "cli";

const clients: { id: ClientId; label: string }[] = [
  { id: "claude", label: "Claude" },
  { id: "cursor", label: "Cursor" },
];

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

/** Claude Desktop needs a local stdio bridge — url+headers often fails to load. */
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

function claudeCodeCli(url: string, apiKey: string) {
  const key = apiKey || "sm_…";
  return `claude mcp add --transport http desin ${url} \\
  --header "Authorization: Bearer ${key}"`;
}

function resolveMcpUrl() {
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:3000/api/mcp";
  }
  return "https://desin.ai/api/mcp";
}

function SnippetBlock({
  label,
  value,
  copied,
  copyKind,
  onCopy,
}: {
  label: string;
  value: string;
  copied: CopyKind | null;
  copyKind: CopyKind;
  onCopy: (value: string, kind: CopyKind) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-[var(--muted)]">{label}</p>
        <button
          type="button"
          onClick={() => onCopy(value, copyKind)}
          className="rounded border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--ink)] hover:bg-[var(--bg)]"
        >
          {copied === copyKind ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto rounded border border-[var(--line)] bg-[var(--bg)] p-3 font-mono text-[11px] leading-relaxed text-[var(--ink)]">
        {value}
      </pre>
    </div>
  );
}

export function McpConnectPanel({ containerTag }: { containerTag: string }) {
  const [active, setActive] = useState<ClientId>("claude");
  const [copied, setCopied] = useState<CopyKind | null>(null);
  const [mcpUrl] = useState(resolveMcpUrl);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [keyMeta, setKeyMeta] = useState<{
    brandId: string;
    containerTag: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setApiKey(null);
    setKeyMeta(null);
    setError(null);
  }, [containerTag]);

  const isLocalhost = mcpUrl.includes("localhost");
  const keyOrPlaceholder = apiKey ?? "";
  const desktopConfig = claudeDesktopConfig(mcpUrl, keyOrPlaceholder);
  const cursorConfig = sharedConfig(mcpUrl, keyOrPlaceholder);
  const cliSnippet = claudeCodeCli(mcpUrl, keyOrPlaceholder);

  async function copyText(value: string, kind: CopyKind) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  }

  function generateKey(forceNew = false) {
    if (!containerTag.trim()) {
      setError("Set a containerTag above first.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/playground/api-keys", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            containerTag: containerTag.trim(),
            forceNew,
          }),
        });
        const data = (await res.json()) as {
          key?: string;
          brandId?: string;
          containerTag?: string;
          created?: boolean;
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
              Brand-scoped · encrypted at rest · reveal anytime
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending || !containerTag.trim()}
              onClick={() => generateKey(false)}
              className="rounded border border-[var(--line)] bg-[var(--sheet)] px-3 py-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--bg)] disabled:opacity-50"
            >
              {pending
                ? "Loading…"
                : apiKey
                  ? "Reveal key"
                  : "Reveal / create key"}
            </button>
            {apiKey ? (
              <button
                type="button"
                disabled={pending || !containerTag.trim()}
                onClick={() => generateKey(true)}
                className="rounded border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink)] hover:bg-[var(--sheet)] disabled:opacity-50"
              >
                Generate new
              </button>
            ) : null}
          </div>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

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
            Creating a brand auto-mints a key. Reveal it here to fill the
            snippets below.
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
        {isLocalhost ? (
          <p className="text-xs leading-relaxed text-[var(--muted)]">
            Localhost only works on your machine (Claude Desktop / Claude Code
            against a tunnel, or Cursor). claude.ai custom connectors need a
            public URL (e.g. your Vercel deploy +{" "}
            <code className="font-mono text-[var(--ink)]">/api/mcp</code>).
          </p>
        ) : null}
      </div>

      {active === "claude" ? (
        <div className="space-y-8">
          <ol className="space-y-5">
            <li className="space-y-1">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                01
              </p>
              <p className="text-sm font-medium text-[var(--ink)]">
                Generate a brand API key
              </p>
              <p className="text-sm leading-relaxed text-[var(--muted)]">
                Use the button above. Prefer a brand-scoped{" "}
                <code className="font-mono text-[var(--ink)]">sm_…</code> key so
                containerTag is automatic.
              </p>
            </li>
            <li className="space-y-1">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                02
              </p>
              <p className="text-sm font-medium text-[var(--ink)]">
                Claude Desktop (recommended)
              </p>
              <p className="text-sm leading-relaxed text-[var(--muted)]">
                Desktop often rejects a plain{" "}
                <code className="font-mono text-[var(--ink)]">url</code> +{" "}
                <code className="font-mono text-[var(--ink)]">headers</code>{" "}
                block. Use the{" "}
                <code className="font-mono text-[var(--ink)]">mcp-remote</code>{" "}
                snippet below instead. Needs Node.js (
                <code className="font-mono text-[var(--ink)]">npx</code>
                ). Edit{" "}
                <code className="font-mono text-[var(--ink)]">
                  claude_desktop_config.json
                </code>
                , merge the{" "}
                <code className="font-mono text-[var(--ink)]">mcpServers</code>{" "}
                entry at the top level, then fully quit Desktop (Cmd+Q) and
                reopen. Keep{" "}
                <code className="font-mono text-[var(--ink)]">bun dev</code>{" "}
                running. Do not put a space after{" "}
                <code className="font-mono text-[var(--ink)]">Authorization:</code>{" "}
                in the header arg.
              </p>
            </li>
            <li className="space-y-1">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                03
              </p>
              <p className="text-sm font-medium text-[var(--ink)]">Claude Code</p>
              <p className="text-sm leading-relaxed text-[var(--muted)]">
                From a terminal, run the CLI command below, then use{" "}
                <code className="font-mono text-[var(--ink)]">/mcp</code> in
                Claude Code to confirm the server is connected.
              </p>
            </li>
            <li className="space-y-1">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                04
              </p>
              <p className="text-sm font-medium text-[var(--ink)]">
                claude.ai custom connector
              </p>
              <p className="text-sm leading-relaxed text-[var(--muted)]">
                Settings → Connectors → Add custom connector → paste a{" "}
                <strong className="font-medium text-[var(--ink)]">public</strong>{" "}
                MCP URL. If you see Request headers (beta), set{" "}
                <code className="font-mono text-[var(--ink)]">Authorization</code>{" "}
                to{" "}
                <code className="font-mono text-[var(--ink)]">
                  Bearer sm_…
                </code>{" "}
                (include the word Bearer). If you only see OAuth fields, use
                Desktop or Claude Code instead — desin is API-key auth, not OAuth
                yet.
              </p>
            </li>
          </ol>

          <SnippetBlock
            label="Claude Desktop config (mcp-remote)"
            value={desktopConfig}
            copied={copied}
            copyKind="desktop"
            onCopy={copyText}
          />
          <SnippetBlock
            label="Claude Code CLI"
            value={cliSnippet}
            copied={copied}
            copyKind="cli"
            onCopy={copyText}
          />
          <p className="text-xs leading-relaxed text-[var(--muted)]">
            After connecting, ask Claude to call{" "}
            <code className="font-mono text-[var(--ink)]">whoAmI</code> or{" "}
            <code className="font-mono text-[var(--ink)]">brandContext</code>. If
            Desktop still errors, check that Node/npx works and that{" "}
            <code className="font-mono text-[var(--ink)]">bun dev</code> is
            serving{" "}
            <code className="font-mono text-[var(--ink)]">/api/mcp</code>.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <ol className="space-y-5">
            <li className="space-y-1">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                01
              </p>
              <p className="text-sm font-medium text-[var(--ink)]">
                Generate a brand API key
              </p>
              <p className="text-sm leading-relaxed text-[var(--muted)]">
                Use the button above to mint a brand-scoped key for this
                containerTag.
              </p>
            </li>
            <li className="space-y-1">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                02
              </p>
              <p className="text-sm font-medium text-[var(--ink)]">
                Open MCP settings
              </p>
              <p className="text-sm leading-relaxed text-[var(--muted)]">
                Cursor → Settings → MCP, or edit mcp.json.
              </p>
            </li>
            <li className="space-y-1">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                03
              </p>
              <p className="text-sm font-medium text-[var(--ink)]">
                Paste URL + Bearer header
              </p>
              <p className="text-sm leading-relaxed text-[var(--muted)]">
                Copy the mcp.json snippet below (includes your key when
                generated).
              </p>
            </li>
          </ol>

          <SnippetBlock
            label="mcp.json"
            value={cursorConfig}
            copied={copied}
            copyKind="config"
            onCopy={copyText}
          />
        </div>
      )}
    </div>
  );
}
