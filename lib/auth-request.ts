import { eq } from "drizzle-orm";
import { db } from "@/db";
import { brands } from "@/db/schema";
import {
  ensurePublicUser,
  verifyApiKey,
  type ApiKeyAuth,
} from "@/lib/auth-api-key";

export type RequestAuth = {
  userId: string;
  keyId: string | null;
  brandId: string | null;
  /** When set from a brand-scoped key, routes must use this tag. */
  forcedContainerTag: string | null;
};

/**
 * Resolve caller identity for /v3 routes.
 * - Bearer API key → user (+ optional brand containerTag after migrate)
 * - No key in non-production → shared public user (playground)
 * - No key in production → 401
 */
export async function requireApiAuth(
  request: Request,
): Promise<RequestAuth> {
  const verified = await verifyApiKey(request.headers.get("Authorization"));
  if (verified) {
    const forced = await resolveBrandContainerTag(verified);
    return {
      userId: verified.userId,
      keyId: verified.keyId,
      brandId: verified.brandId,
      forcedContainerTag: forced,
    };
  }

  const allowPublic =
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_PUBLIC_V3 === "true";

  if (!allowPublic) {
    throw Response.json(
      { error: "Unauthorized — Bearer API key required" },
      { status: 401 },
    );
  }

  const userId = await ensurePublicUser();
  return {
    userId,
    keyId: null,
    brandId: null,
    forcedContainerTag: null,
  };
}

/** Prefer key-bound brand tag over client-supplied containerTag. */
export function resolveContainerTag(
  auth: RequestAuth,
  clientTag: string | undefined,
): string {
  if (auth.forcedContainerTag) return auth.forcedContainerTag;
  if (clientTag?.trim()) return clientTag.trim();
  throw Response.json(
    { error: "containerTag is required" },
    { status: 400 },
  );
}

async function resolveBrandContainerTag(
  auth: ApiKeyAuth,
): Promise<string | null> {
  if (!auth.brandId) return null;
  try {
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, auth.brandId),
    });
    return brand?.containerTag ?? null;
  } catch {
    // brands table may not exist until migrate
    return null;
  }
}
