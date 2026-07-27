import { eq } from "drizzle-orm";
import { db } from "@/db";
import { brands, user } from "@/db/schema";
import { verifyApiKey } from "@/lib/auth-api-key";

export type McpSession = {
  userId: string;
  keyId: string;
  brandId: string | null;
  containerTag: string | null;
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

  let containerTag: string | null = null;
  if (verified.brandId) {
    try {
      const brand = await db.query.brands.findFirst({
        where: eq(brands.id, verified.brandId),
      });
      containerTag = brand?.containerTag ?? null;
    } catch {
      containerTag = null;
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
    containerTag,
    email,
    name,
    apiKey: bearerToken,
  };
}

export function requireContainerTag(
  session: McpSession,
  override?: string,
): string {
  const tag = override?.trim() || session.containerTag;
  if (!tag) {
    throw new Error(
      "containerTag is required — use a brand-scoped API key or pass containerTag.",
    );
  }
  return tag;
}
