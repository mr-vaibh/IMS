import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  async rewrites() {
    return [
      // PDFs + HTML reports
      {
        source: "/reports/:path*",
        destination: "http://localhost:8000/reports/:path*",
      },

      // API calls
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
