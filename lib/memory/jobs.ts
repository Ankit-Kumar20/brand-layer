import { and, eq, lte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { memoryLog } from "./log";

export async function enqueueIngestJob(documentId: string, userId: string) {
  const id = nanoid();
  await db.insert(jobs).values({
    id,
    type: "ingest",
    documentId,
    userId,
    status: "pending",
    runAfter: new Date(),
  });
  memoryLog("job", "enqueue ingest", { jobId: id, documentId });
  return id;
}

export async function enqueueDreamJob(opts: {
  documentId?: string;
  userId: string;
  containerTag: string;
  delayMs?: number;
  coalesce?: boolean;
}) {
  const delayMs = opts.delayMs ?? 0;

  if (opts.coalesce) {
    const existing = await db.query.jobs.findFirst({
      where: and(
        eq(jobs.type, "dream_batch"),
        eq(jobs.userId, opts.userId),
        eq(jobs.containerTag, opts.containerTag),
        eq(jobs.status, "pending"),
      ),
    });
    if (existing) {
      await db
        .update(jobs)
        .set({
          documentId: opts.documentId ?? existing.documentId,
          runAfter: new Date(Date.now() + delayMs),
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, existing.id));
      memoryLog("job", "coalesce dream", {
        jobId: existing.id,
        documentId: opts.documentId,
        containerTag: opts.containerTag,
        delayMs,
      });
      return existing.id;
    }
  }

  const id = nanoid();
  await db.insert(jobs).values({
    id,
    type: "dream_batch",
    documentId: opts.documentId,
    userId: opts.userId,
    containerTag: opts.containerTag,
    status: "pending",
    runAfter: new Date(Date.now() + delayMs),
  });
  memoryLog("job", "enqueue dream", {
    jobId: id,
    documentId: opts.documentId,
    containerTag: opts.containerTag,
    delayMs,
  });
  return id;
}

export async function claimNextJob() {
  const now = new Date();
  const candidates = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.status, "pending"), lte(jobs.runAfter, now)))
    .orderBy(jobs.runAfter)
    .limit(1);

  const job = candidates[0];
  if (!job) return null;

  const updated = await db
    .update(jobs)
    .set({
      status: "running",
      attempts: sql`${jobs.attempts} + 1`,
      updatedAt: new Date(),
    })
    .where(and(eq(jobs.id, job.id), eq(jobs.status, "pending")))
    .returning();

  return updated[0] ?? null;
}

export async function completeJob(jobId: string) {
  await db
    .update(jobs)
    .set({ status: "done", updatedAt: new Date() })
    .where(eq(jobs.id, jobId));
  memoryLog("job", "complete", { jobId });
}

export async function failJob(jobId: string, error: string) {
  await db
    .update(jobs)
    .set({ status: "failed", error, updatedAt: new Date() })
    .where(eq(jobs.id, jobId));
  memoryLog("job", "fail", { jobId, error });
}
