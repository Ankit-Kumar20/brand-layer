import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { chunks, documents, jobs } from "@/db/schema";
import { chunkText } from "./chunk";
import { dreamBatch, dreamDocument } from "./dream";
import { embedTexts, EMBEDDING_MODEL } from "./embed";
import { extractDocument } from "./extract";
import { refreshChunkFts } from "./index";
import {
  claimNextJob,
  completeJob,
  enqueueDreamJob,
  failJob,
} from "./jobs";
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

    // Dream enqueue
    if (doc.taskType === "memory") {
      if (doc.dreaming === "instant") {
        const dreamJobId = await enqueueDreamJob({
          documentId,
          userId: doc.userId,
          containerTag: doc.containerTag,
          delayMs: 0,
        });
        memoryLog("L6", "dream enqueued (instant)", {
          documentId,
          dreamJobId,
        });
      } else {
        const dreamJobId = await enqueueDreamJob({
          documentId,
          userId: doc.userId,
          containerTag: doc.containerTag,
          delayMs: 2_000,
          coalesce: true,
        });
        memoryLog("L6", "dream enqueued (dynamic)", {
          documentId,
          dreamJobId,
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

export async function processJobById(jobId: string) {
  const job = await db.query.jobs.findFirst({
    where: eq(jobs.id, jobId),
  });
  if (!job) {
    memoryLog("job", "missing job", { jobId });
    return;
  }

  memoryLog("job", "run start", {
    jobId,
    type: job.type,
    documentId: job.documentId,
    containerTag: job.containerTag,
    attempt: job.attempts,
  });
  const started = Date.now();

  try {
    if (job.type === "ingest") {
      if (!job.documentId) throw new Error("ingest job missing documentId");
      await processIngestJob(job.documentId);
    } else if (job.type === "dream_batch") {
      if (job.documentId) {
        const doc = await db.query.documents.findFirst({
          where: eq(documents.id, job.documentId),
        });
        if (doc?.dreaming === "instant") {
          await dreamDocument(job.documentId);
        } else if (job.userId && job.containerTag) {
          await dreamBatch(job.userId, job.containerTag, job.documentId);
        } else if (job.documentId) {
          await dreamDocument(job.documentId);
        }
      } else if (job.userId && job.containerTag) {
        await dreamBatch(job.userId, job.containerTag);
      }
    } else {
      throw new Error(`Unknown job type: ${job.type}`);
    }
    await completeJob(job.id);
    memoryLog("job", "run done", {
      jobId,
      type: job.type,
      ms: Date.now() - started,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    memoryError("job", "run failed", {
      jobId,
      type: job.type,
      error: message,
      ms: Date.now() - started,
    });
    await failJob(job.id, message);
  }
}

export async function processNextJob() {
  const job = await claimNextJob();
  if (!job) return false;
  memoryLog("job", "claimed", {
    jobId: job.id,
    type: job.type,
    documentId: job.documentId,
  });
  await processJobById(job.id);
  return true;
}

export async function processPendingJobs(max = 10) {
  let processed = 0;
  for (let i = 0; i < max; i++) {
    const did = await processNextJob();
    if (!did) break;
    processed++;
  }
  return processed;
}

/** Process a specific document's pending ingest job if present. */
export async function kickDocumentJob(documentId: string) {
  const job = await db.query.jobs.findFirst({
    where: and(
      eq(jobs.documentId, documentId),
      eq(jobs.type, "ingest"),
      eq(jobs.status, "pending"),
    ),
  });
  if (!job) {
    memoryLog("job", "kick skipped — no pending ingest", { documentId });
    return;
  }
  memoryLog("job", "kick ingest", { documentId, jobId: job.id });
  await db
    .update(jobs)
    .set({ status: "running", attempts: job.attempts + 1, updatedAt: new Date() })
    .where(eq(jobs.id, job.id));
  await processJobById(job.id);
}
