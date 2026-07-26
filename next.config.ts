import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/v3/:path*", destination: "/api/v3/:path*" }];
  },
};

export default nextConfig;
