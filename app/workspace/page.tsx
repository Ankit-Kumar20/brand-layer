import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { auth } from "@/lib/auth";

export default async function WorkspacePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/?auth=1&next=/workspace");
  }

  return (
    <WorkspaceShell
      user={{
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      }}
    />
  );
}
