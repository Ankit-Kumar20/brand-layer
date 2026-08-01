import type { Metadata } from "next";

import { BrandLogo } from "@/components/logo/brand-logo";
import { BrandBrain3DLazy } from "@/components/logo/brand-brain-3d-lazy";
import { SectionRule, SheetEdges } from "@/components/landing/section-rule";

export const metadata: Metadata = {
  title: "Branding - desin",
  description: "The desin brand mark.",
};

export default function BrandingPage() {
  return (
    <div className="relative flex min-h-svh flex-col overflow-x-clip bg-sheet">
      <div className="sheet flex min-h-svh flex-col">
        <div className="relative flex flex-1 flex-col">
          <SheetEdges />

          <header className="sheet-pad relative flex h-14 items-center justify-between md:h-16">
            <BrandLogo size="md" />
            <p className="text-label text-muted-foreground">Branding</p>
            <SectionRule className="bottom-0" />
          </header>

          <main className="sheet-pad flex flex-1 flex-col gap-10 py-10 md:gap-12 md:py-14">
            <div className="relative flex max-w-2xl flex-col gap-3">
              <p className="text-label text-primary">Identity / mark</p>
              <h1 className="text-title font-medium">Brand Brain</h1>
              <p className="text-prose text-pretty text-foreground/80">
                Dashed system ring with a solid orange live core.
              </p>
            </div>

            <BrandBrain3DLazy />
          </main>
        </div>
      </div>
    </div>
  );
}
