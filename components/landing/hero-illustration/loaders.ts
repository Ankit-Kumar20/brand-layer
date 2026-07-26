import type { ComponentType } from "react";

import type { HeroIllustrationId } from "@/components/landing/hero-illustration/variants";
import { heroIllustrationMeta } from "@/components/landing/hero-illustration/variants";

/** Dynamic loaders — kept for gallery / later use; not pulled by the homepage. */
export const heroIllustrationLoaders: Record<
  HeroIllustrationId,
  () => Promise<ComponentType>
> = {
  flow: () =>
    import("@/components/landing/hero-illustration/flow").then(
      (m) => m.HeroIllustrationFlow,
    ),
  simple: () =>
    import("@/components/landing/hero-illustration/simple").then(
      (m) => m.HeroIllustrationSimple,
    ),
  radial: () =>
    import("@/components/landing/hero-illustration/radial").then(
      (m) => m.HeroIllustrationRadial,
    ),
  layers: () =>
    import("@/components/landing/hero-illustration/layers").then(
      (m) => m.HeroIllustrationLayers,
    ),
  manifest: () =>
    import("@/components/landing/hero-illustration/manifest").then(
      (m) => m.HeroIllustrationManifest,
    ),
  spectrum: () =>
    import("@/components/landing/hero-illustration/spectrum").then(
      (m) => m.HeroIllustrationSpectrum,
    ),
  signal: () =>
    import("@/components/landing/hero-illustration/signal").then(
      (m) => m.HeroIllustrationSignal,
    ),
  blueprint: () =>
    import("@/components/landing/hero-illustration/blueprint").then(
      (m) => m.HeroIllustrationBlueprint,
    ),
};

/** Metadata + lazy loader for each variant (gallery / later use). */
export const heroIllustrationRegistry: Record<
  HeroIllustrationId,
  {
    label: string;
    description: string;
    load: () => Promise<ComponentType>;
  }
> = {
  flow: { ...heroIllustrationMeta.flow, load: heroIllustrationLoaders.flow },
  simple: {
    ...heroIllustrationMeta.simple,
    load: heroIllustrationLoaders.simple,
  },
  radial: {
    ...heroIllustrationMeta.radial,
    load: heroIllustrationLoaders.radial,
  },
  layers: {
    ...heroIllustrationMeta.layers,
    load: heroIllustrationLoaders.layers,
  },
  manifest: {
    ...heroIllustrationMeta.manifest,
    load: heroIllustrationLoaders.manifest,
  },
  spectrum: {
    ...heroIllustrationMeta.spectrum,
    load: heroIllustrationLoaders.spectrum,
  },
  signal: {
    ...heroIllustrationMeta.signal,
    load: heroIllustrationLoaders.signal,
  },
  blueprint: {
    ...heroIllustrationMeta.blueprint,
    load: heroIllustrationLoaders.blueprint,
  },
};
