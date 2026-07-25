import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { memories, profiles } from "@/db/schema";

const DYNAMIC_LIMIT = 20;
const STATIC_LIMIT = 50;

export async function recomputeProfile(userId: string, containerTag: string) {
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
    return { static: staticFacts, dynamic: dynamicFacts };
  }

  await db.insert(profiles).values({
    id: nanoid(),
    userId,
    containerTag,
    staticFacts,
    dynamicFacts,
  });

  return { static: staticFacts, dynamic: dynamicFacts };
}

export async function getProfile(userId: string, containerTag: string) {
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
    };
  }

  return recomputeProfile(userId, containerTag);
}
