import { eq } from "drizzle-orm";
import { db } from "@/db";
import { documents } from "@/db/schema";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const doc = await db.query.documents.findFirst({
      where: eq(documents.id, id),
    });

    if (!doc) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json({
      id: doc.id,
      customId: doc.customId,
      containerTag: doc.containerTag,
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
