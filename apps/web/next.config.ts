import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/payments"],
};

export default nextConfig;
