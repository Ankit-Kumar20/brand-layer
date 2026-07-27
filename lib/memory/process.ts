import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { chunks, documents } from "@/db/schema";
import { chunkText } from "./chunk";
import { embedTexts, EMBEDDING_MODEL } from "./embed";
import { extractDocument } from "./extract";
import { refreshChunkFts } from "./index";
import { enqueueDreamJob } from "./jobs";
import { memoryError, memoryLog } from "./log";

async function setDocumentStatus(
  documentId: string,
  status: string,
  extra?: Partial<typeof documents.$inferInsert>,
) {
  await db
    .update(documents)
    .set({
      status,
      updatedAt: new Date(),
      ...extra,
    })
    .where(eq(documents.id, documentId));
}

export async function processIngestJob(documentId: string) {
  const doc = await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
  });
  if (!doc) throw new Error(`Document ${documentId} not found`);

  const started = Date.now();
  memoryLog("L1", "ingest start", {
    documentId,
    containerTag: doc.containerTag,
    taskType: doc.taskType,
    dreaming: doc.dreaming,
    type: doc.type,
  });

  try {
    // L2 Extract
    memoryLog("L2", "extract start", { documentId });
    await setDocumentStatus(documentId, "extracting");
    const extracted = await extractDocument({
      content: doc.content,
      url: doc.url,
      type: doc.type,
      kind: doc.type,
      metadata: doc.metadata,
      pdfBase64:
        doc.type === "pdf" && doc.content && !doc.content.trim().startsWith("%PDF")
          ? doc.content
          : null,
    });
    await setDocumentStatus(documentId, "extracting", {
      rawText: extracted.rawText,
      type: extracted.type,
    });
    memoryLog("L2", "extract done", {
      documentId,
      type: extracted.type,
      chars: extracted.rawText.length,
      ms: Date.now() - started,
    });

    // L3 Chunk
    memoryLog("L3", "chunk start", { documentId });
    await setDocumentStatus(documentId, "chunking");
    await db.delete(chunks).where(eq(chunks.documentId, documentId));
    const parts = chunkText(extracted.rawText);
    if (parts.length === 0) {
      throw new Error("No chunks produced from content");
    }
    memoryLog("L3", "chunk done", {
      documentId,
      chunks: parts.length,
      tokens: parts.reduce((n, p) => n + p.tokenCount, 0),
      ms: Date.now() - started,
    });

    // L4 Embed
    memoryLog("L4", "embed start", {
      documentId,
      chunks: parts.length,
      model: EMBEDDING_MODEL,
    });
    await setDocumentStatus(documentId, "embedding");
    const vectors = await embedTexts(parts.map((p) => p.content));
    const chunkRows = parts.map((part, i) => ({
      id: nanoid(),
      documentId,
      position: part.position,
      content: part.content,
      tokenCount: part.tokenCount,
      embedding: vectors[i]!,
      embeddingModel: EMBEDDING_MODEL,
    }));
    await db.insert(chunks).values(chunkRows);
    memoryLog("L4", "embed done", {
      documentId,
      vectors: vectors.length,
      ms: Date.now() - started,
    });

    // L5 Index FTS
    memoryLog("L5", "index start", { documentId });
    await setDocumentStatus(documentId, "indexing");
    await refreshChunkFts(documentId);
    await setDocumentStatus(documentId, "done", {
      chunkCount: chunkRows.length,
      error: null,
      processingMetadata: {
        startTime: started,
        endTime: Date.now(),
        duration: Date.now() - started,
        finalStatus: "done",
        chunkCount: chunkRows.length,
      },
    });
    memoryLog("L5", "index done — document ready", {
      documentId,
      chunkCount: chunkRows.length,
      ms: Date.now() - started,
    });

    // Dream enqueue (Trigger.dev)
    if (doc.taskType === "memory") {
      if (doc.dreaming === "instant") {
        const dreamRunId = await enqueueDreamJob({
          documentId,
          userId: doc.userId,
          containerTag: doc.containerTag,
          mode: "instant",
        });
        memoryLog("L6", "dream enqueued (instant)", {
          documentId,
          dreamRunId,
        });
      } else {
        const dreamRunId = await enqueueDreamJob({
          documentId,
          userId: doc.userId,
          containerTag: doc.containerTag,
          delayMs: 2_000,
          coalesce: true,
          mode: "dynamic",
        });
        memoryLog("L6", "dream enqueued (dynamic)", {
          documentId,
          dreamRunId,
          delayMs: 2_000,
        });
      }
    } else {
      memoryLog("L6", "dream skipped (taskType != memory)", {
        documentId,
        taskType: doc.taskType,
      });
    }

    memoryLog("L1", "ingest complete", {
      documentId,
      ms: Date.now() - started,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    memoryError("L1", "ingest failed", {
      documentId,
      error: message,
      ms: Date.now() - started,
    });
    await setDocumentStatus(documentId, "failed", {
      error: message,
      processingMetadata: {
        startTime: started,
        endTime: Date.now(),
        duration: Date.now() - started,
        finalStatus: "failed",
        error: message,
      },
    });
    throw err;
  }
}
