import { headers } from "next/headers";

import {
  Faq,
  Footer,
  GetStarted,
  Hero,
  HowItWorks,
  McpSetup,
  Pricing,
  SheetEdges,
  TopBar,
} from "@/components/landing";
import { auth } from "@/lib/auth";

export default async function Home() {
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

          <main className="flex flex-1 flex-col">
            <Hero signedIn={signedIn} />
            <HowItWorks />
            <Pricing />
            <McpSetup />
            <Faq />
            <GetStarted />
          </main>
        </div>

        <Footer />
      </div>
    </div>
  );
}
