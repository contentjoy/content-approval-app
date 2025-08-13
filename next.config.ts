import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-8ca27ad93a114ad7b4d6e6ff4549cf90.r2.dev',
      },
      {
        protocol: 'https', 
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https', 
        hostname: 'f002.backblazeb2.com',
      },
      {
        protocol: 'https',
        hostname: '*.backblazeb2.com',
      }
    ],
  },
};

export default nextConfig;
