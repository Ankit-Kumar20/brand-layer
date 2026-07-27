import { inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import {
  brands,
  organizationMembers,
  organizations,
} from "@/db/schema";
import { listUserBrands, requireUserSession } from "@/lib/auth-session";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

/**
 * Create an organization (+ optional first brand) for the signed-in user.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUserSession(request);
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
      userId: user.id,
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
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json(
      {
        error: "Failed to create organization",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireUserSession(request);
    const userBrands = await listUserBrands(user.id);
    const orgIds = [...new Set(userBrands.map((b) => b.organizationId))];

    if (orgIds.length === 0) {
      return Response.json({ organizations: [] });
    }

    const rows = await db
      .select()
      .from(organizations)
      .where(inArray(organizations.id, orgIds));

    return Response.json({ organizations: rows });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json(
      {
        error: "Organizations unavailable",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
