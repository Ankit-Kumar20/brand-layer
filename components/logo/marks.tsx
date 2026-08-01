import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

type MarkProps = SVGProps<SVGSVGElement> & {
  className?: string;
};

const base = {
  fill: "none",
  viewBox: "0 0 32 32",
  xmlns: "http://www.w3.org/2000/svg",
} as const;

/** Live brand brain - dashed ring, solid orange core. */
export function MarkBrain({ className, ...props }: MarkProps) {
  return (
    <svg {...base} aria-hidden className={cn("size-full", className)} {...props}>
      <circle
        cx="16"
        cy="16"
        r="11"
        stroke="currentColor"
        strokeDasharray="2.5 2"
        strokeWidth="1.4"
      />
      <circle cx="16" cy="16" fill="var(--logo-core, #ff5800)" r="5" />
      <circle cx="16" cy="16" fill="none" r="7.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
