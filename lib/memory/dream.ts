import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import {
  documents,
  memories,
  memoryDocumentSources,
  memoryEdges,
} from "@/db/schema";
import { DREAM_MODEL, getOpenAI } from "@/lib/openai";
import { cosineSimilarity, embedText, EMBEDDING_MODEL } from "./embed";
import { refreshMemoryFts } from "./index";
import { memoryLog, memoryWarn } from "./log";
import { recomputeProfile } from "./profile";
import { DreamOpsResponseSchema, type DreamOp } from "./schemas";

const DEDUP_THRESHOLD = 0.92;
const EXISTING_MEMORY_LIMIT = 40;

function truncate(text: string, maxChars: number) {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}…`;
}

async function linkSource(memoryId: string, documentId: string) {
  await db
    .insert(memoryDocumentSources)
    .values({
      id: nanoid(),
      memoryId,
      documentId,
    })
    .onConflictDoNothing();
}

async function insertMemory(opts: {
  userId: string;
  brandTag: string;
  text: string;
  isStatic?: boolean;
  isInference?: boolean;
  version?: number;
  parentMemoryId?: string | null;
  rootMemoryId?: string | null;
  documentId: string;
  metadata?: Record<string, string | number | boolean> | null;
}) {
  const embedding = await embedText(opts.text);
  const id = nanoid();
  const rootId = opts.rootMemoryId ?? opts.parentMemoryId ?? id;

  await db.insert(memories).values({
    id,
    userId: opts.userId,
    brandTag: opts.brandTag,
    memory: opts.text,
    isStatic: opts.isStatic ?? false,
    isLatest: true,
    isForgotten: false,
    isInference: opts.isInference ?? false,
    version: opts.version ?? 1,
    parentMemoryId: opts.parentMemoryId ?? null,
    rootMemoryId: rootId,
    embedding,
    embeddingModel: EMBEDDING_MODEL,
    metadata: opts.metadata ?? null,
  });

  await refreshMemoryFts(id);
  await linkSource(id, opts.documentId);
  return id;
}

async function addEdge(
  fromId: string,
  toId: string,
  type: "updates" | "extends" | "derives",
) {
  await db
    .insert(memoryEdges)
    .values({
      id: nanoid(),
      fromId,
      toId,
      type,
    })
    .onConflictDoNothing();
}

async function findNearDuplicate(
  userId: string,
  brandTag: string,
  embedding: number[],
) {
  const rows = await db
    .select()
    .from(memories)
    .where(
      and(
        eq(memories.userId, userId),
        eq(memories.brandTag, brandTag),
        eq(memories.isLatest, true),
        eq(memories.isForgotten, false),
      ),
    )
    .limit(100);

  let best: { id: string; score: number } | null = null;
  for (const row of rows) {
    if (!row.embedding) continue;
    const score = cosineSimilarity(embedding, row.embedding as number[]);
    if (score >= DEDUP_THRESHOLD && (!best || score > best.score)) {
      best = { id: row.id, score };
    }
  }
  return best;
}

async function applyOp(
  op: DreamOp,
  ctx: {
    userId: string;
    brandTag: string;
    documentId: string;
    docMetadata?: Record<string, string | number | boolean> | null;
  },
) {
  if (op.op === "ignore") {
    memoryLog("L6", "op ignore", {
      documentId: ctx.documentId,
      reason: op.reason,
    });
    return;
  }

  if (op.op === "forget") {
    if (!op.targetMemoryId) {
      memoryWarn("L6", "forget skipped — no targetMemoryId", {
        documentId: ctx.documentId,
      });
      return;
    }
    await db
      .update(memories)
      .set({ isForgotten: true, updatedAt: new Date() })
      .where(
        and(
          eq(memories.id, op.targetMemoryId),
          eq(memories.userId, ctx.userId),
          eq(memories.brandTag, ctx.brandTag),
        ),
      );
    memoryLog("L6", "op forget", {
      documentId: ctx.documentId,
      targetMemoryId: op.targetMemoryId,
      reason: op.reason,
    });
    return;
  }

  const text = op.memory?.trim();
  if (!text) {
    memoryWarn("L6", "op skipped — empty memory text", {
      documentId: ctx.documentId,
      op: op.op,
    });
    return;
  }

  const metadata: Record<string, string | number | boolean> = {
    ...(ctx.docMetadata ?? {}),
  };
  if (op.category) metadata.category = op.category;

  const embedding = await embedText(text);
  const dup = await findNearDuplicate(ctx.userId, ctx.brandTag, embedding);
  if (dup && (op.op === "new" || op.op === "extend" || op.op === "derive")) {
    memoryLog("L6", "op deduped", {
      documentId: ctx.documentId,
      op: op.op,
      duplicateOf: dup.id,
      score: Number(dup.score.toFixed(3)),
    });
    return;
  }

  if (op.op === "update") {
    const targetId = op.targetMemoryId ?? dup?.id;
    if (!targetId) {
      const id = await insertMemory({
        userId: ctx.userId,
        brandTag: ctx.brandTag,
        text,
        isStatic: op.isStatic,
        documentId: ctx.documentId,
        metadata,
      });
      memoryLog("L6", "op update→new (no target)", {
        documentId: ctx.documentId,
        memoryId: id,
        isStatic: !!op.isStatic,
        preview: text.slice(0, 80),
      });
      return;
    }

    const old = await db.query.memories.findFirst({
      where: and(
        eq(memories.id, targetId),
        eq(memories.userId, ctx.userId),
      ),
    });
    if (!old) {
      memoryWarn("L6", "update target missing", {
        documentId: ctx.documentId,
        targetMemoryId: targetId,
      });
      return;
    }

    await db
      .update(memories)
      .set({ isLatest: false, updatedAt: new Date() })
      .where(eq(memories.id, old.id));

    const newId = await insertMemory({
      userId: ctx.userId,
      brandTag: ctx.brandTag,
      text,
      isStatic: op.isStatic ?? old.isStatic,
      version: old.version + 1,
      parentMemoryId: old.id,
      rootMemoryId: old.rootMemoryId ?? old.id,
      documentId: ctx.documentId,
      metadata: {
        ...(old.metadata ?? {}),
        ...metadata,
      },
    });
    await addEdge(newId, old.id, "updates");
    memoryLog("L6", "op update", {
      documentId: ctx.documentId,
      oldMemoryId: old.id,
      newMemoryId: newId,
      version: old.version + 1,
      preview: text.slice(0, 80),
    });
    return;
  }

  if (op.op === "extend" || op.op === "derive") {
    const newId = await insertMemory({
      userId: ctx.userId,
      brandTag: ctx.brandTag,
      text,
      isStatic: op.isStatic,
      isInference: op.op === "derive",
      documentId: ctx.documentId,
      metadata,
    });
    if (op.targetMemoryId) {
      await addEdge(
        newId,
        op.targetMemoryId,
        op.op === "derive" ? "derives" : "extends",
      );
    }
    memoryLog("L6", `op ${op.op}`, {
      documentId: ctx.documentId,
      memoryId: newId,
      targetMemoryId: op.targetMemoryId,
      isStatic: !!op.isStatic,
      preview: text.slice(0, 80),
    });
    return;
  }

  // new
  const id = await insertMemory({
    userId: ctx.userId,
    brandTag: ctx.brandTag,
    text,
    isStatic: op.isStatic,
    documentId: ctx.documentId,
    metadata,
  });
  memoryLog("L6", "op new", {
    documentId: ctx.documentId,
    memoryId: id,
    isStatic: !!op.isStatic,
    preview: text.slice(0, 80),
  });
}

export async function dreamDocument(documentId: string) {
  const started = Date.now();
  const doc = await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
  });
  if (!doc) throw new Error(`Document ${documentId} not found`);
  if (!doc.rawText?.trim()) throw new Error("Document has no rawText to dream");

  memoryLog("L6", "dream start", {
    documentId,
    brandTag: doc.brandTag,
    chars: doc.rawText.length,
  });

  const existing = await db
    .select({
      id: memories.id,
      memory: memories.memory,
      isStatic: memories.isStatic,
      metadata: memories.metadata,
    })
    .from(memories)
    .where(
      and(
        eq(memories.userId, doc.userId),
        eq(memories.brandTag, doc.brandTag),
        eq(memories.isLatest, true),
        eq(memories.isForgotten, false),
      ),
    )
    .orderBy(desc(memories.updatedAt))
    .limit(EXISTING_MEMORY_LIMIT);

  memoryLog("L6", "loaded existing memories", {
    documentId,
    count: existing.length,
  });

  const openai = getOpenAI();
  const system = `You extract atomic brand facts for a brand memory graph.
