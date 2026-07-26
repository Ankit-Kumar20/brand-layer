import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { memories, profiles } from "@/db/schema";
import { memoryLog } from "./log";

const DYNAMIC_LIMIT = 20;
const STATIC_LIMIT = 50;

export async function recomputeProfile(userId: string, containerTag: string) {
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
    return { static: staticFacts, dynamic: dynamicFacts };
  }

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
  return { static: staticFacts, dynamic: dynamicFacts };
}

export async function getProfile(userId: string, containerTag: string) {
  memoryLog("L8", "get profile", { containerTag });
  const existing = await db.query.profiles.findFirst({
    where: and(
      eq(profiles.userId, userId),
      eq(profiles.containerTag, containerTag),
    ),
  });

  if (existing) {
    memoryLog("L8", "profile cache hit", {
      containerTag,
      static: (existing.staticFacts ?? []).length,
      dynamic: (existing.dynamicFacts ?? []).length,
    });
    return {
      static: existing.staticFacts ?? [],
      dynamic: existing.dynamicFacts ?? [],
    };
  }

  memoryLog("L8", "profile cache miss — recomputing", { containerTag });
  return recomputeProfile(userId, containerTag);
}
