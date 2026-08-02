import { createBrandKitFromUrl } from "@/lib/brand-kit/from-url";
import { BrandKitFromUrlSchema } from "@/lib/brand-kit/schemas";
import { requireUserSession } from "@/lib/auth-session";

/** Create a new brand + editable kit from a website URL; also queues memory ingest. */
export async function POST(request: Request) {
  try {
    const user = await requireUserSession(request);
    const body = await request.json().catch(() => ({}));
    const parsed = BrandKitFromUrlSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await createBrandKitFromUrl(user.id, parsed.data);

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
      kit: result.kit,
      documentId: result.documentId,
      brandKitDocumentId: result.brandKitDocumentId,
      resolvedName: result.resolvedName,
      sourceUrl: result.sourceUrl,
      metadata: result.metadata,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json(
      {
        error: "Failed to create brand kit from URL",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