Return JSON: { "ops": [ ... ] }
Each op: { "op": "new"|"update"|"extend"|"derive"|"forget"|"ignore", "memory"?: string, "isStatic"?: boolean, "category"?: "identity"|"assets"|"products"|"campaigns"|"claims"|"restrictions", "targetMemoryId"?: string, "reason"?: string }
Rules:
- Prefer atomic brand facts (voice, colors, logos, claims, restrictions, products).
- Categories:
  - identity: name, mission, voice, tone, values
  - assets: logos, colors, fonts, usage rules
  - products: features, positioning, naming
  - campaigns: seasonal/temporary messaging
  - claims: approved messaging
  - restrictions: don't say / don't use
- Mark identity, assets, restrictions, and approved claims as isStatic=true.
- Mark campaigns and ephemeral product pushes as isStatic=false.
- Prefer approved/static facts over one-off campaign copy when they conflict (update or forget the weaker fact).
- Use update when a guideline supersedes an existing fact (set targetMemoryId).
- Use extend when adding detail without invalidating.
- Use derive sparingly for reasonable inferences; prefer stated facts.
- Use forget when content retires a claim, logo, or expired campaign.
- Ignore fluff and unrelated noise.`;

  const userPrompt = `Brand tag: ${doc.brandTag}
Document type: ${doc.type}
Document metadata: ${JSON.stringify(doc.metadata ?? {})}

