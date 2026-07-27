import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import {
  brands,
  organizationMembers,
  organizations,
} from "@/db/schema";
import { createApiKey, ensurePublicUser } from "@/lib/auth-api-key";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

/**
 * Playground helper: mint a brand-scoped API key for a containerTag.
 * Creates a playground org + brand when the tag does not exist yet.
 */
export async function POST(request: Request) {
  const allowed =
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_DEV_API_KEYS === "true";
  if (!allowed) {
    return Response.json({ error: "Not available" }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      containerTag?: string;
      name?: string;
    };
    const containerTag = body.containerTag?.trim();
    if (!containerTag) {
      return Response.json(
        { error: "containerTag is required" },
        { status: 400 },
      );
    }

    const userId = await ensurePublicUser();

    let brand = await db.query.brands.findFirst({
      where: eq(brands.containerTag, containerTag),
    });

    if (!brand) {
      const orgId = nanoid();
      const brandId = nanoid();
      const slug = slugify(containerTag.replace(/^brand_/, "") || containerTag);
      const orgSlug = `playground-${slug}`.slice(0, 64);

      await db.insert(organizations).values({
        id: orgId,
        name: `Playground ${containerTag}`,
        slug: orgSlug,
      });
      await db.insert(organizationMembers).values({
        id: nanoid(),
        organizationId: orgId,
        userId,
        role: "owner",
      });
      await db.insert(brands).values({
        id: brandId,
        organizationId: orgId,
        name: containerTag,
        slug: slug || brandId.slice(0, 8),
        containerTag,
      });

      brand = await db.query.brands.findFirst({
        where: eq(brands.id, brandId),
      });
    }

    if (!brand) {
      return Response.json(
        { error: "Failed to resolve brand for containerTag" },
        { status: 500 },
      );
    }

    const keyName =
      typeof body.name === "string" && body.name.trim()
        ? body.name.trim()
        : `playground-${new Date().toISOString().slice(0, 10)}`;

    const key = await createApiKey(userId, keyName, brand.id);

    return Response.json({
      id: key.id,
      name: key.name,
      key: key.raw,
      prefix: key.prefix,
      userId,
      brandId: brand.id,
      containerTag: brand.containerTag,
      warning: "Store this key now; it will not be shown again.",
    });
  } catch (err) {
    return Response.json(
      {
        error: "Failed to create playground API key",
        detail: err instanceof Error ? err.message : String(err),
        hint: "Ensure organizations/brands/api_keys migrations have been applied.",
      },
      { status: 500 },
    );
  }
}
