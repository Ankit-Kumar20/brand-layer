import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { brands, mcpOauthBrand, user } from "@/db/schema";
import { verifyApiKey } from "@/lib/auth-api-key";
import { auth } from "@/lib/auth";

export type McpSession = {
  userId: string;
  keyId: string;
  brandId: string | null;
  brandTag: string | null;
  email?: string;
  name?: string;
  apiKey: string;
  /** How the session was authenticated. */
  authMethod: "api_key" | "oauth";
  /** OAuth client id when authMethod is oauth. */
  clientId?: string;
};

async function loadUserProfile(userId: string): Promise<{
  email?: string;
  name?: string;
}> {
  try {
    const row = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });
    return { email: row?.email, name: row?.name };
  } catch {
    return {};
  }
}

async function resolveBrandForUser(
  userId: string,
  clientId?: string,
): Promise<{ brandId: string | null; brandTag: string | null }> {
  if (clientId) {
    const scoped = await db.query.mcpOauthBrand.findFirst({
      where: and(
        eq(mcpOauthBrand.userId, userId),
        eq(mcpOauthBrand.clientId, clientId),
      ),
    });
    if (scoped) {
      return { brandId: scoped.brandId, brandTag: scoped.brandTag };
    }
  }

  const brand = await db.query.brands.findFirst({
    where: eq(brands.userId, userId),
    orderBy: [desc(brands.updatedAt)],
  });
  if (!brand) return { brandId: null, brandTag: null };
  return { brandId: brand.id, brandTag: brand.brandTag };
}

/**
 * Resolve a Bearer sm_… key into MCP session props.
 * Never falls back to public/playground auth.
 */
export async function resolveApiKeyMcpSession(
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

  const profile = await loadUserProfile(verified.userId);

  return {
    userId: verified.userId,
    keyId: verified.keyId,
    brandId: verified.brandId,
    brandTag,
    email: profile.email,
    name: profile.name,
    apiKey: bearerToken,
    authMethod: "api_key",
  };
}

/**
 * Resolve an OAuth access token (ChatGPT / Claude connectors) into MCP session.
 */
export async function resolveOAuthMcpSession(
  request: Request,
): Promise<McpSession | null> {
  const token = await auth.api.getMcpSession({
    headers: request.headers,
  });
  if (!token?.userId) return null;

  const brand = await resolveBrandForUser(token.userId, token.clientId);
  const profile = await loadUserProfile(token.userId);

  return {
    userId: token.userId,
    keyId: `oauth:${token.clientId}`,
    brandId: brand.brandId,
    brandTag: brand.brandTag,
    email: profile.email,
    name: profile.name,
    // Tools that still expect a string token — not an sm_ key.
    apiKey: token.accessToken,
    authMethod: "oauth",
    clientId: token.clientId,
  };
}

/**
 * Dual auth: brand API key (Cursor/Claude Desktop) or OAuth (ChatGPT).
 */
export async function resolveMcpSession(
  bearerToken: string | undefined,
  request?: Request,
): Promise<McpSession | null> {
  if (bearerToken?.startsWith("sm_")) {
    return resolveApiKeyMcpSession(bearerToken);
  }
  if (request && bearerToken) {
    return resolveOAuthMcpSession(request);
  }
  return null;
}

export function requireBrandTag(
  session: McpSession,
  override?: string,
): string {
  const tag = override?.trim() || session.brandTag;
  if (!tag) {
    throw new Error(
      "brandTag is required — pick a brand during OAuth consent, use a brand-scoped API key, or pass brandTag.",
    );
  }
  return tag;
}

/** Persist brand selection from the OAuth consent page. */
export async function saveMcpOauthBrand(opts: {
  userId: string;
  clientId: string;
  brandId: string;
  brandTag: string;
}) {
  const existing = await db.query.mcpOauthBrand.findFirst({
    where: and(
      eq(mcpOauthBrand.userId, opts.userId),
      eq(mcpOauthBrand.clientId, opts.clientId),
    ),
  });

  if (existing) {
    await db
      .update(mcpOauthBrand)
      .set({
        brandId: opts.brandId,
        brandTag: opts.brandTag,
        updatedAt: new Date(),
      })
      .where(eq(mcpOauthBrand.id, existing.id));
    return;
  }

  await db.insert(mcpOauthBrand).values({
    id: nanoid(),
    userId: opts.userId,
    clientId: opts.clientId,
    brandId: opts.brandId,
    brandTag: opts.brandTag,
  });
}
