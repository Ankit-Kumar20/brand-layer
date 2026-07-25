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
  containerTag: string;
  text: string;
  isStatic?: boolean;
  isInference?: boolean;
  version?: number;
  parentMemoryId?: string | null;
  rootMemoryId?: string | null;
  documentId: string;
}) {
  const embedding = await embedText(opts.text);
  const id = nanoid();
  const rootId = opts.rootMemoryId ?? opts.parentMemoryId ?? id;

  await db.insert(memories).values({
    id,
    userId: opts.userId,
    containerTag: opts.containerTag,
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
  containerTag: string,
  embedding: number[],
) {
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
  ctx: { userId: string; containerTag: string; documentId: string },
) {
  if (op.op === "ignore") return;

  if (op.op === "forget") {
    if (!op.targetMemoryId) return;
    await db
      .update(memories)
      .set({ isForgotten: true, updatedAt: new Date() })
      .where(
        and(
          eq(memories.id, op.targetMemoryId),
          eq(memories.userId, ctx.userId),
          eq(memories.containerTag, ctx.containerTag),
        ),
      );
    return;
  }

  const text = op.memory?.trim();
  if (!text) return;

  const embedding = await embedText(text);
  const dup = await findNearDuplicate(ctx.userId, ctx.containerTag, embedding);
  if (dup && (op.op === "new" || op.op === "extend" || op.op === "derive")) {
    // Near-duplicate: treat as ignore unless explicitly updating
    return;
  }

  if (op.op === "update") {
    const targetId = op.targetMemoryId ?? dup?.id;
    if (!targetId) {
      await insertMemory({
        userId: ctx.userId,
        containerTag: ctx.containerTag,
        text,
        isStatic: op.isStatic,
        documentId: ctx.documentId,
      });
      return;
    }

    const old = await db.query.memories.findFirst({
      where: and(
        eq(memories.id, targetId),
        eq(memories.userId, ctx.userId),
      ),
    });
    if (!old) return;

    await db
      .update(memories)
      .set({ isLatest: false, updatedAt: new Date() })
      .where(eq(memories.id, old.id));

    const newId = await insertMemory({
      userId: ctx.userId,
      containerTag: ctx.containerTag,
      text,
      isStatic: op.isStatic ?? old.isStatic,
      version: old.version + 1,
      parentMemoryId: old.id,
      rootMemoryId: old.rootMemoryId ?? old.id,
      documentId: ctx.documentId,
    });
    await addEdge(newId, old.id, "updates");
    return;
  }

  if (op.op === "extend" || op.op === "derive") {
    const newId = await insertMemory({
      userId: ctx.userId,
      containerTag: ctx.containerTag,
      text,
      isStatic: op.isStatic,
      isInference: op.op === "derive",
      documentId: ctx.documentId,
    });
    if (op.targetMemoryId) {
      await addEdge(newId, op.targetMemoryId, op.op === "derive" ? "derives" : "extends");
    }
    return;
  }

  // new
  await insertMemory({
    userId: ctx.userId,
    containerTag: ctx.containerTag,
    text,
    isStatic: op.isStatic,
    documentId: ctx.documentId,
  });
}

export async function dreamDocument(documentId: string) {
  const doc = await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
  });
  if (!doc) throw new Error(`Document ${documentId} not found`);
  if (!doc.rawText?.trim()) throw new Error("Document has no rawText to dream");

  const existing = await db
    .select({
      id: memories.id,
      memory: memories.memory,
      isStatic: memories.isStatic,
    })
    .from(memories)
    .where(
      and(
        eq(memories.userId, doc.userId),
        eq(memories.containerTag, doc.containerTag),
        eq(memories.isLatest, true),
        eq(memories.isForgotten, false),
      ),
    )
    .orderBy(desc(memories.updatedAt))
    .limit(EXISTING_MEMORY_LIMIT);

  const openai = getOpenAI();
  const system = `You extract atomic memory facts for a personal AI memory graph.
Return JSON: { "ops": [ ... ] }
Each op: { "op": "new"|"update"|"extend"|"derive"|"forget"|"ignore", "memory"?: string, "isStatic"?: boolean, "targetMemoryId"?: string, "reason"?: string }
Rules:
- Prefer atomic first-person/user facts.
- Use update when a fact supersedes an existing one (set targetMemoryId).
- Use extend when adding detail to an existing fact.
- Use derive for reasonable inferences.
- Use forget when content clearly invalidates a fact.
- Mark durable identity/preferences as isStatic=true.
- Ignore fluff, greetings, and one-off noise.`;

  const userPrompt = `Container: ${doc.containerTag}

Existing memories:
${existing.map((m) => `- [${m.id}]${m.isStatic ? " (static)" : ""} ${m.memory}`).join("\n") || "(none)"}

New content:
${truncate(doc.rawText, 12_000)}`;

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
    parsed = { ops: [] };
  }

  const result = DreamOpsResponseSchema.safeParse(parsed);
  const ops = result.success ? result.data.ops : [];

  for (const op of ops) {
    await applyOp(op, {
      userId: doc.userId,
      containerTag: doc.containerTag,
      documentId: doc.id,
    });
  }

  await recomputeProfile(doc.userId, doc.containerTag);
  return { opsApplied: ops.length };
}

export async function dreamBatch(userId: string, containerTag: string, documentId?: string | null) {
  if (documentId) {
    return dreamDocument(documentId);
  }

  // Dream the most recent done document in the container
  const recent = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.userId, userId),
        eq(documents.containerTag, containerTag),
        eq(documents.status, "done"),
        eq(documents.taskType, "memory"),
      ),
    )
    .orderBy(desc(documents.updatedAt))
    .limit(1);

  const doc = recent[0];
  if (!doc) return { opsApplied: 0 };
  return dreamDocument(doc.id);
}
