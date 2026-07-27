import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Playground } from "@/components/playground/Playground";
import { auth } from "@/lib/auth";

export default async function PlaygroundPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/?auth=1&next=/playground");
  }

  return (
    <Playground
      user={{
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      }}
    />
  );
}
