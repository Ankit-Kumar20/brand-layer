import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Parent ~/bun.lock makes Next infer the wrong workspace root and miss local deps.
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  async rewrites() {
    return [{ source: "/v3/:path*", destination: "/api/v3/:path*" }];
  },
};

export default nextConfig;
