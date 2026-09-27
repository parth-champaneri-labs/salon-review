import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/qr/review": ["./public/logo/qr-logo.png"],
  },
};

export default nextConfig;
