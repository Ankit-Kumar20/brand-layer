import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * L5 — Refresh FTS columns for chunks and memories.
 */
export async function refreshChunkFts(documentId: string) {
  await db.execute(sql`
    UPDATE chunks
    SET fts = to_tsvector('english', coalesce(content, ''))
    WHERE document_id = ${documentId}
  `);
}

export async function refreshMemoryFts(memoryId: string) {
  await db.execute(sql`
    UPDATE memories
    SET fts = to_tsvector('english', coalesce(memory, ''))
    WHERE id = ${memoryId}
  `);
}
