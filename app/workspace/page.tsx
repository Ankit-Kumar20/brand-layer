import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { auth } from "@/lib/auth";
import { loadWorkspaceSearchParams } from "@/lib/workspace/search-params";

type WorkspacePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WorkspacePage({
  searchParams,
}: WorkspacePageProps) {
  // Validate/normalize workspace URL state (nuqs server loader).
  await loadWorkspaceSearchParams(searchParams);

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
