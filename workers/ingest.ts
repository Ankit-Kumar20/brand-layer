import "dotenv/config";
import { memoryError, memoryLog } from "../lib/memory/log";
import { processNextJob } from "../lib/memory/process";

const POLL_MS = Number(process.env.WORKER_POLL_MS ?? 1500);

async function loop() {
  memoryLog("worker", "started", { pollMs: POLL_MS });
  for (;;) {
    try {
      const did = await processNextJob();
      if (!did) {
        await new Promise((r) => setTimeout(r, POLL_MS));
      }
    } catch (err) {
      memoryError("worker", "loop error", {
        error: err instanceof Error ? err.message : String(err),
      });
      await new Promise((r) => setTimeout(r, POLL_MS));
    }
  }
}

loop();
