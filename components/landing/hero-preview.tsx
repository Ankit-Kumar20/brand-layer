import { SectionRule } from "@/components/landing/section-rule";

export function HeroPreview() {
  return (
    <div className="relative w-full">
      <SectionRule animate className="top-0" />
      <div className="sheet-pad py-8 sm:py-12 md:py-16">
        <p className="text-prose max-w-xl text-pretty text-foreground">
          Save the kit once. Agents pull it live - no paste, no credits for
          generation on our site.
        </p>
      </div>
      <SectionRule className="bottom-0" />
    </div>
  );
}
