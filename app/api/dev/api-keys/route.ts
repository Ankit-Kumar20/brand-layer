import { createApiKey, ensurePublicUser } from "@/lib/auth-api-key";

/**
 * Dev-only: mint an API key for the shared public user (not brand-scoped).
 * For brand-scoped keys use POST /api/brands/:brandId/api-keys after migrate.
 * Disabled when NODE_ENV=production unless ALLOW_DEV_API_KEYS=true.
 */
export async function POST(request: Request) {
  const allowed =
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_DEV_API_KEYS === "true";

  if (!allowed) {
    return Response.json({ error: "Not available" }, { status: 403 });
  }

  let name = "default";
  try {
    const body = await request.json();
    if (typeof body?.name === "string") name = body.name;
  } catch {
    // empty body ok
  }

  const userId = await ensurePublicUser();
  const key = await createApiKey(userId, name);

  return Response.json({
    id: key.id,
    name: key.name,
    key: key.raw,
    prefix: key.prefix,
    userId,
    warning: "Store this key now; it will not be shown again.",
  });
}
