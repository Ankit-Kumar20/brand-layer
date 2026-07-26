/**
 * v1 - Detailed flow: sources → brand system → named tools.
 */

/** Trig results differ in the last bit across engines, which breaks hydration. */
const round = (value: number) => Math.round(value * 100) / 100;

export function HeroIllustrationFlow() {
  return (
    <div
      aria-hidden
      className="relative mx-auto aspect-[5/4] w-full max-w-lg select-none md:mx-0 md:max-w-none"
    >
      <div className="absolute inset-0 bg-background-50" />

      <div className="absolute top-6 bottom-6 left-3 flex w-3 flex-col justify-between">
        {Array.from({ length: 13 }).map((_, i) => (
          <span
            className={
              i % 4 === 0
                ? "h-px w-3 bg-background-500"
                : "h-px w-1.5 bg-background-400"
            }
            key={i}
          />
        ))}
      </div>

      <svg
        className="absolute inset-0 size-full"
        fill="none"
        viewBox="0 0 480 384"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Brand context flowing into AI tools</title>

        <path
          className="hero-flow-line"
          d="M118 96 H168 C188 96 198 128 218 160"
          stroke="currentColor"
          strokeDasharray="4 4"
          style={{ color: "var(--background-500)" }}
        />
        <path
          className="hero-flow-line"
          d="M118 192 H218"
          stroke="currentColor"
          strokeDasharray="4 4"
          style={{ animationDelay: "0.12s", color: "var(--primary)" }}
        />
        <path
          className="hero-flow-line"
          d="M118 288 H168 C188 288 198 256 218 224"
          stroke="currentColor"
          strokeDasharray="4 4"
          style={{ animationDelay: "0.24s", color: "var(--background-500)" }}
        />

        <path
          className="hero-flow-line"
          d="M286 160 C310 128 320 96 340 96 H362"
          stroke="currentColor"
          strokeDasharray="4 4"
          style={{ animationDelay: "0.36s", color: "var(--background-500)" }}
        />
        <path
          className="hero-flow-line"
          d="M286 192 H362"
          stroke="currentColor"
          strokeDasharray="4 4"
          style={{ animationDelay: "0.48s", color: "var(--primary)" }}
        />
        <path
          className="hero-flow-line"
          d="M286 224 C310 256 320 288 340 288 H362"
          stroke="currentColor"
          strokeDasharray="4 4"
          style={{ animationDelay: "0.6s", color: "var(--background-500)" }}
        />

        <circle className="hero-pulse" cx="168" cy="192" fill="var(--primary)" r="3" />
        <circle
          className="hero-pulse"
          cx="324"
          cy="192"
          fill="var(--primary)"
          r="3"
          style={{ animationDelay: "0.9s" }}
        />
      </svg>

      <div className="absolute top-[18%] left-[6%] flex w-[22%] flex-col gap-5">
        <SourceNode label="Guidelines" mark="doc" />
        <SourceNode label="Palette" mark="swatch" />
        <SourceNode label="Voice" mark="voice" />
      </div>

      <div className="absolute top-1/2 left-1/2 flex w-[28%] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3">
        <div className="hero-core relative flex aspect-square w-full items-center justify-center">
          <svg className="absolute inset-0 size-full" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              fill="var(--sheet)"
              r="52"
              stroke="var(--background-400)"
              strokeWidth="1"
            />
            <circle
              cx="60"
              cy="60"
              fill="none"
              r="52"
              stroke="var(--primary)"
              strokeDasharray="2 6"
              strokeWidth="1.5"
            />
            {Array.from({ length: 24 }).map((_, i) => {
              const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
              const inner = i % 6 === 0 ? 44 : 48;
              const outer = 52;
              return (
                <line
                  key={i}
                  stroke={i % 6 === 0 ? "var(--primary)" : "var(--background-500)"}
                  strokeWidth={i % 6 === 0 ? 1.25 : 1}
                  x1={round(60 + Math.cos(a) * inner)}
                  x2={round(60 + Math.cos(a) * outer)}
                  y1={round(60 + Math.sin(a) * inner)}
                  y2={round(60 + Math.sin(a) * outer)}
                />
              );
            })}
          </svg>
          <div className="relative z-1 flex flex-col items-center gap-1 px-2 text-center">
            <span className="size-2 rounded-full bg-primary" />
            <span className="font-mono text-[10px] leading-tight tracking-[0.12em] text-foreground uppercase">
              Brand
              <br />
              system
            </span>
          </div>
        </div>
        <p className="text-center font-mono text-[10px] tracking-[0.14em] text-primary uppercase">
          desin
        </p>
      </div>

      <div className="absolute top-[18%] right-[6%] flex w-[22%] flex-col gap-5">
        <ToolNode label="Claude" />
        <ToolNode label="Cursor" />
        <ToolNode label="ChatGPT" />
      </div>

      <p className="absolute right-4 bottom-4 left-4 text-center font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase md:text-left">
        Sources → live context → every agent
      </p>
    </div>
  );
}

function SourceNode({
  label,
  mark,
}: {
  label: string;
  mark: "doc" | "swatch" | "voice";
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-9 shrink-0 items-center justify-center border border-dashed border-primary bg-sheet">
        {mark === "doc" ? (
          <span className="block h-4 w-3 border border-background-500 bg-background-100" />
        ) : null}
        {mark === "swatch" ? (
          <span className="flex gap-0.5">
            <span className="size-2.5 bg-primary" />
            <span className="size-2.5 bg-foreground" />
            <span className="size-2.5 bg-background-500" />
          </span>
        ) : null}
        {mark === "voice" ? (
          <span className="flex h-3.5 items-end gap-0.5">
            <span className="h-1.5 w-0.5 bg-foreground" />
            <span className="h-3.5 w-0.5 bg-primary" />
            <span className="h-2 w-0.5 bg-foreground" />
            <span className="h-3 w-0.5 bg-background-600" />
          </span>
        ) : null}
      </div>
      <span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </span>
    </div>
  );
}

function ToolNode({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-end gap-2.5">
      <span className="font-mono text-[10px] tracking-[0.08em] text-foreground uppercase">
        {label}
      </span>
      <div className="flex size-9 shrink-0 items-center justify-center border border-border bg-sheet">
        <span className="size-1.5 rounded-full bg-foreground" />
      </div>
    </div>
  );
}
