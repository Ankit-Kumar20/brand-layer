import { requireApiKey } from "@/lib/auth-api-key";
import { getProfile } from "@/lib/memory/profile";
import { ProfileSchema } from "@/lib/memory/schemas";
import { searchMemoriesAndDocuments } from "@/lib/memory/search";

export async function POST(request: Request) {
  try {
    const auth = await requireApiKey(request);
    const body = await request.json();
    const parsed = ProfileSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const profile = await getProfile(auth.userId, parsed.data.containerTag);

    let searchResults;
    if (parsed.data.includeSearch && parsed.data.q) {
      searchResults = await searchMemoriesAndDocuments(auth.userId, {
        q: parsed.data.q,
        containerTag: parsed.data.containerTag,
        searchMode: "hybrid",
        limit: 10,
        threshold: 0.3,
        includeRelated: false,
      });
    }

    return Response.json({
      profile: {
        static: profile.static,
        dynamic: profile.dynamic,
      },
      searchResults,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