Existing brand memories:
${existing.map((m) => {
  const cat = m.metadata && typeof m.metadata.category === "string" ? m.metadata.category : "";
  return `- [${m.id}]${m.isStatic ? " (static)" : ""}${cat ? ` [${cat}]` : ""} ${m.memory}`;
}).join("\n") || "(none)"}

New brand content:
${truncate(doc.rawText, 12_000)}`;

  memoryLog("L6", "LLM extract start", {
    documentId,
    model: DREAM_MODEL,
  });
  const completion = await openai.chat.completions.create({
    model: DREAM_MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? '{"ops":[]}';
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    memoryWarn("L6", "LLM JSON parse failed", { documentId });
    parsed = { ops: [] };
  }

  const result = DreamOpsResponseSchema.safeParse(parsed);
  if (!result.success) {
    memoryWarn("L6", "LLM ops schema invalid", {
      documentId,
      issues: result.error.issues.length,
    });
  }
  const ops = result.success ? result.data.ops : [];
  memoryLog("L6", "LLM extract done", {
    documentId,
    ops: ops.length,
    kinds: ops.map((o) => o.op),
    ms: Date.now() - started,
  });

  for (const op of ops) {
    await applyOp(op, {
      userId: doc.userId,
      brandTag: doc.brandTag,
      documentId: doc.id,
      docMetadata: doc.metadata,
    });
  }

  memoryLog("L7", "profile recompute start", {
    documentId,
    brandTag: doc.brandTag,
  });
  await recomputeProfile(doc.userId, doc.brandTag);
  memoryLog("L6", "dream complete", {
    documentId,
    opsApplied: ops.length,
    ms: Date.now() - started,
  });
  return { opsApplied: ops.length };
}

export async function dreamBatch(userId: string, brandTag: string, documentId?: string | null) {
  if (documentId) {
    memoryLog("L6", "dreamBatch → document", { documentId, brandTag });
    return dreamDocument(documentId);
  }

  // Dream the most recent done document in the container
  const recent = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.userId, userId),
        eq(documents.brandTag, brandTag),
        eq(documents.status, "done"),
        eq(documents.taskType, "memory"),
      ),
    )
    .orderBy(desc(documents.updatedAt))
    .limit(1);

  const doc = recent[0];
  if (!doc) {
    memoryLog("L6", "dreamBatch empty — no done docs", { brandTag });
    return { opsApplied: 0 };
  }
  memoryLog("L6", "dreamBatch → latest doc", {
    documentId: doc.id,
    brandTag,
  });
  return dreamDocument(doc.id);
}
