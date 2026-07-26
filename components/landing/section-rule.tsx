import { cn } from "@/lib/utils";

type SectionRuleProps = {
  className?: string;
  animate?: boolean;
};

/** Horizontal dashed hairline in primary colour. */
export function SectionRule({ className, animate = false }: SectionRuleProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 z-1 border-t border-dashed border-primary",
        animate && "animate-rule",
        className,
      )}
    />
  );
}

type SheetEdgesProps = {
  className?: string;
};

/** Full-height vertical dashed guides on the sheet edges. */
export function SheetEdges({ className }: SheetEdgesProps) {
  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-1 border-l border-dashed border-primary",
          className,
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 z-1 border-r border-dashed border-primary",
          className,
        )}
      />
    </>
  );
}
