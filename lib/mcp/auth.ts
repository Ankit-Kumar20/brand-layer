import { eq } from "drizzle-orm";
import { db } from "@/db";
import { brands, user } from "@/db/schema";
import { verifyApiKey } from "@/lib/auth-api-key";

export type McpSession = {
  userId: string;
  keyId: string;
  brandId: string | null;
  brandTag: string | null;
  email?: string;
  name?: string;
  apiKey: string;
};

/**
 * Resolve a Bearer sm_… key into MCP session props.
 * Never falls back to public/playground auth.
 */
export async function resolveMcpSession(
  bearerToken: string | undefined,
): Promise<McpSession | null> {
  if (!bearerToken?.startsWith("sm_")) return null;

  const verified = await verifyApiKey(`Bearer ${bearerToken}`);
  if (!verified) return null;

  let brandTag: string | null = null;
  if (verified.brandId) {
    try {
      const brand = await db.query.brands.findFirst({
        where: eq(brands.id, verified.brandId),
      });
      brandTag = brand?.brandTag ?? null;
    } catch {
      brandTag = null;
    }
  }

  let email: string | undefined;
  let name: string | undefined;
  try {
    const row = await db.query.user.findFirst({
      where: eq(user.id, verified.userId),
    });
    email = row?.email;
    name = row?.name;
  } catch {
    // best-effort
  }

  return {
    userId: verified.userId,
    keyId: verified.keyId,
    brandId: verified.brandId,
    brandTag,
    email,
    name,
    apiKey: bearerToken,
  };
}

export function requireBrandTag(
  session: McpSession,
  override?: string,
): string {
  const tag = override?.trim() || session.brandTag;
  if (!tag) {
    throw new Error(
      "brandTag is required — use a brand-scoped API key or pass brandTag.",
    );
  }
  return tag;
}
