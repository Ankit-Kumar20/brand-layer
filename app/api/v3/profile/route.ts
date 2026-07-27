import {
  requireApiAuth,
  resolveContainerTag,
} from "@/lib/auth-request";
import { memoryError, memoryLog } from "@/lib/memory/log";
import { getProfile } from "@/lib/memory/profile";
import { ProfileSchema } from "@/lib/memory/schemas";
import { searchMemoriesAndDocuments } from "@/lib/memory/search";

export async function POST(request: Request) {
  try {
    const auth = await requireApiAuth(request);
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

    const containerTag = await resolveContainerTag(
      auth,
      parsed.data.containerTag,
    );

    memoryLog("api", "POST /v3/profile", {
      containerTag,
      includeSearch: !!parsed.data.includeSearch,
    });

    const profile = await getProfile(auth.userId, containerTag);

    let searchResults;
    if (parsed.data.includeSearch && parsed.data.q) {
      searchResults = await searchMemoriesAndDocuments(auth.userId, {
        q: parsed.data.q,
        containerTag,
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
        staticCard: profile.staticCard,
        dynamicCard: profile.dynamicCard,
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
