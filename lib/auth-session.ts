import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { db } from "@/db";
import {
  brands,
  organizationMembers,
  organizations,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  createApiKey,
  type CreatedApiKey,
} from "@/lib/auth-api-key";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

export type BrandRow = {
  id: string;
  name: string;
  slug: string;
  containerTag: string;
  organizationId: string;
};

export type BrandWithApiKey = BrandRow & {
  apiKey: CreatedApiKey;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

/** Better Auth session from request cookies (API routes or RSC). */
export async function getSessionUser(
  request?: Request,
): Promise<SessionUser | null> {
  const session = await auth.api.getSession({
    headers: request ? request.headers : await headers(),
  });
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
}

/** Require a signed-in user or throw a Response (401). */
export async function requireUserSession(
  request?: Request,
): Promise<SessionUser> {
  const user = await getSessionUser(request);
  if (!user) {
    throw Response.json(
      { error: "Unauthorized — sign in required" },
      { status: 401 },
    );
  }
  return user;
}

/** Brands the user can access via organization membership. */
export async function listUserBrands(userId: string): Promise<BrandRow[]> {
  const memberships = await db
    .select({
      id: brands.id,
      name: brands.name,
      slug: brands.slug,
      containerTag: brands.containerTag,
      organizationId: brands.organizationId,
    })
    .from(brands)
    .innerJoin(
      organizationMembers,
      eq(organizationMembers.organizationId, brands.organizationId),
    )
    .where(eq(organizationMembers.userId, userId));

  return memberships;
}

export async function getBrandIfMember(
  userId: string,
  brandId: string,
): Promise<BrandRow | null> {
  const rows = await db
    .select({
      id: brands.id,
      name: brands.name,
      slug: brands.slug,
      containerTag: brands.containerTag,
      organizationId: brands.organizationId,
    })
    .from(brands)
    .innerJoin(
      organizationMembers,
      eq(organizationMembers.organizationId, brands.organizationId),
    )
    .where(
      and(eq(brands.id, brandId), eq(organizationMembers.userId, userId)),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function getBrandByContainerTagIfMember(
  userId: string,
  containerTag: string,
): Promise<BrandRow | null> {
  const rows = await db
    .select({
      id: brands.id,
      name: brands.name,
      slug: brands.slug,
      containerTag: brands.containerTag,
      organizationId: brands.organizationId,
    })
    .from(brands)
    .innerJoin(
      organizationMembers,
      eq(organizationMembers.organizationId, brands.organizationId),
    )
    .where(
      and(
        eq(brands.containerTag, containerTag),
        eq(organizationMembers.userId, userId),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Resolve a brand the user can access by containerTag, or create one under
 * a personal playground org when the tag is free.
 * New brands always get a brand-scoped API key (encrypted at rest).
 */
export async function ensureBrandForContainerTag(
  userId: string,
  containerTag: string,
  opts?: { name?: string },
): Promise<BrandRow | BrandWithApiKey> {
  const tag = containerTag.trim();
  if (!tag) {
    throw Response.json(
      { error: "containerTag is required" },
      { status: 400 },
    );
  }

  const existingMember = await getBrandByContainerTagIfMember(userId, tag);
  if (existingMember) return existingMember;

  const existing = await db.query.brands.findFirst({
    where: eq(brands.containerTag, tag),
  });
  if (existing) {
    throw Response.json(
      { error: "containerTag is owned by another workspace" },
      { status: 403 },
    );
  }

  const slug = slugify(tag.replace(/^brand_/, "") || tag) || nanoid(8);
  const orgId = nanoid();
  const brandId = nanoid();
  const orgSlug = `user-${userId.slice(0, 8)}-${slug}`.slice(0, 64);
  const brandName = opts?.name?.trim() || tag;

  await db.insert(organizations).values({
    id: orgId,
    name: brandName,
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
    name: brandName,
    slug,
    containerTag: tag,
  });

  const apiKey = await createApiKey(userId, "default", brandId);

  return {
    id: brandId,
    name: brandName,
    slug,
    containerTag: tag,
    organizationId: orgId,
    apiKey,
  };
}

/** Create a brand with a derived containerTag under the user's org (+ API key). */
export async function createUserBrand(
  userId: string,
  input: { name: string; slug?: string; organizationId?: string },
): Promise<BrandWithApiKey> {
  const name = input.name.trim();
  if (!name) {
    throw Response.json({ error: "name is required" }, { status: 400 });
  }

  const brandSlug = slugify(input.slug?.trim() || name) || nanoid(8);
  const containerTag = `brand_${brandSlug}`;

  const taken = await db.query.brands.findFirst({
    where: eq(brands.containerTag, containerTag),
  });
  if (taken) {
    throw Response.json(
      { error: "Brand slug / containerTag already exists" },
      { status: 409 },
    );
  }

  let organizationId = input.organizationId;
  if (organizationId) {
    const member = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId),
      ),
    });
    if (!member) {
      throw Response.json({ error: "Forbidden" }, { status: 403 });
    }
  } else {
    organizationId = nanoid();
    await db.insert(organizations).values({
      id: organizationId,
      name,
      slug: `org-${brandSlug}`.slice(0, 64),
    });
    await db.insert(organizationMembers).values({
      id: nanoid(),
      organizationId,
      userId,
      role: "owner",
    });
  }

  const brandId = nanoid();
  await db.insert(brands).values({
    id: brandId,
    organizationId,
    name,
    slug: brandSlug,
    containerTag,
  });

  const apiKey = await createApiKey(userId, "default", brandId);

  return {
    id: brandId,
    name,
    slug: brandSlug,
    containerTag,
    organizationId,
    apiKey,
  };
}
