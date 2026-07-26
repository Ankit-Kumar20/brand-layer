/**
 * Hero illustration variants.
 *
 * Switch the live homepage mark by updating:
 * 1. `variants.ts` → `HERO_ILLUSTRATION`
 * 2. `pinned.ts` → the matching static import
 *
 * Other variants stay available via `heroIllustrationLoaders` / Gallery.
 */
export { HeroIllustration } from "@/components/landing/hero-illustration/active";
export { HeroIllustrationGallery } from "@/components/landing/hero-illustration/gallery";
export {
  heroIllustrationLoaders,
  heroIllustrationRegistry,
} from "@/components/landing/hero-illustration/loaders";
export {
  HERO_ILLUSTRATION,
  HERO_ILLUSTRATION_ORDER,
  heroIllustrationMeta,
  type HeroIllustrationId,
} from "@/components/landing/hero-illustration/variants";
