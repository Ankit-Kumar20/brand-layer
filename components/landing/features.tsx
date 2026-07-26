import { SectionRule } from "@/components/landing/section-rule";

const features = [
  {
    title: "MCP auto-pull",
    description:
      "Connect once. Every chat gets the latest brand - no pasting a brand.md, no stale copies.",
  },
  {
    title: "Multi-brand switching",
    description:
      "Agencies flip between clients cleanly. One workspace, many brand brains.",
  },
  {
    title: "Team sync",
    description:
      "Update palette or voice once. Every teammate and every connected agent sees it on the next call.",
  },
  {
    title: "Hosted refs & logos",
    description:
      "Stable image URLs agents can fetch - not broken Drive links buried in a doc.",
  },
  {
    title: "Task-specific packs",
    description:
      "Email banner, LinkedIn post, landing copy - serve the right slice, not the whole brand dump.",
  },
  {
    title: "Export when you must",
    description:
      "Closed tools like Midjourney or Canva? One-click brand prompt - always current.",
  },
] as const;

export function Features() {
  return (
    <section className="relative py-12 sm:py-16 md:py-24">
      <div className="sheet-pad">
        <div className="mb-12 grid gap-6 md:mb-14 md:grid-cols-2 md:gap-12 lg:gap-16">
          <div className="space-y-3">
            <p className="text-label text-primary">Why pay</p>
            <h2 className="text-title text-balance">
              Built so a file can&apos;t replace you
            </h2>
          </div>
          <p className="text-body self-end text-pretty text-muted-foreground">
            A shared markdown file works for one person, once a week. You charge
            for connected, multi-brand, always-current brand that tools pull.
          </p>
        </div>

        <ul className="grid gap-x-8 gap-y-8 border-t border-border pt-8 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-10 sm:pt-10 lg:grid-cols-3 lg:gap-x-12">
          {features.map((feature) => (
            <li className="flex flex-col gap-2" key={feature.title}>
              <h3 className="text-prose text-foreground">{feature.title}</h3>
              <p className="text-body text-pretty text-muted-foreground">
                {feature.description}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <SectionRule className="bottom-0" />
    </section>
  );
}
