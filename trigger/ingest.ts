import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";
import { memoryLog } from "@/lib/memory/log";
import { processIngestJob } from "@/lib/memory/process";

export const ingestDocumentTask = schemaTask({
  id: "ingest-document",
  schema: z.object({
    documentId: z.string(),
  }),
  retry: {
    maxAttempts: 3,
  },
  run: async (payload) => {
    memoryLog("trigger", "ingest-document start", {
      documentId: payload.documentId,
    });
    await processIngestJob(payload.documentId);
    memoryLog("trigger", "ingest-document done", {
      documentId: payload.documentId,
    });
    return { documentId: payload.documentId };
  },
});
