import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { brands } from "@/db/schema";
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
  userId: string;
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

function toBrandRow(row: {
  id: string;
  name: string;
  slug: string;
  containerTag: string;
  userId: string;
}): BrandRow {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    containerTag: row.containerTag,
    userId: row.userId,
  };
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

/** Brands owned by the user. */
export async function listUserBrands(userId: string): Promise<BrandRow[]> {
  const rows = await db
    .select({
      id: brands.id,
      name: brands.name,
      slug: brands.slug,
      containerTag: brands.containerTag,
      userId: brands.userId,
    })
    .from(brands)
    .where(eq(brands.userId, userId));

  return rows.map(toBrandRow);
}

export async function getBrandIfOwner(
  userId: string,
  brandId: string,
): Promise<BrandRow | null> {
  const rows = await db
    .select({
      id: brands.id,
      name: brands.name,
      slug: brands.slug,
      containerTag: brands.containerTag,
      userId: brands.userId,
    })
    .from(brands)
    .where(and(eq(brands.id, brandId), eq(brands.userId, userId)))
    .limit(1);

  return rows[0] ? toBrandRow(rows[0]) : null;
}

/** @deprecated Use getBrandIfOwner */
export const getBrandIfMember = getBrandIfOwner;

export async function getBrandByContainerTagIfOwner(
  userId: string,
  containerTag: string,
): Promise<BrandRow | null> {
  const rows = await db
    .select({
      id: brands.id,
      name: brands.name,
      slug: brands.slug,
      containerTag: brands.containerTag,
      userId: brands.userId,
    })
    .from(brands)
    .where(
      and(eq(brands.containerTag, containerTag), eq(brands.userId, userId)),
    )
    .limit(1);

  return rows[0] ? toBrandRow(rows[0]) : null;
}

/** @deprecated Use getBrandByContainerTagIfOwner */
export const getBrandByContainerTagIfMember = getBrandByContainerTagIfOwner;

/**
 * Resolve the caller's brand for a containerTag, or create one for this user.
 * Same tag may exist for other users — content stays isolated by user_id.
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

  const existing = await getBrandByContainerTagIfOwner(userId, tag);
  if (existing) return existing;

  const slug = slugify(tag.replace(/^brand_/, "") || tag) || nanoid(8);
  const brandId = nanoid();
  const brandName = opts?.name?.trim() || tag;

  await db.insert(brands).values({
    id: brandId,
    userId,
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
    userId,
    apiKey,
  };
}

/** Create a user-owned brand with a derived containerTag (+ API key). */
export async function createUserBrand(
  userId: string,
  input: { name: string; slug?: string },
): Promise<BrandWithApiKey> {
  const name = input.name.trim();
  if (!name) {
    throw Response.json({ error: "name is required" }, { status: 400 });
  }

  const brandSlug = slugify(input.slug?.trim() || name) || nanoid(8);
  const containerTag = `brand_${brandSlug}`;

  const taken = await db.query.brands.findFirst({
    where: and(eq(brands.userId, userId), eq(brands.containerTag, containerTag)),
  });
  if (taken) {
    throw Response.json(
      { error: "You already have a brand with this containerTag" },
      { status: 409 },
    );
  }

  const brandId = nanoid();
  await db.insert(brands).values({
    id: brandId,
    userId,
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
    userId,
    apiKey,
  };
}
