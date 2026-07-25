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

  try {
    // L2 Extract
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

    // L3 Chunk
    await setDocumentStatus(documentId, "chunking");
    await db.delete(chunks).where(eq(chunks.documentId, documentId));
    const parts = chunkText(extracted.rawText);
    if (parts.length === 0) {
      throw new Error("No chunks produced from content");
    }

    // L4 Embed
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

    // L5 Index FTS
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

    // Dream enqueue
    if (doc.taskType === "memory") {
      if (doc.dreaming === "instant") {
        await enqueueDreamJob({
          documentId,
          userId: doc.userId,
          containerTag: doc.containerTag,
          delayMs: 0,
        });
      } else {
        await enqueueDreamJob({
          documentId,
          userId: doc.userId,
          containerTag: doc.containerTag,
          delayMs: 2_000,
          coalesce: true,
        });
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
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
  if (!job) return;

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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await failJob(job.id, message);
  }
}

export async function processNextJob() {
  const job = await claimNextJob();
  if (!job) return false;
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
  if (!job) return;
  await db
    .update(jobs)
    .set({ status: "running", attempts: job.attempts + 1, updatedAt: new Date() })
    .where(eq(jobs.id, job.id));
  await processJobById(job.id);
}
