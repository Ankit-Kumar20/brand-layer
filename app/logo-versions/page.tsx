import type { Metadata } from "next";

import { BrandLogo } from "@/components/logo/brand-logo";
import { LOGO_GROUPS, LOGO_MARKS, type LogoMark } from "@/components/logo/marks";
import { SectionRule, SheetEdges } from "@/components/landing/section-rule";

export const metadata: Metadata = {
  title: "Logo versions - desin",
  description: "Icon mark candidates for the desin brand.",
};

const SIZES = [
  { label: "16", px: 16 },
  { label: "24", px: 24 },
  { label: "32", px: 32 },
  { label: "48", px: 48 },
  { label: "80", px: 80 },
] as const;

const SURFACES = [
  { id: "sheet", label: "Sheet", className: "bg-sheet text-foreground" },
  { id: "chrome", label: "Chrome", className: "bg-chrome text-foreground" },
  { id: "ink", label: "Ink", className: "bg-foreground text-sheet" },
  {
    id: "signal",
    label: "Signal",
    className: "bg-primary text-primary-foreground [--logo-core:#ffffff]",
  },
] as const;

function MarkCard({ id, name, note, Mark }: LogoMark) {
  return (
    <article
      className="relative grid gap-8 border-t border-dashed border-primary pt-10 lg:grid-cols-[220px_1fr]"
      id={id}
    >
      <div className="flex flex-col gap-2">
        <h3 className="text-body font-medium tracking-tight">{name}</h3>
        <p className="text-label text-muted-foreground">{note}</p>
        <p className="text-label text-foreground/40">{id}</p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end gap-6">
          {SIZES.map(({ label, px }) => (
            <div className="flex flex-col items-center gap-2" key={label}>
              <div
                className="flex items-center justify-center text-foreground"
                style={{ width: px, height: px }}
              >
                <Mark />
              </div>
              <span className="text-label text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SURFACES.map((surface) => (
            <div
              className={`flex aspect-[4/3] flex-col items-center justify-center gap-3 ${surface.className}`}
              key={surface.id}
            >
              <div className="size-12">
                <Mark />
              </div>
              <span
                className={
                  surface.id === "ink" || surface.id === "signal"
                    ? "text-label opacity-70"
                    : "text-label text-muted-foreground"
                }
              >
                {surface.label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-10 border border-border px-6 py-5">
          <div className="flex items-center gap-2.5 text-foreground">
            <div className="size-7">
              <Mark />
            </div>
            <span className="text-body font-medium tracking-tight">desin</span>
          </div>
          <div className="flex items-center gap-2.5 text-foreground">
            <div className="size-5">
              <Mark />
            </div>
            <span className="text-[13px] font-medium tracking-tight">desin</span>
          </div>
          <p className="text-label text-muted-foreground">Lockup previews</p>
        </div>
      </div>
    </article>
  );
}

export default function LogoVersionsPage() {
  return (
    <div className="relative flex min-h-svh flex-col overflow-x-clip bg-sheet">
      <div className="sheet flex min-h-svh flex-col">
        <div className="relative flex flex-1 flex-col">
          <SheetEdges />

          <header className="sheet-pad relative flex h-14 items-center justify-between md:h-16">
            <BrandLogo size="md" />
            <nav className="hidden items-center gap-6 md:flex">
              {LOGO_GROUPS.map((group) => (
                <a
                  className="text-label text-muted-foreground transition-colors hover:text-foreground"
                  href={`#${group.id}`}
                  key={group.id}
                >
                  {group.title}
                </a>
              ))}
            </nav>
            <p className="text-label text-muted-foreground">Logo versions</p>
            <SectionRule className="bottom-0" />
          </header>

          <main className="sheet-pad flex flex-1 flex-col gap-20 py-12 md:py-16">
            <div className="relative flex max-w-2xl flex-col gap-3">
              <p className="text-label text-primary">Identity / marks</p>
              <h1 className="text-title font-medium">Logo icon candidates</h1>
              <p className="text-prose text-pretty text-foreground/80">
                Brand Brain from the product set, plus geometry explorations.
              </p>
              <SectionRule className="bottom-0 translate-y-8" />
            </div>

            {LOGO_GROUPS.map((group) => {
              const marks = LOGO_MARKS.filter((m) => m.group === group.id);
              return (
                <section className="relative flex flex-col gap-10" id={group.id} key={group.id}>
                  <div className="flex max-w-xl flex-col gap-2 border-t border-border pt-10">
                    <p className="text-label text-primary">{group.id}</p>
                    <h2 className="text-title font-medium">{group.title}</h2>
                    <p className="text-body text-pretty text-muted-foreground">
                      {group.blurb}
                    </p>
                  </div>

                  <div className="flex flex-col gap-10">
                    {marks.map((mark) => (
                      <MarkCard key={mark.id} {...mark} />
                    ))}
                  </div>
                </section>
              );
            })}
          </main>
        </div>
      </div>
    </div>
  );
}
