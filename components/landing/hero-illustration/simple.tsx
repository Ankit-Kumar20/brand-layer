/**
 * v2 - Simple line: Brand → desin → Agents.
 */
export function HeroIllustrationSimple() {
  return (
    <div
      aria-hidden
      className="relative flex aspect-[4/3] w-full items-center justify-center bg-background-50 select-none"
    >
      <div className="flex w-full max-w-md items-center justify-between gap-3 px-8 sm:gap-5 sm:px-10">
        <Node label="Brand" />
        <Flow />
        <Node accent label="desin" />
        <Flow delay />
        <Node label="Agents" />
      </div>
    </div>
  );
}

function Node({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={
          accent
            ? "relative flex size-16 items-center justify-center rounded-full border border-dashed border-primary bg-sheet sm:size-[4.5rem]"
            : "flex size-16 items-center justify-center rounded-full border border-border bg-sheet sm:size-[4.5rem]"
        }
      >
        {accent ? (
          <span className="hero-pulse size-2.5 rounded-full bg-primary" />
        ) : (
          <span className="size-2 rounded-full bg-foreground/80" />
        )}
      </div>
      <span
        className={
          accent
            ? "font-mono text-[11px] tracking-[0.14em] text-primary uppercase"
            : "font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase"
        }
      >
        {label}
      </span>
    </div>
  );
}

function Flow({ delay = false }: { delay?: boolean }) {
  return (
    <div className="relative mb-7 h-px min-w-6 flex-1 overflow-hidden sm:min-w-10">
      <div className="absolute inset-0 border-t border-dashed border-background-500" />
      <div
        className="hero-flow-dot absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-primary"
        style={delay ? { animationDelay: "0.9s" } : undefined}
      />
    </div>
  );
}
