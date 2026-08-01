import { tasks } from "@trigger.dev/sdk";
import type { dreamBatchTask } from "@/trigger/dream";
import type { ingestDocumentTask } from "@/trigger/ingest";
import { memoryLog } from "./log";

function delayFromMs(delayMs: number): string {
  if (delayMs <= 0) return "0s";
  if (delayMs % 1000 === 0) return `${delayMs / 1000}s`;
  return `${delayMs}ms`;
}

export async function enqueueIngestJob(
  documentId: string,
  opts?: { contentHash?: string },
) {
  const handle = await tasks.trigger<typeof ingestDocumentTask>(
    "ingest-document",
    { documentId },
    opts?.contentHash
      ? {
          idempotencyKey: `ingest:${documentId}:${opts.contentHash}`,
          idempotencyKeyTTL: "24h",
        }
      : undefined,
  );
  memoryLog("job", "enqueue ingest", {
    runId: handle.id,
    documentId,
  });
  return handle.id;
}

export async function enqueueDreamJob(opts: {
  documentId?: string;
  userId: string;
  brandTag: string;
  delayMs?: number;
  coalesce?: boolean;
  mode?: "instant" | "dynamic";
}) {
  const mode =
    opts.mode ?? (opts.delayMs && opts.delayMs > 0 ? "dynamic" : "instant");
  const payload = {
    documentId: opts.documentId,
    userId: opts.userId,
    brandTag: opts.brandTag,
    mode,
  };

  const options =
    opts.coalesce || mode === "dynamic"
      ? {
          debounce: {
            key: `${opts.userId}:${opts.brandTag}`,
            delay: delayFromMs(opts.delayMs ?? 2000),
            mode: "trailing" as const,
          },
        }
      : opts.delayMs && opts.delayMs > 0
        ? { delay: delayFromMs(opts.delayMs) }
        : undefined;

  const handle = await tasks.trigger<typeof dreamBatchTask>(
    "dream-batch",
    payload,
    options,
  );

  memoryLog("job", "enqueue dream", {
    runId: handle.id,
    documentId: opts.documentId,
    brandTag: opts.brandTag,
    mode,
    delayMs: opts.delayMs ?? 0,
    coalesce: Boolean(opts.coalesce),
  });
  return handle.id;
}
