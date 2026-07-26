"use client";

import { useState } from "react";

import { ToolIcon } from "@/components/landing/integrations";
import { SectionRule } from "@/components/landing/section-rule";
import { MarkBrain } from "@/components/logo/marks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MCP_URL = "https://desin.ai/api/mcp";

type ClientId = "claude" | "cursor" | "chatgpt";

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
        title: "Open Connectors",
        body: 'In Claude, go to Settings → Connectors and choose “Add custom connector”.',
      },
      {
        title: "Paste the desin URL",
        body: "Drop in the connector address below. Most clients start sign-in automatically.",
      },
      {
        title: "Authorize once",
        body: "Approve in the browser. From then on, Claude can pull your live brand kit.",
      },
    ],
  },
  {
    id: "cursor",
    label: "Cursor",
    steps: [
      {
        title: "Open MCP settings",
        body: "In Cursor, open Settings → MCP and add a new server.",
      },
      {
        title: "Add the desin server",
        body: "Paste the connector URL. Cursor will prompt you to authenticate.",
      },
      {
        title: "Authorize once",
        body: "Sign in in the browser. Agents can fetch the latest brand on the next turn.",
      },
    ],
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    steps: [
      {
        title: "Open Connectors",
        body: "In ChatGPT, open Settings → Connectors and add a custom connector.",
      },
      {
        title: "Paste the desin URL",
        body: "Use the same MCP address. ChatGPT handles the OAuth handoff.",
      },
      {
        title: "Authorize once",
        body: "Approve access. Your brand context is available in new chats.",
      },
    ],
  },
];

export function McpSetup() {
  const [active, setActive] = useState<ClientId>("claude");
  const [copied, setCopied] = useState(false);
  const client = clients.find((c) => c.id === active) ?? clients[0];

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(MCP_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="relative py-12 sm:py-16 md:py-24" id="connect">
      <div className="sheet-pad">
        <div className="mb-12 grid gap-6 md:mb-14 md:grid-cols-2 md:gap-12 lg:gap-16">
          <div className="space-y-3">
            <p className="text-label text-primary">Connect</p>
            <h2 className="text-title text-balance">
              Wire your brand into the tools you already open
            </h2>
          </div>
          <p className="text-body self-end text-pretty text-muted-foreground">
            Add the connector once. Every new chat can pull the current kit -
            palette, voice, rules, and refs - without paste or a stale file.
          </p>
        </div>

        <div
          aria-label="Choose an AI client"
          className="mb-10 flex flex-wrap gap-2 border-b border-border pb-4"
          role="tablist"
        >
          {clients.map((c) => {
            const selected = c.id === active;
            return (
              <button
                aria-controls={`connect-panel-${c.id}`}
                aria-selected={selected}
                className={cn(
                  "inline-flex items-center gap-2 rounded px-3 py-2 text-body transition-colors duration-300 ease-[var(--ease-swift)] [&_img]:mr-0 [&_svg]:mr-0",
                  selected
                    ? "bg-foreground text-sheet"
                    : "text-muted-foreground hover:bg-background-100 hover:text-foreground",
                )}
                id={`connect-tab-${c.id}`}
                key={c.id}
                onClick={() => setActive(c.id)}
                role="tab"
                type="button"
              >
                <ToolIcon id={c.id} />
                {c.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div
            aria-labelledby={`connect-tab-${client.id}`}
            id={`connect-panel-${client.id}`}
            role="tabpanel"
          >
            <ol className="space-y-8">
              {client.steps.map((step, index) => (
                <li className="flex flex-col gap-2" key={step.title}>
                  <p className="text-label text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="text-prose text-foreground">{step.title}</h3>
                  <p className="text-body text-pretty text-muted-foreground">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>

            <div className="mt-10 space-y-3">
              <p className="text-label text-muted-foreground">Connector URL</p>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 truncate rounded border border-border bg-background-50 px-3 py-2.5 font-mono text-sm text-foreground">
                  {MCP_URL}
                </code>
                <Button
                  className="h-10 w-full shrink-0 px-4 font-medium sm:w-auto"
                  onClick={copyUrl}
                  type="button"
                  variant="outline"
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="text-body text-pretty text-muted-foreground">
                Prefer HTTP? Same brand kit is available over the REST API -
                docs ship with your workspace.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-8 border-t border-border pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-16">
            <div className="space-y-5">
              <p className="text-label text-muted-foreground">In chat</p>
              <div className="space-y-1">
                <p className="text-label text-muted-foreground">You</p>
                <p className="text-body text-pretty text-foreground">
                  Pull our brand for this email header - keep voice and palette
                  tight.
                </p>
              </div>
              <div className="space-y-2 border-t border-border pt-5">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MarkBrain className="size-3.5" />
                  <p className="text-label">desin</p>
                </div>
                <p className="text-body text-pretty text-foreground">
                  Loaded Acme - warm, direct tone · primary #FF5800 · logo +
                  three approved refs ready.
                </p>
                <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                  Called get_brand
                </p>
              </div>
            </div>
            <p className="text-body text-pretty text-muted-foreground">
              Creation stays in {client.label}. desin only supplies the live
              brand context.
            </p>
          </div>
        </div>
      </div>
      <SectionRule className="bottom-0" />
    </section>
  );
}
