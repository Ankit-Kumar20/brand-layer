import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { memories, profiles } from "@/db/schema";
import {
  emptyDynamicCard,
  emptyStaticCard,
  type BrandCategory,
  type BrandDynamicCard,
  type BrandProfile,
  type BrandStaticCard,
} from "@/lib/brand/types";
import { memoryLog } from "./log";

const DYNAMIC_LIMIT = 20;
const STATIC_LIMIT = 50;

function categoryOf(m: {
  metadata: Record<string, string | number | boolean> | null;
  isStatic: boolean;
}): BrandCategory {
  const raw = m.metadata?.category;
  if (
    raw === "identity" ||
    raw === "assets" ||
    raw === "products" ||
    raw === "campaigns" ||
    raw === "claims" ||
    raw === "restrictions"
  ) {
    return raw;
  }
  // Heuristic fallback when category was not set by older dreams
  if (m.isStatic) return "identity";
  return "products";
}

function buildBrandCards(
  rows: Array<{
    memory: string;
    isStatic: boolean;
    metadata: Record<string, string | number | boolean> | null;
  }>,
): { staticCard: BrandStaticCard; dynamicCard: BrandDynamicCard } {
  const staticCard = emptyStaticCard();
  const dynamicCard = emptyDynamicCard();

  for (const row of rows) {
    const cat = categoryOf(row);
    if (cat === "identity") staticCard.identity.push(row.memory);
    else if (cat === "assets") staticCard.assets.push(row.memory);
    else if (cat === "claims") staticCard.claims.push(row.memory);
    else if (cat === "restrictions") staticCard.restrictions.push(row.memory);
    else if (cat === "campaigns") dynamicCard.campaigns.push(row.memory);
    else dynamicCard.products.push(row.memory);
  }

  return { staticCard, dynamicCard };
}

export async function recomputeProfile(
  userId: string,
  containerTag: string,
): Promise<BrandProfile> {
  memoryLog("L7", "recompute profile", { containerTag });
  const rows = await db
    .select()
    .from(memories)
    .where(
      and(
        eq(memories.userId, userId),
        eq(memories.containerTag, containerTag),
        eq(memories.isLatest, true),
        eq(memories.isForgotten, false),
      ),
    )
    .orderBy(desc(memories.updatedAt));

  const staticFacts = rows
    .filter((m) => m.isStatic)
    .slice(0, STATIC_LIMIT)
    .map((m) => m.memory);

  const dynamicFacts = rows
    .filter((m) => !m.isStatic)
    .slice(0, DYNAMIC_LIMIT)
    .map((m) => m.memory);

  const { staticCard, dynamicCard } = buildBrandCards(rows);

  const existing = await db.query.profiles.findFirst({
    where: and(
      eq(profiles.userId, userId),
      eq(profiles.containerTag, containerTag),
    ),
  });

  if (existing) {
    await db
      .update(profiles)
      .set({
        staticFacts,
        dynamicFacts,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, existing.id));
    memoryLog("L7", "profile updated", {
      containerTag,
      static: staticFacts.length,
      dynamic: dynamicFacts.length,
    });
  } else {
    await db.insert(profiles).values({
      id: nanoid(),
      userId,
      containerTag,
      staticFacts,
      dynamicFacts,
    });
    memoryLog("L7", "profile created", {
      containerTag,
      static: staticFacts.length,
      dynamic: dynamicFacts.length,
    });
  }

  return {
    static: staticFacts,
    dynamic: dynamicFacts,
    staticCard,
    dynamicCard,
  };
}

export async function getProfile(
  userId: string,
  containerTag: string,
): Promise<BrandProfile> {
  memoryLog("L8", "get profile", { containerTag });

  // Always rebuild cards from latest memories so categories stay accurate.
  const rows = await db
    .select()
    .from(memories)
    .where(
      and(
        eq(memories.userId, userId),
        eq(memories.containerTag, containerTag),
        eq(memories.isLatest, true),
        eq(memories.isForgotten, false),
      ),
    )
    .orderBy(desc(memories.updatedAt));

  if (rows.length === 0) {
    const existing = await db.query.profiles.findFirst({
      where: and(
        eq(profiles.userId, userId),
        eq(profiles.containerTag, containerTag),
      ),
    });
    if (existing) {
      return {
        static: existing.staticFacts ?? [],
        dynamic: existing.dynamicFacts ?? [],
        staticCard: emptyStaticCard(),
        dynamicCard: emptyDynamicCard(),
      };
    }
    return recomputeProfile(userId, containerTag);
  }

  const staticFacts = rows
    .filter((m) => m.isStatic)
    .slice(0, STATIC_LIMIT)
    .map((m) => m.memory);
  const dynamicFacts = rows
    .filter((m) => !m.isStatic)
    .slice(0, DYNAMIC_LIMIT)
    .map((m) => m.memory);
  const { staticCard, dynamicCard } = buildBrandCards(rows);

  memoryLog("L8", "profile from memories", {
    containerTag,
    static: staticFacts.length,
    dynamic: dynamicFacts.length,
  });

  return {
    static: staticFacts,
    dynamic: dynamicFacts,
    staticCard,
    dynamicCard,
  };
}
