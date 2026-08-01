"use client";

import { Button } from "@/components/ui/button";

export function ByokSection() {
  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-medium tracking-tight text-foreground sm:text-2xl">
        BYOK
      </h2>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Provider</span>
          <select
            className="h-10 rounded bg-background-100 px-3 text-sm text-foreground outline-none disabled:opacity-50"
            disabled
            defaultValue="openai"
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">API key</span>
          <input
            className="h-10 w-full rounded bg-background-100 px-3 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/50 disabled:opacity-50"
            disabled
            placeholder="sk-…"
            type="password"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Status</span>
          <div className="rounded bg-background-100 px-3 py-2.5 text-sm text-muted-foreground">
            No keys saved
          </div>
        </div>

        <div>
          <Button disabled type="button" variant="secondary">
            Save key
          </Button>
        </div>
      </div>
    </div>
  );
}
