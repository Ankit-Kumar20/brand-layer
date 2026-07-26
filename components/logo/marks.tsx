import type { ComponentType, SVGProps } from "react";

import { cn } from "@/lib/utils";

type MarkProps = SVGProps<SVGSVGElement> & {
  className?: string;
};

const base = {
  fill: "none",
  viewBox: "0 0 32 32",
  xmlns: "http://www.w3.org/2000/svg",
} as const;

export type LogoGroup = "product" | "geometry";

export type LogoMark = {
  id: string;
  name: string;
  note: string;
  group: LogoGroup;
  Mark: ComponentType<MarkProps>;
};

/* ─── Product story marks ─────────────────────────────────────────── */

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

/* ─── Geometry marks (earlier explorations) ───────────────────────── */

/** Three flat plates - middle plate solid orange. */
export function MarkLayersFlat({ className, ...props }: MarkProps) {
  return (
    <svg {...base} aria-hidden className={cn("size-full", className)} {...props}>
      <rect height="4" rx="0.5" stroke="currentColor" strokeWidth="1.5" width="20" x="6" y="7" />
      <rect fill="var(--logo-core, #ff5800)" height="4" rx="0.5" stroke="var(--logo-core, #ff5800)" strokeWidth="1.5" width="20" x="6" y="14" />
      <rect height="4" rx="0.5" stroke="currentColor" strokeWidth="1.5" width="20" x="6" y="21" />
    </svg>
  );
}

/** Offset stack - plates slide right as they go down. */
export function MarkLayersOffset({ className, ...props }: MarkProps) {
  return (
    <svg {...base} aria-hidden className={cn("size-full", className)} {...props}>
      <rect height="4" rx="0.5" stroke="currentColor" strokeWidth="1.5" width="18" x="5" y="7" />
      <rect fill="var(--logo-core, #ff5800)" height="4" rx="0.5" stroke="var(--logo-core, #ff5800)" strokeWidth="1.5" width="18" x="7" y="14" />
      <rect height="4" rx="0.5" stroke="currentColor" strokeWidth="1.5" width="18" x="9" y="21" />
    </svg>
  );
}

