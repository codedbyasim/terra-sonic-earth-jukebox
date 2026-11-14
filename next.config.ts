import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "svs.gsfc.nasa.gov",
      },
    ],
  },
};

export default nextConfig;
