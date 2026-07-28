import { SectionRule } from "@/components/landing/section-rule";

export function HeroPreview() {
  return (
    <div className="relative w-full">
      <SectionRule animate className="top-0" />
      <div className="sheet-pad py-8 sm:py-12 md:py-16">
        <p className="text-prose max-w-2xl text-pretty text-foreground">
          Add your website, logos, and guidelines once. Then make images,
          posts, and campaigns that actually look like your brand.
        </p>
      </div>
      <SectionRule className="bottom-0" />
    </div>
  );
}
