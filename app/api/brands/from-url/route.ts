import { createBrandFromUrl } from "@/lib/brand/create-from-url";
import { requireUserSession } from "@/lib/auth-session";

/** Create a brand by scraping a website URL (Firecrawl → name → brand + ingest). */
export async function POST(request: Request) {
  try {
    const user = await requireUserSession(request);
    const body = (await request.json().catch(() => ({}))) as {
      url?: string;
      name?: string;
    };

    if (!body.url?.trim()) {
      return Response.json({ error: "url is required" }, { status: 400 });
    }

    const result = await createBrandFromUrl(user.id, {
      url: body.url,
      name: body.name,
    });

    return Response.json({
      brand: result.brand,
      apiKey: {
        id: result.apiKey.id,
        name: result.apiKey.name,
        key: result.apiKey.raw,
        prefix: result.apiKey.prefix,
        created: result.apiKey.created,
        recoverable: true,
      },
      documentId: result.documentId,
      resolvedName: result.resolvedName,
      sourceUrl: result.sourceUrl,
      metadata: result.metadata,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json(
      {
        error: "Failed to create brand from URL",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
