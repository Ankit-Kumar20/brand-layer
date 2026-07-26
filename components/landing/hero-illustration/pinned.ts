/**
 * Static import for the live homepage hero.
 *
 * Keep this aligned with `HERO_ILLUSTRATION` in `variants.ts`. Only the
 * component imported here ships in the homepage client graph; other variants
 * stay available via `loaders.ts` / `HeroIllustrationGallery`.
 */
export { HeroIllustrationLayers as ActiveHeroIllustration } from "@/components/landing/hero-illustration/layers";
