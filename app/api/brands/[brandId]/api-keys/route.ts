import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import {
  createApiKey,
  ensureDefaultBrandApiKey,
  revealBrandApiKey,
} from "@/lib/auth-api-key";
import { getBrandIfOwner, requireUserSession } from "@/lib/auth-session";

/**
 * List API key metadata for a brand.
 * Pass ?reveal=1 to also return the default key's raw secret (from ciphertext).
 * Pass ?keyId=… with ?reveal=1 to reveal a specific key.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ brandId: string }> },
) {
  try {
    const user = await requireUserSession(request);
    const { brandId } = await context.params;
    const brand = await getBrandIfOwner(user.id, brandId);
    if (!brand) {
      return Response.json({ error: "Brand not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const reveal = url.searchParams.get("reveal") === "1";
    const keyId = url.searchParams.get("keyId");

    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        prefix: apiKeys.keyPrefix,
        recoverable: apiKeys.keyCiphertext,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(and(eq(apiKeys.brandId, brand.id), eq(apiKeys.userId, user.id)))
      .orderBy(desc(apiKeys.createdAt));

    const listed = keys.map((k) => ({
      id: k.id,
      name: k.name,
      prefix: k.prefix,
      recoverable: Boolean(k.recoverable),
      createdAt: k.createdAt,
    }));

    if (!reveal) {
      return Response.json({
        brandId: brand.id,
        brandTag: brand.brandTag,
        keys: listed,
      });
    }

    let revealed;
    if (keyId) {
      revealed = await revealBrandApiKey(user.id, brand.id, keyId);
    } else {
      revealed = await ensureDefaultBrandApiKey(user.id, brand.id);
    }

    return Response.json({
      brandId: brand.id,
      brandTag: brand.brandTag,
      keys: listed,
      revealed: revealed
        ? {
            id: revealed.id,
            name: revealed.name,
            key: revealed.raw,
            prefix: revealed.prefix,
            created: revealed.created,
            recoverable: revealed.recoverable,
          }
        : null,
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
 * Requires session + brand ownership. Stores encrypted ciphertext.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ brandId: string }> },
) {
  try {
    const user = await requireUserSession(request);
    const { brandId } = await context.params;
    const brand = await getBrandIfOwner(user.id, brandId);
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
      brandTag: brand.brandTag,
      created: key.created,
      recoverable: true,
      warning:
        "Key is encrypted at rest and can be revealed again with ?reveal=1.",
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
