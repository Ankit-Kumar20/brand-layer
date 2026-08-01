import { eq } from "drizzle-orm";
import { db } from "@/db";
import { brands } from "@/db/schema";
import { requireUserSession } from "@/lib/auth-session";
import { saveMcpOauthBrand } from "@/lib/mcp/auth";

/** Persist which brand an MCP OAuth client may use for this user. */
export async function POST(request: Request) {
  try {
    const user = await requireUserSession(request);
    const body = (await request.json().catch(() => ({}))) as {
      clientId?: string;
      brandId?: string;
      brandTag?: string;
    };

    if (!body.clientId?.trim() || !body.brandId?.trim()) {
      return Response.json(
        { error: "clientId and brandId are required" },
        { status: 400 },
      );
    }

    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, body.brandId),
    });
    if (!brand || brand.userId !== user.id) {
      return Response.json({ error: "Brand not found" }, { status: 404 });
    }

    await saveMcpOauthBrand({
      userId: user.id,
      clientId: body.clientId.trim(),
      brandId: brand.id,
      brandTag: brand.brandTag,
    });

    return Response.json({
      ok: true,
      brandId: brand.id,
      brandTag: brand.brandTag,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json(
      {
        error: "Failed to save MCP brand scope",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
