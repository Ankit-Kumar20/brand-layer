import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys, user } from "@/db/schema";
import {
  decryptApiKey,
  encryptApiKey,
} from "@/lib/crypto/api-key-secret";
import { nanoid } from "nanoid";

/** Shared owner for unauthenticated / public API access. */
export const PUBLIC_USER_ID = "public";
export const PUBLIC_USER_EMAIL = "public@brand-layer.local";
const LEGACY_DEV_EMAIL = "dev@brand-layer.local";

export type ApiKeyAuth = {
  userId: string;
  keyId: string;
  brandId: string | null;
};

export type CreatedApiKey = {
  id: string;
  raw: string;
  prefix: string;
  name: string;
  brandId: string | null;
  /** True when a new row was inserted. */
  created: boolean;
  /** True when raw was recovered from ciphertext (or just minted). */
  recoverable: boolean;
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

export async function createApiKey(
  userId: string,
  name = "default",
  brandId?: string | null,
): Promise<CreatedApiKey> {
  const { raw, hash, prefix } = generateApiKey();
  const id = nanoid();
  const keyCiphertext = encryptApiKey(raw);

  if (brandId) {
    await db.insert(apiKeys).values({
      id,
      userId,
      brandId,
      name,
      keyHash: hash,
      keyPrefix: prefix,
      keyCiphertext,
    });
  } else {
    try {
      await db.insert(apiKeys).values({
        id,
        userId,
        name,
        keyHash: hash,
        keyPrefix: prefix,
        keyCiphertext,
      });
    } catch {
      // Pre-migrate DBs may lack key_ciphertext / brand_id.
      await db.execute(sql`
        INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix, created_at)
        VALUES (${id}, ${userId}, ${name}, ${hash}, ${prefix}, NOW())
      `);
    }
  }

  return {
    id,
    raw,
    prefix,
    name,
    brandId: brandId ?? null,
    created: true,
    recoverable: true,
  };
}

/**
 * Return the brand's latest API key (decrypting if stored), or mint one.
 */
export async function ensureDefaultBrandApiKey(
  userId: string,
  brandId: string,
  name = "default",
): Promise<CreatedApiKey> {
  const existing = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      keyCiphertext: apiKeys.keyCiphertext,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.brandId, brandId), eq(apiKeys.userId, userId)))
    .orderBy(desc(apiKeys.createdAt))
    .limit(1);

  const row = existing[0];
  if (row) {
    let raw: string | null = null;
    if (row.keyCiphertext) {
      try {
        raw = decryptApiKey(row.keyCiphertext);
      } catch {
        raw = null;
      }
    }
    if (raw) {
      return {
        id: row.id,
        raw,
        prefix: row.keyPrefix,
        name: row.name,
        brandId,
        created: false,
        recoverable: true,
      };
    }
    // Legacy row without recoverable ciphertext — mint a new key.
  }

  return createApiKey(userId, name, brandId);
}

/** Decrypt a specific key the user owns (brand-scoped). */
export async function revealBrandApiKey(
  userId: string,
  brandId: string,
  keyId: string,
): Promise<CreatedApiKey | null> {
  const rows = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      keyCiphertext: apiKeys.keyCiphertext,
    })
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.brandId, brandId),
        eq(apiKeys.userId, userId),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row?.keyCiphertext) return null;

  try {
    const raw = decryptApiKey(row.keyCiphertext);
    return {
      id: row.id,
      raw,
      prefix: row.keyPrefix,
      name: row.name,
      brandId,
      created: false,
      recoverable: true,
    };
  } catch {
    return null;
  }
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

  // Select only columns that exist pre-migrate; brand_id is optional.
  const rows = await db.execute(sql`
    SELECT id, user_id
    FROM api_keys
    WHERE key_hash = ${keyHash}
    LIMIT 1
  `);
  const row = [...rows][0] as { id: string; user_id: string } | undefined;
  if (!row) return null;

  let brandId: string | null = null;
  try {
    const brandRows = await db.execute(sql`
      SELECT brand_id FROM api_keys WHERE id = ${row.id} LIMIT 1
    `);
    const brandRow = [...brandRows][0] as { brand_id: string | null } | undefined;
    brandId = brandRow?.brand_id ?? null;
  } catch {
    brandId = null;
  }

  return { userId: row.user_id, keyId: row.id, brandId };
}

/** Ensure the shared public user row exists (for FK ownership). */
export async function ensurePublicUser() {
  const byId = await db.query.user.findFirst({
    where: eq(user.id, PUBLIC_USER_ID),
  });
  if (byId) return byId.id;

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
