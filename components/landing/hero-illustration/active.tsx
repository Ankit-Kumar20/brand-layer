import { ActiveHeroIllustration } from "@/components/landing/hero-illustration/pinned";

/** Renders the active hero illustration (static, no switcher). */
export function HeroIllustration() {
  return (
    <div className="relative w-full">
      <ActiveHeroIllustration />
    </div>
  );
}
