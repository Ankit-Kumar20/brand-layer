import { ensurePublicUser } from "@/lib/auth-api-key";
import { SearchSchema } from "@/lib/memory/schemas";
import { searchMemoriesAndDocuments } from "@/lib/memory/search";

export async function POST(request: Request) {
  try {
    const userId = await ensurePublicUser();
    const body = await request.json();
    const parsed = SearchSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await searchMemoriesAndDocuments(userId, parsed.data);
    return Response.json(result);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