/** Isometric three-plate stack (simplified 30°). */
export function MarkLayersIso({ className, ...props }: MarkProps) {
  return (
    <svg {...base} aria-hidden className={cn("size-full", className)} {...props}>
      <path
        d="M16 5 L26 10 L16 15 L6 10 Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
      <path
        d="M16 11.5 L26 16.5 L16 21.5 L6 16.5 Z"
        fill="var(--logo-core, #ff5800)"
        stroke="var(--logo-core, #ff5800)"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
      <path
        d="M16 18 L26 23 L16 28 L6 23 Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

/** Isometric stack with side thickness on the orange plate. */
export function MarkLayersSlab({ className, ...props }: MarkProps) {
  return (
    <svg {...base} aria-hidden className={cn("size-full", className)} {...props}>
      <path
        d="M16 4.5 L25 9 L16 13.5 L7 9 Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.35"
      />
      <path
        d="M7 13.5 L16 18 L25 13.5 L25 16 L16 20.5 L7 16 Z"
        fill="var(--logo-core, #ff5800)"
        opacity="0.35"
      />
      <path
        d="M16 11 L25 15.5 L16 20 L7 15.5 Z"
        fill="var(--logo-core, #ff5800)"
        stroke="var(--logo-core, #ff5800)"
        strokeLinejoin="round"
        strokeWidth="1.35"
      />
      <path
        d="M16 18 L25 22.5 L16 27 L7 22.5 Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.35"
      />
    </svg>
  );
}

/** Crop / construction corners framing a signal square. */
export function MarkCorners({ className, ...props }: MarkProps) {
  return (
    <svg {...base} aria-hidden className={cn("size-full", className)} {...props}>
      <path
        d="M8 12 V8 H12 M20 8 H24 V12 M24 20 V24 H20 M12 24 H8 V20"
        stroke="currentColor"
        strokeLinecap="square"
        strokeWidth="1.6"
      />
      <rect fill="var(--logo-core, #ff5800)" height="8" width="8" x="12" y="12" />
    </svg>
  );
}

/** Dashed frame with a solid orange core. */
export function MarkDashedCore({ className, ...props }: MarkProps) {
  return (
    <svg {...base} aria-hidden className={cn("size-full", className)} {...props}>
      <rect
        height="22"
        rx="1"
        stroke="currentColor"
        strokeDasharray="2.5 2"
        strokeWidth="1.4"
        width="22"
        x="5"
        y="5"
      />
      <rect fill="var(--logo-core, #ff5800)" height="10" width="10" x="11" y="11" />
    </svg>
  );
}

/** Bracketed lowercase d. */
export function MarkBracketD({ className, ...props }: MarkProps) {
  return (
    <svg {...base} aria-hidden className={cn("size-full", className)} {...props}>
      <path d="M9 8 V24 M23 8 V24" stroke="currentColor" strokeLinecap="square" strokeWidth="1.6" />
      <path
        d="M9 8 H12 M9 24 H12 M23 8 H20 M23 24 H20"
        stroke="currentColor"
        strokeLinecap="square"
        strokeWidth="1.6"
      />
      <text
        fill="currentColor"
        fontFamily="var(--font-geist-sans), Geist, sans-serif"
        fontSize="14"
        fontWeight="500"
        textAnchor="middle"
        x="16"
        y="21"
      >
        d
      </text>
      <circle cx="22" cy="10" fill="var(--logo-core, #ff5800)" r="1.6" />
    </svg>
  );
}

/** Signal bar - three rising ticks, last orange. */
export function MarkSignal({ className, ...props }: MarkProps) {
  return (
    <svg {...base} aria-hidden className={cn("size-full", className)} {...props}>
      <rect fill="currentColor" height="8" rx="0.5" width="4" x="7" y="17" />
      <rect fill="currentColor" height="14" rx="0.5" width="4" x="14" y="11" />
      <rect fill="var(--logo-core, #ff5800)" height="20" rx="0.5" width="4" x="21" y="5" />
    </svg>
  );
}

/** Nested squares - context inside brand. */
export function MarkNested({ className, ...props }: MarkProps) {
  return (
    <svg {...base} aria-hidden className={cn("size-full", className)} {...props}>
      <rect height="20" stroke="currentColor" strokeWidth="1.5" width="20" x="6" y="6" />
      <rect height="12" stroke="currentColor" strokeWidth="1.5" width="12" x="10" y="10" />
      <rect fill="var(--logo-core, #ff5800)" height="4" width="4" x="14" y="14" />
    </svg>
  );
}

/** Split plate - top stroke, bottom orange fill. */
export function MarkSplit({ className, ...props }: MarkProps) {
  return (
    <svg {...base} aria-hidden className={cn("size-full", className)} {...props}>
      <path d="M7 10 H25" stroke="currentColor" strokeLinecap="square" strokeWidth="1.6" />
      <path d="M7 16 H25" stroke="currentColor" strokeLinecap="square" strokeWidth="1.6" />
      <rect fill="var(--logo-core, #ff5800)" height="5" width="18" x="7" y="20" />
    </svg>
  );
}

export const LOGO_GROUPS: { id: LogoGroup; title: string; blurb: string }[] = [
  {
    id: "product",
    title: "Product story",
    blurb: "Brand Brain - dashed system ring with a solid orange live core.",
  },
  {
    id: "geometry",
    title: "Geometry",
    blurb: "Earlier abstract explorations - layers, corners, signal.",
  },
];

export const LOGO_MARKS: LogoMark[] = [
  {
    id: "brain",
    name: "Brand Brain",
    note: "Live brand brain - dashed system ring, solid orange core",
    group: "product",
    Mark: MarkBrain,
  },
  {
    id: "layers-flat",
    name: "Layers Flat",
    note: "Three plates, orange mid layer",
    group: "geometry",
    Mark: MarkLayersFlat,
  },
  {
    id: "layers-offset",
    name: "Layers Offset",
    note: "Stack shifts right - suggests flow downward",
    group: "geometry",
    Mark: MarkLayersOffset,
  },
  {
    id: "layers-iso",
    name: "Layers Iso",
    note: "Matches hero isometric language",
    group: "geometry",
    Mark: MarkLayersIso,
  },
  {
    id: "layers-slab",
    name: "Layers Slab",
    note: "Iso with thickness on the live plate",
    group: "geometry",
    Mark: MarkLayersSlab,
  },
  {
    id: "corners",
    name: "Corners",
    note: "Construction crop marks + signal core",
    group: "geometry",
    Mark: MarkCorners,
  },
  {
    id: "dashed-core",
    name: "Dashed Core",
    note: "Blueprint frame around the live core",
    group: "geometry",
    Mark: MarkDashedCore,
  },
  {
    id: "bracket-d",
    name: "Bracket D",
    note: "Monogram for text-heavy places",
    group: "geometry",
    Mark: MarkBracketD,
  },
  {
    id: "signal",
    name: "Signal",
    note: "Live brand signal - rising bars",
    group: "geometry",
    Mark: MarkSignal,
  },
  {
    id: "nested",
    name: "Nested",
    note: "Context nested inside the brand kit",
    group: "geometry",
    Mark: MarkNested,
  },
  {
    id: "split",
    name: "Split",
    note: "Spec lines over a solid base plate",
    group: "geometry",
    Mark: MarkSplit,
  },
];
