import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { createApiKey } from "@/lib/auth-api-key";
import { getBrandIfMember, requireUserSession } from "@/lib/auth-session";

/**
 * List API key metadata for a brand (no raw secrets).
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ brandId: string }> },
) {
  try {
    const user = await requireUserSession(request);
    const { brandId } = await context.params;
    const brand = await getBrandIfMember(user.id, brandId);
    if (!brand) {
      return Response.json({ error: "Brand not found" }, { status: 404 });
    }

    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        prefix: apiKeys.keyPrefix,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(and(eq(apiKeys.brandId, brand.id), eq(apiKeys.userId, user.id)))
      .orderBy(desc(apiKeys.createdAt));

    return Response.json({
      brandId: brand.id,
      containerTag: brand.containerTag,
      keys,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json(
      {
        error: "Failed to list API keys",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

/**
 * Mint an API key scoped to a brand (sets api_keys.brand_id).
 * Requires session + org membership.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ brandId: string }> },
) {
  try {
    const user = await requireUserSession(request);
    const { brandId } = await context.params;
    const brand = await getBrandIfMember(user.id, brandId);
    if (!brand) {
      return Response.json({ error: "Brand not found" }, { status: 404 });
    }

    let name = "default";
    try {
      const body = await request.json();
      if (typeof body?.name === "string" && body.name.trim()) {
        name = body.name.trim();
      }
    } catch {
      // empty body ok
    }

    const key = await createApiKey(user.id, name, brand.id);

    return Response.json({
      id: key.id,
      name: key.name,
      key: key.raw,
      prefix: key.prefix,
      userId: user.id,
      brandId: brand.id,
      containerTag: brand.containerTag,
      warning: "Store this key now; it will not be shown again.",
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json(
      {
        error: "Failed to create brand API key",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
