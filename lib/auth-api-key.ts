import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys, user } from "@/db/schema";
import { nanoid } from "nanoid";

/** Shared owner for unauthenticated / public API access. */
export const PUBLIC_USER_ID = "public";
export const PUBLIC_USER_EMAIL = "public@brand-layer.local";
const LEGACY_DEV_EMAIL = "dev@brand-layer.local";

export type ApiKeyAuth = {
  userId: string;
  keyId: string;
};

export function hashApiKey(rawKey: string) {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function generateApiKey() {
  const raw = `sm_${randomBytes(24).toString("hex")}`;
  return {
    raw,
    hash: hashApiKey(raw),
    prefix: raw.slice(0, 10),
  };
}

export async function createApiKey(userId: string, name = "default") {
  const { raw, hash, prefix } = generateApiKey();
  const id = nanoid();
  await db.insert(apiKeys).values({
    id,
    userId,
    name,
    keyHash: hash,
    keyPrefix: prefix,
  });
  return { id, raw, prefix, name };
}

export async function verifyApiKey(
  authorizationHeader: string | null,
): Promise<ApiKeyAuth | null> {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }
  const raw = authorizationHeader.slice("Bearer ".length).trim();
  if (!raw) return null;

  const keyHash = hashApiKey(raw);
  const row = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.keyHash, keyHash),
  });
  if (!row) return null;

  return { userId: row.userId, keyId: row.id };
}

/** Ensure the shared public user row exists (for FK ownership). */
export async function ensurePublicUser() {
  const byId = await db.query.user.findFirst({
    where: eq(user.id, PUBLIC_USER_ID),
  });
  if (byId) return byId.id;

  // Reuse an existing public/dev row so previously ingested data stays visible.
  for (const email of [PUBLIC_USER_EMAIL, LEGACY_DEV_EMAIL]) {
    const row = await db.query.user.findFirst({
      where: eq(user.email, email),
    });
    if (row) return row.id;
  }

  try {
    await db.insert(user).values({
      id: PUBLIC_USER_ID,
      name: "Public",
      email: PUBLIC_USER_EMAIL,
      emailVerified: true,
    });
    return PUBLIC_USER_ID;
  } catch {
    for (const email of [PUBLIC_USER_EMAIL, LEGACY_DEV_EMAIL]) {
      const again = await db.query.user.findFirst({
        where: eq(user.email, email),
      });
      if (again) return again.id;
    }
    throw new Error("Failed to ensure public user");
  }
}

/** @deprecated Use ensurePublicUser */
export const ensureDevUser = ensurePublicUser;
