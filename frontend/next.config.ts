import type { NextConfig } from "next";

const nextConfig: NextConfig | any = {
  /* config options here */
  reactCompiler: true,
  output: 'standalone',
  experimental: {
    allowedDevOrigins: ['192.168.1.20', 'localhost:3000']
  }
};

export default nextConfig;
