import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import {
  brands,
  organizationMembers,
  organizations,
} from "@/db/schema";
import { ensurePublicUser } from "@/lib/auth-api-key";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

/**
 * Create an organization (+ optional first brand).
 * Dev/public-friendly until session org auth is wired.
 * Requires brands/organizations tables (run migrate first).
 */
export async function POST(request: Request) {
  const allowed =
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_DEV_API_KEYS === "true";
  if (!allowed) {
    return Response.json({ error: "Not available" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      slug?: string;
      brandName?: string;
      brandSlug?: string;
    };

    const name = body.name?.trim();
    if (!name) {
      return Response.json({ error: "name is required" }, { status: 400 });
    }

    const userId = await ensurePublicUser();
    const orgId = nanoid();
    const orgSlug = body.slug?.trim() || slugify(name);

    await db.insert(organizations).values({
      id: orgId,
      name,
      slug: orgSlug,
    });

    await db.insert(organizationMembers).values({
      id: nanoid(),
      organizationId: orgId,
      userId,
      role: "owner",
    });

    let brand = null;
    if (body.brandName?.trim() || body.brandSlug?.trim()) {
      const brandName = body.brandName?.trim() || name;
      const brandSlug = body.brandSlug?.trim() || slugify(brandName);
      const brandId = nanoid();
      const containerTag = `brand_${brandSlug}`;
      await db.insert(brands).values({
        id: brandId,
        organizationId: orgId,
        name: brandName,
        slug: brandSlug,
        containerTag,
      });
      brand = { id: brandId, name: brandName, slug: brandSlug, containerTag };
    }

    return Response.json({
      organization: { id: orgId, name, slug: orgSlug },
      brand,
      warning:
        "Requires migrated organizations/brands tables. Store brand id for API keys.",
    });
  } catch (err) {
    return Response.json(
      {
        error: "Failed to create organization",
        detail: err instanceof Error ? err.message : String(err),
        hint: "Run db:migrate after applying the brand workspace migration.",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const rows = await db.select().from(organizations).limit(50);
    return Response.json({ organizations: rows });
  } catch (err) {
    return Response.json(
      {
        error: "Organizations unavailable",
        detail: err instanceof Error ? err.message : String(err),
        hint: "Run db:migrate for brand workspace tables.",
      },
      { status: 500 },
    );
  }
}
