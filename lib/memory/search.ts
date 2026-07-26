import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { memoryEdges, memories } from "@/db/schema";
import { embedText } from "./embed";
import { memoryLog } from "./log";
import type { SearchInput } from "./schemas";

type SearchHit = {
  id: string;
  type: "memory" | "chunk";
  memory?: string;
  content?: string;
  documentId?: string;
  similarity: number;
  isStatic?: boolean;
  relatedMemories?: Array<{ id: string; memory: string; relation: string }>;
};

function vectorSql(embedding: number[]) {
  // Numeric-only literal — safe to inline for pgvector casts
  return sql.raw(`'[${embedding.join(",")}]'::vector`);
}

async function searchMemories(
  userId: string,
  containerTag: string,
  embedding: number[],
  q: string,
  limit: number,
  threshold: number,
): Promise<SearchHit[]> {
  const vec = vectorSql(embedding);
  const rows = await db.execute(sql`
    SELECT
      id,
      memory,
      is_static,
      (1 - (embedding <=> ${vec}))::float8 AS similarity
    FROM memories
    WHERE user_id = ${userId}
      AND container_tag = ${containerTag}
      AND is_latest = true
      AND is_forgotten = false
      AND embedding IS NOT NULL
      AND (
        (1 - (embedding <=> ${vec})) >= ${threshold}
        OR fts @@ plainto_tsquery('english', ${q})
      )
    ORDER BY embedding <=> ${vec}
    LIMIT ${limit}
  `);

  return [...rows].map((r) => {
    const row = r as {
      id: string;
      memory: string;
      is_static: boolean;
      similarity: number;
    };
    return {
      id: row.id,
      type: "memory" as const,
      memory: row.memory,
      similarity: Number(row.similarity),
      isStatic: row.is_static,
    };
  });
}

async function searchChunks(
  userId: string,
  containerTag: string,
  embedding: number[],
  q: string,
  limit: number,
  threshold: number,
): Promise<SearchHit[]> {
  const vec = vectorSql(embedding);
  const rows = await db.execute(sql`
    SELECT
      c.id,
      c.content,
      c.document_id,
      (1 - (c.embedding <=> ${vec}))::float8 AS similarity
    FROM chunks c
    INNER JOIN documents d ON d.id = c.document_id
    WHERE d.user_id = ${userId}
      AND d.container_tag = ${containerTag}
      AND c.embedding IS NOT NULL
      AND (
        (1 - (c.embedding <=> ${vec})) >= ${threshold}
        OR c.fts @@ plainto_tsquery('english', ${q})
      )
    ORDER BY c.embedding <=> ${vec}
    LIMIT ${limit}
  `);

  return [...rows].map((r) => {
    const row = r as {
      id: string;
      content: string;
      document_id: string;
      similarity: number;
    };
    return {
      id: row.id,
      type: "chunk" as const,
      content: row.content,
      documentId: row.document_id,
      similarity: Number(row.similarity),
    };
  });
}

async function attachRelated(hits: SearchHit[]) {
  for (const hit of hits) {
    if (hit.type !== "memory") continue;
    const edges = await db
      .select({
        type: memoryEdges.type,
        toId: memoryEdges.toId,
        fromId: memoryEdges.fromId,
      })
      .from(memoryEdges)
      .where(eq(memoryEdges.fromId, hit.id));

    const related: SearchHit["relatedMemories"] = [];
    for (const edge of edges) {
      const otherId = edge.toId === hit.id ? edge.fromId : edge.toId;
      const mem = await db.query.memories.findFirst({
        where: and(eq(memories.id, otherId), eq(memories.isForgotten, false)),
      });
      if (mem) {
        related.push({
          id: mem.id,
          memory: mem.memory,
          relation: edge.type,
        });
      }
    }
    hit.relatedMemories = related;
  }
}

export async function searchMemoriesAndDocuments(
  userId: string,
  input: SearchInput,
) {
  const started = Date.now();
  memoryLog("L8", "search start", {
    containerTag: input.containerTag,
    mode: input.searchMode,
    q: input.q.slice(0, 80),
    limit: input.limit,
    threshold: input.threshold,
  });

  const embedding = await embedText(input.q);
  memoryLog("L8", "query embedded", { ms: Date.now() - started });
  const results: SearchHit[] = [];

  if (input.searchMode === "memories" || input.searchMode === "hybrid") {
    const memHits = await searchMemories(
      userId,
      input.containerTag,
      embedding,
      input.q,
      input.limit,
      input.threshold,
    );
    memoryLog("L8", "memory hits", { count: memHits.length });
    results.push(...memHits);
  }

  if (input.searchMode === "documents" || input.searchMode === "hybrid") {
    const chunkHits = await searchChunks(
      userId,
      input.containerTag,
      embedding,
      input.q,
      input.limit,
      input.threshold,
    );
    memoryLog("L8", "chunk hits", { count: chunkHits.length });
    results.push(...chunkHits);
  }

  // Rank: similarity + static boost + slight recency via type preference
  results.sort((a, b) => {
    const as = a.similarity + (a.isStatic ? 0.05 : 0);
    const bs = b.similarity + (b.isStatic ? 0.05 : 0);
    return bs - as;
  });

  const trimmed = results.slice(0, input.limit);
  if (input.includeRelated) {
    await attachRelated(trimmed);
    memoryLog("L8", "related edges attached", { hits: trimmed.length });
  }

  memoryLog("L8", "search done", {
    total: trimmed.length,
    ms: Date.now() - started,
  });

  return {
    results: trimmed,
    total: trimmed.length,
  };
}
