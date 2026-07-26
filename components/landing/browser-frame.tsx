import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BrowserFrameProps = {
  children?: ReactNode;
  className?: string;
};

export function BrowserFrame({ children, className }: BrowserFrameProps) {
  return (
    <div
      className={cn(
        "relative flex w-full items-center justify-center overflow-hidden",
        className,
      )}
    >
      <div className="w-full overflow-hidden rounded-lg border border-border bg-background-50">
        <div className="flex h-10 items-center gap-2 border-b border-border bg-sheet px-3">
          <span className="size-2.5 rounded-full bg-background-500" />
          <span className="size-2.5 rounded-full bg-background-500" />
          <span className="size-2.5 rounded-full bg-background-500" />
          <div className="ml-3 flex h-6 flex-1 items-center rounded px-3 font-mono text-[10px] text-muted-foreground">
            mcp://desin / get_brand
          </div>
        </div>
        <div className="relative min-h-[280px] bg-sheet md:min-h-[420px]">
          {children ?? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
              <span
                aria-hidden
                className="size-3 rounded-full bg-primary"
              />
              <p className="max-w-sm text-center text-pretty text-sm leading-relaxed text-muted-foreground">
                Canonical brand system · aesthetics, voice, references, and
                machine-readable rules.
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {["voice", "palette", "logo", "MCP"].map((tag) => (
                  <span
                    className="rounded border border-border px-2.5 py-1 font-mono text-[10px] text-muted-foreground tracking-wide uppercase"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
