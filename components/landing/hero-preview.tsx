import { SectionRule } from "@/components/landing/section-rule";

export function HeroPreview() {
  return (
    <div className="relative w-full">
      <SectionRule animate className="top-0" />
      <div className="sheet-pad py-8 sm:py-12 md:py-16">
        <p className="text-prose max-w-2xl text-pretty text-foreground">
          Decks, sites, Figma, social, and images go in. One canonical brand
          comes out — aesthetics, voice, references, and rules agents can use
          without re-explaining anything.
        </p>
      </div>
      <SectionRule className="bottom-0" />
    </div>
  );
}
