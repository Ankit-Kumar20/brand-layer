import { headers } from "next/headers";
import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { SetupClient } from "./setup-client";

export const metadata: Metadata = {
  title: "Set up your brand | desin",
  description:
    "Paste your website, and desin sets up your brand context automatically for Claude, Cursor, and ChatGPT.",
};

export default async function SetupPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <SetupClient
      user={
        session?.user
          ? {
              id: session.user.id,
              name: session.user.name,
              email: session.user.email,
              image: session.user.image,
            }
          : null
      }
    />
  );
}
