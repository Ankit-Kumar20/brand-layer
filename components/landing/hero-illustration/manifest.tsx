/**
 * v5 - Manifest: the live brand payload agents actually read.
 */
const TOKENS = [
  { key: "color/primary", value: "#FF5800", swatch: true },
  { key: "type/display", value: "Geist 32/36" },
  { key: "voice/tone", value: "direct · plain" },
  { key: "space/unit", value: "4px" },
];

const AGENTS = ["Claude", "Cursor", "ChatGPT"];

export function HeroIllustrationManifest() {
  return (
    <div
      aria-hidden
      className="relative flex aspect-square w-full max-w-md items-center justify-center bg-background-50 p-6 select-none lg:max-w-none"
    >
      <div className="flex w-full flex-col items-center">
        <div className="w-full border border-border bg-sheet">
          <div className="flex items-center justify-between border-b border-border bg-background-50 px-3.5 py-2.5">
            <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.1em] text-foreground">
              <span className="hero-pulse size-1.5 rounded-full bg-primary" />
              brand.context
            </span>
            <span className="font-mono text-[9px] tracking-[0.16em] text-muted-foreground uppercase">
              MCP
            </span>
          </div>

          <ul className="flex flex-col">
            {TOKENS.map((token) => (
              <li
                className="flex items-center justify-between gap-3 border-b border-border px-3.5 py-3 last:border-b-0"
                key={token.key}
              >
                <span className="font-mono text-[11px] tracking-[0.04em] text-muted-foreground">
                  {token.key}
                </span>
                <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.04em] text-foreground">
                  {token.swatch ? (
                    <span className="size-2.5 bg-primary" />
                  ) : null}
                  {token.value}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between border-t border-border bg-background-50 px-3.5 py-2.5">
            <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
              Synced 2s ago
            </span>
            <span className="flex items-center gap-1 font-mono text-[10px] tracking-[0.16em] text-primary uppercase">
              4/4
              <span className="hero-blink inline-block h-2.5 w-[3px] bg-primary" />
            </span>
          </div>
        </div>

        <div className="relative h-10 w-full">
          <span className="absolute top-0 left-1/2 h-1/2 -translate-x-1/2 border-l border-dashed border-background-500" />
          <span className="absolute top-1/2 right-[16.666%] left-[16.666%] border-t border-dashed border-background-500" />
          {["16.666%", "50%", "83.333%"].map((left) => (
            <span
              className="absolute top-1/2 h-1/2 -translate-x-1/2 border-l border-dashed border-background-500"
              key={left}
              style={{ left }}
            />
          ))}
        </div>

        <div className="grid w-full grid-cols-3">
          {AGENTS.map((agent, i) => (
            <div className="flex flex-col items-center gap-2" key={agent}>
              <span className="flex size-11 items-center justify-center border border-border bg-sheet">
                <span
                  className="hero-pulse size-1.5 rounded-full bg-foreground"
                  style={{ animationDelay: `${i * 0.3}s` }}
                />
              </span>
              <span className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                {agent}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
