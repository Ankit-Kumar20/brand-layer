import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  // Replace with your project ref from https://cloud.trigger.dev (Project settings)
  project: process.env.TRIGGER_PROJECT_REF ?? "proj_desin",
  runtime: "node",
  logLevel: "log",
  maxDuration: 900,
  dirs: ["./trigger"],
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 30_000,
      factor: 2,
      randomize: true,
    },
  },
  build: {
    // Native / special packages that should not be bundled
    external: ["postgres", "unpdf"],
  },
});
