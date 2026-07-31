import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import {
  brands,
  organizationMembers,
  organizations,
} from "@/db/schema";
import { createApiKey } from "@/lib/auth-api-key";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  const allowed =
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_DEV_API_KEYS === "true";
  if (!allowed) {
    return Response.json({ error: "Not available" }, { status: 403 });
  }

  try {
    const { orgId } = await context.params;
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    });
    if (!org) {
      return Response.json({ error: "Organization not found" }, { status: 404 });
    }

    const body = (await request.json()) as {
      name?: string;
      slug?: string;
      containerTag?: string;
    };
    const name = body.name?.trim();
    if (!name) {
      return Response.json({ error: "name is required" }, { status: 400 });
    }

    const slug = body.slug?.trim() || slugify(name);
    const containerTag = body.containerTag?.trim() || `brand_${slug}`;
    const id = nanoid();

    await db.insert(brands).values({
      id,
      organizationId: orgId,
      name,
      slug,
      containerTag,
    });

    const owner = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.organizationId, orgId),
        eq(organizationMembers.role, "owner"),
      ),
    });

    let apiKey = null;
    if (owner) {
      const key = await createApiKey(owner.userId, "default", id);
      apiKey = {
        id: key.id,
        name: key.name,
        key: key.raw,
        prefix: key.prefix,
        created: key.created,
        recoverable: true,
      };
    }

    return Response.json({
      id,
      organizationId: orgId,
      name,
      slug,
      containerTag,
      apiKey,
    });
  } catch (err) {
    return Response.json(
      {
        error: "Failed to create brand",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await context.params;
    const rows = await db.query.brands.findMany({
      where: eq(brands.organizationId, orgId),
    });
    return Response.json({ brands: rows });
  } catch (err) {
    return Response.json(
      {
        error: "Failed to list brands",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
