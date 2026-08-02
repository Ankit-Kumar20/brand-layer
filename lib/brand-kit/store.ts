import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { brandKits } from "@/db/schema";
import type {
  BrandKitDesignLanguage,
  BrandKitIdentity,
  BrandKitPatchInput,
  BrandKitRecord,
} from "@/lib/brand-kit/schemas";

function toRecord(row: typeof brandKits.$inferSelect): BrandKitRecord {
  return {
    id: row.id,
    brandId: row.brandId,
    userId: row.userId,
    brandTag: row.brandTag,
    sourceUrl: row.sourceUrl,
    status: row.status,
    identity: row.identity,
    designLanguage: row.designLanguage,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getBrandKitByBrandId(
  userId: string,
  brandId: string,
): Promise<BrandKitRecord | null> {
  const row = await db.query.brandKits.findFirst({
    where: and(eq(brandKits.brandId, brandId), eq(brandKits.userId, userId)),
  });
  return row ? toRecord(row) : null;
}

export async function upsertBrandKit(opts: {
  brandId: string;
  userId: string;
  brandTag: string;
  sourceUrl?: string | null;
  status?: string;
  identity: BrandKitIdentity;
  designLanguage: BrandKitDesignLanguage;
  rawFirecrawl?: Record<string, unknown> | null;
}): Promise<BrandKitRecord> {
  const existing = await db.query.brandKits.findFirst({
    where: eq(brandKits.brandId, opts.brandId),
  });

  if (existing) {
    const [updated] = await db
      .update(brandKits)
      .set({
        sourceUrl: opts.sourceUrl ?? existing.sourceUrl,
        status: opts.status ?? "ready",
        identity: opts.identity,
        designLanguage: opts.designLanguage,
        rawFirecrawl: opts.rawFirecrawl ?? existing.rawFirecrawl,
        updatedAt: new Date(),
      })
      .where(eq(brandKits.id, existing.id))
      .returning();
    return toRecord(updated!);
  }

  const [created] = await db
    .insert(brandKits)
    .values({
      id: nanoid(),
      brandId: opts.brandId,
      userId: opts.userId,
      brandTag: opts.brandTag,
      sourceUrl: opts.sourceUrl ?? null,
      status: opts.status ?? "ready",
      identity: opts.identity,
      designLanguage: opts.designLanguage,
      rawFirecrawl: opts.rawFirecrawl ?? null,
    })
    .returning();

  return toRecord(created!);
}

export async function patchBrandKit(
  userId: string,
  brandId: string,
  patch: BrandKitPatchInput,
): Promise<BrandKitRecord | null> {
  const existing = await db.query.brandKits.findFirst({
    where: and(eq(brandKits.brandId, brandId), eq(brandKits.userId, userId)),
  });
  if (!existing) return null;

  const identity: BrandKitIdentity = {
    ...existing.identity,
    ...(patch.identity ?? {}),
    name: patch.identity?.name?.trim() || existing.identity.name,
  };

  const designLanguage: BrandKitDesignLanguage = {
    colors: patch.designLanguage?.colors ?? existing.designLanguage.colors,
    fonts: {
      ...existing.designLanguage.fonts,
      ...(patch.designLanguage?.fonts ?? {}),
    },
    tone: patch.designLanguage?.tone ?? existing.designLanguage.tone,
    aesthetic:
      patch.designLanguage?.aesthetic !== undefined
        ? patch.designLanguage.aesthetic
        : existing.designLanguage.aesthetic,
  };

  const [updated] = await db
    .update(brandKits)
    .set({
      identity,
      designLanguage,
      sourceUrl:
        patch.sourceUrl !== undefined ? patch.sourceUrl : existing.sourceUrl,
      updatedAt: new Date(),
    })
    .where(eq(brandKits.id, existing.id))
    .returning();

  return toRecord(updated!);
}
