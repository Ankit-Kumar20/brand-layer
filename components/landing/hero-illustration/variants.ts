/**
 * Active hero illustration.
 *
 * Options:
 * - `"flow"`      - sources → brand system → named tools (first detailed diagram)
 * - `"simple"`    - Brand → desin → Agents (three-node line)
 * - `"radial"`    - measured dial / live signal
 * - `"layers"`    - isometric stack: sources compile down to agents
 * - `"manifest"`  - the live token payload agents actually read
 * - `"spectrum"`  - specimen matrix with a scan line
 * - `"signal"`    - on-brand output as an instrument readout
 * - `"blueprint"` - wordmark under measurement
 *
 * When changing `HERO_ILLUSTRATION`, also update `pinned.ts` so the homepage
 * statically imports only the live variant.
 */
export type HeroIllustrationId =
  | "flow"
  | "simple"
  | "radial"
  | "layers"
  | "manifest"
  | "spectrum"
  | "signal"
  | "blueprint";

export const HERO_ILLUSTRATION: HeroIllustrationId = "layers";

/** Cycle order for prev/next chevrons. */
export const HERO_ILLUSTRATION_ORDER: HeroIllustrationId[] = [
  "flow",
  "simple",
  "radial",
  "layers",
  "manifest",
  "spectrum",
  "signal",
  "blueprint",
];

export const heroIllustrationMeta: Record<
  HeroIllustrationId,
  { label: string; description: string }
> = {
  flow: {
    label: "Flow",
    description: "Guidelines / palette / voice → desin → Claude / Cursor / ChatGPT",
  },
  simple: {
    label: "Simple",
    description: "Brand → desin → Agents",
  },
  radial: {
    label: "Radial",
    description: "Live brand signal dial with agent endpoints",
  },
  layers: {
    label: "Layers",
    description: "Isometric stack: inputs → brand → create → assets",
  },
  manifest: {
    label: "Manifest",
    description: "The live brand.context payload agents actually read",
  },
  spectrum: {
    label: "Spectrum",
    description: "Specimen matrix - color, type, rhythm, voice - under a scan line",
  },
  signal: {
    label: "Signal",
    description: "On-brand output charted as a measured instrument readout",
  },
  blueprint: {
    label: "Blueprint",
    description: "The desin wordmark under dimension lines and swatches",
  },
};
