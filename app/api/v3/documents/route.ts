import { after } from "next/server";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { ensurePublicUser } from "@/lib/auth-api-key";
import { contentHash } from "@/lib/memory/hash";
import { enqueueIngestJob } from "@/lib/memory/jobs";
import { kickDocumentJob } from "@/lib/memory/process";
import { DocumentAddSchema } from "@/lib/memory/schemas";

export async function POST(request: Request) {
  try {
    const userId = await ensurePublicUser();
    const body = await request.json();
    const parsed = DocumentAddSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const hashSource = input.content?.trim() || input.url || "";
    const hash = contentHash(hashSource);
    const type = input.url && !input.content ? "webpage" : "text";

    let documentId: string;

    if (input.customId) {
      const existing = await db.query.documents.findFirst({
        where: and(
          eq(documents.userId, userId),
          eq(documents.containerTag, input.containerTag),
          eq(documents.customId, input.customId),
        ),
      });

      if (existing) {
        documentId = existing.id;
        await db
          .update(documents)
          .set({
            content: input.content ?? null,
            url: input.url ?? null,
            contentHash: hash,
            type,
            status: "queued",
            taskType: input.taskType,
            dreaming: input.dreaming,
            metadata: input.metadata ?? null,
            error: null,
            updatedAt: new Date(),
          })
          .where(eq(documents.id, existing.id));
      } else {
        documentId = nanoid();
        await db.insert(documents).values({
          id: documentId,
          userId,
          containerTag: input.containerTag,
          customId: input.customId,
          content: input.content ?? null,
          url: input.url ?? null,
          contentHash: hash,
          type,
          status: "queued",
          taskType: input.taskType,
          dreaming: input.dreaming,
          metadata: input.metadata ?? null,
        });
      }
    } else {
      documentId = nanoid();
      await db.insert(documents).values({
        id: documentId,
        userId,
        containerTag: input.containerTag,
        content: input.content ?? null,
        url: input.url ?? null,
        contentHash: hash,
        type,
        status: "queued",
        taskType: input.taskType,
        dreaming: input.dreaming,
        metadata: input.metadata ?? null,
      });
    }

    await enqueueIngestJob(documentId, userId);

    after(async () => {
      try {
        await kickDocumentJob(documentId);
      } catch (err) {
        console.error("kickDocumentJob failed", err);
      }
    });

    return Response.json({ id: documentId, status: "queued" });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
