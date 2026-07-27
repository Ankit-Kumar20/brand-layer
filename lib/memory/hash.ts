import { createHash } from "node:crypto";

export function contentHash(input: string) {
  return createHash("sha256").update(input).digest("hex");
}
