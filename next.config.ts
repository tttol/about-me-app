import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export", // static site generation(SSG)
  images: { unoptimized: true },
};

export default nextConfig;
