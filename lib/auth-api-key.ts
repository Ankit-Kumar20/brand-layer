import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys, user } from "@/db/schema";
import { nanoid } from "nanoid";

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

export async function requireApiKey(request: Request): Promise<ApiKeyAuth> {
  const auth = await verifyApiKey(request.headers.get("authorization"));
  if (!auth) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return auth;
}

/** Ensure a user row exists for API-key ownership (dev mint). */
export async function ensureDevUser(email = "dev@brand-layer.local") {
  const existing = await db.query.user.findFirst({
    where: eq(user.email, email),
  });
  if (existing) return existing.id;

  const id = nanoid();
  await db.insert(user).values({
    id,
    name: "Dev User",
    email,
    emailVerified: true,
  });
  return id;
}
