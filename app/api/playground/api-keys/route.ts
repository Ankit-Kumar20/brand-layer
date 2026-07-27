import { createApiKey } from "@/lib/auth-api-key";
import {
  ensureBrandForContainerTag,
  requireUserSession,
} from "@/lib/auth-session";

/**
 * Mint a brand-scoped API key for a containerTag.
 * Requires Better Auth session. Creates brand+org when the tag is free.
 * Always persists to api_keys with brand_id set.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUserSession(request);
    const body = (await request.json().catch(() => ({}))) as {
      containerTag?: string;
      name?: string;
      brandName?: string;
    };

    const containerTag = body.containerTag?.trim();
    if (!containerTag) {
      return Response.json(
        { error: "containerTag is required" },
        { status: 400 },
      );
    }

    const brand = await ensureBrandForContainerTag(user.id, containerTag, {
      name: body.brandName,
    });

    const keyName =
      typeof body.name === "string" && body.name.trim()
        ? body.name.trim()
        : `playground-${new Date().toISOString().slice(0, 10)}`;

    const key = await createApiKey(user.id, keyName, brand.id);

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
        error: "Failed to create playground API key",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
