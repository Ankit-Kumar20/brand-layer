import { headers } from "next/headers";
import type { ReactNode } from "react";

import { Footer } from "@/components/landing/footer";
import { SectionRule, SheetEdges } from "@/components/landing/section-rule";
import { TopBar } from "@/components/landing/topbar";
import { auth } from "@/lib/auth";

type SiteShellProps = {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export async function SiteShell({
  eyebrow,
  title,
  description,
  children,
}: SiteShellProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const signedIn = Boolean(session);

  return (
    <div className="relative flex min-h-svh flex-col overflow-x-clip bg-sheet">
      <div className="sheet flex min-h-svh flex-col">
        <div className="relative flex flex-1 flex-col">
          <SheetEdges />
          <TopBar signedIn={signedIn} />

          <main className="relative flex flex-1 flex-col">
            <div className="sheet-pad flex flex-1 flex-col py-12 md:py-16">
              <div className="mx-auto flex w-full max-w-2xl flex-col gap-12 md:gap-16">
                <div className="flex flex-col gap-3">
                  <p className="text-label text-primary">{eyebrow}</p>
                  <h1 className="text-title font-medium text-balance">{title}</h1>
                  {description ? (
                    <p className="text-prose text-pretty text-foreground/80">
                      {description}
                    </p>
                  ) : null}
                </div>

                {children}
              </div>
            </div>
            <SectionRule className="bottom-0" />
          </main>
        </div>

        <Footer />
      </div>
    </div>
  );
}
