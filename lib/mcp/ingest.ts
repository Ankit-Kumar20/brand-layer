import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { contentHash } from "@/lib/memory/hash";
import { enqueueIngestJob } from "@/lib/memory/jobs";
import type { DocumentAddInput } from "@/lib/memory/schemas";

function resolveDocumentType(input: {
  kind?: string;
  content?: string;
  url?: string;
  pdfBase64?: string;
}): string {
  if (input.kind) {
    if (input.kind === "svg_asset") return "svg_asset";
    return input.kind;
  }
  if (input.pdfBase64) return "pdf";
  if (input.url && !input.content) return "webpage";
  return "text";
}

function defaultMetadata(
  type: string,
  metadata?: Record<string, string | number | boolean>,
): Record<string, string | number | boolean> {
  const base: Record<string, string | number | boolean> = {
    ...(metadata ?? {}),
  };
  if (!base.source) {
    if (type === "pdf" || type === "markdown" || type === "text") {
      base.source = "brand_guidelines";
    } else if (type === "json") {
      base.source = "brand_tokens";
      if (!base.category) base.category = "assets";
      if (!base.assetType) base.assetType = "color";
    } else if (type === "webpage") {
      base.source = "web";
      if (!base.category) base.category = "products";
    } else if (type === "svg_asset") {
      base.source = "asset";
      if (!base.category) base.category = "assets";
      if (!base.assetType) base.assetType = "logo";
    }
  }
  return base;
}

export async function queueDocumentIngest(
  userId: string,
  containerTag: string,
  input: DocumentAddInput & { containerTag?: string },
) {
  const type = resolveDocumentType(input);
  const metadata = defaultMetadata(type, {
    ...input.metadata,
    source: input.metadata?.source ?? "mcp",
  });

  const storedContent =
    type === "pdf" && input.pdfBase64
      ? input.pdfBase64
      : (input.content ?? null);

  const hashSource =
    storedContent?.trim() || input.url || input.pdfBase64 || "";
  const hash = contentHash(hashSource);

  let documentId: string;

  if (input.customId) {
    const existing = await db.query.documents.findFirst({
      where: and(
        eq(documents.userId, userId),
        eq(documents.containerTag, containerTag),
        eq(documents.customId, input.customId),
      ),
    });

    if (existing) {
      documentId = existing.id;
      await db
        .update(documents)
        .set({
          content: storedContent,
          url: input.url ?? null,
          contentHash: hash,
          type,
          status: "queued",
          taskType: input.taskType,
          dreaming: input.dreaming,
          metadata,
          error: null,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, existing.id));
    } else {
      documentId = nanoid();
      await db.insert(documents).values({
        id: documentId,
        userId,
        containerTag,
        customId: input.customId,
        content: storedContent,
        url: input.url ?? null,
        contentHash: hash,
        type,
        status: "queued",
        taskType: input.taskType,
        dreaming: input.dreaming,
        metadata,
      });
    }
  } else {
    documentId = nanoid();
    await db.insert(documents).values({
      id: documentId,
      userId,
      containerTag,
      content: storedContent,
      url: input.url ?? null,
      contentHash: hash,
      type,
      status: "queued",
      taskType: input.taskType,
      dreaming: input.dreaming,
      metadata,
    });
  }

  await enqueueIngestJob(documentId, { contentHash: hash });

  return { id: documentId, status: "queued" as const, containerTag, type };
}
