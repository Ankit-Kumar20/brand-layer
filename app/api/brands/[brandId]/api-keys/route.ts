import { eq } from "drizzle-orm";
import { db } from "@/db";
import { brands } from "@/db/schema";
import { createApiKey, ensurePublicUser } from "@/lib/auth-api-key";

/**
 * Mint an API key scoped to a brand (sets api_keys.brand_id).
 * Requires brand workspace migration.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ brandId: string }> },
) {
  const allowed =
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_DEV_API_KEYS === "true";
  if (!allowed) {
    return Response.json({ error: "Not available" }, { status: 403 });
  }

  try {
    const { brandId } = await context.params;
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });
    if (!brand) {
      return Response.json({ error: "Brand not found" }, { status: 404 });
    }

    let name = "default";
    try {
      const body = await request.json();
      if (typeof body?.name === "string") name = body.name;
    } catch {
      // empty body ok
    }

    const userId = await ensurePublicUser();
    const key = await createApiKey(userId, name, brand.id);

    return Response.json({
      id: key.id,
      name: key.name,
      key: key.raw,
      prefix: key.prefix,
      userId,
      brandId: brand.id,
      containerTag: brand.containerTag,
      warning: "Store this key now; it will not be shown again.",
    });
  } catch (err) {
    return Response.json(
      {
        error: "Failed to create brand API key",
        detail: err instanceof Error ? err.message : String(err),
        hint: "Ensure brand_id column exists on api_keys (run migrate).",
      },
      { status: 500 },
    );
  }
}
