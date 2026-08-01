import { eq } from "drizzle-orm";
import { db } from "@/db";
import { brands, user } from "@/db/schema";
import { verifyApiKey } from "@/lib/auth-api-key";
import { memoryError, memoryLog } from "@/lib/memory/log";

/**
 * MCP / agent session introspection.
 * Requires a real Bearer API key — never falls back to public playground auth.
 */
export async function GET(request: Request) {
  try {
    const verified = await verifyApiKey(request.headers.get("Authorization"));
    if (!verified) {
      return Response.json(
        { error: "Unauthorized — Bearer API key required" },
        { status: 401 },
      );
    }

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
      // user lookup is best-effort
    }

    memoryLog("api", "GET /v3/session", {
      userId: verified.userId,
      brandId: verified.brandId,
      brandTag,
    });

    return Response.json({
      user: {
        id: verified.userId,
        email,
        name,
      },
      brandId: verified.brandId,
      brandTag,
      keyId: verified.keyId,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    memoryError("api", "GET /v3/session error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
