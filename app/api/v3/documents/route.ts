import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { documents } from "@/db/schema";
import {
  requireApiAuth,
  resolveContainerTag,
} from "@/lib/auth-request";
import { contentHash } from "@/lib/memory/hash";
import { enqueueIngestJob } from "@/lib/memory/jobs";
import { memoryError, memoryLog } from "@/lib/memory/log";
import { DocumentAddSchema } from "@/lib/memory/schemas";

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
  const base: Record<string, string | number | boolean> = { ...(metadata ?? {}) };
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

export async function POST(request: Request) {
  try {
    const auth = await requireApiAuth(request);
    const body = await request.json();
    const parsed = DocumentAddSchema.safeParse(body);
    if (!parsed.success) {
      memoryLog("api", "POST /v3/documents invalid", {
        issues: parsed.error.issues.length,
      });
      return Response.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const containerTag = resolveContainerTag(auth, input.containerTag);
    const type = resolveDocumentType(input);
    const metadata = defaultMetadata(type, input.metadata);

    const storedContent =
      type === "pdf" && input.pdfBase64
        ? input.pdfBase64
        : (input.content ?? null);

    const hashSource =
      storedContent?.trim() ||
      input.url ||
      input.pdfBase64 ||
      "";
    const hash = contentHash(hashSource);

    memoryLog("api", "POST /v3/documents", {
      containerTag,
      customId: input.customId,
      taskType: input.taskType,
      dreaming: input.dreaming,
      type,
      kind: input.kind,
      hasContent: Boolean(input.content?.trim()),
      hasUrl: Boolean(input.url),
      hasPdf: Boolean(input.pdfBase64),
    });

    let documentId: string;
    let upserted = false;

    if (input.customId) {
      const existing = await db.query.documents.findFirst({
        where: and(
          eq(documents.userId, auth.userId),
          eq(documents.containerTag, containerTag),
          eq(documents.customId, input.customId),
        ),
      });

      if (existing) {
        documentId = existing.id;
        upserted = true;
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
          userId: auth.userId,
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
        userId: auth.userId,
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

    memoryLog("api", upserted ? "document upserted" : "document created", {
      documentId,
      customId: input.customId,
    });

    const runId = await enqueueIngestJob(documentId, { contentHash: hash });
    memoryLog("api", "ingest triggered", { documentId, runId });

    return Response.json({ id: documentId, status: "queued", containerTag, type });
  } catch (err) {
    if (err instanceof Response) return err;
    memoryError("api", "POST /v3/documents error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
