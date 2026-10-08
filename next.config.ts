import type { NextConfig } from "next";

const nextConfig: NextConfig = { output: "standalone", serverExternalPackages: ["fayda-decoder"] };

export default nextConfig;
