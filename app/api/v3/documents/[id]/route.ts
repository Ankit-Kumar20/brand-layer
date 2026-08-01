import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { requireApiAuth } from "@/lib/auth-request";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireApiAuth(request);
    const { id } = await context.params;

    const doc = await db.query.documents.findFirst({
      where: and(eq(documents.id, id), eq(documents.userId, auth.userId)),
    });

    if (!doc) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    if (
      auth.forcedBrandTag &&
      doc.brandTag !== auth.forcedBrandTag
    ) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json({
      id: doc.id,
      customId: doc.customId,
      brandTag: doc.brandTag,
      status: doc.status,
      type: doc.type,
      taskType: doc.taskType,
      dreaming: doc.dreaming,
      contentHash: doc.contentHash,
      chunkCount: doc.chunkCount,
      metadata: doc.metadata,
      processingMetadata: doc.processingMetadata,
      error: doc.error,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
