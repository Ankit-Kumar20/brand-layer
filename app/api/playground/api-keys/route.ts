import {
  createApiKey,
  ensureDefaultBrandApiKey,
} from "@/lib/auth-api-key";
import {
  ensureBrandForContainerTag,
  requireUserSession,
} from "@/lib/auth-session";

/**
 * Get or mint a brand-scoped API key for a containerTag.
 * Requires Better Auth session. Creates brand+org (+ key) when the tag is free.
 * Returns the recoverable raw key (encrypted at rest).
 */
export async function POST(request: Request) {
  try {
    const user = await requireUserSession(request);
    const body = (await request.json().catch(() => ({}))) as {
      containerTag?: string;
      name?: string;
      brandName?: string;
      /** When true, always mint a new key instead of revealing the existing one. */
      forceNew?: boolean;
    };

    const containerTag = body.containerTag?.trim();
    if (!containerTag) {
      return Response.json(
        { error: "containerTag is required" },
        { status: 400 },
      );
    }

    const brandResult = await ensureBrandForContainerTag(
      user.id,
      containerTag,
      { name: body.brandName },
    );

    const keyName =
      typeof body.name === "string" && body.name.trim()
        ? body.name.trim()
        : `playground-${new Date().toISOString().slice(0, 10)}`;

    let key;
    if ("apiKey" in brandResult && brandResult.apiKey && !body.forceNew) {
      // Brand was just created with a default key.
      key = brandResult.apiKey;
    } else if (body.forceNew) {
      key = await createApiKey(user.id, keyName, brandResult.id);
    } else {
      key = await ensureDefaultBrandApiKey(user.id, brandResult.id, keyName);
    }

    return Response.json({
      id: key.id,
      name: key.name,
      key: key.raw,
      prefix: key.prefix,
      userId: user.id,
      brandId: brandResult.id,
      containerTag: brandResult.containerTag,
      created: key.created,
      recoverable: key.recoverable,
      warning: key.created
        ? "Key is encrypted at rest and can be revealed again from the playground."
        : "Revealed existing key from encrypted storage.",
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
