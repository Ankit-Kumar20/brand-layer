import { schemaTask } from "@trigger.dev/sdk";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { dreamBatch, dreamDocument } from "@/lib/memory/dream";
import { memoryLog } from "@/lib/memory/log";

export const dreamBatchTask = schemaTask({
  id: "dream-batch",
  schema: z.object({
    documentId: z.string().optional(),
    userId: z.string(),
    brandTag: z.string(),
    mode: z.enum(["instant", "dynamic"]).default("dynamic"),
  }),
  retry: {
    maxAttempts: 3,
  },
  run: async (payload) => {
    memoryLog("trigger", "dream-batch start", payload);

    if (payload.mode === "instant" && payload.documentId) {
      await dreamDocument(payload.documentId);
      memoryLog("trigger", "dream-batch done (instant)", {
        documentId: payload.documentId,
      });
      return { mode: "instant" as const, documentId: payload.documentId };
    }

    if (payload.documentId) {
      const doc = await db.query.documents.findFirst({
        where: eq(documents.id, payload.documentId),
      });
      if (doc?.dreaming === "instant") {
        await dreamDocument(payload.documentId);
        memoryLog("trigger", "dream-batch done (doc instant)", {
          documentId: payload.documentId,
        });
        return { mode: "instant" as const, documentId: payload.documentId };
      }
      await dreamBatch(payload.userId, payload.brandTag, payload.documentId);
    } else {
      await dreamBatch(payload.userId, payload.brandTag);
    }

    memoryLog("trigger", "dream-batch done (dynamic)", {
      userId: payload.userId,
      brandTag: payload.brandTag,
      documentId: payload.documentId,
    });
    return {
      mode: "dynamic" as const,
      userId: payload.userId,
      brandTag: payload.brandTag,
      documentId: payload.documentId,
    };
  },
});
