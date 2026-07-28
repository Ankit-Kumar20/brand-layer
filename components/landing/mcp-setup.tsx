"use client";

import { useState } from "react";

import { ToolIcon } from "@/components/landing/integrations";
import { SectionRule } from "@/components/landing/section-rule";
import { Button } from "@/components/ui/button";

const MCP_URL = "https://desin.ai/api/mcp";

const steps = [
  {
    id: "01",
    title: "Add the connector",
    description:
      "In Claude, Cursor, or ChatGPT, open Connectors / MCP settings and add a custom server.",
  },
  {
    id: "02",
    title: "Paste the desin URL",
    description:
      "Use the address below. Sign in once — the client keeps the session for later chats.",
  },
  {
    id: "03",
    title: "Create on-brand",
    description:
      "Agents pull your live kit — palette, voice, rules, and refs — without you re-pasting anything.",
  },
] as const;

const clients = [
  { id: "claude" as const, label: "Claude" },
  { id: "cursor" as const, label: "Cursor" },
  { id: "chatgpt" as const, label: "ChatGPT" },
];

export function McpSetup() {
  const [copied, setCopied] = useState(false);

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
        <div className="mb-12 space-y-3 md:mb-16">
          <p className="text-label text-primary">Connect</p>
          <h2 className="text-title text-balance">
            Call your brand from any agent
          </h2>
          <p className="text-body max-w-xl text-pretty text-muted-foreground">
            MCP is one way in. Prefer embedding? The same kit is available over
            REST.
          </p>
        </div>

        <ol className="mb-12 grid gap-10 sm:mb-14 sm:grid-cols-3 sm:gap-8 lg:gap-12 md:mb-16">
          {steps.map((step) => (
            <li className="flex flex-col gap-3" key={step.id}>
              <p className="text-label text-primary">{step.id}</p>
              <h3 className="text-prose text-foreground">{step.title}</h3>
              <p className="text-body text-pretty text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>

        <div className="border border-border">
          <div className="flex flex-col gap-4 p-5 sm:p-6 md:flex-row md:items-end md:justify-between md:gap-8 md:p-8">
            <div className="min-w-0 flex-1 space-y-3">
              <p className="text-label text-muted-foreground">MCP URL</p>
              <code className="block truncate font-mono text-sm text-foreground sm:text-body">
                {MCP_URL}
              </code>
            </div>
            <Button
              className="h-11 w-full shrink-0 px-7 font-medium md:w-auto"
              onClick={copyUrl}
              type="button"
              variant="secondary"
            >
              {copied ? "Copied" : "Copy URL"}
            </Button>
          </div>

          <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5 md:px-8">
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {clients.map((client) => (
                <li
                  className="inline-flex items-center text-body text-muted-foreground"
                  key={client.id}
                >
                  <ToolIcon id={client.id} />
                  {client.label}
                </li>
              ))}
            </ul>
            <p className="text-body text-muted-foreground">
              Same kit over REST when you embed.
            </p>
          </div>
        </div>
      </div>
      <SectionRule className="bottom-0" />
    </section>
  );
}
