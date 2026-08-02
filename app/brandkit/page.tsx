import type { Metadata } from "next";
import { headers } from "next/headers";

import { BrandKitApp } from "@/components/brandkit/brand-kit-app";
import { Footer } from "@/components/landing/footer";
import { SheetEdges } from "@/components/landing/section-rule";
import { TopBar } from "@/components/landing/topbar";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Brand kit - desin",
  description:
    "Import a website URL into a structured, editable brand kit — identity, colors, fonts, tone.",
};

export default async function BrandKitPage() {
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
            <BrandKitApp signedIn={signedIn} />
          </main>
        </div>
        <Footer />
      </div>
    </div>
  );
}
