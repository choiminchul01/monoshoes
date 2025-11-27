import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "svivlaltqammrxzuiher.supabase.co",
      },
    ],
  },
};

export default nextConfig;
