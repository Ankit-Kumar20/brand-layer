import { ensurePublicUser } from "@/lib/auth-api-key";
import { memoryError, memoryLog } from "@/lib/memory/log";
import { getProfile } from "@/lib/memory/profile";
import { ProfileSchema } from "@/lib/memory/schemas";
import { searchMemoriesAndDocuments } from "@/lib/memory/search";

export async function POST(request: Request) {
  try {
    const userId = await ensurePublicUser();
    const body = await request.json();
    const parsed = ProfileSchema.safeParse(body);
    if (!parsed.success) {
      memoryLog("api", "POST /v3/profile invalid", {
        issues: parsed.error.issues.length,
      });
      return Response.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    memoryLog("api", "POST /v3/profile", {
      containerTag: parsed.data.containerTag,
      includeSearch: !!parsed.data.includeSearch,
    });

    const profile = await getProfile(userId, parsed.data.containerTag);

    let searchResults;
    if (parsed.data.includeSearch && parsed.data.q) {
      searchResults = await searchMemoriesAndDocuments(userId, {
        q: parsed.data.q,
        containerTag: parsed.data.containerTag,
        searchMode: "hybrid",
        limit: 10,
        threshold: 0.3,
        includeRelated: false,
      });
    }

    memoryLog("api", "POST /v3/profile ok", {
      static: profile.static.length,
      dynamic: profile.dynamic.length,
    });

    return Response.json({
      profile: {
        static: profile.static,
        dynamic: profile.dynamic,
      },
      searchResults,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    memoryError("api", "POST /v3/profile error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
