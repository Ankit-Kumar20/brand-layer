import { eq } from "drizzle-orm";
import { db } from "@/db";
import { brands } from "@/db/schema";
import {
  verifyApiKey,
  type ApiKeyAuth,
} from "@/lib/auth-api-key";
import {
  getBrandByBrandTagIfOwner,
  getSessionUser,
} from "@/lib/auth-session";

export type RequestAuth = {
  userId: string;
  keyId: string | null;
  brandId: string | null;
  /** When set from a brand-scoped key, routes must use this tag. */
  forcedBrandTag: string | null;
};

/**
 * Resolve caller identity for /v3 routes.
 * - Bearer API key → user (+ optional brandTag)
 * - Better Auth session → user (must own the brandTag)
 * - Otherwise → 401
 */
export async function requireApiAuth(
  request: Request,
): Promise<RequestAuth> {
  const verified = await verifyApiKey(request.headers.get("Authorization"));
  if (verified) {
    const forced = await brandTagFromApiKey(verified);
    return {
      userId: verified.userId,
      keyId: verified.keyId,
      brandId: verified.brandId,
      forcedBrandTag: forced,
    };
  }

  const sessionUser = await getSessionUser(request);
  if (sessionUser) {
    return {
      userId: sessionUser.id,
      keyId: null,
      brandId: null,
      forcedBrandTag: null,
    };
  }

  throw Response.json(
    { error: "Unauthorized — Bearer API key or sign-in required" },
    { status: 401 },
  );
}

/**
 * Prefer key-bound brand tag. For session auth, require ownership of the tag.
 */
export async function resolveBrandTag(
  auth: RequestAuth,
  clientTag: string | undefined,
): Promise<string> {
  if (auth.forcedBrandTag) return auth.forcedBrandTag;

  const tag = clientTag?.trim();
  if (!tag) {
    throw Response.json(
      { error: "brandTag is required" },
      { status: 400 },
    );
  }

  // Brand-scoped key already forced above. Session (or unscoped key):
  // require the user to own a brand with this tag.
  if (!auth.keyId || !auth.brandId) {
    const brand = await getBrandByBrandTagIfOwner(auth.userId, tag);
    if (!brand) {
      throw Response.json(
        { error: "Forbidden — no access to this brandTag" },
        { status: 403 },
      );
    }
  }

  return tag;
}

async function brandTagFromApiKey(
  auth: ApiKeyAuth,
): Promise<string | null> {
  if (!auth.brandId) return null;
  try {
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, auth.brandId),
    });
    return brand?.brandTag ?? null;
  } catch {
    return null;
  }
}
