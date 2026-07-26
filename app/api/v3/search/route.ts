import {
  requireApiAuth,
  resolveContainerTag,
} from "@/lib/auth-request";
import { memoryError, memoryLog } from "@/lib/memory/log";
import { SearchSchema } from "@/lib/memory/schemas";
import { searchMemoriesAndDocuments } from "@/lib/memory/search";

export async function POST(request: Request) {
  try {
    const auth = await requireApiAuth(request);
    const body = await request.json();
    const parsed = SearchSchema.safeParse(body);
    if (!parsed.success) {
      memoryLog("api", "POST /v3/search invalid", {
        issues: parsed.error.issues.length,
      });
      return Response.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const containerTag = resolveContainerTag(auth, parsed.data.containerTag);

    memoryLog("api", "POST /v3/search", {
      containerTag,
      mode: parsed.data.searchMode,
      q: parsed.data.q.slice(0, 80),
    });

    const result = await searchMemoriesAndDocuments(auth.userId, {
      ...parsed.data,
      containerTag,
    });
    memoryLog("api", "POST /v3/search ok", { total: result.total });
    return Response.json(result);
  } catch (err) {
    if (err instanceof Response) return err;
    memoryError("api", "POST /v3/search error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
