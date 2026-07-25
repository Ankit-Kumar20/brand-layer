import "dotenv/config";
import { processNextJob } from "../lib/memory/process";

const POLL_MS = Number(process.env.WORKER_POLL_MS ?? 1500);

async function loop() {
  console.log(`[worker] started (poll ${POLL_MS}ms)`);
  for (;;) {
    try {
      const did = await processNextJob();
      if (!did) {
        await new Promise((r) => setTimeout(r, POLL_MS));
      }
    } catch (err) {
      console.error("[worker] error", err);
      await new Promise((r) => setTimeout(r, POLL_MS));
    }
  }
}

loop();
