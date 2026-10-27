import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: process.env.PAGES_BASE_PATH ?? "/SmartMaintainer",
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
